import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadView from './views/UploadView';
import DashboardView from './views/DashboardView';
import ExplorerView from './views/ExplorerView';
import FixesView from './views/FixesView';
import ReportView from './views/ReportView';
import AuthView from './views/AuthView';
import AICopilotModal from './components/AICopilotModal';
import { 
  fetchAuditTransactions, 
  clearLocalData, 
  getSavedClients, 
  saveClientsList, 
  deleteClientTransactions 
} from './lib/supabaseClient';
import { RAW_SAMPLE_TRANSACTIONS, SAMPLE_AUDIT_YEARS } from './lib/sampleData';
import { processTransactionsWithAnomalies } from './lib/anomalyEngine';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState(() => getSavedClients());
  const [selectedClient, setSelectedClient] = useState(() => getSavedClients()[0] || 'Apex Infra Tech Pvt Ltd');
  const [selectedYear, setSelectedYear] = useState(SAMPLE_AUDIT_YEARS[0]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Check saved Auth Session on mount
  useEffect(() => {
    const session = localStorage.getItem('auditpulse_auth_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('auditpulse_auth_session');
      }
    }
  }, []);

  // Load transactions whenever client, year or authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    }
  }, [isAuthenticated, selectedClient, selectedYear]);

  async function loadTransactions() {
    setIsLoading(true);
    try {
      const data = await fetchAuditTransactions(selectedClient, selectedYear);
      setTransactions(data);
    } catch (e) {
      console.warn('Error loading transactions, fallback to sample data:', e);
      setTransactions(processTransactionsWithAnomalies(RAW_SAMPLE_TRANSACTIONS));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReloadSampleData() {
    await clearLocalData();
    loadTransactions();
  }

  function handleAddClient(name) {
    const updated = [name, ...clients.filter(c => c !== name)];
    setClients(updated);
    saveClientsList(updated);
    setSelectedClient(name);
  }

  async function handleDeleteClient(name) {
    const updated = clients.filter(c => c !== name);
    const safeUpdated = updated.length > 0 ? updated : ['Apex Infra Tech Pvt Ltd'];
    setClients(safeUpdated);
    saveClientsList(safeUpdated);
    await deleteClientTransactions(name);

    if (selectedClient === name) {
      setSelectedClient(safeUpdated[0]);
    } else {
      loadTransactions();
    }
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem('auditpulse_auth_session');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }

  // Summary Metrics (Memoized for performance)
  const { totalCount, anomaliesList, anomalyCount, highRiskTx, highRiskCount, highRiskExposure } = useMemo(() => {
    const totalCount = transactions?.length || 0;
    const anomaliesList = (transactions || []).filter(t => t.anomalies && t.anomalies.length > 0);
    const anomalyCount = anomaliesList.length;
    const highRiskTx = (transactions || []).filter(t => t.risk_level === 'High');
    const highRiskCount = highRiskTx.length;
    const highRiskExposure = highRiskTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { totalCount, anomaliesList, anomalyCount, highRiskTx, highRiskCount, highRiskExposure };
  }, [transactions]);

  // If not authenticated, render Login / Firm Registration Gate
  if (!isAuthenticated) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomalyCount={anomalyCount}
        highRiskCount={highRiskCount}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <Header
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          clients={clients}
          onAddClient={handleAddClient}
          onDeleteClient={handleDeleteClient}
          transactions={transactions}
          onReloadSampleData={handleReloadSampleData}
          totalCount={totalCount}
          anomalyCount={anomalyCount}
          highRiskExposure={highRiskExposure}
          theme={theme}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-12">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-indigo-500 font-semibold text-sm">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Running Anomaly Detection Heuristics...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <UploadView
                  selectedClient={selectedClient}
                  selectedYear={selectedYear}
                  theme={theme}
                  onUploadComplete={() => {
                    loadTransactions();
                    setActiveTab('dashboard');
                  }}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                  theme={theme}
                  onNavigateToExplorer={() => setActiveTab('explorer')}
                />
              )}

              {activeTab === 'explorer' && (
                <ExplorerView
                  transactions={transactions}
                  theme={theme}
                  onUpdateStatus={loadTransactions}
                />
              )}

              {activeTab === 'fixes' && (
                <FixesView
                  transactions={transactions}
                  selectedClient={selectedClient}
                  selectedYear={selectedYear}
                  theme={theme}
                  onUpdateStatus={loadTransactions}
                />
              )}

              {activeTab === 'report' && (
                <ReportView
                  transactions={transactions}
                  selectedClient={selectedClient}
                  selectedYear={selectedYear}
                  theme={theme}
                  onUpdateStatus={loadTransactions}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global AI Audit Copilot Modal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedTx={transactions.find(t => t.anomalies && t.anomalies.length > 0) || null}
        allAnomalies={transactions.filter(t => t.anomalies && t.anomalies.length > 0)}
        theme={theme}
      />
    </div>
  );
}
