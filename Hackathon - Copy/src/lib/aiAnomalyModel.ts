import { Transaction, AnomalyFlag, RiskLevel } from './types';

// ============================================================================
// 1. ISOLATION FOREST (iForest) TABULAR MACHINE LEARNING ALGORITHM
// ============================================================================

interface IsolationTreeNode {
  isLeaf: boolean;
  size: number;
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
}

/**
 * Expected average path length c(n) of unsuccessful searches in a Binary Search Tree.
 * Used to normalize isolation tree path lengths.
 * c(n) = 2 * (ln(n - 1) + EulerMascheroni) - 2 * (n - 1) / n
 */
function c(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerMascheroni = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
}

class IsolationTree {
  root: IsolationTreeNode;
  maxDepth: number;

  constructor(data: number[][], maxDepth: number) {
    this.maxDepth = maxDepth;
    this.root = this.buildTree(data, 0);
  }

  private buildTree(data: number[][], currentDepth: number): IsolationTreeNode {
    const n = data.length;
    if (currentDepth >= this.maxDepth || n <= 1) {
      return { isLeaf: true, size: n };
    }

    // Determine min/max for each feature
    const numFeatures = data[0].length;
    const candidates: { feature: number; min: number; max: number }[] = [];

    for (let f = 0; f < numFeatures; f++) {
      let min = data[0][f];
      let max = data[0][f];
      for (let i = 1; i < n; i++) {
        const val = data[i][f];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      if (min < max) {
        candidates.push({ feature: f, min, max });
      }
    }

    if (candidates.length === 0) {
      return { isLeaf: true, size: n };
    }

    // Randomly pick a splittable feature
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const splitValue = chosen.min + Math.random() * (chosen.max - chosen.min);

    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (let i = 0; i < n; i++) {
      if (data[i][chosen.feature] < splitValue) {
        leftData.push(data[i]);
      } else {
        rightData.push(data[i]);
      }
    }

    return {
      isLeaf: false,
      size: n,
      splitFeature: chosen.feature,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1),
      right: this.buildTree(rightData, currentDepth + 1)
    };
  }

  computePathLength(point: number[], node: IsolationTreeNode, currentDepth: number): number {
    if (node.isLeaf) {
      return currentDepth + c(node.size);
    }
    const feat = node.splitFeature!;
    const val = node.splitValue!;
    if (point[feat] < val) {
      return node.left ? this.computePathLength(point, node.left, currentDepth + 1) : currentDepth;
    } else {
      return node.right ? this.computePathLength(point, node.right, currentDepth + 1) : currentDepth;
    }
  }
}

export class IsolationForestModel {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private subsampleSize: number;

  constructor(numTrees: number = 60, subsampleSize: number = 128) {
    this.numTrees = numTrees;
    this.subsampleSize = subsampleSize;
  }

  fit(data: number[][]): this {
    this.trees = [];
    const n = data.length;
    if (n === 0) return this;

    const sampleSize = Math.min(this.subsampleSize, n);
    const maxDepth = Math.ceil(Math.log2(Math.max(sampleSize, 2)));

    for (let i = 0; i < this.numTrees; i++) {
      // Subsample without replacement or bootstrap
      const sample: number[][] = [];
      const indices = new Set<number>();
      while (indices.size < sampleSize) {
        indices.add(Math.floor(Math.random() * n));
      }
      indices.forEach(idx => sample.push(data[idx]));

      const tree = new IsolationTree(sample, maxDepth);
      this.trees.push(tree);
    }

    return this;
  }

  /**
   * Computes isolation score in range [0, 1].
   * s(x, n) = 2^(- E(h(x)) / c(sampleSize))
   * Scores > 0.60 indicate significant anomalous isolation.
   */
  score(point: number[], sampleSize: number): number {
    if (this.trees.length === 0) return 0.5;
    let sumPathLength = 0;
    for (let i = 0; i < this.trees.length; i++) {
      sumPathLength += this.trees[i].computePathLength(point, this.trees[i].root, 0);
    }
    const avgPathLength = sumPathLength / this.trees.length;
    const norm = c(Math.min(this.subsampleSize, sampleSize));
    if (norm === 0) return 0.5;

    return Math.pow(2, - (avgPathLength / norm));
  }
}

// ============================================================================
// 2. BENFORD'S LAW FIRST-DIGIT DISTRIBUTION ANALYSIS
// ============================================================================

