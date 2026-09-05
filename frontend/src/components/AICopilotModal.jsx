import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Trash2 } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AICopilotModal({ isOpen, onClose, selectedTx }) {
  const getInitMsg = (tx) => ({
    role: 'assistant',
    text: tx
      ? `Voucher ${tx.voucher_no || tx.transaction_id || '—'} (${tx.account_head || 'Unknown'}) is flagged for ${tx.anomalies?.[0]?.type || 'High Risk'}. What would you like to know?`
      : `Ask me about any flagged transaction — root cause, inquiry letters, or journal entries.`
  });

  const [messages, setMessages] = useState([getInitMsg(selectedTx)]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef(null);

  // Reset chat when a new transaction is selected
  useEffect(() => {
    setMessages([getInitMsg(selectedTx)]);
  }, [selectedTx]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  if (!isOpen) return null;

  function handleClear() {
    setMessages([initMsg]);
  }

  async function handleSend(customPrompt) {
    const text = customPrompt || inputText;
    if (!text.trim() || isGenerating) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputText('');
    setIsGenerating(true);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert CA and statutory auditor. Keep ALL responses short, simple, and easy to understand — max 2-3 sentences. Only give longer answers if the user explicitly asks for a formal letter or memo.\nContext: ${selectedTx ? JSON.stringify(selectedTx) : 'none'}.\nQuery: ${text}`
              }]
            }]
          })
        }
      );
      const data = await res.json();
      const reply = data.error
        ? `❌ ${data.error.message}`
        : data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Connection failed.' }]);
    }
    setIsGenerating(false);
  }

  const quickPrompts = ['Explain root cause', 'Draft CFO letter', 'CARO 2020 memo', 'GST ITC guidance'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md flex flex-col rounded-[2rem] shadow-2xl bg-white border border-slate-100" style={{ height: '76vh' }}>

        {/* Top bar: AI Suggestions pill + clear + close */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="bg-black text-white text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide">
            AI Suggestions
          </span>
          <div className="flex items-center gap-1">
            <button onClick={handleClear} className="p-1.5 rounded-lg text-black hover:bg-slate-100 transition-colors" title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-black hover:bg-slate-100 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages — scrollable but no visible scrollbar */}
        <div
          className="flex-1 px-4 py-1 space-y-2.5 overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-sm'
                    : 'bg-[#b9ff66] text-black rounded-tl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-[#b9ff66] px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        <div
          className="px-4 py-2 flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-all whitespace-nowrap"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask Audit AI..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-slate-400 transition-colors bg-slate-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isGenerating}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 hover:bg-slate-700 transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
}
