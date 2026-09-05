import { Transaction, AnomalyFlag, RiskLevel } from './types';
import { runAIAnomalyDetection, AIModelRunResult } from './aiAnomalyModel';
import { generateAIFix } from './aiFixEngine';

// Standard GST Rates in India / Financial Systems
const STANDARD_GST_RATES = [0, 0.05, 0.12, 0.18, 0.28];

// Cached model results for dashboard & status inspection
let cachedAIModelStats: AIModelRunResult = {
  transactions: [],
  benfordStats: {
    observedFrequencies: {},
    expectedFrequencies: {},
    meanAbsoluteDeviation: 0,
    isConforming: true,
    tamperedDigits: []
  },
  isolationForestFitted: false,
  totalInferences: 0,
  averageConfidence: 95
};

export function getCachedAIModelStats(): AIModelRunResult {
  return cachedAIModelStats;
}

/**
 * Calculates mean and standard deviation for account heads
 */
function calculateAccountStats(transactions: Transaction[]) {
  const accountStats: Record<string, { count: number; mean: number; stdDev: number; amounts: number[] }> = {};

  // Group amounts by account_head
  transactions.forEach(t => {
    const head = t.account_head || 'General Ledger';
    const val = Math.abs(t.debit > 0 ? t.debit : t.credit > 0 ? t.credit : t.amount || 0);
    if (!accountStats[head]) {
      accountStats[head] = { count: 0, mean: 0, stdDev: 0, amounts: [] };
    }
    accountStats[head].amounts.push(val);
  });

  // Compute mean and stdDev for each group
  Object.keys(accountStats).forEach(head => {
    const arr = accountStats[head].amounts;
    const n = arr.length;
    if (n === 0) return;

    const mean = arr.reduce((acc, curr) => acc + curr, 0) / n;
    const variance = arr.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    accountStats[head].count = n;
    accountStats[head].mean = mean;
    accountStats[head].stdDev = stdDev;
    accountStats[head].amounts = [];
  });

  return accountStats;
}

/**
 * Runs the integrated AI Model (Isolation Forest + Benford's Law + Heuristics + Fix Synthesis)
 * over a set of raw transactions.
 */