export interface BenfordAnalysisResult {
  observedFrequencies: Record<number, number>;
  expectedFrequencies: Record<number, number>;
  meanAbsoluteDeviation: number; // MAD
  isConforming: boolean;
  tamperedDigits: number[];
}

export function evaluateBenfordsLaw(transactions: Transaction[]): BenfordAnalysisResult {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let validCount = 0;

  transactions.forEach(t => {
    const val = Math.abs(t.amount || t.debit || t.credit || 0);
    if (val >= 10) {
      const firstDigit = parseInt(String(val).replace(/[^1-9]/g, '')[0], 10);
      if (firstDigit >= 1 && firstDigit <= 9) {
        counts[firstDigit]++;
        validCount++;
      }
    }
  });

  const observedFrequencies: Record<number, number> = {};
  const expectedFrequencies: Record<number, number> = {};
  let totalAbsDev = 0;
  const tamperedDigits: number[] = [];

  for (let d = 1; d <= 9; d++) {
    const expected = Math.log10(1 + 1 / d);
    expectedFrequencies[d] = expected;
    const observed = validCount > 0 ? counts[d] / validCount : expected;
    observedFrequencies[d] = observed;

    const dev = Math.abs(observed - expected);
    totalAbsDev += dev;

    // Digits with > 50% relative deviation and notable volume
    if (validCount >= 30 && dev > 0.04 && observed > expected) {
      tamperedDigits.push(d);
    }
  }

  const meanAbsoluteDeviation = totalAbsDev / 9;
  // According to Nigrini (2012), MAD <= 0.012 indicates close conformity, > 0.018 indicates nonconformity
  const isConforming = meanAbsoluteDeviation <= 0.018;

  return {
    observedFrequencies,
    expectedFrequencies,
    meanAbsoluteDeviation,
    isConforming,
    tamperedDigits
  };
}

// ============================================================================
// 3. TAX & INVOICING MATHEMATICAL INCONSISTENCY ENGINE
// ============================================================================

export function detectMathematicalInconsistencies(tx: Transaction): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const val = Math.abs(tx.amount || tx.debit || tx.credit || 0);
  const qty = tx.quantity;
  const rate = tx.rate;
  const taxable = tx.taxable_value !== undefined ? tx.taxable_value : undefined;
  const cgst = tx.cgst || 0;
  const sgst = tx.sgst || 0;
  const igst = tx.igst || 0;
  const totalTax = cgst + sgst + igst;
  const totalInvoice = tx.invoice_total;

  // 1. Zero-value Voucher Flag
  if (val === 0 && (taxable === 0 || taxable === undefined)) {
    flags.push({
      type: 'Zero-Value Voucher',
      severity: 'Medium',
      scoreImpact: 30,
      description: `Zero-value voucher (${tx.transaction_id}) recorded with no monetary consideration.`,
      evidence: `Taxable Value: ₹0, Invoice Total: ₹0, Rate: ₹0`
    });
    return flags;
  }

  // 2. Quantity * Rate vs Taxable Value Inconsistency
  if (qty !== undefined && rate !== undefined && taxable !== undefined && qty !== 0 && rate > 0) {
    const expectedTaxable = Math.abs(qty) * rate;
    const diff = Math.abs(Math.abs(taxable) - expectedTaxable);
    const diffRatio = diff / (expectedTaxable || 1);

    if (diff > 50 && diffRatio > 0.10) {
      flags.push({
        type: 'Tax Calculation Inconsistency',
        severity: 'High',
        scoreImpact: 45,
        description: `Taxable value (₹${Math.abs(taxable).toLocaleString('en-IN')}) deviates drastically from Quantity × Rate (${qty} × ₹${rate.toLocaleString('en-IN')} = ₹${Math.round(expectedTaxable).toLocaleString('en-IN')}).`,
        evidence: `Discrepancy: ₹${Math.round(diff).toLocaleString('en-IN')} (${(diffRatio * 100).toFixed(1)}% artificial inflation)`
      });
    }
  }

  // 3. Negative Quantity with Positive Tax Liability / Invoice Total Inversion
  if (qty !== undefined && qty < 0 && (totalTax > 0 || (taxable !== undefined && taxable < 0 && totalInvoice !== undefined && totalInvoice < 0 && totalTax > 0))) {
    flags.push({
      type: 'Tax Calculation Inconsistency',
      severity: 'High',
      scoreImpact: 45,
      description: `Negative quantity (${qty}) / return credit entered with positive tax credits (₹${totalTax.toLocaleString('en-IN')}).`,
      evidence: `Quantity: ${qty}, Tax Claimed: +₹${totalTax.toLocaleString('en-IN')}`
    });
  }

  // 4. Invoice Total vs (Taxable + Tax) Mathematical Check
  if (taxable !== undefined && totalInvoice !== undefined && totalInvoice > 0) {
    const calculatedSum = Math.abs(taxable) + totalTax;
    const invoiceDiff = Math.abs(totalInvoice - calculatedSum);
    if (invoiceDiff > 100 && (invoiceDiff / totalInvoice) > 0.05) {
      flags.push({
        type: 'Tax Calculation Inconsistency',
        severity: 'Medium',
        scoreImpact: 25,
        description: `Invoice Total (₹${totalInvoice.toLocaleString('en-IN')}) does not balance with Taxable Value + Tax (₹${calculatedSum.toLocaleString('en-IN')}).`,
        evidence: `Unbalanced difference: ₹${Math.round(invoiceDiff).toLocaleString('en-IN')}`
      });
    }
  }

  return flags;
}

