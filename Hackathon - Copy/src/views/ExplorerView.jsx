import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileSpreadsheet,
  Download,
  CheckCheck,
  Bot,
  Wrench,
  Cpu
} from 'lucide-react';
import { updateAuditStatusInDB } from '../lib/supabaseClient';
import { generateAIFix } from '../lib/aiFixEngine';
import AICopilotModal from '../components/AICopilotModal';

export default function ExplorerView({ transactions, onUpdateStatus, theme }) {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedAnomalyType, setSelectedAnomalyType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Transaction for Detail Modal
  const [activeTx, setActiveTx] = useState(null);
  const [auditorNote, setAuditorNote] = useState('');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotTx, setCopilotTx] = useState(null);

  // Filter transactions
  const filteredTx = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => {
      // Search
      const matchesSearch = 
        t.transaction_id.toLowerCase().includes(query) ||
        t.account_head.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.gst_number && t.gst_number.toLowerCase().includes(query));

      // Risk level
      const matchesRisk = selectedRisk === 'All' || t.risk_level === selectedRisk;

      // Anomaly type
      const matchesType = selectedAnomalyType === 'All' || t.anomalies.some(a => a.type.toLowerCase().includes(selectedAnomalyType.toLowerCase()));

      // Status
      const matchesStatus = selectedStatus === 'All' || t.audit_status === selectedStatus;

      return matchesSearch && matchesRisk && matchesType && matchesStatus;
    });
  }, [transactions, searchQuery, selectedRisk, selectedAnomalyType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTx.length / itemsPerPage) || 1;
  const paginatedTx = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTx.slice(start, start + itemsPerPage);
  }, [filteredTx, currentPage]);

  function handleOpenModal(tx) {
    setActiveTx(tx);
    setAuditorNote(tx.auditor_notes || '');
  }

  async function handleUpdateStatus(status) {
    if (!activeTx) return;
    await updateAuditStatusInDB(activeTx.id, status, auditorNote);
    onUpdateStatus();
    setActiveTx({
      ...activeTx,
      audit_status: status,
      auditor_notes: auditorNote
    });
  }

  async function handleApplyAIFix(tx) {
    const fix = tx.ai_fix || generateAIFix(tx);
    const note = `Auto-Applied AI Fix: ${fix.actionTitle} (${fix.complianceRule})`;
    await updateAuditStatusInDB(tx.id, 'Remediated', tx.auditor_notes, note);
    onUpdateStatus();
    setActiveTx({
      ...activeTx,
      audit_status: 'Remediated',
      remediation_notes: note,
      risk_score: 0,
      risk_level: 'Pass'
    });
  }

  function handleExportExcel() {
    const exportRows = filteredTx.map(t => ({
      'Voucher ID': t.transaction_id,
      'Date': t.date,
      'Posting Date': t.posting_date || t.date,
      'Account Head': t.account_head,
      'Description': t.description,
      'Amount (₹)': t.amount,
      'Debit (₹)': t.debit,
      'Credit (₹)': t.credit,
      'GST Number': t.gst_number || '',
      'GST Amount (₹)': t.gst_amount || 0,
      'ML Anomaly Score': t.ml_score !== undefined ? `${(t.ml_score * 100).toFixed(1)}%` : 'N/A',
      'AI Confidence': `${t.ai_confidence || 94}%`,
      'Risk Score': t.risk_score,
      'Risk Level': t.risk_level,
      'Detected Risk Flags': t.anomalies.map(a => a.type).join('; ') || 'None (Clean)',
      'AI Reasoning Summary': t.ai_summary || '',
      'AI Suggested Fix': t.ai_fix?.actionTitle || '',
      'Audit Status': t.audit_status,
      'Auditor Notes': t.auditor_notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Anomaly_Ledger');
    XLSX.writeFile(wb, `AuditPulse_Ledger_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  function handleExportCSV() {
    const exportRows = filteredTx.map(t => ({
      'Voucher ID': t.transaction_id,
      'Date': t.date,
      'Account Head': t.account_head,
      'Amount': t.amount,
      'ML Score': t.ml_score || '',
      'Risk Level': t.risk_level,
      'Risk Score': t.risk_score,
      'Detected Anomalies': t.anomalies.map(a => a.type).join('; '),
      'Audit Status': t.audit_status
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `AuditPulse_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleBulkApproveClean() {
    const cleanList = filteredTx.filter(t => t.anomalies.length === 0 && t.audit_status === 'Pending');
    for (const t of cleanList) {
      await updateAuditStatusInDB(t.id, 'Approved', 'Auto-approved by auditor bulk sweep (Clean record)');
    }
    onUpdateStatus();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Container */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-6 rounded-3xl shadow-xl transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 uppercase tracking-wider">
              Step 3: Anomaly Investigation
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• Showing {filteredTx.length} Vouchers</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Ledger Anomaly Explorer</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Search, filter, and inspect AI-generated risk reasoning and potential fixes for individual transaction vouchers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setCopilotTx(filteredTx[0] || null); setIsCopilotOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-600/30"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Copilot</span>
          </button>

          <button
            onClick={handleBulkApproveClean}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Auto-approve all clean/passed vouchers currently filtered"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>Approve Clean</span>
          </button>

          <button
            onClick={handleExportExcel}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Export filtered records to Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar Container */}
      <div className={`border rounded-2xl p-4 space-y-4 shadow-xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search voucher ID, account, GST..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Filter by Risk Level */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => { setSelectedRisk(e.target.value); setCurrentPage(1); }}
              className={`bg-transparent text-xs focus:outline-none cursor-pointer w-full font-semibold ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              <option value="All" className={isDark ? 'bg-slate-900' : 'bg-white'}>All Risk Tiers</option>
              <option value="High" className={isDark ? 'bg-slate-900 text-rose-400' : 'bg-white text-rose-600'}>High Risk (60+)</option>
              <option value="Medium" className={isDark ? 'bg-slate-900 text-amber-400' : 'bg-white text-amber-600'}>Medium Risk (25-59)</option>
              <option value="Low" className={isDark ? 'bg-slate-900 text-emerald-400' : 'bg-white text-emerald-600'}>Low Risk (1-24)</option>
              <option value="Pass" className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}>Clean / Passed</option>
            </select>
          </div>

          {/* Filter by Anomaly Type */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Heuristic:</span>
            <select
              value={selectedAnomalyType}
              onChange={(e) => { setSelectedAnomalyType(e.target.value); setCurrentPage(1); }}
              className={`bg-transparent text-xs focus:outline-none cursor-pointer w-full font-semibold ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              <option value="All" className={isDark ? 'bg-slate-900' : 'bg-white'}>All Heuristics & ML</option>
              <option value="Isolation" className={isDark ? 'bg-slate-900' : 'bg-white'}>Isolation Forest (ML)</option>
              <option value="Tax" className={isDark ? 'bg-slate-900' : 'bg-white'}>Tax/Math Inconsistency</option>
              <option value="Benford" className={isDark ? 'bg-slate-900' : 'bg-white'}>Benford's Law Deviation</option>
              <option value="Duplicate" className={isDark ? 'bg-slate-900' : 'bg-white'}>Duplicate Transactions</option>
              <option value="Backdated" className={isDark ? 'bg-slate-900' : 'bg-white'}>Backdated Entries</option>
              <option value="Round-Tripping" className={isDark ? 'bg-slate-900' : 'bg-white'}>Round-Tripping / Circular</option>
              <option value="GST" className={isDark ? 'bg-slate-900' : 'bg-white'}>GST Mismatch</option>
              <option value="Month-End" className={isDark ? 'bg-slate-900' : 'bg-white'}>Month-End Spikes</option>
              <option value="Outlier" className={isDark ? 'bg-slate-900' : 'bg-white'}>3σ Statistical Outliers</option>
            </select>
          </div>

          {/* Filter by Audit Status */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review:</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className={`bg-transparent text-xs focus:outline-none cursor-pointer w-full font-semibold ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              <option value="All" className={isDark ? 'bg-slate-900' : 'bg-white'}>All Review States</option>
              <option value="Pending" className={isDark ? 'bg-slate-900' : 'bg-white'}>Pending Review</option>
              <option value="Remediated" className={isDark ? 'bg-slate-900 text-emerald-400' : 'bg-white text-emerald-600'}>Remediated with AI Fix</option>
              <option value="Approved" className={isDark ? 'bg-slate-900 text-emerald-400' : 'bg-white text-emerald-600'}>Approved by CA</option>
              <option value="Flagged" className={isDark ? 'bg-slate-900 text-rose-400' : 'bg-white text-rose-600'}>Flagged for Audit Paper</option>
              <option value="Dismissed" className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}>Dismissed (False Positive)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className={`border rounded-2xl shadow-xl overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`font-semibold border-b uppercase tracking-wider ${
                isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Voucher ID & Date</th>
                <th className="py-3.5 px-4">Account Head</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4">Detected Risk Flags</th>
                <th className="py-3.5 px-4 text-center">Score / ML</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {paginatedTx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTx.map((tx) => {
                  const isHigh = tx.risk_level === 'High';
                  const isMedium = tx.risk_level === 'Medium';
                  const isLow = tx.risk_level === 'Low';
                  const isRemediated = tx.audit_status === 'Remediated';

                  return (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors ${
                        isDark 
                          ? isRemediated ? 'bg-emerald-950/10 hover:bg-slate-800/60' : isHigh ? 'bg-rose-950/10 hover:bg-slate-800/60' : isMedium ? 'bg-amber-950/5 hover:bg-slate-800/60' : 'hover:bg-slate-800/40'
                          : isRemediated ? 'bg-emerald-50/30 hover:bg-slate-100' : isHigh ? 'bg-rose-50/50 hover:bg-slate-100' : isMedium ? 'bg-amber-50/40 hover:bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Review Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          tx.audit_status === 'Remediated'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : tx.audit_status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : tx.audit_status === 'Flagged'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : tx.audit_status === 'Dismissed'
                            ? isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-300'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {tx.audit_status === 'Remediated' && <CheckCircle2 className="w-3 h-3" />}
                          {tx.audit_status}
                        </span>
                      </td>

                      {/* Voucher ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-0.5">
                        <p className={`font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{tx.transaction_id}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tx.date}</p>
                      </td>

                      {/* Account Head */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{tx.account_head}</p>
                        {tx.gst_number && (
                          <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>GSTIN: {tx.gst_number}</p>
                        )}
                      </td>

                      {/* Description */}
                      <td className={`py-3.5 px-4 max-w-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {tx.description}
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Anomalies Badges */}
                      <td className="py-3.5 px-4">
                        {tx.anomalies.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Clean Entry</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {tx.anomalies.map((a, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  a.severity === 'High'
                                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                                }`}
                              >
                                {a.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Risk Score & ML Metric */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center space-y-1">
                        <span className={`inline-block font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${
                          isRemediated
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isHigh 
                            ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                            : isMedium 
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                            : isLow
                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                            : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {tx.risk_score}
                        </span>

                        {tx.ml_score !== undefined && (
                          <p className={`text-[9px] font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            ML: {(tx.ml_score * 100).toFixed(0)}%
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenModal(tx)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all hover:scale-105 ${
                            isDark 
                              ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300' 
                              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>AI Reason</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span>
            Page <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{currentPage}</strong> of <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail & AI Reasoning Modal Container */}
      {activeTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Voucher Detail: <span className="font-mono text-indigo-500">{activeTx.transaction_id}</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Explainable AI Audit Risk Diagnosis & Remediation</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTx(null)}
                className={`text-sm font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Voucher Meta Grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 border p-4 rounded-xl text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Account Head</span>
                  <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{activeTx.account_head}</p>
                </div>
                <div>
                  <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Voucher Amount</span>
                  <p className={`font-bold font-mono mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>₹{activeTx.amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Transaction Date</span>
                  <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{activeTx.date}</p>
                </div>
                <div>
                  <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Risk Tier Score</span>
                  <p className={`font-mono font-bold mt-0.5 ${
                    activeTx.risk_level === 'High' ? 'text-rose-500' : activeTx.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {activeTx.risk_level} ({activeTx.risk_score}/100)
                  </p>
                </div>
              </div>

              {/* AI Reasoning Insight Box */}
              <div className={`border rounded-xl p-5 space-y-2 shadow-inner ${
                isDark ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">AI Explainable Auditor Insight</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Confidence: {activeTx.ai_confidence || 94}%
                  </span>
                </div>
                <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {activeTx.ai_summary}
                </p>
              </div>

              {/* AI Suggested Fix Card (If Anomaly Exists) */}
              {activeTx.anomalies.length > 0 && (
                <div className={`border rounded-xl p-5 space-y-3 ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <h4 className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                        AI Potential Fix & Journal Entry
                      </h4>
                    </div>

                    {activeTx.audit_status !== 'Remediated' && (
                      <button
                        onClick={() => handleApplyAIFix(activeTx)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Apply Fix</span>
                      </button>
                    )}
                  </div>

                  {(() => {
                    const fix = activeTx.ai_fix || generateAIFix(activeTx);
                    return (
                      <div className="space-y-2 text-xs">
                        <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {fix.actionTitle}
                        </p>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Rule: <span className="text-indigo-400 font-medium">{fix.complianceRule}</span>
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {fix.protocol}
                        </p>

                        {/* Journal Table */}
                        <div className={`border rounded-lg overflow-hidden mt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead className={isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}>
                              <tr>
                                <th className="p-2">Account Particulars</th>
                                <th className="p-2 text-center">Type</th>
                                <th className="p-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                              {fix.entries.map((e, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-sans">{e.type === 'Debit' ? 'By ' : 'To '} {e.account}</td>
                                  <td className="p-2 text-center font-bold text-indigo-400">{e.type}</td>
                                  <td className="p-2 text-right font-bold">{e.amount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Detailed Rule Breakdown List */}
              <div className="space-y-3">
                <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Triggered Anomaly Detection Rules ({activeTx.anomalies.length})
                </h4>

                {activeTx.anomalies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No heuristic rules triggered for this clean entry.</p>
                ) : (
                  <div className="space-y-2">
                    {activeTx.anomalies.map((a, i) => (
                      <div key={i} className={`border rounded-xl p-4 space-y-1 ${
                        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{a.type}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            a.severity === 'High' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          }`}>
                            +{a.scoreImpact} Score Impact
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{a.description}</p>
                        <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Evidence: {a.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auditor Action & Notes Section */}
              <div className={`border rounded-xl p-4 space-y-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Auditor Working Paper Decision & Notes
                </h4>

                <textarea
                  rows={2}
                  value={auditorNote}
                  onChange={(e) => setAuditorNote(e.target.value)}
                  placeholder="Enter auditor comments or physical voucher verification notes..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setCopilotTx(activeTx); setIsCopilotOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/40 text-xs font-bold"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Copilot</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus('Approved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-500 text-xs font-bold transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Approve Entry
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Flagged')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-500 text-xs font-bold transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      Flag for Audit Paper
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Dismissed')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Modal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedTx={copilotTx}
        allAnomalies={transactions.filter(t => t.anomalies.length > 0)}
        theme={theme}
      />
    </div>
  );
}
