import React, { useState } from 'react';
import { BarChart2, UserPlus, EyeOff, ChevronDown, LogIn } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import loginBg from './assets/login_bg.jpg';

export default function Login({ setIsLoggedIn, setShowLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log("Google Auth Success:", codeResponse);
      setIsLoggedIn(true);
      setShowLogin(false);
    },
    onError: (error) => console.log('Google Login Failed:', error)
  });

  return (
    <div className="h-screen w-full flex items-center justify-center font-sans selection:bg-orange-500 selection:text-white bg-slate-100 p-4 md:p-6 lg:p-8 overflow-hidden">
      
      {/* Main Floating Card */}
      <div className="w-full h-full max-w-[1600px] flex rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-[#241e1b]">
        
        {/* Left Section - Image Background */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] h-full relative">
          <img 
            src={loginBg} 
            alt="Auditly Login Background" 
            className="w-full h-full object-cover object-[center_65%]"
          />
        </div>

        {/* Right Login Section */}
        <div className="w-full h-full lg:w-[55%] xl:w-[50%] bg-white lg:rounded-l-[3rem] flex flex-col justify-between p-8 md:p-12 relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.15)] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3 text-slate-900 cursor-pointer" onClick={() => setShowLogin(false)}>
            <div className="bg-brand-blue p-1.5 rounded-full text-white shadow-sm ring-2 ring-white outline outline-1 outline-slate-100">
              <BarChart2 size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Auditly</span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            {isSignUp ? <LogIn size={18} strokeWidth={2} /> : <UserPlus size={18} strokeWidth={2} />}
            <span>{isSignUp ? 'Sign In' : 'Sign Up'}</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="max-w-[340px] w-full mx-auto my-auto py-8">
          <h2 className="text-4xl font-medium text-slate-900 mb-8 tracking-tight">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setShowLogin(false); }}>
            
            {/* Input fields */}
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Email or Username"
                  className="w-full bg-transparent border border-slate-200 rounded-full px-5 py-3 text-slate-900 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-slate-400 text-sm font-medium"
                />
              </div>
              
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="Password"
                  className="w-full bg-transparent border border-slate-200 rounded-full px-5 py-3 text-slate-900 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-slate-400 text-sm font-medium pr-10"
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <EyeOff size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="pt-1 pb-1">
                <a href="#" className="text-sm font-medium text-brand-blue hover:text-blue-800 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <div className={isSignUp ? "pt-4" : "pt-1"}>
              <button type="submit" className="w-full bg-brand-blue text-white font-medium py-3 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 flex items-center justify-center space-x-2">
                {isSignUp ? <UserPlus size={18} strokeWidth={2} /> : <LogIn size={18} strokeWidth={2} />}
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </div>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button 
              type="button" 
              onClick={() => handleGoogleLogin()}
              className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-full hover:bg-slate-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 font-medium shrink-0">
          <p>© 2005-2026 Auditly Inc.</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-slate-600 transition-colors">Contact Us</a>
            <button className="flex items-center hover:text-slate-600 transition-colors">
              <span>English</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