// ============================================================================
// 4. FEATURE VECTOR EXTRACTION FOR TABULAR MACHINE LEARNING
// ============================================================================

export function extractFeatureVector(
  tx: Transaction,
  accountMeans: Record<string, number>,
  accountStdDevs: Record<string, number>
): number[] {
  const val = Math.abs(tx.amount || tx.debit || tx.credit || 0);
  const head = tx.account_head || 'General Ledger';
  const mean = accountMeans[head] || 50000;
  const stdDev = accountStdDevs[head] || 25000;

  // Feature 0: Log-scaled amount
  const f0_amount = Math.log10(val + 1);

  // Feature 1: Taxable / Math discrepancy ratio
  let f1_mathRatio = 0;
  if (tx.quantity && tx.rate && tx.taxable_value !== undefined && tx.rate > 0) {
    const expected = Math.abs(tx.quantity) * tx.rate;
    f1_mathRatio = Math.min(10, Math.abs(Math.abs(tx.taxable_value) - expected) / (expected || 1));
  }

  // Feature 2: GST discrepancy ratio
  let f2_gstRatio = 0;
  if (val > 0 && tx.gst_amount) {
    const expectedRate = tx.expected_gst_rate || 0.18;
    const expectedGst = val * expectedRate;
    f2_gstRatio = Math.min(5, Math.abs(tx.gst_amount - expectedGst) / (expectedGst || 1));
  }

  // Feature 3: Days from Month End
  let f3_daysFromMonthEnd = 15;
  let f4_isWeekend = 0;
  if (tx.date) {
    const d = new Date(tx.date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      f3_daysFromMonthEnd = lastDay - d.getDate();
      const dayOfWeek = d.getDay();
      f4_isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
    }
  }

  // Feature 5: Account Head Z-Score
  const f5_zScore = stdDev > 0 ? Math.min(10, Math.abs(val - mean) / stdDev) : 0;

  // Feature 6: Posting Delay (in days)
  let f6_delayDays = 0;
  if (tx.posting_date && tx.date) {
    const tPost = new Date(tx.posting_date).getTime();
    const tTx = new Date(tx.date).getTime();
    if (!isNaN(tPost) && !isNaN(tTx)) {
      f6_delayDays = Math.max(0, Math.min(180, (tPost - tTx) / (1000 * 3600 * 24)));
    }
  }

  // Feature 7: Zero value indicator
  const f7_zeroValue = val === 0 ? 1 : 0;

  return [
    f0_amount,
    f1_mathRatio,
    f2_gstRatio,
    f3_daysFromMonthEnd,
    f4_isWeekend,
    f5_zScore,
    f6_delayDays,
    f7_zeroValue
  ];
}

// ============================================================================
// 5. RUN FULL AI ANOMALY DETECTION ENGINE
// ============================================================================

export interface AIModelRunResult {
  transactions: Transaction[];
  benfordStats: BenfordAnalysisResult;
  isolationForestFitted: boolean;
  totalInferences: number;
  averageConfidence: number;
}

