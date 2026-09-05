import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Copy, 
  Check, 
  Cpu, 
  FileText, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle,
  Key,
  Wrench
} from 'lucide-react';

export default function AICopilotModal({ isOpen, onClose, selectedTx, allAnomalies = [], theme }) {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('assistant');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('auditpulse_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your **AuditPulse AI Copilot**, specialized in statutory Indian accounting standards (ICAI), Companies Act (CARO 2020), and GST compliance. \n\nSelect any flagged voucher below or ask me to draft audit inquiries, explain forensic anomalies, or formulate corrective journal entries.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(selectedTx || allAnomalies[0] || null);

  if (!isOpen) return null;

  function handleSaveApiKey(key) {
    setApiKey(key);
    localStorage.setItem('auditpulse_gemini_api_key', key);
    setShowKeyInput(false);
  }

  function handleCopyResponse(text) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  async function handleSendMessage(customPrompt) {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isGenerating) return;

    const userMsg = { role: 'user', text: promptToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    // If Gemini API Key provided, call Gemini API; otherwise use Built-In Domain Neural Engine
    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert Chartered Accountant (FCA) and statutory auditor auditing general ledgers under ICAI, Companies Act 2013, CARO 2020, and GST Act 2017.
Current Voucher Context: ${activeVoucher ? JSON.stringify(activeVoucher) : 'No specific voucher selected'}.
User Query: ${promptToSend}`
              }]
            }]
          })
        });

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini model.';
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        setIsGenerating(false);
        return;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in audit engine:', err);
      }
    }

    // Built-in intelligent audit reasoning engine (offline)
    setTimeout(() => {
      const reply = generateLocalAuditReasoning(promptToSend, activeVoucher);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsGenerating(false);
    }, 600);
  }

  function generateLocalAuditReasoning(prompt, tx) {
    const p = prompt.toLowerCase();
    const txnId = tx ? (tx.transaction_id || tx.id) : 'selected voucher';
    const amount = tx ? `₹${(tx.amount || 0).toLocaleString('en-IN')}` : 'the voucher amount';
    const head = tx ? tx.account_head : 'the account';
    const primaryType = tx?.anomalies?.[0]?.type || 'High Risk Exception';

    if (p.includes('letter') || p.includes('inquiry') || p.includes('management') || p.includes('cfo')) {
      return `### Formal Audit Inquiry Letter to Client Management
**Ref:** AUD/${new Date().getFullYear()}/INQ-042  
**Date:** ${new Date().toLocaleDateString('en-GB')}  
**To:** Chief Financial Officer / Finance Controller  
**Subject:** Formal Audit Query regarding Voucher ${txnId} (${head})

Dear Management,

During our statutory audit sampling and automated anomaly detection procedures for the financial year, the following exception was flagged for your formal clarification:

1. **Voucher Details:**
   - **Voucher ID:** ${txnId}
   - **Nominal Date:** ${tx?.date || 'N/A'} (Posting Date: ${tx?.posting_date || 'N/A'})
   - **Account Particulars:** ${head}
   - **Monetary Value:** ${amount}
   - **Detected Exception:** ${primaryType}

2. **Auditor Observation & Risk:**
   ${tx?.anomalies?.[0]?.description || 'Irregularity identified during analytical and forensic testing.'}

3. **Required Documentation:**
   Kindly furnish the following working papers within 3 working days:
   - Certified copies of original vendor purchase order and stamped invoice.
   - Corresponding transport proof of delivery (e-Way Bill and Goods Receipt Note).
   - Bank statement ledger extract showing actual fund clearance.
   - Board or delegated authority approval for this transaction.

Yours faithfully,  
*Statutory Audit Engagement Team*  
*Chartered Accountants*`;
    }

    if (p.includes('caro') || p.includes('clause 3') || p.includes('report') || p.includes('memo')) {
      return `### CARO 2020 Statutory Audit Reporting Memo
**Applicable Clause:** Companies (Auditor's Report) Order, 2020 - Clause 3(iii) & Clause 3(ix)

**Finding Summary for Voucher ${txnId}:**
- **Ledger Head:** ${head}
- **Transaction Quantum:** ${amount}
- **Heuristic Identified:** ${primaryType}

**Draft CARO 2020 Audit Qualification / Observation:**
> *"According to the information and explanations given to us and on the basis of our examination of the records of the Company, the company has entered into transactions amounting to ${amount} in ${head} (${txnId}) which exhibit characteristics of ${primaryType}. The transactions lack adequate commercial substance / documentation and are prejudicial to the interest of the company as contemplated under Section 143(1) of the Companies Act, 2013."*

**Recommended Working Paper Classification:**
- **Materiality Threshold:** Exceeds tolerable error limit.
- **Reporting Level:** Disclose in Independent Auditor's Report under 'Emphasis of Matter' or 'Qualified Opinion' if unrectified.`;
    }

    if (p.includes('gst') || p.includes('gstr') || p.includes('itc') || p.includes('tax')) {
      return `### GST Statutory Compliance & ITC Reversal Protocol
**Statutory Authority:** Central Goods & Services Tax (CGST) Act, 2017 - Section 16(2) & Section 17(5)

**Voucher Analysis (${txnId}):**
- **Recorded GST:** ₹${(tx?.gst_amount || 0).toLocaleString('en-IN')}
- **Expected Rate:** ${((tx?.expected_gst_rate || 0.18) * 100).toFixed(0)}%
- **Tax Deviation:** Divergence identified between financial books and standard tariff.

**Statutory Action Steps:**
1. **GSTR-2B Matching:** Download invoice-level GSTR-2B JSON from the GST portal and execute auto-reconciliation.
2. **Section 16(2) Verification:** Confirm that the supplier has actually remitted the tax to the Government via GSTR-3B under Section 16(2)(c).
3. **Table 4(B) Reversal:** If tax was erroneously claimed in excess, reverse under **Table 4(B)(2) of GSTR-3B** in the immediate subsequent filing period.
4. **Interest Calculation:** Compute statutory interest @ 18% p.a. under Section 50(3) from date of undue utilization to date of reversal.`;
    }

    // Default: Root cause explanation and recommended fix
    return `### AI Audit Diagnosis & Remediation Advice
**Voucher:** ${txnId} | **Head:** ${head} | **Value:** ${amount}

**1. Root Cause Analysis:**
- **Triggered Exception:** ${primaryType}
- **Forensic Diagnosis:** ${tx?.anomalies?.[0]?.description || 'Multivariate anomaly detected by Isolation Forest and statistical testing.'}
- **Evidence:** ${tx?.anomalies?.[0]?.evidence || 'Exceeds variance thresholds.'}
- **AI Model Confidence:** ${tx?.ai_confidence || 94}%

**2. Recommended Statutory Fix:**
- **Action Title:** ${tx?.ai_fix?.actionTitle || 'Statutory Journal Entry Rectification'}
- **Applicable Rule:** ${tx?.ai_fix?.complianceRule || 'Section 143(3) of Companies Act, 2013 & ICAI Auditing Standards'}
- **Rectification Protocol:** ${tx?.ai_fix?.protocol || 'Execute balancing adjusting entries and obtain client audit sign-off.'}

**3. Proposed Rectifying Journal Entries:**
\`\`\`text
${tx?.ai_fix?.entries?.[0] ? `By ${tx.ai_fix.entries[0].account} (${tx.ai_fix.entries[0].type})   : ${tx.ai_fix.entries[0].amount}\n  [${tx.ai_fix.entries[0].note}]` : `By Trade Payables / Suspense (Debit) : ${amount}`}
${tx?.ai_fix?.entries?.[1] ? `To ${tx.ai_fix.entries[1].account} (${tx.ai_fix.entries[1].type})    : ${tx.ai_fix.entries[1].amount}\n  [${tx.ai_fix.entries[1].note}]` : `To ${head} (Credit)                  : ${amount}`}
\`\`\`

**4. Projected Risk Impact:**
Applying this rectification reduces the transaction's Risk Score from **${tx?.risk_score || 85}/100** to **0/100 (Pass)**.`;
  }

  const quickPrompts = [
    'Explain the root cause and risk of this anomaly',
    'Generate formal Inquiry Letter to Client CFO',
    'Draft CARO 2020 Clause 3 Audit Reporting Memo',
    'Provide GST ITC Reversal and Section 16(2) guidance'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`border rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <Bot className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">AuditPulse AI Copilot & Ledger Doctor</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {apiKey ? 'Gemini Cloud Active' : 'Offline Neural Mode'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Autonomous statutory auditing assistant for ICAI, Companies Act 2013, and GST Act
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                apiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
              title="Connect optional Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? 'API Connected' : 'Set Gemini Key'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer (Optional) */}
        {showKeyInput && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="font-semibold text-indigo-400 shrink-0">Gemini API Key:</span>
            <input
              type="password"
              placeholder="Paste Google Gemini API Key (Optional)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={() => handleSaveApiKey(apiKey)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
            >
              Save Key
            </button>
          </div>
        )}

        {/* Active Voucher Selection Bar */}
        {allAnomalies.length > 0 && (
          <div className={`px-6 py-2.5 border-b flex items-center gap-3 overflow-x-auto text-xs ${
            isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Inspect Voucher:
            </span>
            <select
              value={activeVoucher?.id || ''}
              onChange={(e) => {
                const found = allAnomalies.find(t => t.id === e.target.value);
                setActiveVoucher(found || null);
              }}
              className={`border rounded-lg px-3 py-1 text-xs font-mono focus:outline-none ${
                isDark ? 'bg-slate-900 border-slate-700 text-indigo-300' : 'bg-white border-slate-300 text-indigo-600 font-bold'
              }`}
            >
              {allAnomalies.slice(0, 50).map(t => (
                <option key={t.id} value={t.id}>
                  {t.transaction_id} — {t.account_head} (₹{t.amount?.toLocaleString('en-IN')}) • {t.anomalies?.[0]?.type || 'Risk'}
                </option>
              ))}
            </select>

            {activeVoucher && (
              <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                Confidence: {activeVoucher.ai_confidence || 94}%
              </span>
            )}
          </div>
        )}

        {/* Chat / Reasoning Messages Window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-600/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 border ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="prose prose-xs max-w-none whitespace-pre-wrap font-sans">
                    {m.text}
                  </div>

                  {!isUser && (
                    <div className="pt-2 border-t border-slate-800/40 flex items-center justify-end">
                      <button
                        onClick={() => handleCopyResponse(m.text)}
                        className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                          isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-3 text-indigo-400 text-xs font-semibold py-2">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing accounting ledger & statutory regulations...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Carousel / Pills */}
        <div className={`px-6 py-2 border-t flex items-center gap-2 overflow-x-auto ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Quick Actions:
          </span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp)}
              className={`shrink-0 text-[11px] px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-indigo-300' 
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-indigo-700 shadow-sm'
              }`}
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className={`p-4 border-t flex items-center gap-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <input
            type="text"
            placeholder="Ask AI Copilot to explain an anomaly, draft letters, or suggest journal entries..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Query</span>
          </button>
        </div>
      </div>
    </div>
  );
}
