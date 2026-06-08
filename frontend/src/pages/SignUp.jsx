import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function SignUp({ onNavigate, initialMethod = 'email' }) {
  const [authMethod, setAuthMethod] = useState(initialMethod); // 'email' or 'whatsapp'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          confirm_password: confirmPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_email', email);
        onNavigate('business-profile');
      } else {
        alert(data.detail || 'Sign up failed');
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo in case backend connection errors out
      alert('Proceeding with developer mock account.');
      localStorage.setItem('auth_token', 'mock_dev_token_123');
      localStorage.setItem('user_email', email || 'demo@company.com');
      onNavigate('business-profile');
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: 'None', filledCount: 0, colorClass: 'bg-gray-200' };
    if (password.length < 6) return { label: 'Weak', filledCount: 1, colorClass: 'bg-red-400' };
    if (password.length < 10) return { label: 'Fair', filledCount: 2, colorClass: 'bg-yellow-400' };
    return { label: 'Strong', filledCount: 4, colorClass: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar Navigation */}
      <Sidebar activeStep={1} />

      {/* Main Content Area */}
      <main className="flex-grow flex justify-center items-start overflow-y-auto px-6 py-12 md:py-16 bg-white text-gray-900">
        <div className="w-full max-w-2xl">
          {/* Section Header */}
          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="text-gray-500 mt-2">Choose your preferred sign-up method to get started</p>
          </div>

          {/* Social Login Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-3 border border-gray-300 rounded-custom py-3 px-4 hover:bg-gray-50 transition-colors">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiYrE2K7e20a9kCDHGpffkxpfHPzFL-EIyeFWLpqW9hF179Sr-hxtl0oFC2V48MLdNgAYP0PGrtWNZqdWvcOufjMWnbhe_dT9X4WYv_HkUyS4GNPoOtq4Cwqq7p0ZUEYungB63EwHNTHPp50AOcV0zebkp0NKmOGsChWFWZDqXHxD_AR8WPa1gI4UMLhKm3tLbhqMVI1awisS0QrhTmHtH_nJNZBw_GmXvj_2-bZ3NbaZM_aQRdgiHfjkONqQVTnF7-jMpyp3VRwA" />
              <span className="text-gray-700 font-medium text-sm">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 border border-gray-300 rounded-custom py-3 px-4 hover:bg-gray-50 transition-colors">
              <svg className="text-gray-900" fill="currentColor" height="18" viewBox="0 0 384 512" width="18">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
              <span className="text-gray-700 font-medium text-sm">Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Quick Contact Options / Sign up Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button 
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex items-center justify-center gap-3 rounded-custom py-3 px-4 transition-all ${
                authMethod === 'email' 
                  ? 'bg-[#333] text-white hover:bg-black shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span className="font-medium text-sm">Email</span>
            </button>
            <button 
              type="button"
              onClick={() => setAuthMethod('whatsapp')}
              className={`flex items-center justify-center gap-3 rounded-custom py-3 px-4 transition-all ${
                authMethod === 'whatsapp' 
                  ? 'bg-primary text-white hover:opacity-90 shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {/* WhatsApp Icon */}
              <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437 0 12.045c0 2.112.552 4.173 1.6 6l-1.7 6.2 6.34-1.662c1.82 1.002 3.882 1.53 5.97 1.531h.005c6.604 0 12.039-5.438 12.04-12.046a11.75 11.75 0 00-3.517-8.406"></path>
              </svg>
              <span className="font-medium text-sm">WhatsApp</span>
            </button>
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleRegister} data-purpose="registration-form">
            {authMethod === 'email' ? (
              <>
                {/* Email Registration Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="first-name">First Name</label>
                    <input 
                      required
                      type="text" 
                      id="first-name" 
                      placeholder="John" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-3 focus:ring-brand-accent focus:border-brand-accent text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="last-name">Last Name</label>
                    <input 
                      required
                      type="text" 
                      id="last-name" 
                      placeholder="Doe" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-3 focus:ring-brand-accent focus:border-brand-accent text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="email">Email Address</label>
                  <input 
                    required
                    type="email" 
                    id="email" 
                    placeholder="you@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-gray-300 rounded-custom px-4 py-3 focus:ring-brand-accent focus:border-brand-accent text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                  <div className="relative">
                    <input 
                      required
                      type={showPassword ? 'text' : 'password'} 
                      id="password" 
                      placeholder="Create a strong password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-3 pr-10 focus:ring-brand-accent focus:border-brand-accent text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="flex gap-1.5 mt-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <div 
                        key={num} 
                        className={`password-strength-bar ${
                          strength.filledCount >= num ? strength.colorClass : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Password strength: <span className="font-semibold text-gray-600">{strength.label}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="confirm-password">Confirm Password</label>
                  <div className="relative">
                    <input 
                      required
                      type={showConfirmPassword ? 'text' : 'password'} 
                      id="confirm-password" 
                      placeholder="Re-enter your password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-3 pr-10 focus:ring-brand-accent focus:border-brand-accent text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3">
                  <input 
                    required
                    type="checkbox" 
                    id="terms" 
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#00c38b] border-gray-300 rounded focus:ring-[#00c38b]"
                  />
                  <label className="text-sm text-gray-600" htmlFor="terms">
                    I agree to the <a className="text-gray-900 font-semibold underline" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a className="text-gray-900 font-semibold underline" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="w-full bg-[#333] text-white py-4 rounded-custom font-semibold flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all shadow-md"
                >
                  Continue
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </>
            ) : (
              <>
                {/* WhatsApp Registration Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="phone">Phone Number</label>
                  <div className="flex gap-2">
                    <select 
                      id="country-code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-24 border-gray-300 rounded-custom px-3 py-3 focus:ring-primary focus:border-primary text-sm bg-white"
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (IN)</option>
                    </select>
                    <input 
                      required
                      type="tel" 
                      id="phone" 
                      placeholder="(555) 123-4567" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-grow border-gray-300 rounded-custom px-4 py-3 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-custom font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-md"
                >
                  {/* WhatsApp Icon */}
                  <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437 0 12.045c0 2.112.552 4.173 1.6 6l-1.7 6.2 6.34-1.662c1.82 1.002 3.882 1.53 5.97 1.531h.005c6.604 0 12.039-5.438 12.04-12.046a11.75 11.75 0 00-3.517-8.406"></path>
                  </svg>
                  Send OTP via WhatsApp
                </button>
              </>
            )}

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => onNavigate('signin')}
                className="text-gray-900 font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
