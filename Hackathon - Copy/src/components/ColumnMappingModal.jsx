import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ColumnMappingModal({ isOpen, onClose, excelHeaders, sampleRow, onConfirmMapping, theme }) {
  const isDark = theme === 'dark';

  const [mapping, setMapping] = useState({
    transaction_id: '',
    date: '',
    posting_date: '',
    account_head: '',
    description: '',
    debit: '',
    credit: '',
    gst_number: '',
    gst_amount: '',
    user_id: ''
  });

  // Auto-match headers upon opening
  useEffect(() => {
    if (excelHeaders && excelHeaders.length > 0) {
      const autoMap = {
        transaction_id: findBestMatch(excelHeaders, ['voucher_no', 'voucherno', 'vouch_no', 'transaction_id', 'voucher', 'id', 'txn_id', 'ref_no']),
        date: findBestMatch(excelHeaders, ['datetime', 'date', 'txn_date', 'transaction_date', 'voucher_date', 'entry_date']),
        posting_date: findBestMatch(excelHeaders, ['posting_date', 'creation_date', 'system_date', 'post_date']),
        account_head: findBestMatch(excelHeaders, ['party_name', 'partyname', 'account_head', 'account', 'head', 'ledger', 'particulars']),
        description: findBestMatch(excelHeaders, ['item_name', 'itemname', 'description', 'narration', 'details', 'remarks', 'memo']),
        debit: findBestMatch(excelHeaders, ['taxable_value', 'taxablevalue', 'invoice_total', 'invoicetotal', 'debit', 'dr', 'debit_amount', 'dr_amount', 'amount']),
        credit: findBestMatch(excelHeaders, ['credit', 'cr', 'credit_amount', 'cr_amount']),
        gst_number: findBestMatch(excelHeaders, ['gstin', 'gst_number', 'gst_no', 'tax_id']),
        gst_amount: findBestMatch(excelHeaders, ['igst', 'cgst', 'gst_amount', 'gst_val', 'tax_amount', 'gst']),
        user_id: findBestMatch(excelHeaders, ['entered_by', 'enteredby', 'user_id', 'user', 'prepared_by'])
      };
      setMapping(autoMap);
    }
  }, [excelHeaders]);

  if (!isOpen) return null;

  function findBestMatch(headers, candidates) {
    for (const cand of candidates) {
      const match = headers.find(h => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cand.replace(/[^a-z0-9]/g, '')));
      if (match) return match;
    }
    return '';
  }

  const fields = [
    { key: 'transaction_id', label: 'Transaction / Voucher ID', required: true },
    { key: 'date', label: 'Transaction Date', required: true },
    { key: 'posting_date', label: 'System Posting Date (Optional)', required: false },
    { key: 'account_head', label: 'Account Head / Particulars', required: true },
    { key: 'description', label: 'Description / Narration', required: false },
    { key: 'debit', label: 'Debit Amount (₹)', required: false },
    { key: 'credit', label: 'Credit Amount (₹)', required: false },
    { key: 'gst_number', label: 'GSTIN Number (Optional)', required: false },
    { key: 'gst_amount', label: 'GST Tax Value (Optional)', required: false },
    { key: 'user_id', label: 'User ID / Entered By (Optional)', required: false }
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmMapping(mapping);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Confirm Column Header Mapping</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Align parsed Excel columns to standard Supabase database fields</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className={`border rounded-xl p-3.5 flex items-start gap-3 text-xs ${
            isDark ? 'bg-indigo-950/30 border-indigo-800/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              Smart Auto-Mapping detected match patterns. Please verify that <strong className="text-indigo-600">Transaction ID</strong>, <strong className="text-indigo-600">Date</strong>, and <strong className="text-indigo-600">Account Head</strong> map accurately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => {
              const currentVal = mapping[f.key] || '';
              const sampleValue = sampleRow && currentVal ? sampleRow[currentVal] : undefined;

              return (
                <div key={f.key} className={`border rounded-xl p-3.5 space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {f.label}
                      {f.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>

                    {currentVal && (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Mapped
                      </span>
                    )}
                  </div>

                  <select
                    value={currentVal}
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Ignore Field / Unmapped --</option>
                    {excelHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>

                  {sampleValue !== undefined && (
                    <p className={`text-[11px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Sample Data: <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{String(sampleValue)}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`pt-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Confirm Mapping & Sync</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
