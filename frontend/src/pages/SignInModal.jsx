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
              {validationError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 mb-4 animate-in fade-in duration-200">
                  <div className="flex">
                    <span className="material-symbols-outlined mr-2 text-[20px]">error</span>
                    <span>{validationError}</span>
                  </div>
                </div>
              )}

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
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-on-background text-white py-4 rounded-lg font-label-md text-label-md hover:bg-on-background/90 active:scale-[0.98] transition-all mt-stack-lg shadow-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                    <span className="material-symbols-outlined font-bold text-sm">arrow_forward</span>
                  </button>
                </>
              ) : (
                <>
                  {!otpSent ? (
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
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-on-background text-white py-4 rounded-lg font-label-md text-label-md hover:bg-on-background/90 active:scale-[0.98] transition-all mt-stack-lg shadow-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send OTP'}
                        <span className="material-symbols-outlined text-sm font-bold">send</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="font-label-md text-label-md text-on-surface-variant block text-xs font-semibold text-gray-600" htmlFor="otp-input">
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
                          className="w-full p-4 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-body-md text-body-md text-sm text-center font-mono tracking-widest text-lg text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          We sent a 6-digit verification code to {emailOrPhone}.
                        </p>
                      </div>

                      {/* Primary Action */}
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-on-background text-white py-4 rounded-lg font-label-md text-label-md hover:bg-on-background/90 active:scale-[0.98] transition-all mt-stack-lg shadow-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="w-full text-center text-xs text-gray-500 hover:text-gray-700 underline pt-2"
                      >
                        Change Email/Phone
                      </button>
                    </>
                  )}
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
