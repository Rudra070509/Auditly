export type RiskLevel = 'High' | 'Medium' | 'Low' | 'Pass';

export type AnomalyType = 
  | 'Duplicate Transaction'
  | 'Backdated Entry'
  | 'Round-Tripping / Circular'
  | 'GST-to-Book Mismatch'
  | 'Month-End Spike'
  | 'Statistical Outlier (3σ)'
  | 'Isolation Forest Outlier (ML)'
  | 'Benford\'s Law Deviation'
  | 'Tax Calculation Inconsistency'
  | 'Zero-Value Voucher'
  | 'Normal';

export interface AnomalyFlag {
  type: AnomalyType;
  severity: RiskLevel;
  scoreImpact: number; // e.g. 35
  description: string;
  evidence: string;
}

export interface JournalEntry {
  account: string;
  type: 'Debit' | 'Credit';
  amount: string;
  note: string;
}

export interface AIFixRecommendation {
  actionTitle: string;
  complianceRule: string;
  protocol: string;
  entries: JournalEntry[];
  confidence: number; // 0-100%
  projectedRiskScore: number; // 0
  severity: RiskLevel;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  client_name: string;
  audit_year: string;
  date: string;
  posting_date?: string; // System creation date
  account_head: string;
  description: string;
  debit: number;
  credit: number;
  amount: number; // net value or total
  gst_number?: string;
  gst_amount?: number;
  expected_gst_rate?: number; // e.g. 0.18
  user_id: string;
  entity_type?: 'Vendor' | 'Customer' | 'Bank' | 'Internal' | 'Related Entity';

  // Extended ERP/Tally voucher fields
  voucher_type?: string;
  quantity?: number;
  rate?: number;
  taxable_value?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  invoice_total?: number;

  // Computed anomaly fields & AI model metrics
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  anomalies: AnomalyFlag[];
  ai_summary?: string;
  ml_score?: number; // Isolation Forest Anomaly Score 0.0 - 1.0
  ai_confidence?: number; // AI Model Confidence 0 - 100%
  ai_fix?: AIFixRecommendation; // Automatically synthesized corrective action & journal entries

  // Audit state
  audit_status: 'Pending' | 'Approved' | 'Flagged' | 'Dismissed' | 'Remediated';
  auditor_notes?: string;
  remediation_notes?: string;
  remediated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ColumnMapping {
  transaction_id: string;
  date: string;
  posting_date: string;
  account_head: string;
  description: string;
  debit: string;
  credit: string;
  gst_number: string;
  gst_amount: string;
  user_id: string;
  quantity?: string;
  rate?: string;
  taxable_value?: string;
  invoice_total?: string;
}

export interface AuditSummaryStats {
  totalTransactions: number;
  totalAnomalies: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  highRiskExposure: number; // total monetary value of high risk items
  pendingReviewsCount: number;
  averageRiskScore: number;
  byCategory: Record<AnomalyType, number>;
}

