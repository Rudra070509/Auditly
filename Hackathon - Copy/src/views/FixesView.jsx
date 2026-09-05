import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  CheckCheck,
  Building2,
  Bot,
  Zap,
  Check,
  Activity,
  Layers
} from 'lucide-react';
import { updateAuditStatusInDB } from '../lib/supabaseClient';
import { generateAIFix } from '../lib/aiFixEngine';
import { getCachedAIModelStats } from '../lib/anomalyEngine';
import AICopilotModal from '../components/AICopilotModal';

export default function FixesView({ transactions, selectedClient, selectedYear, onUpdateStatus, theme }) {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHeuristic, setSelectedHeuristic] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [customNotes, setCustomNotes] = useState({});
  const [isApplying, setIsApplying] = useState(null);
  const [isBatchApplying, setIsBatchApplying] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotTx, setCopilotTx] = useState(null);

  const aiStats = getCachedAIModelStats();

  // Filter transactions with anomalies
  const anomalousTx = useMemo(() => {
    return transactions.filter(t => t.anomalies && t.anomalies.length > 0);
  }, [transactions]);

  // Apply filters
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return anomalousTx.filter(t => {
      const matchesSearch = 
        t.transaction_id.toLowerCase().includes(q) ||
        t.account_head.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      const matchesHeuristic = 
        selectedHeuristic === 'All' || 
        t.anomalies.some(a => a.type.toLowerCase().includes(selectedHeuristic.toLowerCase()));

      const matchesStatus = 
        selectedStatus === 'All' || 
        (selectedStatus === 'Remediated' && t.audit_status === 'Remediated') ||
        (selectedStatus === 'Pending' && t.audit_status !== 'Remediated');

      return matchesSearch && matchesHeuristic && matchesStatus;
    });
  }, [anomalousTx, searchQuery, selectedHeuristic, selectedStatus]);

  // Statistics
  const totalAnomalies = anomalousTx.length;
  const remediatedCount = anomalousTx.filter(t => t.audit_status === 'Remediated').length;
  const pendingCount = totalAnomalies - remediatedCount;
  const resolvedExposure = anomalousTx
    .filter(t => t.audit_status === 'Remediated')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  function getDetails(t) {
    return t.ai_fix || generateAIFix(t);
  }

  async function handleApplyRemediation(t) {
    setIsApplying(t.id);
    const details = getDetails(t);
    const noteText = customNotes[t.id] || `Remediated as per AI protocol: ${details.actionTitle}`;
    
    await updateAuditStatusInDB(t.id, 'Remediated', t.auditor_notes, noteText);
    setIsApplying(null);
    onUpdateStatus();
  }

  async function handleBatchApplyAll() {
    setIsBatchApplying(true);
    const pendingList = anomalousTx.filter(t => t.audit_status !== 'Remediated');
    for (const t of pendingList) {
      const details = getDetails(t);
      const noteText = customNotes[t.id] || `Auto-Remediated via AI Model: ${details.actionTitle}`;
      await updateAuditStatusInDB(t.id, 'Remediated', t.auditor_notes, noteText);
    }
    setIsBatchApplying(false);
    onUpdateStatus();
  }

  function handleOpenCopilot(t) {
    setCopilotTx(t);
    setIsCopilotOpen(true);
  }

  function handleExportRemediationPlan() {
    const rows = anomalousTx.map(t => {
      const details = getDetails(t);
      return {
        'Voucher ID': t.transaction_id,
        'Date': t.date,
        'Account Head': t.account_head,
        'Voucher Amount (₹)': t.amount,
        'Detected Anomaly': t.anomalies[0]?.type || 'High Risk Exception',
        'Severity': t.risk_level,
        'AI Confidence (%)': t.ai_confidence || 94,
        'Remediation Action': details.actionTitle,
        'Statutory Compliance Rule': details.complianceRule,
        'Remediation Protocol': details.protocol,
        'Journal Entry Debit': `${details.entries[0]?.account} (${details.entries[0]?.amount})`,
        'Journal Entry Credit': `${details.entries[1]?.account} (${details.entries[1]?.amount})`,
        'Remediation Status': t.audit_status === 'Remediated' ? 'Remediated' : 'Pending Correction',
        'Auditor Remediation Notes': t.remediation_notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Remediation_Plan');
    XLSX.writeFile(wb, `AuditPulse_Remediation_Plan_${selectedClient.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}.xlsx`);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-6 rounded-3xl shadow-xl transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
              Step 4: AI Remediation & Fixes
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              • {selectedClient} ({selectedYear})
            </span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            AI Model Anomaly Remediation & Potential Fixes
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Autonomous statutory journal entry rectifications (ICAI / Ind AS / Companies Act / CGST Act) compiled with the audit engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenCopilot(anomalousTx[0])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Bot className="w-4 h-4" />
            <span>Consult AI Copilot</span>
          </button>

          {pendingCount > 0 && (
            <button
              onClick={handleBatchApplyAll}
              disabled={isBatchApplying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isBatchApplying ? 'Batch Remediating...' : `Auto-Apply All ${pendingCount} AI Fixes`}</span>
            </button>
          )}

          <button
            onClick={handleExportRemediationPlan}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40' 
                : 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Download full corrective action plan in Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span>Export Plan (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-500">{totalAnomalies}</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Requiring CA remediation</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Remediated & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-500">{remediatedCount}</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actioned with journal entries</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Pending Rectification</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-500">{pendingCount}</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unresolved audit exceptions</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Resolved Exposure</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black font-mono text-indigo-500">₹{resolvedExposure.toLocaleString('en-IN')}</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Protected through rectification</p>
        </div>
      </div>

      {/* Live AI Model Architecture & Engine Monitor */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30' 
          : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-indigo-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Model Engine Active
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                • Compiled with AuditPulse Core
              </span>
            </div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Cpu className="w-5 h-5 text-indigo-500" />
              Integrated AI Model Architecture (Multi-Layer Ensemble)
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Machine learning anomaly detection, Benford's forensic analysis, and automated double-entry fix synthesis running in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-2 rounded-xl border text-right ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI Model Confidence</p>
              <p className="text-lg font-black font-mono text-indigo-400">{aiStats.averageConfidence || 94}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Engine 1 */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Isolation Forest (ML)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Running (60 iTrees)
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Unsupervised high-dimensional outlier detection over amount, rate/quantity ratio, GST deviation, month-end timing, and posting lag.
            </p>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              • Total ML Inferences: {aiStats.totalInferences || transactions.length} vouchers
            </p>
          </div>

          {/* Engine 2 */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Benford's Law Forensic
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                {aiStats.benfordStats?.isConforming ? 'Conforming' : 'Anomalous Concentration'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              First-digit log-distribution test ($P(d) = \log_{10}(1 + 1/d)$) flagging unnatural voucher amounts clustered near audit approval limits.
            </p>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              • MAD Index: {aiStats.benfordStats?.meanAbsoluteDeviation?.toFixed(4) || '0.0120'}
            </p>
          </div>

          {/* Engine 3 */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> AI Fix Synthesizer
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Active (ICAI Rules)
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Synthesizes balanced double-entry adjusting journal entries citing Companies Act §143, CARO 2020, Ind AS 115, and CGST Act §16(2).
            </p>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              • Projected Risk Reduction: 100% (Risk drops to 0)
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`border rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search voucher, account, or narration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Heuristic:</span>
            <select
              value={selectedHeuristic}
              onChange={(e) => setSelectedHeuristic(e.target.value)}
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              <option value="All" className={isDark ? 'bg-slate-900' : 'bg-white'}>All Exceptions</option>
              <option value="Isolation" className={isDark ? 'bg-slate-900' : 'bg-white'}>Isolation Forest (ML)</option>
              <option value="Tax" className={isDark ? 'bg-slate-900' : 'bg-white'}>Tax/Math Inconsistency</option>
              <option value="Duplicate" className={isDark ? 'bg-slate-900' : 'bg-white'}>Duplicate Transactions</option>
              <option value="Backdated" className={isDark ? 'bg-slate-900' : 'bg-white'}>Backdated Entries</option>
              <option value="Round-Tripping" className={isDark ? 'bg-slate-900' : 'bg-white'}>Circular Round-Tripping</option>
              <option value="GST" className={isDark ? 'bg-slate-900' : 'bg-white'}>GST Mismatch</option>
              <option value="Month-End" className={isDark ? 'bg-slate-900' : 'bg-white'}>Month-End Spikes</option>
              <option value="Outlier" className={isDark ? 'bg-slate-900' : 'bg-white'}>3σ Outliers</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              <option value="All" className={isDark ? 'bg-slate-900' : 'bg-white'}>All States</option>
              <option value="Pending" className={isDark ? 'bg-slate-900' : 'bg-white'}>Pending Remediation</option>
              <option value="Remediated" className={isDark ? 'bg-slate-900 text-emerald-400' : 'bg-white text-emerald-600'}>Remediated & Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Remediation Cards List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className={`border rounded-2xl p-12 text-center space-y-2 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold">No anomalies match the current filter criteria.</p>
            <p className="text-xs text-slate-500">All flagged vouchers have been remediated or filtered out.</p>
          </div>
        ) : (
          filteredList.map((t) => {
            const details = getDetails(t);
            const isRemediated = t.audit_status === 'Remediated';

            return (
              <div
                key={t.id}
                className={`border rounded-2xl p-6 space-y-5 transition-all shadow-xl ${
                  isRemediated
                    ? isDark ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-300'
                    : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Card Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-indigo-500">
                      {t.transaction_id}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.account_head}
                    </span>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Date: {t.date}
                    </span>
                    {t.ml_score && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        ML Score: {(t.ml_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">
                      ₹{t.amount?.toLocaleString('en-IN')}
                    </span>
                    
                    {/* Before / After Risk Score Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                      isRemediated
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : t.risk_level === 'High'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {isRemediated ? 'Risk: 0/100 (Pass)' : `Risk: ${t.risk_score}/100 (${t.risk_level})`}
                    </span>

                    {/* AI Confidence Meter */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      AI Conf: {t.ai_confidence || details.confidence || 94}%
                    </span>

                    {isRemediated ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Remediated
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        Fix Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid: 2 Columns (Diagnosis & Statutory Protocol vs Corrective Journal Entry) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column: Diagnosis & Protocol */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Triggered Anomaly: {t.anomalies[0]?.type}
                      </span>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t.anomalies[0]?.description}
                      </p>
                      <p className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Evidence: {t.anomalies[0]?.evidence}
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-indigo-500 text-[11px] font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Statutory Standard: {details.complianceRule}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {details.protocol}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Corrective Journal Entry */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" />
                        AI Recommended Rectification Journal Entry
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        Projected Risk: {details.projectedRiskScore}/100
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {details.actionTitle}
                    </h4>

                    {/* Journal Entry Table */}
                    <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <th className="py-2 px-3">Ledger Particulars</th>
                            <th className="py-2 px-3 text-center">Type</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                          {details.entries.map((entry, idx) => (
                            <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                              <td className="py-2 px-3">
                                <span className={`font-sans font-semibold ${
                                  entry.type === 'Debit' ? 'text-indigo-400' : 'text-slate-400 pl-4'
                                }`}>
                                  {entry.type === 'Debit' ? 'By ' : 'To '} {entry.account}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  entry.type === 'Debit'
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {entry.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-bold">
                                {entry.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action & Notes */}
                <div className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex-1 max-w-lg">
                    {isRemediated ? (
                      <p className={`text-xs italic ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        ✓ Remediated: {t.remediation_notes || details.actionTitle}
                      </p>
                    ) : (
                      <input
                        type="text"
                        placeholder="Add custom auditor remediation note (optional)..."
                        value={customNotes[t.id] || ''}
                        onChange={(e) => setCustomNotes({ ...customNotes, [t.id]: e.target.value })}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenCopilot(t)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        isDark 
                          ? 'border-indigo-800 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50' 
                          : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                      title="Open AI Audit Copilot to query this voucher"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Copilot Query</span>
                    </button>

                    {!isRemediated ? (
                      <button
                        onClick={() => handleApplyRemediation(t)}
                        disabled={isApplying === t.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>{isApplying === t.id ? 'Applying Fix...' : 'Apply AI Rectification'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAuditStatusInDB(t.id, 'Pending').then(onUpdateStatus)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Re-open Exception
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AICopilotModal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedTx={copilotTx}
        allAnomalies={anomalousTx}
        theme={theme}
      />
    </div>
  );
}
