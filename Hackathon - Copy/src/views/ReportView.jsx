import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Printer, 
  AlertTriangle, 
  FileText,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportView({ transactions, selectedClient, selectedYear, onUpdateStatus, theme }) {
  const isDark = theme === 'dark';

  const [managementComments, setManagementComments] = useState(
    "Based on automated heuristic evaluation and CA sample verification, high-risk monetary exposures in Consultancy Expenses and Director Remuneration require immediate management clarification and supporting invoice presentation before final audit working paper sign-off."
  );

  const { totalCount, flaggedTx, highRiskExposure } = React.useMemo(() => {
    const totalCount = transactions.length;
    const flaggedTx = transactions.filter(t => t.risk_level === 'High' || t.audit_status === 'Flagged');
    const highRiskExposure = flaggedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { totalCount, flaggedTx, highRiskExposure };
  }, [transactions]);

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Summary
    const summaryData = [
      { Parameter: 'Auditing CA Firm', Value: 'R. MEHTA & CO. Chartered Accountants (FRN: 108922W)' },
      { Parameter: 'Audit Client', Value: selectedClient },
      { Parameter: 'Audit Period', Value: selectedYear },
      { Parameter: 'Report Generation Date', Value: new Date().toLocaleDateString('en-IN') },
      { Parameter: 'Lead Engagement Partner', Value: 'Rajesh Mehta, FCA (ICAI M.No: 045928)' },
      { Parameter: 'Total Ledger Vouchers Audited', Value: totalCount },
      { Parameter: 'Flagged High-Risk Exceptions', Value: flaggedTx.length },
      { Parameter: 'High-Risk Exposure (₹)', Value: highRiskExposure },
      { Parameter: 'Auditor Executive Assessment', Value: managementComments }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Audit_Summary');

    // Sheet 2: Flagged Exceptions
    const exceptionsData = flaggedTx.map(t => ({
      'Voucher ID': t.transaction_id,
      'Date': t.date,
      'Posting Date': t.posting_date || t.date,
      'Account Head': t.account_head,
      'Description': t.description,
      'Amount (₹)': t.amount,
      'Risk Score': t.risk_score,
      'Risk Severity': t.risk_level,
      'Primary Anomaly': t.anomalies[0]?.type || 'High Risk Exception',
      'All Triggered Rules': t.anomalies.map(a => a.type).join('; '),
      'AI Explainable Insight': t.ai_summary || '',
      'Audit Review Status': t.audit_status,
      'Auditor Working Notes': t.auditor_notes || ''
    }));
    const wsExceptions = XLSX.utils.json_to_sheet(exceptionsData);
    XLSX.utils.book_append_sheet(wb, wsExceptions, 'Flagged_Exceptions');

    // Sheet 3: Complete Scored Ledger
    const allLedgerData = transactions.map(t => ({
      'Voucher ID': t.transaction_id,
      'Date': t.date,
      'Account Head': t.account_head,
      'Description': t.description,
      'Debit (₹)': t.debit,
      'Credit (₹)': t.credit,
      'Amount (₹)': t.amount,
      'GSTIN': t.gst_number || '',
      'GST Amount (₹)': t.gst_amount || 0,
      'Risk Score': t.risk_score,
      'Risk Level': t.risk_level,
      'Audit Status': t.audit_status
    }));
    const wsLedger = XLSX.utils.json_to_sheet(allLedgerData);
    XLSX.utils.book_append_sheet(wb, wsLedger, 'Complete_Ledger');

    const cleanClient = selectedClient.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanYear = selectedYear.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `AuditPulse_Working_Papers_${cleanClient}_${cleanYear}.xlsx`);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner (Hidden in Print) Container */}
      <div className={`no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border p-6 rounded-3xl shadow-xl transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase tracking-wider">
              Step 4: Report Generation
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• Printable CA Working Paper</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Audit Executive Summary & Working Paper</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Generate printable executive audit reports for SME client management and audit committee review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40' 
                : 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Download multi-sheet audit working papers in Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span>Export Working Papers (.XLSX)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Auditor Management Comments Input (Hidden in Print) Container */}
      <div className={`no-print border rounded-2xl p-6 space-y-3 shadow-xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <FileText className="w-4 h-4 text-indigo-500" />
          Chartered Accountant Auditor Opinion & Recommendation
        </h3>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          This statement will be incorporated into the Executive Summary document letterhead below.
        </p>

        <textarea
          rows={3}
          value={managementComments}
          onChange={(e) => setManagementComments(e.target.value)}
          className={`w-full border rounded-xl p-3.5 text-xs font-sans focus:outline-none focus:border-indigo-500 ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        />
      </div>

      {/* Printable Executive Summary Document */}
      <div className={`card-print border rounded-2xl p-8 shadow-2xl space-y-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Document Letterhead */}
        <div className={`border-b pb-6 flex items-start justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                CA
              </div>
              <h1 className={`text-lg font-black tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                R. MEHTA & CO.
              </h1>
            </div>
            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chartered Accountants & Financial Auditors</p>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ICAI Firm Regn No: 108922W • Statutory Audit Division</p>
          </div>

          <div className="text-right space-y-1">
            <span className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-500 font-mono text-xs font-bold border border-indigo-500/30">
              AUDIT EXECUTIVE SUMMARY
            </span>
            <p className={`text-xs font-semibold mt-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{selectedClient}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Audit Financial Year: <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{selectedYear}</span></p>
            <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date Generated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Audit Scope & High-Level Risk Profile */}
        <div className={`grid grid-cols-3 gap-4 border p-4 rounded-xl text-center ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Ledger Vouchers</span>
            <p className={`text-xl font-bold font-mono mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{totalCount}</p>
          </div>
          <div>
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Flagged High-Risk Exceptions</span>
            <p className="text-xl font-bold font-mono text-rose-500 mt-1">{flaggedTx.length}</p>
          </div>
          <div>
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>High Risk Exposure ($/₹)</span>
            <p className="text-xl font-bold font-mono text-rose-500 mt-1">₹{highRiskExposure.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Auditor Executive Opinion */}
        <div className={`space-y-2 border p-5 rounded-xl ${
          isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/70 border-indigo-200'
        }`}>
          <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Auditor Executive Assessment & Risk Conclusion
          </h3>
          <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            "{managementComments}"
          </p>
        </div>

        {/* Key Exception Table */}
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Significant Anomaly Audit Exceptions Breakdown
          </h3>

          <div className={`overflow-x-auto border rounded-xl ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`font-semibold border-b uppercase tracking-wider ${
                  isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <th className="py-2.5 px-3">Voucher ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Account Head</th>
                  <th className="py-2.5 px-3">Primary Risk Flag</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Auditor Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {flaggedTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                      No high risk exceptions flagged for inclusion.
                    </td>
                  </tr>
                ) : (
                  flaggedTx.map((tx) => (
                    <tr key={tx.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                      <td className={`py-2.5 px-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{tx.transaction_id}</td>
                      <td className={`py-2.5 px-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tx.date}</td>
                      <td className={`py-2.5 px-3 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{tx.account_head}</td>
                      <td className="py-2.5 px-3 text-rose-500 font-medium">
                        {tx.anomalies[0]?.type || 'High Risk Entry'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30">
                          {tx.audit_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Sign-off Block */}
        <div className={`pt-8 border-t flex items-end justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="space-y-1">
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Auditing Firm Verification Stamp</p>
            <div className={`w-32 h-16 border border-dashed rounded-lg flex items-center justify-center text-[10px] font-mono ${
              isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'
            }`}>
              [DIGITAL CA STAMP]
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="h-10 font-serif italic text-indigo-500 text-base font-bold">
              Rajesh Mehta
            </div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Rajesh Mehta, FCA</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Senior Engagement Partner</p>
            <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Membership No: 045928</p>
          </div>
        </div>
      </div>
    </div>
  );
}
