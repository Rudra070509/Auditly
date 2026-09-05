import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart3,
  Layers,
  FileSearch,
  CheckSquare,
  Cpu,
  Bot,
  Activity,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { getCachedAIModelStats } from '../lib/anomalyEngine';

export default function DashboardView({ transactions, onNavigateToExplorer, theme }) {
  const isDark = theme === 'dark';

  const aiStats = getCachedAIModelStats();
  const { 
    totalCount, 
    anomalyCount, 
    anomalyRate, 
    highRiskCount, 
    highRiskExposure, 
    pendingReviews, 
    fixesAvailableCount, 
    barChartData, 
    lineChartData, 
    topAccountExposures 
  } = useMemo(() => {
    const totalCount = transactions.length;
    const anomaliesList = transactions.filter(t => t.anomalies && t.anomalies.length > 0);
    const anomalyCount = anomaliesList.length;
    const anomalyRate = totalCount > 0 ? ((anomalyCount / totalCount) * 100).toFixed(1) : '0';

    const highRiskTx = transactions.filter(t => t.risk_level === 'High');
    const highRiskCount = highRiskTx.length;
    const highRiskExposure = highRiskTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingReviews = transactions.filter(t => t.audit_status === 'Pending').length;
    const fixesAvailableCount = anomaliesList.filter(t => t.ai_fix || t.audit_status !== 'Remediated').length;

    // Compute Anomaly Distribution by Category
    const categoryCounts = {
      'ML Outlier': 0, 'Tax Math': 0, 'Duplicate': 0, 'Backdated': 0,
      'Circular RT': 0, 'GST Mismatch': 0, 'Month-End': 0, '3σ Outlier': 0
    };

    transactions.forEach(t => {
      t.anomalies?.forEach(a => {
        if (a.type.includes('Isolation Forest') || a.type.includes('ML')) categoryCounts['ML Outlier']++;
        else if (a.type.includes('Tax') || a.type.includes('Calculation') || a.type.includes('Zero-Value')) categoryCounts['Tax Math']++;
        else if (a.type.includes('Duplicate')) categoryCounts['Duplicate']++;
        else if (a.type.includes('Backdated')) categoryCounts['Backdated']++;
        else if (a.type.includes('Round-Tripping') || a.type.includes('Circular')) categoryCounts['Circular RT']++;
        else if (a.type.includes('GST')) categoryCounts['GST Mismatch']++;
        else if (a.type.includes('Month-End')) categoryCounts['Month-End']++;
        else if (a.type.includes('Outlier') || a.type.includes('3σ')) categoryCounts['3σ Outlier']++;
      });
    });

    const barChartData = [
      { name: 'ML Outlier', count: categoryCounts['ML Outlier'], color: '#6366f1' },
      { name: 'Tax Math', count: categoryCounts['Tax Math'], color: '#06b6d4' },
      { name: 'Duplicate', count: categoryCounts['Duplicate'], color: '#ef4444' },
      { name: 'Backdated', count: categoryCounts['Backdated'], color: '#f59e0b' },
      { name: 'Circular RT', count: categoryCounts['Circular RT'], color: '#ec4899' },
      { name: 'GST Mismatch', count: categoryCounts['GST Mismatch'], color: '#3b82f6' },
      { name: 'Month-End', count: categoryCounts['Month-End'], color: '#8b5cf6' },
      { name: '3σ Outlier', count: categoryCounts['3σ Outlier'], color: '#10b981' }
    ];

    // Group by Date for Volume vs Anomaly Trend Line Chart
    const dateGroups = {};
    transactions.forEach(t => {
      const d = t.date || '2024-01-01';
      if (!dateGroups[d]) {
        dateGroups[d] = { date: d, total: 0, anomalies: 0 };
      }
      dateGroups[d].total += 1;
      if (t.anomalies && t.anomalies.length > 0) {
        dateGroups[d].anomalies += 1;
      }
    });
    const lineChartData = Object.values(dateGroups).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top Vulnerable Account Heads
    const accountExposureMap = {};
    highRiskTx.forEach(t => {
      const head = t.account_head || 'Other';
      if (!accountExposureMap[head]) {
        accountExposureMap[head] = { name: head, count: 0, exposure: 0 };
      }
      accountExposureMap[head].count += 1;
      accountExposureMap[head].exposure += t.amount || 0;
    });
    const topAccountExposures = Object.values(accountExposureMap)
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 4);

    return { totalCount, anomalyCount, anomalyRate, highRiskCount, highRiskExposure, pendingReviews, fixesAvailableCount, barChartData, lineChartData, topAccountExposures };
  }, [transactions]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Executive Header Banner Container */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-6 rounded-3xl shadow-xl transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border-slate-800' 
          : 'bg-gradient-to-r from-white via-white to-indigo-50/60 border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Step 2: AI Model Analytics
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              • Isolation Forest & Benford Forensic Active
            </span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Audit Anomaly Risk Overview
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Multi-layer AI machine learning detection, forensic rules, and automated statutory fixes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Confidence: {aiStats.averageConfidence || 94}%</span>
          </div>

          <button
            onClick={onNavigateToExplorer}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <FileSearch className="w-4 h-4" />
            <span>Investigate Anomaly Explorer</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Analyzed */}
        <div className={`border rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-colors shadow-lg ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI Inferences Scanned</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{totalCount}</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>100% General Ledger Ingested</p>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="bg-indigo-500 h-full w-full" />
          </div>
        </div>

        {/* Card 2: Total Anomalies */}
        <div className={`border rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-colors shadow-lg ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Anomalies Flagged</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-amber-500 font-mono tracking-tight">{anomalyCount}</p>
              <span className="text-xs font-bold text-amber-500">({anomalyRate}%)</span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ML + Forensic Rules Combined</p>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, Number(anomalyRate) * 3)}%` }} />
          </div>
        </div>

        {/* Card 3: High Risk Exposure */}
        <div className={`border rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-colors shadow-lg ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>High-Risk Exposure (₹)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-500 font-mono tracking-tight">
              ₹{highRiskExposure.toLocaleString('en-IN')}
            </p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{highRiskCount} critical vouchers requiring sign-off</p>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="bg-rose-500 h-full w-4/5" />
          </div>
        </div>

        {/* Card 4: AI Fixes Ready */}
        <div className={`border rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-colors shadow-lg ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI Potential Fixes</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-500 font-mono tracking-tight">{fixesAvailableCount}</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balanced journal entries generated</p>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="bg-emerald-500 h-full" style={{ width: `${totalCount > 0 ? ((totalCount - pendingReviews) / totalCount) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Anomaly Trend Line */}
        <div className={`border rounded-2xl p-6 space-y-4 shadow-xl transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Voucher Volume vs. Detected Anomalies
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Temporal timeline distribution across accounting period</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>Timeline</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Line type="monotone" dataKey="total" name="Total Volume" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="anomalies" name="Flagged Anomalies" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Bar Chart */}
        <div className={`border rounded-2xl p-6 space-y-4 shadow-xl transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Risk Pattern Distribution by Category
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total occurrences across ML and forensic rules</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>Ensemble AI</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Bar dataKey="count" name="Flagged Count" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top High-Risk Account Heads Breakdown */}
      <div className={`border rounded-2xl p-6 space-y-4 shadow-xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              High-Risk Exposure by Ledger Account Head
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accounts carrying highest monetary concentration of high-severity flags</p>
          </div>

          <button 
            onClick={onNavigateToExplorer} 
            className="text-xs text-indigo-500 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Ledger Entries</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topAccountExposures.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No high risk account heads detected in this selection.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topAccountExposures.map((acc) => (
              <div key={acc.name} className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{acc.name}</p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {acc.count} high-risk voucher(s) flagged
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black font-mono text-rose-500">
                    ₹{acc.exposure.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold border border-rose-500/30">
                    Requires Review
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
