import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, Zap, ShieldAlert, BarChart2, DollarSign, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard({ setHasReport }) {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState(null);

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
      alert('Network error connecting to backend.');
    } finally {
      setIsScanning(false);
    }
  };

  const salesData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 6890 },
    { name: 'Jun', value: 2390 },
  ];

  const paymentData = [
    { name: 'Q1', payments: 2400 },
    { name: 'Q2', payments: 1398 },
    { name: 'Q3', payments: 9800 },
    { name: 'Q4', payments: 3908 },
  ];

  const totalFaultAmount = report?.anomalies?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const formattedFaultAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalFaultAmount);

  return (
    <div className="w-full max-w-4xl mx-auto z-10 relative flex flex-col items-center">
      
      {/* Run Button positioned where the sub-hero text was */}
      <button 
        onClick={handleScan}
        disabled={!file || isScanning}
        className={`mb-10 px-10 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center space-x-3 shadow-lg ${
          file && !isScanning 
            ? 'bg-brand-blue text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl cursor-pointer' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
        }`}
      >
        <Zap size={20} className={file && !isScanning ? "animate-pulse" : ""} />
        <span>{isScanning ? "Analyzing Ledger..." : "Run AI Scan Now"}</span>
      </button>

      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl transform transition-all duration-300">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 min-h-[260px] flex flex-col items-center justify-center ${
            isDragActive ? 'border-brand-blue bg-blue-50/50' : 'border-slate-300 bg-white/50 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {isScanning ? (
            <div className="py-2 flex flex-col items-center">
              <div className="animate-spin w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-lg font-bold text-slate-800">Processing Data...</h3>
              <p className="text-slate-500 text-sm">Please wait while the AI engine runs.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="bg-blue-100 p-3 rounded-full text-brand-blue mb-4">
                <UploadCloud size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {isDragActive ? "Drop ledger here..." : "Upload Client Ledger"}
              </h3>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                Drag and drop your Excel or CSV transaction export here, or click to browse files.
              </p>
              
              {!file ? (
                <button className="bg-slate-100 border border-slate-300 text-slate-700 px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors pointer-events-none">
                  Browse Files
                </button>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-emerald-600 bg-emerald-50 py-2 px-4 rounded-lg border border-emerald-100">
                    <CheckCircle size={16} />
                    <span>{file.name} ready</span>
                  </div>
                  <button className="text-brand-blue text-sm font-medium hover:underline pointer-events-none">
                    Upload new database
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div id="data-section" className="w-full mt-20 pt-10 border-t border-slate-200 bg-slate-50 rounded-2xl p-6 shadow-xl border animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Audit Scan Results</h2>
        </div>

        {!report ? (
          <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white/50">
            {isScanning ? (
              <>
                <div className="animate-spin w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-700">Analyzing data structure...</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait while AI generates insights.</p>
              </>
            ) : (
              <>
                <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
                  <BarChart2 size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No data analyzed yet</h3>
                <p className="text-slate-500 text-sm mt-1">Upload a ledger and run a scan to view AI insights.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <FileText size={16} />
                  <span className="text-sm font-medium">Total Entries Scanned</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{report.total_vouchers_scanned?.toLocaleString()}</div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-red-500 mb-2">
                  <ShieldAlert size={16} />
                  <span className="text-sm font-medium">Faulty Entries Detected</span>
                </div>
                <div className="text-3xl font-bold text-red-600">{report.total_anomalies_flagged?.toLocaleString()}</div>
                <div className="text-xs text-red-400 mt-1 font-medium">{report.anomaly_rate_percent}% Anomaly Rate</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-amber-500 mb-2">
                  <DollarSign size={16} />
                  <span className="text-sm font-medium">Value at Risk</span>
                </div>
                <div className="text-3xl font-bold text-amber-600">{formattedFaultAmount}</div>
                <div className="text-xs text-amber-500/80 mt-1 font-medium">Without proper entries</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <BarChart2 size={16} className="text-brand-blue" />
                  <span>Sales Trend Analysis</span>
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <DollarSign size={16} className="text-brand-blue" />
                  <span>Payment Anomalies Over Time</span>
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="payments" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
