import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  X, 
  Briefcase, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ClientManagementModal({
  isOpen,
  onClose,
  clients,
  selectedClient,
  onSelectClient,
  onAddClient,
  onDeleteClient,
  transactions = [],
  theme
}) {
  const isDark = theme === 'dark';

  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('Construction & Infrastructure');
  const [clientToDelete, setClientToDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  async function handleCreateClient(e) {
    e.preventDefault();
    const trimmed = newClientName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a valid client name.');
      return;
    }
    // Check if client name already exists (clients is an array of objects)
    if (clients.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A client with this name already exists.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: trimmed, industry: newClientIndustry })
      });
      if (!res.ok) throw new Error('Failed to add client');
      
      onAddClient(); // Refresh client list in Dashboard
      setNewClientName('');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error adding client. Please check connection.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmDelete(clientObj) {
    if (!clientObj || !clientObj.id) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:3000/api/clients/${clientObj.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete client');
      
      onDeleteClient(); // Refresh client list in Dashboard
      setClientToDelete(null);
    } catch (err) {
      setErrorMsg('Error deleting client.');
    } finally {
      setIsProcessing(false);
    }
  }

  // Count vouchers per client for display
  const voucherCountMap = {};
  transactions.forEach(t => {
    voucherCountMap[t.client_name] = (voucherCountMap[t.client_name] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Audit Client Directory Management
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Add, manage, or permanently remove clients and their ingested ledger records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Client Form */}
          <div className={`border rounded-2xl p-4 space-y-3 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <Plus className="w-4 h-4 text-indigo-500" />
              Register New Audit Client
            </h4>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Horizon Global Systems Ltd"
                    value={newClientName}
                    onChange={(e) => { setNewClientName(e.target.value); setErrorMsg(''); }}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Industry / Sector
                  </label>
                  <select
                    value={newClientIndustry}
                    onChange={(e) => setNewClientIndustry(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Construction & Infrastructure">Construction & Infrastructure</option>
                    <option value="Logistics & Transport">Logistics & Supply Chain</option>
                    <option value="Engineering & Heavy Machinery">Engineering & Technology</option>
                    <option value="Retail & FMCG Wholesale">Retail & FMCG</option>
                    <option value="Pharmaceuticals & Healthcare">Pharma & Healthcare</option>
                    <option value="Financial & Advisory Services">Financial & Advisory</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Client to Roster</span>
                </button>
              </div>
            </form>
          </div>

          {/* Delete Confirmation Alert if active */}
          {clientToDelete && (
            <div className="border border-rose-500/40 bg-rose-500/10 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-500">
                    Confirm Permanent Deletion of "{clientToDelete.name}"
                  </h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    This will permanently delete this client and <strong>all ingested transactions, anomaly findings, and working notes</strong> from the database. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setClientToDelete(null)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(clientToDelete)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete Client & Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Existing Clients List */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Registered Audit Clients ({clients.length})
            </h4>

            <div className={`divide-y rounded-2xl border overflow-hidden ${isDark ? 'divide-slate-800 border-slate-800 bg-slate-950/40' : 'divide-slate-200 border-slate-200 bg-white'}`}>
              {clients.map((client) => {
                const isSelected = client.id === selectedClient?.id;
                const count = voucherCountMap[client.name] || 0;

                return (
                  <div
                    key={client.id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      isSelected
                        ? isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/50'
                        : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {client.name}
                          </p>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                              Active Workspace
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {count} ledgers ingested
                          </p>
                          <p className={`text-[11px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {client.industry || 'No Industry'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectClient(client);
                            onClose();
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Switch</span>
                        </button>
                      )}

                      <button
                        onClick={() => setClientToDelete(client)}
                        disabled={clients.length <= 1}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          clients.length <= 1
                            ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                            : isDark
                              ? 'border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400'
                              : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                        }`}
                        title={clients.length <= 1 ? "Cannot delete the only remaining client" : "Delete client and all records"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
