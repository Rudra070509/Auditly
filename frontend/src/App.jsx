import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, CheckCircle, BarChart2, ShieldAlert, FileText, Zap, Play, ArrowRight, ArrowUp, Server, Shield, Search, Eye, Mail, Phone, ChevronRight, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Login from './Login';
import CompanyProfile from './components/CompanyProfile';
import Vision from './components/Vision';
import ContactUs from './components/ContactUs';
import Dashboard from './components/Dashboard';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const [file, setFile] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    setActivePage('home');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const offset = 60;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [scanText, setScanText] = useState("System ready. Waiting to begin scan.");

  const scanPhrases = [
    "Initializing AIM 2.0 Engine...",
    "Extracting raw ledger entries...",
    "Cross-referencing GSTR-2B datasets...",
    "Applying anomaly detection heuristics...",
    "Isolating high-risk vouchers...",
    "Generating XAI explainability logs..."
  ];

  const startScan = () => {
    if (isScanning || scanComplete) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setScanText(scanPhrases[0]);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 1.2;
        if (next >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanComplete(true);
          setScanText("Analysis Complete: Anomalies isolated with XAI reasoning generated.");
          return 100;
        }
        
        const phraseIndex = Math.floor((next / 100) * scanPhrases.length);
        if (scanPhrases[phraseIndex]) {
          setScanText(scanPhrases[phraseIndex]);
        }
        return next;
      });
    }, 50); // Total time: ~4.1 seconds
  };

  const resetScan = () => {
    setFile(null);
    setIsScanning(false);
    setScanProgress(0);
    setScanComplete(false);
    setActiveFilter('All');
    setScanText("System ready. Waiting to begin scan.");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  if (showLogin) {
    return <Login setIsLoggedIn={setIsLoggedIn} setShowLogin={setShowLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-blue selection:text-white">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white flex justify-between items-center px-8 py-4 transition-all duration-300">
        
        <div className="flex items-center space-x-2 text-slate-800 w-48">
          <div className="bg-white p-1.5 rounded-lg text-brand-blue shadow-sm border border-slate-100">
            <BarChart2 size={24} strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Auditly</span>
        </div>
        
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 space-x-4 text-sm font-medium">
          {isLoggedIn ? (
            <>
              <button onClick={scrollToTop} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex items-center space-x-2 cursor-pointer">
                <BarChart2 size={16} />
                <span>Dashboard</span>
              </button>
              <button onClick={() => {
                document.getElementById('data-section')?.scrollIntoView({ behavior: 'smooth' });
              }} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex items-center space-x-2 cursor-pointer">
                <BarChart2 size={16} className="text-emerald-600" />
                <span>Data Section</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setActivePage('home'); scrollToTop(); }} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Home</button>
              <button onClick={() => scrollToSection('simulator')} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Test Simulator</button>
              <button onClick={() => scrollToSection('features')} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">How it Works</button>
              <div className="relative group">
                <button className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex items-center gap-1.5 cursor-pointer">
                  About
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:rotate-180 transition-transform duration-300"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                
                <div className="absolute top-full right-0 pt-3 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 text-left">
                    <button onClick={() => { setActivePage('company'); scrollToTop(); }} className="w-full text-left block p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="font-semibold text-slate-800 text-sm mb-0.5">Company Profile</div>
                      <div className="text-xs text-slate-500 leading-relaxed">Learn about our mission and the team behind Auditly.</div>
                    </button>
                    <button onClick={() => { setActivePage('vision'); scrollToTop(); }} className="w-full text-left block p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="font-semibold text-slate-800 text-sm mb-0.5">Our Vision</div>
                      <div className="text-xs text-slate-500 leading-relaxed">How we're revolutionizing financial auditing with AI models.</div>
                    </button>
                    <button onClick={() => { setActivePage('contact'); scrollToTop(); }} className="w-full text-left block p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="font-semibold text-slate-800 text-sm mb-0.5">Contact Support</div>
                      <div className="text-xs text-slate-500 leading-relaxed">Get in touch with our expert chartered accountants for assistance.</div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 w-48">
          {isLoggedIn ? (
            <button onClick={() => { 
              setIsLoggedIn(false); 
              setShowLogin(false); 
              setActivePage('home');
              window.scrollTo(0, 0);
            }} className="bg-slate-800 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-700 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 shadow-sm cursor-pointer">
              Sign Out
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} className="bg-[#0b1121] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 shadow-sm cursor-pointer">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Pages Container */}
      {activePage === 'home' && (
        <>
          {/* Home Section */}
          <section id="home" className="bg-slate-50 relative">
        
          {!isLoggedIn ? (
            <div className="text-slate-900 flex flex-col items-center text-center relative px-8 overflow-hidden bg-white justify-center min-h-[85vh] pt-8 pb-28">
              {/* Terranova Animated Background Video */}
              <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover z-0 blur-[1.5px] scale-[1.02] transform-gpu will-change-[filter,transform]"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4"
              ></video>

              <div className="inline-flex items-center space-x-2.5 bg-slate-900/5 border border-slate-900/20 rounded-full px-5 py-1.5 text-sm font-medium text-slate-800 mb-6 backdrop-blur-sm z-10">
                <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                <span>Next-Gen Audit Intelligence for CAs & SMEs</span>
              </div>

              <h1 className="text-[110px] md:text-[160px] font-extrabold tracking-tight leading-none mb-4 z-10" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                Auditly.
              </h1>
              
              <div className="text-center z-10 mb-12 flex flex-col space-y-1">
                <p className="text-xl md:text-2xl text-slate-700 font-medium">
                  AI-Powered Financial Audit Anomaly Detection.
                </p>
                <p className="text-xl md:text-2xl text-slate-700 font-medium">
                  Detect suspicious patterns. Audit smarter. Close faster.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 z-10 relative mt-4">
                <button onClick={() => setShowLearnMore(true)} className="border-2 border-slate-800 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-900/10 hover:-translate-y-1 transition-all duration-300 min-w-[160px] text-center">
                  Learn More
                </button>
                <button onClick={() => setShowLogin(true)} className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-slate-800 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 min-w-[160px] shadow-xl">
                  Login
                </button>
                <a href="#simulator" className="border-2 border-slate-800 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-900/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2 min-w-[160px]">
                  <Play size={18} fill="currentColor" />
                  <span>Test Simulator</span>
                </a>
              </div>
            </div>
          ) : (
            <Dashboard />
          )}

        {/* Floating Stats */}
        {!isLoggedIn && (
          <>
          <div className="w-full max-w-5xl mx-auto px-8 -mt-20 mb-8 relative z-20">
            <div className="bg-black rounded-2xl shadow-xl transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden text-white border border-slate-800">
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
                  <div className="text-slate-400 text-xs font-medium mb-1">Risk Indicators</div>
                  <div className="text-3xl font-bold mb-1">24</div>
                  <div className="flex items-center text-blue-400 text-xs font-medium">
                    <ShieldAlert size={12} className="mr-1.5" /> Financial heuristics mapped
                  </div>
                </div>
                <div className="px-6 py-2">
                  <div className="text-slate-400 text-xs font-medium mb-1">Model Precision</div>
                  <div className="text-3xl font-bold mb-1">99.8%</div>
                  <div className="flex items-center text-green-400 text-xs font-medium">
                    <CheckCircle size={12} className="mr-1.5" /> Statistical validation ready
                  </div>
                </div>
                <div className="px-6 py-2">
                  <div className="text-slate-400 text-xs font-medium mb-1">Processing Capacity</div>
                  <div className="text-3xl font-bold mb-1">100k+</div>
                  <div className="flex items-center text-yellow-400 text-xs font-medium">
                    <Zap size={12} className="mr-1.5" /> Rows analyzed per second
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* 4-Column Stats Section (Now integrated into the video background) */}
        <div className="relative z-10 max-w-6xl mx-auto px-8 py-8 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 drop-shadow-sm">10K+</div>
              <div className="text-slate-800 font-bold text-sm mb-1 drop-shadow-sm">Transactions Analyzed</div>
              <div className="text-slate-600 font-medium text-xs">Across multiple ledgers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 drop-shadow-sm">2-3m</div>
              <div className="text-slate-800 font-bold text-sm mb-1 drop-shadow-sm">Processing Time</div>
              <div className="text-slate-600 font-medium text-xs">From raw ledger to report</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 drop-shadow-sm">127</div>
              <div className="text-slate-800 font-bold text-sm mb-1 drop-shadow-sm">Anomalies Detected</div>
              <div className="text-slate-600 font-medium text-xs">With clear explainability</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 drop-shadow-sm">6+h</div>
              <div className="text-slate-800 font-bold text-sm mb-1 drop-shadow-sm">Time Saved</div>
              <div className="text-slate-600 font-medium text-xs">Average savings per audit</div>
            </div>
          </div>
        </div>
        </>
      )}
      </section>

      {!isLoggedIn && (
        <>
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
              <div className="flex space-x-3">
                {scanComplete && (
                  <button 
                    onClick={resetScan}
                    className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  >
                    Clear Scan
                  </button>
                )}
                <button 
                  onClick={startScan}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20 flex items-center space-x-2 ${isScanning ? 'bg-slate-600 cursor-not-allowed opacity-80' : 'bg-brand-blue hover:bg-blue-600 text-white'}`}
                >
                  <Zap size={16} className={isScanning ? "animate-pulse" : ""} />
                  <span>{isScanning ? 'Scanning...' : scanComplete ? 'Re-run Scan' : 'Run Anomaly Scan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">
            {/* Progress bar area */}
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-800/30">
              <div className="flex justify-between items-center mb-3">
                <div className={`flex items-center space-x-2 text-xs ${scanComplete ? 'text-green-400' : isScanning ? 'text-blue-400' : 'text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${scanComplete ? 'bg-green-400' : isScanning ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{scanText}</span>
                </div>
                <div className={`text-xs font-mono tracking-wider ${scanComplete ? 'text-green-400' : 'text-blue-400'}`}>
                  {isScanning || scanComplete ? `Scanning: ${Math.floor(scanProgress)}%` : 'Standby'}
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                {scanComplete ? (
                  <div className="bg-blue-500 w-full h-full transition-all duration-300" />
                ) : isScanning ? (
                  <div className="bg-blue-500 h-full absolute w-1/3 rounded-full animate-scan-bounce" />
                ) : (
                  <div className="bg-blue-500 w-0 h-full" />
                )}
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
      <section id="how-it-works" className="scroll-mt-[76px] min-h-[calc(100vh-76px)] flex flex-col justify-center py-12 bg-[#0b1121] border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-8 text-center w-full">
          <div className="text-brand-blue text-base font-bold tracking-widest uppercase mb-2">Workflow</div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">How It Works</h2>
          <p className="text-lg md:text-xl text-slate-400 mb-16 max-w-2xl mx-auto font-medium">Streamline your entire audit pipeline in three rapid stages.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm relative z-10 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-[#0b1121] text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Upload Data</h3>
              <p className="text-slate-500 text-sm">Ledgers, trial balances, transaction records</p>
              <div className="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-400">
                Supports CSV, Excel, XML
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-lg relative z-10 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-[#0b1121] text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
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
              <div className="w-16 h-16 bg-[#0b1121] text-white text-2xl font-bold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
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

      {/* About Section (CTA) */}
      <section id="about" className="relative text-slate-900 py-32 text-center px-8 flex-grow flex flex-col justify-center overflow-hidden border-b border-slate-200 scroll-mt-0 min-h-[calc(100vh-76px)]">
          
        {/* Ambient Gradient Background (Replaces heavy video for flawless performance) */}
        <div className="absolute inset-0 bg-slate-50 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-blue-100/40 blur-[100px] rounded-full transform rotate-12"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50%] h-[120%] bg-purple-100/40 blur-[120px] rounded-full transform -rotate-12"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[60%] h-[100%] bg-emerald-50/40 blur-[100px] rounded-full"></div>
        </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900 drop-shadow-sm">
              Ready to Revolutionize <br className="hidden sm:block" /> Your Financial Auditing?
            </h2>
            <p className="text-slate-700 mb-4 max-w-3xl mx-auto text-xl md:text-2xl font-medium drop-shadow-sm leading-relaxed">
              Empower your practice with real-time anomaly detection and deep transaction insights today.
            </p>
          </div>
        </section>
        </>
      )}
      </>
      )}

      {activePage === 'company' && <CompanyProfile />}
      {activePage === 'vision' && <Vision />}
      {activePage === 'contact' && <ContactUs />}

      {/* Footer */}
      {!isLoggedIn && (
        <footer className="relative bg-[#070b14] text-slate-300 pt-20 pb-12 px-8 border-t border-slate-800 mt-auto">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
          {/* Contact Us */}
          <div className="space-y-6">
            <h4 className="text-white font-bold tracking-widest text-sm flex items-center gap-2">
              <span className="w-8 h-px bg-blue-500"></span> CONTACT US
            </h4>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-4 group">
                <div className="mt-1 p-2 rounded-lg bg-slate-800/50 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Email Address</div>
                  <a href="mailto:info@auditly.local" className="text-slate-300 hover:text-blue-400 font-medium transition-colors text-base">info@auditly.local</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="mt-1 p-2 rounded-lg bg-slate-800/50 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Phone Number</div>
                  <a href="tel:+919876543210" className="text-slate-300 hover:text-blue-400 font-medium transition-colors text-base">+91 98765 43210</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="mt-1 p-2 rounded-lg bg-slate-800/50 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Toll Free</div>
                  <a href="tel:18001234567" className="text-slate-300 hover:text-blue-400 font-medium transition-colors text-base">1800 123 4567</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:mx-auto space-y-6">
            <h4 className="text-white font-bold tracking-widest text-sm flex items-center gap-2">
              <span className="w-8 h-px bg-blue-500"></span> QUICK LINKS
            </h4>
            <ul className="space-y-4 text-base font-medium">
              <li>
                <a href="#home" className="group flex items-center text-slate-400 hover:text-white transition-colors">
                  <ChevronRight size={16} className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                  <span className="group-hover:translate-x-1 transition-transform">Home</span>
                </a>
              </li>
              <li>
                <a href="#about" className="group flex items-center text-slate-400 hover:text-white transition-colors">
                  <ChevronRight size={16} className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                  <span className="group-hover:translate-x-1 transition-transform">About</span>
                </a>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="group flex items-center text-slate-400 hover:text-white transition-colors w-full text-left">
                  <ChevronRight size={16} className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                  <span className="group-hover:translate-x-1 transition-transform">Features</span>
                </button>
              </li>
              <li>
                <button onClick={() => setShowLogin(true)} className="group flex items-center text-slate-400 hover:text-white transition-colors">
                  <ChevronRight size={16} className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                  <span className="group-hover:translate-x-1 transition-transform">Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="md:ml-auto space-y-6">
            <h4 className="text-white font-bold tracking-widest text-sm flex items-center gap-2">
              <span className="w-8 h-px bg-blue-500"></span> FOLLOW US
            </h4>
            <div className="flex flex-col space-y-4">
              <a href="#" className="group flex items-center gap-4 text-slate-400 hover:text-white transition-all hover:translate-x-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center group-hover:bg-gradient-to-tr from-pink-500 to-orange-400 group-hover:text-white transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
                <span className="font-semibold tracking-wide">Instagram</span>
              </a>
              <a href="#" className="group flex items-center gap-4 text-slate-400 hover:text-white transition-all hover:translate-x-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center group-hover:bg-[#0A66C2] group-hover:text-white transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </div>
                <span className="font-semibold tracking-wide">LinkedIn</span>
              </a>
              <a href="#" className="group flex items-center gap-4 text-slate-400 hover:text-white transition-all hover:translate-x-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </div>
                <span className="font-semibold tracking-wide">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      )}
      {/* Scroll To Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-brand-blue text-white shadow-xl transition-all duration-300 z-50 hover:-translate-y-1 hover:shadow-2xl hover:bg-blue-600 border border-blue-400/20 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} strokeWidth={2.5} />
      </button>

      {/* Learn More Pop-up Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-brand-blue/10 p-3 rounded-xl">
                    <ShieldAlert className="text-brand-blue" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">How Auditly Works</h2>
                </div>
                <button onClick={() => setShowLearnMore(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 text-slate-600">
                <p>Auditly uses advanced <strong>Machine Learning (Isolation Forests)</strong> and structural rule engines to scan your financial ledgers for hidden anomalies.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center"><Zap size={16} className="mr-2 text-brand-blue"/> What we detect:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Benford's Law Violations:</strong> Unnatural number patterns often indicating fraud.</li>
                    <li><strong>Structural Anomalies:</strong> Duplicate amounts, round numbers, and weekend postings.</li>
                    <li><strong>Multivariate Outliers:</strong> Transactions that break the deep statistical norms of your specific business.</li>
                  </ul>
                </div>
                
                <p className="text-sm mt-4">Upload your CSV or Excel ledger, and our engine instantly vectorizes your data to give you a comprehensive, professional risk report in seconds.</p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={() => setShowLearnMore(false)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg cursor-pointer">
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
