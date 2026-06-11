import React, { useState } from 'react';

export default function WhatsAppModal({ onNavigate }) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsSubmitting(true);

    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = countryCode + cleanPhone;

    if (!otpSent) {
      // Send OTP
      try {
        const response = await fetch('http://localhost:8000/v1/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            whatsapp_number: fullPhone,
            is_signup: true
          })
        });
        const data = await response.json();
        if (response.ok) {
          setOtpSent(true);
        } else {
          if (data.detail && data.detail.includes("already exists")) {
            alert("An account with this phone number already exists. Redirecting to Sign In...");
            onNavigate('signin');
            return;
          }
          setValidationError(data.detail || 'Failed to send OTP. Please check the number.');
        }
      } catch (err) {
        console.error(err);
        setValidationError('Could not connect to the verification server. Please try again.');
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
            whatsapp_number: fullPhone,
            code: otpCode
          })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('user_phone', fullPhone);
          onNavigate('business-profile');
        } else {
          setValidationError(data.detail || 'Invalid OTP code.');
        }
      } catch (err) {
        console.error(err);
        setValidationError('Could not connect to the verification server to verify OTP. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center z-50 p-4 font-body-md text-on-surface">
      {/* Premium Backdrop Overlay with blur */}
      <div 
        className="fixed inset-0 bg-on-background/60 backdrop-blur-md animate-backdrop-in" 
        onClick={() => onNavigate('signup')}
      />

      {/* Modal Container */}
      <div className="bg-white w-full max-w-[480px] rounded-xl shadow-2xl overflow-hidden animate-modal-entry relative z-50 border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00c38b]/10 rounded-lg flex items-center justify-center text-[#00c38b]">
              <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437 0 12.045c0 2.112.552 4.173 1.6 6l-1.7 6.2 6.34-1.662c1.82 1.002 3.882 1.53 5.97 1.531h.005c6.604 0 12.039-5.438 12.04-12.046a11.75 11.75 0 00-3.517-8.406"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp Sign Up</h1>
              <p className="text-xs text-gray-500">Fast, secure login without passwords</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('signup')}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 flex items-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {validationError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 animate-shake flex">
                <span className="material-symbols-outlined mr-2 text-[20px]">error</span>
                <span>{validationError}</span>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide" htmlFor="wa-phone">
                    WhatsApp Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select 
                      id="wa-country-code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-gray-50/50 hover:bg-gray-50 font-medium transition-premium cursor-pointer"
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (IN)</option>
                    </select>
                    <input 
                      required
                      type="tel" 
                      id="wa-phone" 
                      placeholder="(555) 123-4567" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-grow border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-900 bg-white placeholder-gray-400 transition-premium input-focus-premium"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#00c38b] hover:bg-[#00b07d] text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-premium shadow-lg shadow-[#00c38b]/15 disabled:opacity-50 btn-premium cursor-pointer"
                >
                  <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437 0 12.045c0 2.112.552 4.173 1.6 6l-1.7 6.2 6.34-1.662c1.82 1.002 3.882 1.53 5.97 1.531h.005c6.604 0 12.039-5.438 12.04-12.046a11.75 11.75 0 00-3.517-8.406"></path>
                  </svg>
                  {isSubmitting ? 'Sending code...' : 'Send OTP via WhatsApp'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide" htmlFor="wa-otp-code">
                    Verification Code
                  </label>
                  <input 
                    required
                    type="text" 
                    id="wa-otp-code" 
                    maxLength={6}
                    placeholder="Enter 6-digit code" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-center font-mono tracking-widest text-xl text-gray-900 placeholder-gray-300 transition-premium input-focus-premium bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center leading-relaxed">
                    We sent a 6-digit verification code to your WhatsApp at <span className="font-semibold text-gray-700">{countryCode} {phone}</span>.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#00c38b] hover:bg-[#00b07d] text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-premium shadow-lg shadow-[#00c38b]/15 disabled:opacity-50 btn-premium cursor-pointer"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium underline py-1 cursor-pointer"
                >
                  Change Phone Number
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100 flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            By continuing, you agree to Realify's Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-gray-600">
            Prefer standard login?{' '}
            <button 
              onClick={() => onNavigate('signup')}
              className="text-[#00c38b] hover:text-[#00b07d] transition-colors font-bold underline"
            >
              Use Email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
