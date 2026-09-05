import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, AlertTriangle, FileText, Activity } from 'lucide-react';

export default function ChatView({ transactions = [], selectedClient, selectedYear, theme }) {
  const isDark = theme === 'dark';
  const chatEndRef = useRef(null);

  const totalTx = transactions?.length || 0;
  const anomalies = transactions?.filter(t => t.anomalies && t.anomalies.length > 0) || [];
  
  const taxIssues = anomalies.filter(t => 
    t.anomalies?.some(a => a.type && (a.type.includes('Tax') || a.type.includes('Value')))
  );
  
  const mlIssues = anomalies.filter(t => 
    t.anomalies?.some(a => a.type && a.type.includes('Isolation'))
  );

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hello! I am your **AuditPulse AI Assistant**. I have analyzed **${totalTx.toLocaleString()}** transactions for **${selectedClient}** (${selectedYear}).\n\nI detected **${anomalies.length}** anomalies, including **${taxIssues.length}** tax inconsistencies and **${mlIssues.length}** ML statistical outliers.\n\nClick one of the suggestions below or ask me a specific question!`
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    { icon: FileText, text: "Summarize the findings" },
    { icon: AlertTriangle, text: "Show me the tax inconsistencies" },
    { icon: Sparkles, text: "How does the ML model work?" },
    { icon: Activity, text: "What are the highest risk vouchers?" }
  ];

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend(text) {
    if (!text.trim()) return;

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = generateAIReply(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      setIsTyping(false);
    }, 800);
  }

  function generateAIReply(query) {
    const lower = query.toLowerCase();

    if (totalTx === 0) {
      return "Please load a dataset in the **Data Import** tab first so I have data to answer your question!";
    }

    if (lower.includes('summary') || lower.includes('summarize') || lower.includes('stats')) {
      return `### Executive Summary for ${selectedClient}\nOut of **${totalTx.toLocaleString()}** vouchers scanned, I flagged **${anomalies.length}** anomalies (${((anomalies.length/totalTx)*100).toFixed(2)}% anomaly rate).\n\n- **${taxIssues.length}** Tax Calculation Inconsistencies (e.g., Qty × Rate valuation padding or zero-value drafts).\n- **${mlIssues.length}** Isolation Forest multi-dimensional statistical outliers.\n\nAll anomalies have generated statutory rectification journal entries which you can review in the **Remediation & Fixes** tab.`;
    }

    if (lower.includes('tax') || lower.includes('inconsistency') || lower.includes('math')) {
      if(taxIssues.length === 0) return "No tax inconsistencies were found in the current dataset.";
      const sample = taxIssues[0];
      const desc = sample.anomalies?.[0]?.description || 'tax discrepancy';
      const fix = sample.ai_fix?.action_title || 'Adjust valuation discrepancies according to Sec 143(3)';
      return `I found **${taxIssues.length}** tax or valuation inconsistencies. \n\nFor example, in voucher **${sample.transaction_id}**, ${desc.toLowerCase()}.\n\n**Recommended Fix:**\n${fix}.`;
    }

    if (lower.includes('isolation forest') || lower.includes('ml model') || lower.includes('how does')) {
      return "The **Isolation Forest** is an unsupervised machine learning algorithm. \n\nInstead of trying to profile 'normal' vouchers, it isolates anomalies by randomly splitting the dataset across 8 mathematical features (like Amount, Tax Ratio, Qty/Rate mismatch, Z-scores). Vouchers that require fewer splits to be isolated are mathematically flagged as outliers. I built 60 isolation trees to score your dataset!";
    }

    if (lower.includes('highest risk') || lower.includes('high risk')) {
      const highRisk = anomalies.filter(a => a.anomalies?.[0]?.severity === 'High');
      if (highRisk.length === 0) return "There are no High Risk vouchers currently flagged.";
      
      let reply = `I found **${highRisk.length}** High Risk vouchers. Here are the top ones:\n\n`;
      highRisk.slice(0, 3).forEach(v => {
        reply += `- **${v.transaction_id}** (${v.account_head}): ₹${v.amount.toLocaleString()} — *${v.anomalies[0].description}*\n`;
      });
      return reply;
    }

    // Search for specific voucher ID (e.g. VOUCH-1002 or SAL/2404)
    const voucherMatch = anomalies.find(a => a.transaction_id && lower.includes(a.transaction_id.toLowerCase()));
    if (voucherMatch) {
      const fix = voucherMatch.ai_fix;
      const severity = voucherMatch.anomalies?.[0]?.severity;
      const desc = voucherMatch.anomalies?.[0]?.description;
      
      let reply = `### Voucher **${voucherMatch.transaction_id}** (${voucherMatch.account_head})\n- **Amount:** ₹${voucherMatch.amount.toLocaleString()}\n- **Risk Score:** ${severity === 'High' ? 90 : 50}/100\n\n**Root Cause:**\n${desc}\n`;
      
      if (fix) {
        reply += `\n**AI Suggested Fix:** ${fix.action_title}\n**Compliance Rule:** ${fix.statutory_rule}\n\n**Rectifying Journal Entry:**\n`;
        fix.entries?.forEach(e => {
            const prefix = e.type === 'Debit' ? 'By' : 'To';
            reply += `- **${prefix}** ${e.account} (${e.type}): ${e.amount}\n`;
        });
      }
      return reply;
    }

    // Fallback
    return "I am the AuditPulse AI Copilot. I have analyzed your dataset using an Isolation Forest ML model and forensic heuristics.\n\nYou can ask me to **summarize the findings**, **explain the Isolation Forest**, or ask about a specific voucher number (e.g., *'What is wrong with SAL/2404/10138?'*).";
  }

  return (
    <div className={`p-8 max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col animate-fade-in`}>
      <div className={`flex items-center gap-3 mb-6 p-4 rounded-2xl border shadow-sm shrink-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            AI Chat Assistant
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ask questions, get summaries, and interact with the dataset using natural language.
          </p>
        </div>
      </div>

      <div className={`flex-1 flex flex-col rounded-3xl border shadow-xl overflow-hidden min-h-0 ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : isDark ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'bg-white text-indigo-600 border border-slate-200'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`px-5 py-4 rounded-3xl text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : isDark 
                    ? 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-sm' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="space-y-2">
                    {msg.content.split('\n').map((line, idx) => {
                      if (!line.trim()) return <div key={idx} className="h-2"></div>;
                      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                      return (
                        <p key={idx} className="leading-relaxed">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className={isDark ? 'text-slate-100' : 'text-slate-900'}>{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('*') && part.endsWith('*')) {
                              return <em key={pIdx} className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>{part.slice(1, -1)}</em>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
                isDark ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'bg-white text-indigo-600 border border-slate-200'
              }`}>
                <Bot className="w-5 h-5" />
              </div>
              <div className={`px-5 py-4 rounded-3xl text-sm shadow-sm flex items-center gap-1.5 ${
                isDark ? 'bg-slate-900 border border-slate-800 rounded-tl-sm' : 'bg-white border border-slate-200 rounded-tl-sm'
              }`}>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area & Suggestions */}
        <div className={`p-4 border-t shrink-0 flex flex-col gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2 max-w-4xl mx-auto w-full">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                disabled={isTyping}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <s.icon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{s.text}</span>
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your dataset, anomalies, or compliance rules..."
              className={`w-full pl-6 pr-14 py-4 rounded-full border text-sm shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
