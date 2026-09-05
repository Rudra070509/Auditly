import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Plus,
  Bot
} from 'lucide-react';
import { SAMPLE_AUDIT_YEARS } from '../lib/sampleData';
import ClientManagementModal from './ClientManagementModal';

export default function Header({ 
  selectedClient, 
  setSelectedClient, 
  selectedYear, 
  setSelectedYear, 
  clients = [],
  onAddClient,
  onDeleteClient,
  transactions = [],
  onReloadSampleData,
  totalCount,
  anomalyCount,
  highRiskExposure,
  theme,
  onOpenCopilot
}) {
  const isDark = theme === 'dark';
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  return (
    <>
      <header className={`backdrop-blur border-b px-6 py-4 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Client & Audit Year Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 shadow-inner transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Audit Client:</span>
            <select
              value={selectedClient}
              onChange={(e) => {
                if (e.target.value === '__MANAGE_CLIENTS__') {
                  setIsClientModalOpen(true);
                } else {
                  setSelectedClient(e.target.value);
                }
              }}
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-2 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {clients.map((c) => (
                <option key={c} value={c} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>
                  {c}
                </option>
              ))}
              <option disabled className={isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}>
                ──────────
              </option>
              <option value="__MANAGE_CLIENTS__" className="text-indigo-500 font-bold">
                + Add / Delete Clients...
              </option>
            </select>
          </div>

          <button
            onClick={() => setIsClientModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
            }`}
            title="Add or delete audit clients and data"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Manage Clients</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold">
              {clients.length}
            </span>
          </button>

          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 shadow-inner transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Period:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-2 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {SAMPLE_AUDIT_YEARS.map((y) => (
                <option key={y} value={y} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Summary Pill & Actions */}
        <div className="flex items-center gap-4">
          <div className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Vouchers:</span>
              <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{totalCount}</span>
            </div>

            <div className={`h-3 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Flagged:</span>
              <span className="text-amber-500 font-mono font-bold">{anomalyCount}</span>
            </div>

            <div className={`h-3 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

            <div className="flex items-center gap-1.5">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>High Risk Exp:</span>
              <span className="text-rose-500 font-mono font-bold">
                ₹{highRiskExposure.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95"
            title="Open AI Audit Copilot & Ledger Doctor"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>

          <button
            onClick={onReloadSampleData}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300' 
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
            title="Reload fresh sample SME data with intentional anomalies"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Reload Ledger</span>
          </button>
        </div>
      </header>

      {/* Client Management Modal */}
      <ClientManagementModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={clients}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        onAddClient={onAddClient}
        onDeleteClient={onDeleteClient}
        transactions={transactions}
        theme={theme}
      />
    </>
  );
}
