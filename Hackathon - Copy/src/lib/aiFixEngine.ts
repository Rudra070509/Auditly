import { Transaction, AIFixRecommendation, JournalEntry } from './types';

/**
 * Synthesizes an intelligent, statutory-compliant AI Fix & Balanced Journal Entry
 * for any anomalous transaction based on Indian CA & International Auditing Standards.
 */
export function generateAIFix(tx: Transaction): AIFixRecommendation {
  const anomalies = tx.anomalies || [];
  const primaryAnomaly = anomalies[0];
  const type = primaryAnomaly?.type || 'Statistical Outlier (3σ)';
  const val = Math.abs(tx.amount || tx.debit || tx.credit || 0);
  const formattedVal = `₹${val.toLocaleString('en-IN')}`;
  const head = tx.account_head || 'General Ledger Account';
  const txnId = tx.transaction_id || tx.id;

  // 1. Tax Calculation Inconsistency (Rate * Qty mismatch, negative qty with positive tax)
  if (type === 'Tax Calculation Inconsistency') {
    const qty = tx.quantity || 1;
    const rate = tx.rate || 0;
    const taxable = Math.abs(tx.taxable_value || val);
    const expectedTaxable = Math.abs(qty) * rate;
    const diff = Math.abs(taxable - expectedTaxable);
    const formattedDiff = `₹${Math.round(diff || val).toLocaleString('en-IN')}`;

    if (qty < 0) {
      return {
        actionTitle: 'Record Formal Credit Note & Reverse Inverted GST ITC',
        complianceRule: 'Section 34 of CGST Act, 2017 & Ind AS 115 (Sale Returns & Allowances)',
        protocol: `Negative quantity (${qty}) indicates a goods return or price revision. Issue a formal Section 34 Tax Credit Note in GSTR-1 and reverse corresponding CGST/SGST input tax credit to eliminate tax ledger inversion.`,
        entries: [
          { 
            account: 'Sales Returns & Allowances Account', 
            type: 'Debit', 
            amount: formattedVal, 
            note: `Recognition of return credit on voucher ${txnId}` 
          },
          { 
            account: `Trade Receivables / Customer Ledger (${tx.description || 'Party'})`, 
            type: 'Credit', 
            amount: formattedVal, 
            note: 'Adjustment of excess receivable balance' 
          }
        ],
        confidence: 96,
        projectedRiskScore: 0,
        severity: 'High'
      };
    }

    return {
      actionTitle: 'Rectify Invoice Valuation & Adjust Over-Stated Turnover',
      complianceRule: 'Guidance Note on Audit of Revenue & Section 143(3) of Companies Act, 2013',
      protocol: `Calculated valuation (${qty} units × ₹${rate.toLocaleString('en-IN')}) is ₹${Math.round(expectedTaxable).toLocaleString('en-IN')}, whereas ledger records ₹${taxable.toLocaleString('en-IN')}. Reverse the artificial inflation of ${formattedDiff} to align books with actual physical delivery records.`,
      entries: [
        { 
          account: head, 
          type: 'Debit', 
          amount: formattedDiff, 
          note: `Valuation correction for voucher ${txnId} (Qty: ${qty})` 
        },
        { 
          account: 'Revenue Suspense / Valuation Adjustment Account', 
          type: 'Credit', 
          amount: formattedDiff, 
          note: 'Elimination of invoice calculation discrepancy' 
        }
      ],
      confidence: 95,
      projectedRiskScore: 0,
      severity: 'High'
    };
  }

  // 2. Zero-Value Voucher
  if (type === 'Zero-Value Voucher') {
    return {
      actionTitle: 'Nullify & Archive Incomplete Zero-Value Voucher',
      complianceRule: 'SA 230 (Audit Documentation) & Rule 56 of CGST Rules (Maintenance of Accounts)',
      protocol: `Voucher ${txnId} was posted with zero monetary consideration and zero tax value. Obtain managerial authorization, verify if it was an aborted billing draft, and cancel the entry with an audit memorandum note.`,
      entries: [
        { 
          account: head, 
          type: 'Debit', 
          amount: '₹0', 
          note: `Cancellation of non-financial entry ${txnId}` 
        },
        { 
          account: 'Audit Memory Memo Ledger', 
          type: 'Credit', 
          amount: '₹0', 
          note: 'Voucher status updated to Cancelled/Void' 
        }
      ],
      confidence: 98,
      projectedRiskScore: 0,
      severity: 'Medium'
    };
  }

  // 3. Isolation Forest ML Outlier
  if (type === 'Isolation Forest Outlier (ML)') {
    return {
      actionTitle: 'Conduct Multi-Variable Substantiation & Balance Confirmation',
      complianceRule: 'SA 505 (External Confirmations) & SA 520 (Analytical Procedures)',
      protocol: `Unsupervised Isolation Forest algorithm flagged this voucher due to an abnormal combination of value, timing, and counterparty frequency (ML Score: ${((tx.ml_score || 0.65) * 100).toFixed(0)}%). Perform direct third-party balance confirmation and cross-reference with stamped delivery challans and e-Way bills.`,
      entries: [
        { 
          account: 'Audited Ledger Escrow / Escrow Suspense', 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Segregation of ML multivariate outlier voucher ${txnId}` 
        },
        { 
          account: head, 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Temporary escrow pending external audit confirmation' 
        }
      ],
      confidence: 92,
      projectedRiskScore: 5,
      severity: 'High'
    };
  }

  // 4. Benford's Law Deviation
  if (type === "Benford's Law Deviation") {
    return {
      actionTitle: 'Targeted Internal Control Audit of Threshold-Clustered Invoices',
      complianceRule: 'SA 240 (The Auditor’s Responsibilities Relating to Fraud in an Audit of Financial Statements)',
      protocol: `Empirical first-digit distribution shows anomalous concentration for this amount range, indicating possible threshold avoidance or deliberate quote manipulation. Request procurement committee bids and verify delegated financial powers (DoA).`,
      entries: [
        { 
          account: head, 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Substantiated voucher under Benford test review (${txnId})` 
        },
        { 
          account: 'Bank / Vendor Clearing Account', 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Verified with competitive vendor quotation files' 
        }
      ],
      confidence: 89,
      projectedRiskScore: 0,
      severity: 'Medium'
    };
  }

  // 5. Duplicate Transaction
  if (type === 'Duplicate Transaction') {
    return {
      actionTitle: 'Issue Vendor Debit Note & Cancel Duplicate Booking',
      complianceRule: 'Guidance Note on Audit of Internal Financial Controls (IFC) & Rule 36 of CGST Rules',
      protocol: `Identical amount was posted within 48 hours in ${head}. Issue a formal Debit Note to the vendor, reverse the duplicate expense liability, and reconcile the supplier's monthly ledger statement.`,
      entries: [
        { 
          account: 'Trade Payables / Vendor Account', 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Reversal of duplicate voucher ${txnId}` 
        },
        { 
          account: head, 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Cancellation of duplicate expense booking' 
        }
      ],
      confidence: 97,
      projectedRiskScore: 0,
      severity: 'High'
    };
  }

  // 6. Backdated Entry
  if (type === 'Backdated Entry') {
    return {
      actionTitle: 'Record Prior-Period Rectification & Disclose under Ind AS 8',
      complianceRule: 'Ind AS 8 / AS 5 (Prior Period Errors) & Section 134(5) of Companies Act, 2013',
      protocol: `Voucher dated ${tx.date} was entered >30 days later (${tx.posting_date}). Reclassify from current operational overheads to Prior Period Adjustments in Retained Earnings, accompanied by an audit committee memo.`,
      entries: [
        { 
          account: 'Prior Period Adjustments (Retained Earnings)', 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Delayed posting rectification for voucher ${txnId}` 
        },
        { 
          account: head, 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Current period expenditure normalization' 
        }
      ],
      confidence: 94,
      projectedRiskScore: 0,
      severity: tx.risk_level === 'High' ? 'High' : 'Medium'
    };
  }

  // 7. Round-Tripping / Circular Transactions
  if (type === 'Round-Tripping / Circular') {
    return {
      actionTitle: 'Reclassify Turnover to Inter-Corporate Loan / Advance (CARO 2020)',
      complianceRule: 'Section 185, 186 of Companies Act, 2013 & CARO 2020 Clause 3(iii)',
      protocol: `Identified circular flow between related accounts cannot be recognized as commercial operating revenue. Reclassify as an inter-corporate deposit, benchmark interest at SBI MCLR rate, and report in Board Form AOC-2.`,
      entries: [
        { 
          account: 'Loans & Advances to Related Entities', 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Reclassification of accommodation flow ${txnId}` 
        },
        { 
          account: 'Commercial Revenue / Operating Turnover', 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Elimination of artificial circular turnover' 
        }
      ],
      confidence: 96,
      projectedRiskScore: 0,
      severity: 'High'
    };
  }

  // 8. GST-to-Book Mismatch
  if (type === 'GST-to-Book Mismatch') {
    const recordedGst = tx.gst_amount || 0;
    const targetRate = tx.expected_gst_rate || 0.18;
    const expectedGst = Math.round(val * targetRate);
    const diff = Math.abs(recordedGst - expectedGst);
    const formattedDiff = `₹${diff.toLocaleString('en-IN')}`;

    return {
      actionTitle: 'File GSTR-3B Table 4(B) ITC Reversal & Reconcile GSTR-2B',
      complianceRule: 'Section 16(2) and Section 17(5) of CGST Act, 2017 & Section 50 (Interest on delayed tax)',
      protocol: `Recorded GST diverges from standard statutory rate (${(targetRate * 100).toFixed(0)}%). Reverse the excess Input Tax Credit of ${formattedDiff} in next month's GSTR-3B return to avoid 18% statutory interest liability.`,
      entries: [
        { 
          account: 'GST Input Tax Credit (ITC) Reversal Account', 
          type: 'Debit', 
          amount: formattedDiff, 
          note: `Reversal of excess tax claimed on voucher ${txnId}` 
        },
        { 
          account: 'Electronic Credit Ledger / Output Tax Liability', 
          type: 'Credit', 
          amount: formattedDiff, 
          note: 'Statutory GST correction as per GSTR-2B reconciliation' 
        }
      ],
      confidence: 98,
      projectedRiskScore: 0,
      severity: 'High'
    };
  }

  // 9. Month-End Spike
  if (type === 'Month-End Spike') {
    return {
      actionTitle: 'Apply Revenue Cut-Off Test & Defer Unperformed Revenue',
      complianceRule: 'Ind AS 115 (Revenue from Contracts with Customers) & SA 240 (Fraud Risk)',
      protocol: `High-value voucher booked in the closing days of the month. Inspect e-way bill timestamps and physical delivery acknowledgments. If performance obligations were completed in the subsequent period, defer revenue.`,
      entries: [
        { 
          account: 'Unearned / Deferred Income Account', 
          type: 'Debit', 
          amount: formattedVal, 
          note: `Cut-off deferral of unperformed obligations (${txnId})` 
        },
        { 
          account: head, 
          type: 'Credit', 
          amount: formattedVal, 
          note: 'Month-end revenue normalization' 
        }
      ],
      confidence: 93,
      projectedRiskScore: 0,
      severity: 'Medium'
    };
  }

  // 10. Default: 3-Sigma Statistical Outlier
  return {
    actionTitle: 'Capital vs. Revenue Segregation & Asset Capitalization (Schedule II)',
    complianceRule: 'Guidance Note on Capital and Revenue Expenditure (ICAI) & Section 143(3)',
    protocol: `Expenditure exceeds 3 standard deviations for ${head}. Verify whether this outlay produced an enduring asset benefit. If enduring, capitalize to Fixed Assets and charge depreciation under Schedule II.`,
    entries: [
      { 
        account: 'Capital Work-in-Progress (CWIP) / Fixed Assets', 
        type: 'Debit', 
        amount: formattedVal, 
        note: `Capitalization of extraordinary outlay (${txnId})` 
      },
      { 
        account: head, 
        type: 'Credit', 
        amount: formattedVal, 
        note: 'Reversal from routine P&L expense' 
      }
    ],
    confidence: 91,
    projectedRiskScore: 0,
    severity: 'High'
  };
}

/**
 * Batch applies AI fixes to a set of transactions, updating their audit status
 * to 'Remediated' and populating remediation notes.
 */
export function batchApplyAIFixes(
  transactions: Transaction[],
  targetIds?: string[]
): { updatedTransactions: Transaction[]; remediatedCount: number } {
  let count = 0;
  const now = new Date().toISOString();

  const updatedTransactions = transactions.map(tx => {
    const isTarget = !targetIds || targetIds.includes(tx.id);
    const hasAnomalies = tx.anomalies && tx.anomalies.length > 0;

    if (isTarget && hasAnomalies && tx.audit_status !== 'Remediated') {
      count++;
      const fix = tx.ai_fix || generateAIFix(tx);
      return {
        ...tx,
        audit_status: 'Remediated' as const,
        remediation_notes: `AI Fix Applied: ${fix.actionTitle} (${fix.complianceRule})`,
        remediated_at: now,
        risk_score: fix.projectedRiskScore,
        risk_level: (fix.projectedRiskScore === 0 ? 'Pass' : 'Low') as any
      };
    }
    return tx;
  });

  return { updatedTransactions, remediatedCount: count };
}
