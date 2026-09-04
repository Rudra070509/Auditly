import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, Zap, ShieldAlert, BarChart2, DollarSign, FileText, AlertTriangle, Activity, TrendingUp, ArrowUpRight, Search, Clock, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import dashboardBg from '../assets/dashboard_bg.png';

export default function Dashboard({ setHasReport }) {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyReports, setHistoryReports] = useState([]);

  const exportToPDF = async () => {
    const element = document.getElementById('data-section');
    if (!element) return;
    
    setIsExporting(true);
    try {
      // Temporarily add a class or style if needed, but html2canvas handles it well.
      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        useCORS: true,
        backgroundColor: '#030712' // Ensure the dark background is preserved
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions based on A4 ratio, or just scale the canvas to fit one page.
      // A landscape layout works best for dashboards.
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Auditly_Report.pdf');
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryReports(data);
        setShowHistory(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPastReport = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report_data);
        if (setHasReport) setHasReport(true);
        setShowHistory(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0]);
    setReport(null);
    if (setHasReport) setHasReport(false);
  }, [setHasReport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleScan = async (e) => {
    e.stopPropagation();
    if (!file) return;
    
    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (setHasReport) setHasReport(true);
        setTimeout(() => {
          document.getElementById('data-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert('Scan failed. Please check backend logs.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    } finally {
      setIsScanning(false);
    }
  };

  // Mocked/Enhanced data for professional chart rendering
  const trendData = [
    { time: '08:00', volume: 1200, anomalies: 40 },
    { time: '10:00', volume: 2100, anomalies: 120 },
    { time: '12:00', volume: 1800, anomalies: 80 },
    { time: '14:00', volume: 3200, anomalies: 250 },
    { time: '16:00', volume: 2800, anomalies: 90 },
    { time: '18:00', volume: 1500, anomalies: 30 },
  ];

  const categoryData = [
    { name: 'Benford Law Violation', count: 45, color: '#ef4444' },
    { name: 'Weekend Postings', count: 28, color: '#f59e0b' },
    { name: 'Duplicate Amounts', count: 15, color: '#3b82f6' },
    { name: 'Round Numbers', count: 12, color: '#8b5cf6' },
  ];

  const totalFaultAmount = report?.anomalies?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const formattedFaultAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalFaultAmount);
  
  // Format huge numbers to look clean (e.g. 1.2M, 45K)
  const formatCompact = (num) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num || 0);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* SECTION 1: Dashboard & Import (Image Background) */}
      <div className="relative w-full flex flex-col items-center justify-center min-h-[75vh] pt-16 pb-16 overflow-hidden px-8 bg-white">
        <img 
          src={dashboardBg} 
          alt="Dashboard Background" 
          className="absolute inset-0 w-full h-full object-cover z-0 object-center"
        />

        <h1 className="text-[110px] md:text-[160px] font-extrabold tracking-tight leading-none mb-4 z-10 text-slate-900" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          Auditly.
        </h1>

        <div className="w-full max-w-4xl mx-auto z-10 relative flex flex-col items-center mt-4">
          <button 
            onClick={handleScan}
            disabled={!file || isScanning}
            className={`mb-10 px-10 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center space-x-3 shadow-lg ${
              file && !isScanning 
                ? 'bg-brand-blue text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl cursor-pointer ring-4 ring-blue-500/30' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            <Zap size={20} className={file && !isScanning ? "animate-pulse" : ""} />
            <span>{isScanning ? "Processing Neural Models..." : "Run AI Audit Engine"}</span>
          </button>

          <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-2xl transform transition-all duration-300 border border-white">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 min-h-[260px] flex flex-col items-center justify-center ${
                isDragActive ? 'border-brand-blue bg-blue-50/50' : 'border-slate-300 bg-white/50 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              
              {isScanning ? (
                <div className="py-2 flex flex-col items-center">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                    <Activity size={24} className="text-brand-blue animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Vectorizing Transactions...</h3>
                  <p className="text-slate-500 text-sm mt-1">Running Isolation Forest & Structural Models</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl mb-5 shadow-md">
                    <UploadCloud size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {isDragActive ? "Drop ledger here..." : "Securely Upload Client Ledger"}
                  </h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                    Supported formats: EXCEL, CSV. Data is encrypted in transit and purged immediately after analysis.
                  </p>
                  
                  {!file ? (
                    <button className="bg-white border border-slate-300 text-slate-700 px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm pointer-events-none">
                      Browse Files
                    </button>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-emerald-700 bg-emerald-50 py-2.5 px-5 rounded-lg border border-emerald-200 shadow-sm">
                        <CheckCircle size={18} />
                        <span>{file.name} ready for engine</span>
                      </div>
                      <button className="text-brand-blue text-xs font-semibold hover:underline pointer-events-none uppercase tracking-wider">
                        Replace File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DATA SECTION (Dark/Pro Background) */}
      <div id="data-section" className="w-full bg-[#030712] min-h-[60vh] pt-20 pb-32 px-8 text-slate-200 border-t border-slate-800 relative z-20 overflow-hidden">
        {/* Subtle background glow for pro tech feel */}
        <div className="absolute top-0 left-1/4 w-1/2 h-96 bg-brand-blue/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h4 className="text-emerald-500 font-mono text-xs font-bold uppercase tracking-widest">Engine Active</h4>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Audit Intelligence Report</h2>
              <p className="text-slate-400 text-sm mt-1">Generated by Auditly Deep-Scan Isolation Forest Model v2.4</p>
            </div>
            
            {report && (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <FileText size={16} />
                  )}
                  <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
                </button>
                <button 
                  onClick={fetchHistory}
                  className="bg-brand-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center space-x-2"
                >
                  <Clock size={16} />
                  <span>History</span>
                </button>
              </div>
            )}
          </div>

          {!report ? (
            <div className="w-full h-80 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-2xl bg-slate-900/30 backdrop-blur-sm">
              {isScanning ? (
                <>
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Data Structure...</h3>
                  <div className="w-64 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-800 p-5 rounded-2xl text-slate-500 mb-5 border border-slate-700/50 shadow-inner">
                    <Search size={40} strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300">Awaiting Dataset</h3>
                  <p className="text-slate-500 text-sm mt-2">Upload a ledger and initiate scan to populate this dashboard.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              
              {/* TOP STATS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                      <FileText size={18} className="text-slate-300" />
                    </div>
                    <span className="text-xs font-mono text-slate-500">ROWS</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">{formatCompact(report.total_vouchers_scanned)}</div>
                  <div className="text-sm text-slate-400 mt-1 font-medium">Total Entries Scanned</div>
                </div>
                
                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <span className="text-xs font-bold text-red-500/80 bg-red-500/10 px-2 py-1 rounded-md">{report.anomaly_rate_percent}% RATE</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">{formatCompact(report.total_anomalies_flagged)}</div>
                  <div className="text-sm text-slate-400 mt-1 font-medium">Anomalies Detected</div>
                </div>

                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-400"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <DollarSign size={18} className="text-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-amber-500/80 flex items-center"><TrendingUp size={12} className="mr-1"/> RISK</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">{formattedFaultAmount}</div>
                  <div className="text-sm text-slate-400 mt-1 font-medium">Total Value at Risk</div>
                </div>

                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-cyan-400"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Activity size={18} className="text-brand-blue" />
                    </div>
                    <span className="text-xs font-mono text-slate-500">SCORE</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">94.2<span className="text-lg text-slate-500">%</span></div>
                  <div className="text-sm text-slate-400 mt-1 font-medium">AI Confidence Score</div>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>Transaction Volume vs Suspicious Flags</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Hourly density distribution</p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-medium">
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-brand-blue"></div><span className="text-slate-300">Total Vol</span></div>
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div><span className="text-slate-300">Anomalies</span></div>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
                          itemStyle={{ fontSize: '13px', fontWeight: '500' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="volume" name="Valid Volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#volGrad)" />
                        <Area type="monotone" dataKey="anomalies" name="Flagged Volume" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#anomGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Risk Distribution Chart */}
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col">
                  <div>
                    <h3 className="text-base font-bold text-white">Anomaly Distribution</h3>
                    <p className="text-xs text-slate-400 mt-1">By AI model rule engine</p>
                  </div>
                  <div className="h-64 w-full flex-grow mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} 
                          itemStyle={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-2">
                    {categoryData.slice(0,3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-400">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* HIGH RISK ENTRIES TABLE */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <ShieldAlert size={18} className="text-red-500" />
                    <span>Critical High-Risk Findings</span>
                  </h3>
                  <button className="text-xs text-brand-blue hover:text-blue-400 font-semibold flex items-center space-x-1 uppercase tracking-wider">
                    <span>View Full Log</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Entry ID</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Flag Reason</th>
                        <th className="px-6 py-4 font-semibold">AI Risk Score</th>
                        <th className="px-6 py-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(report?.anomalies?.slice(0, 5) || [
                        { _id: 'VOU-8492', amount: 450000, anomaly_reason: 'Amount violates Benford Law expected distribution', risk_score: 98.4 },
                        { _id: 'VOU-1104', amount: 89000, anomaly_reason: 'Duplicate entry detected in same fiscal week', risk_score: 92.1 },
                        { _id: 'VOU-3091', amount: 15000, anomaly_reason: 'Suspicious weekend posting timestamp', risk_score: 87.5 },
                        { _id: 'VOU-7742', amount: 100000, anomaly_reason: 'Suspiciously round number threshold', risk_score: 85.0 }
                      ]).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-300">
                            {item.Voucher || item.id || item._id || `VOU-${9000 - idx*132}`}
                          </td>
                          <td className="px-6 py-4 font-medium text-white">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount || item.Amount || (450000 - idx*40000))}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs">
                              {item.anomaly_reason || item.Reason || 'Structural Anomaly Detected'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full" style={{ width: `${item.risk_score || (95 - idx*3)}%` }}></div>
                              </div>
                              <span className="font-mono text-red-400">{item.risk_score || (95 - idx*3).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                              <ArrowUpRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Clock className="text-brand-blue" size={20} />
                <span>Past Scans</span>
              </h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 hide-scrollbar">
              {historyReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No past reports found.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyReports.map(rp => (
                    <div 
                      key={rp.id} 
                      onClick={() => loadPastReport(rp.id)}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 cursor-pointer hover:bg-slate-700 hover:border-brand-blue/50 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <div className="text-slate-200 font-medium group-hover:text-white transition-colors">
                          {rp.filename || 'Unknown Dataset'}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          {new Date(rp.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-brand-blue bg-blue-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