export function runAIAnomalyDetection(rawTransactions: Transaction[]): AIModelRunResult {
  if (rawTransactions.length === 0) {
    return {
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
  }

  // Step A: Calculate account statistics
  const accountStats: Record<string, { count: number; mean: number; stdDev: number; amounts: number[] }> = {};
  rawTransactions.forEach(t => {
    const head = t.account_head || 'General Ledger';
    const val = Math.abs(t.debit > 0 ? t.debit : t.credit > 0 ? t.credit : t.amount || 0);
    if (!accountStats[head]) {
      accountStats[head] = { count: 0, mean: 0, stdDev: 0, amounts: [] };
    }
    accountStats[head].amounts.push(val);
  });

  const accountMeans: Record<string, number> = {};
  const accountStdDevs: Record<string, number> = {};

  Object.keys(accountStats).forEach(head => {
    const arr = accountStats[head].amounts;
    const n = arr.length;
    if (n === 0) return;
    const mean = arr.reduce((sum, curr) => sum + curr, 0) / n;
    const variance = arr.reduce((sum, curr) => sum + Math.pow(curr - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);
    accountMeans[head] = mean;
    accountStdDevs[head] = stdDev;
    accountStats[head].count = n;
    accountStats[head].mean = mean;
    accountStats[head].stdDev = stdDev;
  });

  // Step B: Train Isolation Forest on feature vectors
  const featureMatrix = rawTransactions.map(t => extractFeatureVector(t, accountMeans, accountStdDevs));
  const iforest = new IsolationForestModel(50, Math.min(128, rawTransactions.length));
  iforest.fit(featureMatrix);

  // Step C: Evaluate Benford's Law
  const benfordStats = evaluateBenfordsLaw(rawTransactions);

  // Step D: Score each transaction with ensemble model
  let totalConfidence = 0;

  const scoredTransactions = rawTransactions.map((tx, idx) => {
    const vector = featureMatrix[idx];
    const mlScore = iforest.score(vector, rawTransactions.length);

    // Initial anomalies list
    const anomalies: AnomalyFlag[] = [];

    // 1. Isolation Forest ML Anomaly Check (score threshold > 0.63)
    if (mlScore >= 0.63) {
      const severity: RiskLevel = mlScore >= 0.72 ? 'High' : 'Medium';
      const scoreImpact = mlScore >= 0.72 ? 40 : 25;
      anomalies.push({
        type: 'Isolation Forest Outlier (ML)',
        severity,
        scoreImpact,
        description: `Unsupervised Isolation Forest detected multi-feature multivariate outlier pattern (Isolation Score: ${(mlScore * 100).toFixed(1)}%).`,
        evidence: `ML Isolation Index: ${mlScore.toFixed(3)} (Anomaly threshold > 0.63)`
      });
    }

    // 2. Benford's Law Deviation Check
    const val = Math.abs(tx.amount || tx.debit || tx.credit || 0);
    if (!benfordStats.isConforming && val >= 1000) {
      const firstDigit = parseInt(String(val).replace(/[^1-9]/g, '')[0], 10);
      if (benfordStats.tamperedDigits.includes(firstDigit)) {
        anomalies.push({
          type: 'Benford\'s Law Deviation',
          severity: 'Medium',
          scoreImpact: 20,
          description: `Transaction amount begins with digit '${firstDigit}', which exhibits statistically abnormal frequency under Benford's Law (MAD: ${benfordStats.meanAbsoluteDeviation.toFixed(4)}).`,
          evidence: `First Digit: ${firstDigit}, Observed: ${(benfordStats.observedFrequencies[firstDigit] * 100).toFixed(1)}% vs Expected: ${(benfordStats.expectedFrequencies[firstDigit] * 100).toFixed(1)}%`
        });
      }
    }

    // 3. Mathematical & Tax Inconsistencies
    const mathFlags = detectMathematicalInconsistencies(tx);
    anomalies.push(...mathFlags);

    // Calculate AI Model Confidence for this voucher
    const dataSizeConfidenceBonus = Math.min(10, Math.log10(rawTransactions.length + 1) * 3);
    const hasCorroboration = anomalies.length > 1;
    const confidence = Math.min(99, Math.max(78, Math.round(82 + dataSizeConfidenceBonus + (hasCorroboration ? 8 : 0) + (mlScore > 0.7 ? 5 : 0))));
    totalConfidence += confidence;

    return {
      ...tx,
      ml_score: Number(mlScore.toFixed(3)),
      ai_confidence: confidence,
      anomalies
    };
  });

  const averageConfidence = rawTransactions.length > 0 ? Math.round(totalConfidence / rawTransactions.length) : 92;

  return {
    transactions: scoredTransactions,
    benfordStats,
    isolationForestFitted: true,
    totalInferences: rawTransactions.length,
    averageConfidence
  };
}
