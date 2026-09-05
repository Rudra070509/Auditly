import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';

export default function AuthView({ onLoginSuccess, theme, toggleTheme }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('rajesh.mehta@rmehtaca.in');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regFirm, setRegFirm] = useState('');
  const [regIcaiNo, setRegIcaiNo] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState(null);

  const isDark = theme === 'dark';

  function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    const user = {
      name: loginEmail.includes('mehta') ? 'Rajesh Mehta, FCA' : 'Auditor Partner',
      title: 'Senior Engagement Partner',
      email: loginEmail,
      firm: 'R. MEHTA & CO. Chartered Accountants',
      icaiNo: '045928'
    };

    localStorage.setItem('auditpulse_auth_session', JSON.stringify(user));
    onLoginSuccess(user);
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!regName || !regFirm || !regEmail || !regPassword) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    const user = {
      name: `${regName}, FCA`,
      title: 'Audit Partner',
      email: regEmail,
      firm: regFirm,
      icaiNo: regIcaiNo || '108922'
    };

    localStorage.setItem('auditpulse_auth_session', JSON.stringify(user));
    onLoginSuccess(user);
  }

  function handleQuickDemoLogin() {
    const demoUser = {
      name: 'Rajesh Mehta, FCA',
      title: 'Senior Engagement Partner',
      email: 'rajesh.mehta@rmehtaca.in',
      firm: 'R. MEHTA & CO. Chartered Accountants',
      icaiNo: '045928'
    };

    localStorage.setItem('auditpulse_auth_session', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Background Subtle Glowing Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold ${
            isDark 
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' 
              : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20">
            <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
              <ShieldAlert className="w-7 h-7 text-indigo-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-1.5">
              AuditPulse <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500 font-mono font-bold border border-indigo-500/30">AI</span>
            </h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              AI-Powered Financial Audit & Anomaly Platform for Chartered Accountants
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className={`rounded-3xl border p-8 shadow-2xl transition-colors duration-300 space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Mode Switcher Tabs */}
          <div className={`grid grid-cols-2 p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partner Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register CA Firm
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Auditor Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="partner@ca-firm.in"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Authenticate & Open Ledger Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Chartered Accountant Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rajesh Mehta"
                    className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  CA Firm Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regFirm}
                    onChange={(e) => setRegFirm(e.target.value)}
                    placeholder="e.g. R. Mehta & Co. Chartered Accountants"
                    className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    ICAI Membership No.
                  </label>
                  <input
                    type="text"
                    value={regIcaiNo}
                    onChange={(e) => setRegIcaiNo(e.target.value)}
                    placeholder="045928"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ca@firm.com"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Create Security Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Complete Firm Registration</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Access Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
            <span className={`px-3 text-[10px] font-mono font-bold uppercase tracking-wider absolute ${
              isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'
            }`}>
              Instant Testing Mode
            </span>
          </div>

          {/* One-Click Demo CA Login Button */}
          <button
            onClick={handleQuickDemoLogin}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.01] ${
              isDark 
                ? 'bg-indigo-950/40 hover:bg-indigo-900/50 border-indigo-500/40 text-indigo-300' 
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Sign In as Senior CA Partner (Rajesh Mehta, FCA)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
