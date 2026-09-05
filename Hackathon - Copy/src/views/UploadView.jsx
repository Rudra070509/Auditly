import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Zap, 
  Download, 
  FileSpreadsheet, 
  Play, 
  FileType,
  Bot
} from 'lucide-react';
import ColumnMappingModal from '../components/ColumnMappingModal';
import { saveTransactionsToDatabase } from '../lib/supabaseClient';
import { generateSampleExcelRows } from '../lib/sampleData';

export default function UploadView({ onUploadComplete, selectedClient, selectedYear, theme }) {
  const isDark = theme === 'dark';

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [parsedRawRows, setParsedRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileSelect(file) {
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const raw = results.data;
            const keys = Object.keys(raw[0] || {});
            setParsedRawRows(raw);
            setHeaders(keys);
            setIsMappingModalOpen(true);
          }
        }
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json && json.length > 0) {
          const keys = Object.keys(json[0]);
          setParsedRawRows(json);
          setHeaders(keys);
          setIsMappingModalOpen(true);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleConfirmMapping(mapping) {
    setIsMappingModalOpen(false);
    setIsSyncing(true);
    setSyncProgress(25);

    // Map raw rows to canonical fields
    const mappedTransactions = parsedRawRows.map((row, idx) => {
      const txnId = row[mapping.transaction_id] || `VOUCH-${1000 + idx}`;
      const dt = row[mapping.date] || new Date().toISOString().split('T')[0];
      const postDt = row[mapping.posting_date] || dt;
      const head = row[mapping.account_head] || 'General Expenses';
      const desc = row[mapping.description] || 'Uploaded ledger entry';
      const debitVal = parseFloat(row[mapping.debit]) || 0;
      const creditVal = parseFloat(row[mapping.credit]) || 0;
      const amountVal = Math.max(debitVal, creditVal) || parseFloat(row['amount'] || row['Amount'] || row['Invoice_Total'] || row['Taxable_Value']) || 0;
      const gstin = row[mapping.gst_number] || '';
      const gstVal = parseFloat(row[mapping.gst_amount]) || (parseFloat(row['CGST'] || 0) + parseFloat(row['SGST'] || 0) + parseFloat(row['IGST'] || 0)) || 0;
      const usr = row[mapping.user_id] || 'USR-FIN-01';

      // Extended fields
      const qty = parseFloat(row['Quantity'] || row['quantity'] || row[mapping.quantity || '']) || undefined;
      const rate = parseFloat(row['Rate'] || row['rate'] || row[mapping.rate || '']) || undefined;
      const taxableVal = parseFloat(row['Taxable_Value'] || row['taxable_value'] || row[mapping.taxable_value || '']) || amountVal;
      const cgstVal = parseFloat(row['CGST'] || row['cgst'] || 0) || 0;
      const sgstVal = parseFloat(row['SGST'] || row['sgst'] || 0) || 0;
      const igstVal = parseFloat(row['IGST'] || row['igst'] || 0) || 0;
      const invTotal = parseFloat(row['Invoice_Total'] || row['invoice_total'] || row[mapping.invoice_total || '']) || amountVal;
      const vType = row['Voucher_Type'] || row['voucher_type'] || 'General';

      return {
        id: `TXN-${Date.now()}-${idx}`,
        transaction_id: String(txnId),
        client_name: selectedClient,
        audit_year: selectedYear,
        date: String(dt),
        posting_date: String(postDt),
        account_head: String(head),
        description: String(desc),
        debit: debitVal,
        credit: creditVal,
        amount: amountVal,
        gst_number: String(gstin),
        gst_amount: gstVal,
        user_id: String(usr),
        quantity: qty,
        rate: rate,
        taxable_value: taxableVal,
        cgst: cgstVal,
        sgst: sgstVal,
        igst: igstVal,
        invoice_total: invTotal,
        voucher_type: vType
      };
    });

    setSyncProgress(65);

    // Persist & process through anomaly engine
    const res = await saveTransactionsToDatabase(mappedTransactions);

    setSyncProgress(100);
    setIsSyncing(false);
    setToastMessage(`Successfully ingested ${res.count} records! AI Anomaly Engine completed inferences.`);

    setTimeout(() => {
      onUploadComplete();
    }, 1200);
  }

  // Download pre-formatted Excel or CSV template for easy demonstration
  function handleDownloadTemplate(format = 'xlsx') {
    const rows = generateSampleExcelRows(selectedClient, selectedYear);
    const cleanClient = selectedClient.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanYear = selectedYear.replace(/[^a-zA-Z0-9]/g, '_');

    if (format === 'csv') {
      const csvContent = Papa.unparse(rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditPulse_Sample_Ledger_${cleanClient}_${cleanYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'General_Ledger');
      XLSX.writeFile(wb, `AuditPulse_Sample_Ledger_${cleanClient}_${cleanYear}.xlsx`);
    }
  }

  // One-click demo ingestion for instant evaluation
  async function handleInstantDemoIngest() {
    setIsSyncing(true);
    setSyncProgress(30);

    const rows = generateSampleExcelRows(selectedClient, selectedYear);
    setSyncProgress(60);

    const mappedTransactions = rows.map((row, idx) => {
      const debitVal = Number(row['Debit (₹)']) || 0;
      const creditVal = Number(row['Credit (₹)']) || 0;
      const amountVal = Math.max(debitVal, creditVal);

      return {
        id: `TXN-DEMO-${Date.now()}-${idx}`,
        transaction_id: String(row['Voucher ID']),
        client_name: selectedClient,
        audit_year: selectedYear,
        date: String(row['Transaction Date']),
        posting_date: String(row['Posting Date']),
        account_head: String(row['Account Head']),
        description: String(row['Description / Narration']),
        debit: debitVal,
        credit: creditVal,
        amount: amountVal,
        gst_number: String(row['GSTIN'] || ''),
        gst_amount: Number(row['GST Amount (₹)']) || 0,
        user_id: String(row['Entered By'] || 'USR-FIN-01')
      };
    });

    const res = await saveTransactionsToDatabase(mappedTransactions);
    setSyncProgress(100);
    setIsSyncing(false);
    setToastMessage(`Instant Demo Ingest Complete! ${res.count} transactions parsed & scored.`);

    setTimeout(() => {
      onUploadComplete();
    }, 1000);
  }

  // One-click ingestion of the VertexNova 5,000 Tally ERP Vouchers dataset
  async function handleLoadVertexNova5000() {
    setIsSyncing(true);
    setSyncProgress(20);
    setToastMessage('Fetching VertexNova 5,000 Tally ERP Vouchers...');

    try {
      const response = await fetch('/VertexNova_Tally_ERP_5000_Vouchers.csv');
      if (!response.ok) throw new Error('File not found');
      const csvText = await response.text();
      setSyncProgress(45);

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const raw = results.data;
          setSyncProgress(70);
          setToastMessage(`Running Isolation Forest & AI Anomaly Model over ${raw.length} vouchers...`);

          const mapped = raw.map((row, idx) => {
            const val = parseFloat(row['Invoice_Total']) || parseFloat(row['Taxable_Value']) || 0;
            const taxable = parseFloat(row['Taxable_Value']) || 0;
            const cgst = parseFloat(row['CGST']) || 0;
            const sgst = parseFloat(row['SGST']) || 0;
            const igst = parseFloat(row['IGST']) || 0;
            const qty = parseFloat(row['Quantity']) || 1;
            const rate = parseFloat(row['Rate']) || 0;
            const isPurchase = (row['Voucher_Type'] || '').toLowerCase().includes('purchase') || (row['Voucher_Type'] || '').toLowerCase().includes('payment');

            return {
              id: `TXN-TALLY-${10000 + idx}`,
              transaction_id: row['Voucher_No'] || `VOUCH-${1000 + idx}`,
              client_name: 'VertexNova Technologies Ltd',
              audit_year: row['Financial_Year'] || 'FY 2024-25',
              date: (row['DateTime'] || '').split(' ')[0] || new Date().toISOString().split('T')[0],
              posting_date: (row['DateTime'] || '').split(' ')[0],
              account_head: row['Party_Name'] || row['Item_Name'] || 'General Ledger',
              description: `${row['Voucher_Type'] || 'Voucher'} - ${row['Item_Name'] || ''} (Qty: ${row['Quantity'] || 1})`,
              debit: isPurchase ? Math.abs(val) : 0,
              credit: !isPurchase ? Math.abs(val) : 0,
              amount: Math.abs(val),
              gst_number: row['GSTIN'] || '',
              gst_amount: cgst + sgst + igst,
              expected_gst_rate: (parseFloat(row['GST_Rate_%']) || 18) / 100,
              user_id: row['Entered_By'] || 'accounts1',
              quantity: qty,
              rate: rate,
              taxable_value: taxable,
              cgst: cgst,
              sgst: sgst,
              igst: igst,
              invoice_total: val,
              voucher_type: row['Voucher_Type'] || 'General'
            };
          });

          setSyncProgress(90);
          const res = await saveTransactionsToDatabase(mapped);
          setSyncProgress(100);
          setIsSyncing(false);
          setToastMessage(`Loaded ${res.count} VertexNova vouchers! AI Model detected anomalies.`);

          setTimeout(() => {
            onUploadComplete();
          }, 1200);
        }
      });
    } catch (err) {
      console.error('Failed to load VertexNova CSV:', err);
      setIsSyncing(false);
      setToastMessage('Could not load 5,000 voucher dataset automatically. Please upload file manually.');
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-slide-down">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <span className="text-xs font-mono font-bold">Redirecting to Dashboard...</span>
        </div>
      )}

      {/* Header Banner Container */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-6 rounded-3xl shadow-xl transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 uppercase tracking-wider">
              Step 1: Data Ingestion
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {selectedClient} ({selectedYear})</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Excel / CSV Client Ledger Upload</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Import Tally, Zoho, SAP, or custom Excel trial balance / general ledgers into the AI Anomaly Detection Engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadVertexNova5000}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Load the 5,000-voucher VertexNova Tally ERP dataset from workspace"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load VertexNova 5,000 Vouchers</span>
          </button>

          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Download ready-to-test Excel template with intentional anomalies"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Sample .XLSX</span>
          </button>

          <button
            onClick={() => handleDownloadTemplate('csv')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Download ready-to-test CSV file"
          >
            <FileType className="w-4 h-4 text-slate-400" />
            <span>Sample .CSV</span>
          </button>

          <button
            onClick={handleInstantDemoIngest}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Ingest demo dataset with 1 click without browsing files"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Instant Demo Ingest</span>
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : isDark 
              ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700' 
              : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <p className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            {fileName ? `Selected: ${fileName}` : 'Drag & drop client ledger here, or browse files'}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 50,000 vouchers
          </p>
        </div>

        <span className="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30">
          Browse Files
        </span>
      </div>

      {/* Syncing Progress Indicator */}
      {isSyncing && (
        <div className={`border rounded-2xl p-6 space-y-4 shadow-xl animate-fade-in ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2 text-indigo-400">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Running Machine Learning Isolation Forest & Forensic Heuristics...</span>
            </span>
            <span className="font-mono text-indigo-400">{syncProgress}%</span>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        excelHeaders={headers}
        sampleRow={parsedRawRows[0]}
        onConfirmMapping={handleConfirmMapping}
        theme={theme}
      />
    </div>
  );
}
