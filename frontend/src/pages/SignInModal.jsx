import React, { useState } from 'react';

export default function SignInModal({ onNavigate, initialMethod = 'email' }) {
  const [method, setMethod] = useState(initialMethod); // 'email' or 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailOrPhone,
          password: password
        })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_email', emailOrPhone);
        onNavigate('celebration');
      } else {
        alert(data.detail || 'Sign in failed');
      }
    } catch (err) {
      console.error(err);
      // Fallback for offline/development testing
      alert('Proceeding with developer mock account.');
      localStorage.setItem('auth_token', 'mock_dev_token_123');
      localStorage.setItem('user_email', emailOrPhone || 'demo@company.com');
      onNavigate('celebration');
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full relative overflow-hidden flex items-center justify-center font-body-md text-on-surface">
      {/* Blurred Background Content (Simulating the active screen) */}
      <div className="fixed inset-0 scrolling-bg filter blur-sm scale-105" />

      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-on-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {/* Sign In Modal */}
        <div className="bg-surface-container-lowest w-full max-w-[480px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative z-50">
          
          {/* Header */}
          <div className="flex items-center justify-between p-stack-lg border-b border-gray-100">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Sign In to Realify</h1>
            <button 
              onClick={() => onNavigate('signup')}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-low flex items-center"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-stack-lg py-6 space-y-stack-md">
            
            {/* Social Auth Buttons */}
            <div className="grid grid-cols-2 gap-stack-md">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-md text-label-md text-sm text-gray-700"
              >
                <img 
                  alt="Google" 
                  className="w-5 h-5" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9HZC1Z0nStDBE13OexHhwAJpisGL3XiWLUJDfE9fVNgmA36-N79rpAabtC4SzJfm7eodKqCazOTzyNmG1bVvyqFFQxmAA1Sdm_ARkUQvWHowZXiGFOoweTRYTFDQIL1CVjm24w0yKQrK5M85xXp2-iepJ5Tq06PT-hSfciOY8pxvOA0UhXylTpOmVidD0HZVrZVTRyTGCYWRxuuTWScHcDTs5gIP2oPZQmM_P0_LYWid6rPcxxgE_6nswTQJYA0nHbm0bv_LpIf4" 
                />
                Google
              </button>
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-md text-label-md text-sm text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
                Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant/60"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant font-body-sm text-body-sm text-xs text-gray-400">or continue with</span>
              <div className="flex-grow border-t border-outline-variant/60"></div>
            </div>

            {/* Login Method Toggles */}
            <div className="grid grid-cols-2 gap-stack-md bg-surface-container-low p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => setMethod('email')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-label-md text-label-md transition-all text-sm ${
                  method === 'email' 
                    ? 'bg-on-background text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Email
              </button>
              <button 
                type="button"
                onClick={() => setMethod('otp')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-label-md text-label-md transition-all text-sm ${
                  method === 'otp' 
                    ? 'bg-on-background text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">sms</span>
                OTP
              </button>
            </div>

            {/* Login Form */}
            <form className="space-y-stack-md" onSubmit={handleSubmit}>
              {method === 'email' ? (
                <>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant block text-xs font-semibold text-gray-600" htmlFor="email-input">
                      Email Address
                    </label>
                    <input 
                      required
                      type="email" 
                      id="email-input" 
                      placeholder="you@company.com" 
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full p-4 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-body-md text-body-md text-sm text-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant block text-xs font-semibold text-gray-600" htmlFor="password-input">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? 'text' : 'password'} 
                        id="password-input" 
                        placeholder="Enter your password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 pr-12 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-body-md text-body-md text-sm text-gray-900"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface flex items-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Footer Options */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary transition-all"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface text-xs">
                        Remember me
                      </span>
                    </label>
                    <a 
                      href="#" 
                      onClick={(e) => e.preventDefault()}
                      className="font-label-md text-label-md text-secondary hover:underline text-xs"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Primary Action */}
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-on-background text-white py-4 rounded-lg font-label-md text-label-md hover:bg-on-background/90 active:scale-[0.98] transition-all mt-stack-lg shadow-lg text-sm font-semibold"
                  >
                    Sign In
                    <span className="material-symbols-outlined font-bold text-sm">arrow_forward</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant block text-xs font-semibold text-gray-600" htmlFor="phone-input">
                      Email or Phone
                    </label>
                    <input 
                      required
                      type="text" 
                      id="phone-input" 
                      placeholder="Enter email or phone number" 
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full p-4 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-body-md text-body-md text-sm text-gray-900"
                    />
                  </div>

                  {/* Primary Action */}
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-on-background text-white py-4 rounded-lg font-label-md text-label-md hover:bg-on-background/90 active:scale-[0.98] transition-all mt-stack-lg shadow-lg text-sm font-semibold"
                  >
                    Send OTP 
                    <span className="material-symbols-outlined text-sm font-bold">send</span>
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Secondary Footer */}
          <div className="bg-surface-container-low p-6 text-center border-t border-gray-100">
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => onNavigate('signup')}
                className="text-secondary font-label-md hover:underline font-bold"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
