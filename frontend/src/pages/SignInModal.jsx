import React, { useState } from 'react';

export default function SignInModal({ onNavigate, initialMethod = 'email' }) {
  const [method, setMethod] = useState(initialMethod); // 'email' or 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP and Bug fix states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsSubmitting(true);

    if (method === 'email') {
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
          
          // Route matching backend state
          if (data.onboarding_state === 'AWAITING_PROFILE' || data.onboarding_state === 'AWAITING_WORKSPACE') {
            onNavigate('business-profile');
          } else if (data.onboarding_state === 'AWAITING_INTEGRATION') {
            onNavigate('connect-marketplaces');
          } else {
            onNavigate('celebration');
          }
        } else {
          setValidationError(data.detail || 'Sign in failed');
        }
      } catch (err) {
        console.error(err);
        setValidationError('Could not connect to the server. Please check your backend connection.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // OTP flow (email or phone)
      const isEmail = emailOrPhone.includes('@');
      const payload = isEmail 
        ? { email: emailOrPhone } 
        : { whatsapp_number: emailOrPhone.startsWith('+') ? emailOrPhone : '+91' + emailOrPhone.replace(/\D/g, '') };

      if (!otpSent) {
        try {
          const response = await fetch('http://localhost:8000/v1/auth/request-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (response.ok) {
            setOtpSent(true);
          } else {
            setValidationError(data.detail || 'Failed to send verification code.');
          }
        } catch (err) {
          console.error(err);
          setValidationError('Could not connect to the server to send verification code. Please check your backend connection.');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // Verify OTP
        try {
          const response = await fetch('http://localhost:8000/v1/auth/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...payload,
              code: otpCode
            })
          });
          const data = await response.json();
          if (response.ok) {
            localStorage.setItem('auth_token', data.access_token);
            if (isEmail) {
              localStorage.setItem('user_email', emailOrPhone);
            } else {
              localStorage.setItem('user_phone', payload.whatsapp_number);
            }
            
            // Route matching backend state
            if (data.onboarding_state === 'AWAITING_PROFILE' || data.onboarding_state === 'AWAITING_WORKSPACE') {
              onNavigate('business-profile');
            } else if (data.onboarding_state === 'AWAITING_INTEGRATION') {
              onNavigate('connect-marketplaces');
            } else {
              onNavigate('celebration');
            }
          } else {
            setValidationError(data.detail || 'Invalid verification code.');
          }
        } catch (err) {
          console.error(err);
          setValidationError('Could not connect to the server to verify code. Please check your backend connection.');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center z-50 p-4 font-body-md text-on-surface">
      {/* Backdrop Overlay with blur */}
      <div 
        className="fixed inset-0 bg-on-background/60 backdrop-blur-md animate-backdrop-in cursor-pointer" 
        onClick={() => onNavigate('signup')}
      />

      {/* Sign In Modal Container */}
      <div className="bg-white w-full max-w-[480px] rounded-xl shadow-2xl overflow-hidden animate-modal-entry relative z-50 border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sign In to Realify</h1>
            <p className="text-xs text-gray-500">Access your command center</p>
          </div>
          <button 
            onClick={() => onNavigate('signup')}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 flex items-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-premium font-medium text-sm text-gray-700 btn-premium"
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
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-premium font-medium text-sm text-gray-700 btn-premium"
            >
              <svg className="text-gray-900" fill="currentColor" height="18" viewBox="0 0 384 512" width="18">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
              Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-150"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">or continue with</span>
            <div className="flex-grow border-t border-gray-150"></div>
          </div>

          {/* Login Method Toggles */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setMethod('email')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-premium text-sm ${
                method === 'email' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Email
            </button>
            <button 
              type="button"
              onClick={() => setMethod('otp')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-premium text-sm ${
                method === 'otp' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">sms</span>
              OTP
            </button>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {validationError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 animate-shake flex">
                <span className="material-symbols-outlined mr-2 text-[20px]">error</span>
                <span>{validationError}</span>
              </div>
            )}

            {method === 'email' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="email-input">
                    Email Address
                  </label>
                  <input 
                    required
                    type="email" 
                    id="email-input" 
                    placeholder="you@company.com" 
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm text-gray-900 transition-premium input-focus-premium bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="password-input">
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-3.5 pr-12 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm text-gray-900 transition-premium input-focus-premium bg-white"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center transition-colors duration-200"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Footer Options */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#00c38b] focus:ring-[#00c38b] transition-all cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 select-none group-hover:text-gray-700 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a 
                    href="#" 
                    onClick={(e) => e.preventDefault()}
                    className="text-xs text-brand-accent hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Primary Action */}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#333] hover:bg-black text-white py-4 rounded-lg font-semibold active:scale-[0.98] transition-premium mt-6 shadow-md disabled:opacity-50 btn-premium cursor-pointer"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                  <span className="material-symbols-outlined font-bold text-sm">arrow_forward</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {!otpSent ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="phone-input">
                        Email or Phone
                      </label>
                      <input 
                        required
                        type="text" 
                        id="phone-input" 
                        placeholder="Enter email or phone number" 
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm text-gray-900 transition-premium input-focus-premium bg-white"
                      />
                    </div>

                    {/* Primary Action */}
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-[#333] hover:bg-black text-white py-4 rounded-lg font-semibold active:scale-[0.98] transition-premium mt-6 shadow-md disabled:opacity-50 btn-premium cursor-pointer"
                    >
                      {isSubmitting ? 'Sending...' : 'Send OTP'}
                      <span className="material-symbols-outlined text-sm font-bold">send</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="otp-input">
                        Verification Code
                      </label>
                      <input 
                        required
                        type="text" 
                        id="otp-input" 
                        maxLength={6}
                        placeholder="Enter 6-digit code" 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm text-center font-mono tracking-widest text-xl text-gray-900 transition-premium input-focus-premium bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center leading-relaxed">
                        We sent a 6-digit verification code to <span className="font-semibold text-gray-700">{emailOrPhone}</span>.
                      </p>
                    </div>

                    {/* Primary Action */}
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-[#333] hover:bg-black text-white py-4 rounded-lg font-semibold active:scale-[0.98] transition-premium mt-6 shadow-md disabled:opacity-50 btn-premium cursor-pointer"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                      <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium underline py-1 mt-2 cursor-pointer"
                    >
                      Change Email/Phone
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Secondary Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={() => onNavigate('signup')}
              className="text-brand-accent font-bold hover:underline transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
