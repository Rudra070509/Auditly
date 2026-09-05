import React from 'react';
import { 
  Upload, 
  LayoutDashboard, 
  Search, 
  FileCheck, 
  ShieldAlert, 
  Database, 
  Moon,
  Sun,
  LogOut,
  Wrench,
  Bot
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  anomalyCount, 
  highRiskCount, 
  theme, 
  toggleTheme, 
  currentUser, 
  onLogout 
}) {
  const isDark = theme === 'dark';

  const navItems = [
    {
      id: 'upload',
      label: 'Data Import & Ingestion',
      icon: Upload,
      badge: null,
      description: 'Upload Excel/CSV & map headers'
    },
    {
      id: 'dashboard',
      label: 'Risk Overview Dashboard',
      icon: LayoutDashboard,
      badge: anomalyCount > 0 ? `${anomalyCount} Anomalies` : null,
      badgeColor: isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border-indigo-200',
      description: 'KPIs, visual analytics & trends'
    },
    {
      id: 'explorer',
      label: 'Anomaly Explorer',
      icon: Search,
      badge: highRiskCount > 0 ? `${highRiskCount} High Risk` : null,
      badgeColor: isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-200',
      description: 'Filterable ledger & AI reasoning'
    },
    {
      id: 'fixes',
      label: 'Remediation & Fixes',
      icon: Wrench,
      badge: anomalyCount > 0 ? `${anomalyCount} To Fix` : null,
      badgeColor: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Corrective actions & journal entries'
    },
    {
      id: 'report',
      label: 'Audit Report Generator',
      icon: FileCheck,
      badge: 'Export PDF',
      badgeColor: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description: 'CA checklist & executive summary'
    }
  ];

  return (
    <aside className={`w-72 border-r flex flex-col justify-between select-none h-screen sticky top-0 z-30 transition-colors duration-300 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      {/* Brand Header */}
      <div>
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div>
              <h1 className={`font-bold tracking-tight text-base flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                AuditPulse <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-500 font-mono font-medium border border-indigo-500/30">AI</span>
              </h1>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>SME Financial Audit Engine</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle light/dark theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Database Status Indicator Container */}
        <div className={`px-4 py-3 mx-3 my-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Database className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Engine:</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
            isSupabaseConfigured 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseConfigured ? 'Supabase DB' : 'Local Sandbox'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group flex flex-col gap-1 border ${
                  isActive
                    ? isDark 
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100 shadow-md shadow-indigo-950/40' 
                      : 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                    : isDark 
                      ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-indigo-500' : isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-800'
                    }`} />
                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] pl-8 font-normal ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.description}</p>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Auditor Profile Card Container */}
      <div className={`p-4 border-t transition-colors ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
        <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              CA
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                {currentUser?.name || 'Rajesh Mehta, FCA'}
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentUser?.title || 'Engagement Partner'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-slate-800 hover:bg-rose-900/30 border-slate-700 text-slate-400 hover:text-rose-400' 
                : 'bg-slate-100 hover:bg-rose-50 border-slate-300 text-slate-600 hover:text-rose-600'
            }`}
            title="Sign out of auditor workspace"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
