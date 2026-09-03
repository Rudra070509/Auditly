import React from 'react';
import { BarChart2, ArrowRight } from 'lucide-react';

export default function Login({ setIsLoggedIn, setShowLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-brand-blue selection:text-white px-4">
      {/* Unique Ambient Mesh Background for Login Page */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-blue-100/60 blur-[100px] rounded-full transform rotate-12"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[120%] bg-purple-100/60 blur-[120px] rounded-full transform -rotate-12"></div>
        <div className="absolute bottom-[-30%] left-[20%] w-[60%] h-[100%] bg-emerald-50/60 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md mx-auto z-10 relative">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-left">
          <div className="flex justify-center mb-8">
            <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-md">
              <BarChart2 size={32} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Sign in to Auditly</h2>
            <p className="text-slate-500 text-sm font-medium">Welcome back! Please enter your details.</p>
          </div>
          
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setShowLogin(false); }}>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 ml-1">Work Email</label>
              <input 
                type="email" 
                required
                placeholder="auditor@firm.com"
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all placeholder:text-slate-300 font-semibold shadow-sm"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-bold text-brand-blue hover:text-blue-800 transition-colors">Forgot?</a>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all placeholder:text-slate-300 font-bold tracking-widest shadow-sm"
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-slate-900 text-white font-extrabold py-4 rounded-xl hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Sign In
              </button>
            </div>

            <button type="button" onClick={() => setShowLogin(false)} className="w-full text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors mt-2 flex items-center justify-center space-x-2">
              <ArrowRight size={16} className="rotate-180" />
              <span>Back to Home</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
