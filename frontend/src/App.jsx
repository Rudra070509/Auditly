import React, { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle, BarChart2, ShieldAlert, FileText, Zap, Play, ArrowRight, Server, Shield, Search, Eye } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function App() {
  const [file, setFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanComplete(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen font-sans selection:bg-brand-blue selection:text-white">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white flex justify-between items-center px-8 py-4 transition-all duration-300">
        
        <div className="flex items-center space-x-2 text-slate-800">
          <div className="bg-white p-1.5 rounded-lg text-brand-blue shadow-sm border border-slate-100">
            <BarChart2 size={24} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight">Auditly</span>
        </div>
        
        <div className="hidden md:flex space-x-4 text-sm font-medium">
          <a href="#" className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Home</a>
          <a href="#simulator" className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Test Simulator</a>
          <a href="#features" className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Features</a>
          <a href="#how-it-works" className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">How it Works</a>
          <a href="#about" className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">About</a>
        </div>

        <button className="bg-white text-brand-blue px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 shadow-sm cursor-pointer">
          Get Demo
        </button>
      </nav>

      {/* Home Section */}
      <section id="home" className="bg-slate-50 relative">
        
        {/* Blue Hero (Takes full viewport height) */}
        <div className="bg-brand-blue text-white min-h-[85vh] flex flex-col items-center justify-center text-center relative px-8 pt-8 pb-28">
          {/* Abstract background elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full opacity-10 pointer-events-none">
            <div className="absolute w-[800px] h-[800px] bg-white rounded-full blur-3xl -top-96 left-1/2 -translate-x-1/2" />
          </div>

          <div className="inline-flex items-center space-x-2 bg-blue-800/50 border border-blue-700/50 rounded-full px-4 py-1.5 text-xs font-medium mb-4 backdrop-blur-sm z-10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Next-Gen Audit Intelligence for CAs & SMEs</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[100px] font-extrabold tracking-normal leading-none mb-4 z-10">
            Auditly.
          </h1>
          
          <p className="text-base md:text-[17px] text-blue-100 max-w-4xl mb-5 font-light z-10">
            AI-Powered Financial Audit Anomaly Detection. Audit smarter, close faster.
          </p>

          {/* File Upload / Import Design Zone */}
          <div className="w-full max-w-3xl mx-auto z-10 relative">
            <div className="bg-white rounded-2xl p-2 shadow-xl transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? 'border-brand-blue bg-blue-50' : 'border-slate-700 bg-gray-50/50 hover:bg-gray-50 hover:border-brand-blue'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-full text-brand-blue">
                    <UploadCloud size={24} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {isDragActive ? "Drop ledger here..." : "Upload Client Ledger to Begin"}
                </h3>
                <p className="text-slate-500 text-xs mb-3 max-w-md mx-auto">
                  Drag and drop your Excel or CSV transaction export here, or click to browse files.
                </p>
                <button className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors shadow-md pointer-events-none">
                  Browse Files
                </button>
                
                {file && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-medium text-green-600 bg-green-50 py-1.5 px-3 rounded-lg inline-flex">
                    <CheckCircle size={14} />
                    <span>{file.name} ready for scan</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="w-full max-w-5xl mx-auto px-8 -mt-20 mb-16 relative z-20">
          <div className="bg-brand-dark rounded-2xl shadow-xl transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden text-white border border-slate-700">
            <div className="bg-slate-900/50 px-6 py-2.5 border-b border-slate-700 flex items-center space-x-2 text-xs font-mono text-slate-400">
              <div className="flex space-x-1.5 mr-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span>audit-anomaly-scan-engine // active</span>
              <div className="ml-auto flex items-center space-x-2 text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">
                <CheckCircle size={12} />
                <span>Live Analysis</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700 p-6">
              <div className="px-6 py-2">
                <div className="text-slate-400 text-xs font-medium mb-1">Flagged Transactions</div>
                <div className="text-3xl font-bold mb-1">127</div>
                <div className="flex items-center text-red-400 text-xs font-medium">
                  <ShieldAlert size={12} className="mr-1.5" /> High priority items
                </div>
              </div>
              <div className="px-6 py-2">
                <div className="text-slate-400 text-xs font-medium mb-1">Confidence Score</div>
                <div className="text-3xl font-bold mb-1">99.4%</div>
                <div className="flex items-center text-green-400 text-xs font-medium">
                  <CheckCircle size={12} className="mr-1.5" /> Statistical validation
                </div>
              </div>
              <div className="px-6 py-2">
                <div className="text-slate-400 text-xs font-medium mb-1">Audit Time Saved</div>
                <div className="text-3xl font-bold mb-1">6+ h</div>
                <div className="flex items-center text-blue-400 text-xs font-medium">
                  <Zap size={12} className="mr-1.5" /> Fast closing cycle
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4-Column Stats Section */}
      <section className="bg-white py-16 border-b border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue mb-2">10K+</div>
              <div className="text-slate-800 font-semibold text-sm mb-1">Transactions Analyzed</div>
              <div className="text-slate-400 text-xs">Across multiple financial ledgers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue mb-2">2-3m</div>
              <div className="text-slate-800 font-semibold text-sm mb-1">Processing Time</div>
              <div className="text-slate-400 text-xs">From raw ledger to audit report</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue mb-2">127</div>
              <div className="text-slate-800 font-semibold text-sm mb-1">Anomalies Detected</div>
              <div className="text-slate-400 text-xs">With clear explainability logs</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue mb-2">6+h</div>
              <div className="text-slate-800 font-semibold text-sm mb-1">Time Saved</div>
              <div className="text-slate-400 text-xs">Average savings per audit engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="scroll-mt-[76px] bg-[#0b1121] py-20 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
            <div className="max-w-2xl">
              <div className="inline-block border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full mb-4">
                Interactive Demo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Live Anomaly Scanner Simulator</h2>
              <p className="text-slate-400">
                Experience how Auditly detects fraud, circular trades, and ledger backdating in seconds.
              </p>
            </div>
            
            <div className="mt-6 md:mt-0 flex flex-col items-end space-y-3">
              <select className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-4 py-2.5 outline-none focus:border-brand-blue appearance-none pr-8 relative cursor-pointer">
                <option>Apex Manufacturing Pvt Ltd (FY23-24)</option>
              </select>
              <button 
                onClick={startScan}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20 flex items-center space-x-2 ${isScanning ? 'bg-slate-600 cursor-not-allowed opacity-80' : 'bg-brand-blue hover:bg-blue-600 text-white'}`}
              >
                <Zap size={16} className={isScanning ? "animate-pulse" : ""} />
                <span>{isScanning ? 'Scanning...' : scanComplete ? 'Scan Complete' : 'Run Anomaly Scan'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">
            {/* Progress bar area */}
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-800/30">
              <div className="flex justify-between items-center mb-3">
                <div className={`flex items-center space-x-2 text-xs ${scanComplete ? 'text-green-400' : isScanning ? 'text-blue-400' : 'text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${scanComplete ? 'bg-green-400' : isScanning ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{scanComplete ? 'Analysis Complete: Anomalies isolated with XAI reasoning generated.' : isScanning ? 'Analyzing financial patterns and cross-referencing ledgers...' : 'System ready. Waiting to begin scan.'}</span>
                </div>
                <div className={`text-xs font-mono tracking-wider ${scanComplete ? 'text-green-400' : 'text-blue-400'}`}>
                  {isScanning || scanComplete ? `Scanning: ${scanProgress}%` : 'Standby'}
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-100 ease-linear" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>

            {/* Filters Area */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 bg-[#0f172a]">
              <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {['All', 'High Risk', 'Medium Risk', 'Advisory'].map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-brand-blue text-white' : 'bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}
                  >
                    {filter} {scanComplete && filter === 'All' ? '(5)' : scanComplete && filter === 'High Risk' ? '(2)' : scanComplete && filter === 'Medium Risk' ? '(2)' : scanComplete && filter === 'Advisory' ? '(1)' : ''}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Search voucher or party..." className="w-full bg-slate-900 border border-slate-700/50 text-slate-300 text-xs rounded-lg pl-9 pr-4 py-2 outline-none focus:border-brand-blue/50 placeholder-slate-500" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-[#0f172a]">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-900/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Voucher No</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Account / Party</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Risk Severity</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Anomaly Flag</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Explainability</th>
                  </tr>
                </thead>
                <tbody key={scanComplete ? 'done' : 'loading'} className="divide-y divide-slate-800/50 animate-slide-down">
                  {!scanComplete ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        {isScanning ? (
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm">Processing massive ledger sets...</p>
                          </div>
                        ) : (
                          "Click 'Run Anomaly Scan' to analyze the selected dataset."
                        )}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {(activeFilter === 'All' || activeFilter === 'High Risk') && (
                        <tr className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-blue-400 text-xs">VR-2024-8841</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-200">Nexus Steel & Foundry Ltd</td>
                          <td className="px-6 py-4 font-mono text-[13px]">₹42,50,000</td>
                          <td className="px-6 py-4">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block text-center w-20">High Risk</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-[13px]">Round-Tripping Circular Loop</td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-blue-900/30 text-blue-400 hover:bg-brand-blue hover:text-white border border-blue-800/50 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 ml-auto cursor-pointer">
                              <Eye size={12} /> <span>Explain</span>
                            </button>
                          </td>
                        </tr>
                      )}
                      
                      {(activeFilter === 'All' || activeFilter === 'High Risk') && (
                        <tr className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-blue-400 text-xs">VR-2024-9102</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-200">R. K. Industrial Spares</td>
                          <td className="px-6 py-4 font-mono text-[13px]">₹18,20,000</td>
                          <td className="px-6 py-4">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block text-center w-20">High Risk</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-[13px]">Backdated Journal ({'>'}94 Days)</td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-blue-900/30 text-blue-400 hover:bg-brand-blue hover:text-white border border-blue-800/50 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 ml-auto cursor-pointer">
                              <Eye size={12} /> <span>Explain</span>
                            </button>
                          </td>
                        </tr>
                      )}

                      {(activeFilter === 'All' || activeFilter === 'Medium Risk') && (
                        <tr className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-blue-400 text-xs">VR-2024-7493</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-200">Delta Logistics Corp</td>
                          <td className="px-6 py-4 font-mono text-[13px]">₹6,18,000</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block text-center w-20">Medium</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-[13px]">GSTR-2B ITC Mismatch</td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-blue-900/30 text-blue-400 hover:bg-brand-blue hover:text-white border border-blue-800/50 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 ml-auto cursor-pointer">
                              <Eye size={12} /> <span>Explain</span>
                            </button>
                          </td>
                        </tr>
                      )}

                      {(activeFilter === 'All' || activeFilter === 'Medium Risk') && (
                        <tr className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-blue-400 text-xs">VR-2024-6621</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-200">Kiran Metal Processors</td>
                          <td className="px-6 py-4 font-mono text-[13px]">₹4,95,000</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block text-center w-20">Medium</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-[13px]">Split Invoice (Threshold Avoidance)</td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-blue-900/30 text-blue-400 hover:bg-brand-blue hover:text-white border border-blue-800/50 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 ml-auto cursor-pointer">
                              <Eye size={12} /> <span>Explain</span>
                            </button>
                          </td>
                        </tr>
                      )}

                      {(activeFilter === 'All' || activeFilter === 'Advisory') && (
                        <tr className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-blue-400 text-xs">VR-2024-5280</td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-200">Petty Cash Ledger</td>
                          <td className="px-6 py-4 font-mono text-[13px]">₹85,000</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-600/20 text-slate-300 border border-slate-600/30 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block text-center w-20">Advisory</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-[13px]">Sunday Weekend Cash Withdrawal</td>
                          <td className="px-6 py-4 text-right">
                            <button className="bg-blue-900/30 text-blue-400 hover:bg-brand-blue hover:text-white border border-blue-800/50 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 ml-auto cursor-pointer">
                              <Eye size={12} /> <span>Explain</span>
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="scroll-mt-[76px] min-h-[calc(100vh-76px)] flex flex-col justify-center py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-8 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Powerful Features for Modern CAs</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm">Equip your practice with next-generation tools to identify risks that manual sampling misses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Real-time Anomaly Detection</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Automatically detects duplicate transactions, backdated entries, and suspicious patterns instantly.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Risk-Based Prioritization</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Automatically highlights high-risk transactions for efficient audit focus and investigation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <Shield size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Explainable AI Insights</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Understand exactly why each anomaly was flagged with clear reasoning provided by Hugging Face models.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <Server size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Multi-Audit Support</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Handle multiple SME audits simultaneously without performance degradation using Neon DB.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">GST & Reconciliation</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Verify GST-to-book matches and identify trial balance discrepancies automatically.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                <BarChart2 size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Pattern Recognition</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Identifies month-end spikes, round-tripping, cyclical patterns, and financial irregularities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow / How it Works */}
      <section id="how-it-works" className="scroll-mt-[76px] min-h-[calc(100vh-76px)] flex flex-col justify-center py-12 bg-white">
        <div className="max-w-5xl mx-auto px-8 text-center w-full">
          <div className="text-brand-blue text-sm font-bold tracking-widest uppercase mb-2">Workflow</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">How It Works</h2>
          <p className="text-slate-500 mb-16">Streamline your entire audit pipeline in three rapid stages.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-blue-100 -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm relative z-10 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-brand-blue text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Upload Data</h3>
              <p className="text-slate-500 text-sm">Ledgers, trial balances, transaction records</p>
              <div className="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-400">
                Supports CSV, Excel, XML
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-lg relative z-10 flex flex-col items-center transform md:-translate-y-4 hover:shadow-xl hover:-translate-y-6 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-brand-blue text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">AI Analysis</h3>
              <p className="text-slate-500 text-sm">Real-time pattern detection</p>
              <div className="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-400">
                Scans for anomalies, duplicates
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm relative z-10 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-brand-blue text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Risk Report</h3>
              <p className="text-slate-500 text-sm">Prioritized anomalies</p>
              <div className="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-400">
                Export auditor-ready summaries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section (CTA + Footer) */}
      <div id="about" className="scroll-mt-[76px] min-h-[calc(100vh-76px)] flex flex-col">
        {/* CTA Section */}
        <section className="bg-brand-blue text-white py-24 text-center px-8 flex-grow flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Revolutionize Your Financial Auditing?</h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
            Empower your practice with real-time anomaly detection and deep transaction insights today.
          </p>
          <div>
            <button className="bg-white text-brand-blue px-8 py-3.5 rounded-lg font-bold hover:bg-blue-50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-xl inline-flex items-center space-x-2 cursor-pointer">
              <span>Request Demo</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-16 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 text-white mb-6">
              <div className="bg-white p-1 rounded min-w-max text-brand-blue">
                <BarChart2 size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight">Auditly</span>
            </div>
            <p className="text-sm max-w-sm leading-relaxed mb-6">
              AI-powered financial audit anomaly detection for Chartered Accountants.
            </p>
            <div className="text-xs text-slate-500">
              Shri Bhagubhai Mafatlal Polytechnic<br />
              SVKM
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Contact & Demo</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Get Demo</a></li>
              <li><a href="mailto:info@auditly.local" className="hover:text-white transition-colors">info@auditly.local</a></li>
            </ul>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