export function processTransactionsWithAnomalies(rawTransactions: Transaction[]): Transaction[] {
  if (!rawTransactions || rawTransactions.length === 0) return [];

  // Step 1: Run Unsupervised Isolation Forest & Benford's Law Detection
  const aiResult = runAIAnomalyDetection(rawTransactions);
  cachedAIModelStats = aiResult;
  const aiScoredMap = new Map<string, { mlScore: number; aiConfidence: number; initialAnomalies: AnomalyFlag[] }>();

  aiResult.transactions.forEach(tx => {
    aiScoredMap.set(tx.id, {
      mlScore: tx.ml_score ?? 0.5,
      aiConfidence: tx.ai_confidence ?? 90,
      initialAnomalies: tx.anomalies || []
    });
  });

  // Step 2: Compute statistical profiles
  const accountStats = calculateAccountStats(rawTransactions);

  // Map to store temporary group lookups for duplicate & round-tripping rules
  const sortedTx = [...rawTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Create grouping for sliding window optimizations
  const headGrouped = new Map<string, Transaction[]>();
  
  // Precompute metadata to avoid O(N^2) Date parsing overhead
  const txMeta = new Map<string, { time: number; val: number }>();
  
  sortedTx.forEach(tx => {
    const head = tx.account_head || 'General Ledger';
    if (!headGrouped.has(head)) headGrouped.set(head, []);
    headGrouped.get(head)!.push(tx);
    
    txMeta.set(tx.id, {
      time: new Date(tx.date).getTime(),
      val: Math.abs(tx.debit > 0 ? tx.debit : tx.credit > 0 ? tx.credit : tx.amount || 0)
    });
  });

  return sortedTx.map((tx) => {
    const aiData = aiScoredMap.get(tx.id) || { mlScore: 0.5, aiConfidence: 90, initialAnomalies: [] };
    const anomalies: AnomalyFlag[] = [...aiData.initialAnomalies];

    const meta = txMeta.get(tx.id)!;
    const val = meta.val;
    const txTime = meta.time;
    
    const head = tx.account_head || 'General Ledger';
    const postDate = tx.posting_date ? new Date(tx.posting_date) : null;

    const sameHeadTx = headGrouped.get(head) || [];

    // Rule A: Duplicate Transactions
    let duplicateCount = 0;
    const duplicateIds: string[] = [];
    
    let circularCount = 0;
    const circularIds: string[] = [];

    // Check duplicates within same account head
    for (let i = 0; i < sameHeadTx.length; i++) {
      const other = sameHeadTx[i];
      if (other.id === tx.id) continue;
      
      const otherMeta = txMeta.get(other.id)!;
      const timeDiff = Math.abs(otherMeta.time - txTime) / 86400000;
      
      if (timeDiff <= 2) {
        if (val > 0 && Math.abs(val - otherMeta.val) < 0.01) {
          duplicateCount++;
          duplicateIds.push(other.transaction_id || other.id);
        }
      }
    }

    // Rule C: Circular / Round-Tripping check (within 5 days, same head OR related entity)
    if (val >= 50000) {
      const candidates = (tx.entity_type === 'Related Entity' || head.toLowerCase().includes('sister') || head.toLowerCase().includes('loan') || head.toLowerCase().includes('accommodation'))
        ? sortedTx 
        : sameHeadTx;

      for (let i = 0; i < candidates.length; i++) {
        const other = candidates[i];
        if (other.id === tx.id) continue;

        const otherMeta = txMeta.get(other.id)!;
        const timeDiff = Math.abs(otherMeta.time - txTime) / 86400000;

        if (timeDiff <= 5) {
          const isOppositeFlow = (tx.debit > 0 && other.credit > 0) || (tx.credit > 0 && other.debit > 0);
          const amountDiffRatio = Math.abs(val - otherMeta.val) / (val || 1);

          if (isOppositeFlow && amountDiffRatio <= 0.02) {
            circularCount++;
            circularIds.push(`${other.account_head} (${other.transaction_id || other.id})`);
          }
        }
      }
    }

    if (duplicateCount > 0) {
      anomalies.push({
        type: 'Duplicate Transaction',
        severity: 'High',
        scoreImpact: 35,
        description: `Identical amount of ₹${val.toLocaleString('en-IN')} posted in ${head} within ${duplicateCount} duplicate entry/entries.`,
        evidence: `Matching Transaction ID: ${duplicateIds.slice(0, 3).join(', ')}${duplicateIds.length > 3 ? '...' : ''}`
      });
    }

    // Rule B: Backdated Entries
    if (postDate && !isNaN(postDate.getTime())) {
      const daysDiff = Math.round((postDate.getTime() - txTime) / (1000 * 3600 * 24));
      if (daysDiff > 30) {
        const severity: RiskLevel = daysDiff > 90 ? 'High' : 'Medium';
        anomalies.push({
          type: 'Backdated Entry',
          severity,
          scoreImpact: daysDiff > 90 ? 40 : 25,
          description: `Voucher dated ${tx.date} was recorded in the system ${daysDiff} days later on ${tx.posting_date}.`,
          evidence: `Delay: ${daysDiff} days (Threshold: 30 days)`
        });
      }
    }

    // Rule C: Circular logic application
    if (circularCount > 0) {
      anomalies.push({
        type: 'Round-Tripping / Circular',
        severity: 'High',
        scoreImpact: 45,
        description: `Potential circular fund flow detected: ₹${val.toLocaleString('en-IN')} offset by matching counter-entry within 5 days.`,
        evidence: `Counter-parties: ${circularIds.slice(0, 3).join(', ')}`
      });
    }

    // Rule D: GST-to-Book Mismatches
    const gstAmt = tx.gst_amount || (tx.cgst || 0) + (tx.sgst || 0) + (tx.igst || 0);
    if (val > 0 && gstAmt > 0) {
      const calculatedRate = gstAmt / val;
      const targetRate = typeof tx.expected_gst_rate === 'number'
        ? tx.expected_gst_rate
        : STANDARD_GST_RATES.reduce((prev, curr) => 
            Math.abs(curr - calculatedRate) < Math.abs(prev - calculatedRate) ? curr : prev
          );
      const expectedGst = val * targetRate;
      const discrepancy = Math.abs(gstAmt - expectedGst);
      const percentDiff = targetRate > 0 ? (discrepancy / expectedGst) : (discrepancy > 100 ? 1 : 0);

      if (discrepancy > 100 && percentDiff > 0.05) {
        anomalies.push({
          type: 'GST-to-Book Mismatch',
          severity: percentDiff > 0.15 ? 'High' : 'Medium',
          scoreImpact: percentDiff > 0.15 ? 30 : 20,
          description: `Recorded GST of ₹${gstAmt.toLocaleString('en-IN')} diverges from expected standard rate (${(targetRate * 100).toFixed(0)}% = ₹${expectedGst.toFixed(0)}).`,
          evidence: `Discrepancy: ₹${discrepancy.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${(percentDiff * 100).toFixed(1)}% deviation)`
        });
      }
    }

    // Rule E: Month-End Spikes
    if (!isNaN(txTime)) {
      const year = txDate.getFullYear();
      const month = txDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const day = txDate.getDate();
      const daysFromMonthEnd = lastDayOfMonth - day;

      const stats = accountStats[head];
      const isHighValue = stats && stats.mean > 0 && val > (stats.mean * 2.5);

      if (daysFromMonthEnd <= 2 && isHighValue && val > 100000) {
        anomalies.push({
          type: 'Month-End Spike',
          severity: 'Medium',
          scoreImpact: 25,
          description: `High-value entry of ₹${val.toLocaleString('en-IN')} posted in the final ${daysFromMonthEnd === 0 ? 'day' : `${daysFromMonthEnd + 1} days`} of the month.`,
          evidence: `Posted on Day ${day}/${lastDayOfMonth}. Exceeds account mean (₹${Math.round(stats.mean).toLocaleString('en-IN')}) by ${Math.round((val / stats.mean - 1) * 100)}%`
        });
      }
    }

    // Rule F: Statistical Outliers (3-Sigma $3\sigma$)
    const stats = accountStats[head];
    if (stats && stats.count >= 3 && stats.stdDev > 0) {
      const zScore = (val - stats.mean) / stats.stdDev;
      if (zScore >= 3.0) {
        anomalies.push({
          type: 'Statistical Outlier (3σ)',
          severity: 'High',
          scoreImpact: 40,
          description: `Transaction value ₹${val.toLocaleString('en-IN')} exceeds 3 standard deviations (Z-Score: +${zScore.toFixed(2)}σ) above mean for ${head}.`,
          evidence: `Mean: ₹${Math.round(stats.mean).toLocaleString('en-IN')}, StdDev: ₹${Math.round(stats.stdDev).toLocaleString('en-IN')}`
        });
      }
    }

    // Deduplicate anomaly types
    const seenTypes = new Set<string>();
    const uniqueAnomalies = anomalies.filter(a => {
      if (seenTypes.has(a.type)) return false;
      seenTypes.add(a.type);
      return true;
    });

    // Calculate total Risk Score (bounded 0 - 100)
    const rawScore = uniqueAnomalies.reduce((sum, a) => sum + a.scoreImpact, 0);
    const risk_score = Math.min(100, Math.max(0, rawScore));

    let risk_level: RiskLevel = 'Pass';
    if (risk_score >= 60) risk_level = 'High';
    else if (risk_score >= 25) risk_level = 'Medium';
    else if (risk_score > 0) risk_level = 'Low';

    // If already remediated in audit state, honor it
    const audit_status = tx.audit_status || 'Pending';
    const effectiveRiskScore = audit_status === 'Remediated' ? 0 : risk_score;
    const effectiveRiskLevel = audit_status === 'Remediated' ? 'Pass' : risk_level;

    // Build temporary transaction object
    const candidateTx: Transaction = {
      ...tx,
      amount: val,
      risk_score: effectiveRiskScore,
      risk_level: effectiveRiskLevel,
      anomalies: uniqueAnomalies,
      ml_score: aiData.mlScore,
      ai_confidence: aiData.aiConfidence,
      audit_status
    };

    // Synthesize autonomous AI Fix recommendation if anomalies exist
    if (uniqueAnomalies.length > 0) {
      candidateTx.ai_fix = generateAIFix(candidateTx);
    }

    // Generate natural language AI reasoning
    candidateTx.ai_summary = generateAISummary(candidateTx, val, head, uniqueAnomalies, risk_score, risk_level);

    return candidateTx;
  });
}

/**
 * Synthesizes clear, explainable AI reasoning for auditors
 */
function generateAISummary(
  tx: Transaction, 
  val: number, 
  head: string, 
  anomalies: AnomalyFlag[], 
  score: number, 
  level: RiskLevel
): string {
  if (anomalies.length === 0) {
    return `Clean Entry: Transaction of ₹${val.toLocaleString('en-IN')} in ${head} conforms with standard ledger frequency, expected GST tax rates, and normal posting timelines.`;
  }

  const primaryAnomaly = anomalies[0];
  const count = anomalies.length;

  let reasoning = `AI Diagnosis [${level} Risk - ${score}/100]: `;

  if (count === 1) {
    reasoning += `${primaryAnomaly.description} ${primaryAnomaly.evidence}`;
  } else {
    reasoning += `Triggered ${count} risk flags including ${primaryAnomaly.type} and ${anomalies[1]?.type || ''}. ${primaryAnomaly.description}`;
  }

  if (tx.ai_fix) {
    reasoning += ` AI Recommended Fix: ${tx.ai_fix.actionTitle} (${tx.ai_fix.complianceRule}).`;
  } else if (score >= 60) {
    reasoning += ` Recommended Action: Require physical invoice verification, bank statement cross-check, and auditor sign-off.`;
  } else if (score >= 25) {
    reasoning += ` Recommended Action: Review supporting vouchers and confirm GST return filing status (GSTR-2B matching).`;
  }

  return reasoning;
}
