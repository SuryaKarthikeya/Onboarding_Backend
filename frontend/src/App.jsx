import React, { useState } from 'react';
import SignUp from './pages/SignUp';
import BusinessProfile from './pages/BusinessProfile';
import ConnectMarketplaces from './pages/ConnectMarketplaces';
import DashboardCelebration from './pages/DashboardCelebration';
import SignInModal from './pages/SignInModal';
import CostDataIngestion from './pages/CostDataIngestion';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('signup'); // 'signup', 'signup-whatsapp', 'business-profile', 'connect-marketplaces', 'celebration', 'ready', 'signin', 'signin-otp'
  const [showDevPanel, setShowDevPanel] = useState(true);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('currentScreen');
    const status = params.get('status');
    const platform = params.get('platform');
    const integration = params.get('integration');

    // If screen switcher explicitly overrides the screen, skip status check
    if (screen) {
      setCurrentScreen(screen);
      return;
    }

    // Handle redirection back from Shopify connection callback
    if (window.location.pathname.startsWith('/dashboard') || integration === 'success') {
      localStorage.setItem('shopify_connected', 'true');
      window.history.replaceState({}, document.title, '/');
    }

    if (status === 'SUCCESS' && platform === 'shopify') {
      localStorage.setItem('shopify_connected', 'true');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Restore session by querying user status from backend
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('http://localhost:8000/v1/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          setCurrentScreen('signup');
        } else if (res.ok) {
          return res.json();
        }
      })
      .then(data => {
        if (data) {
          switch (data.onboarding_state) {
            case 'AWAITING_PROFILE':
            case 'AWAITING_WORKSPACE':
              setCurrentScreen('business-profile');
              break;
            case 'AWAITING_INTEGRATION':
              setCurrentScreen('connect-marketplaces');
              break;
            case 'ACTIVE':
              if (integration === 'success') {
                setCurrentScreen('connect-marketplaces');
              } else {
                const celebrationSeen = localStorage.getItem('celebration_seen') === 'true';
                setCurrentScreen(celebrationSeen ? 'ready' : 'celebration');
              }
              break;
            default:
              setCurrentScreen('signup');
          }
        }
      })
      .catch(err => {
        console.error('Error fetching onboarding status:', err);
      });
    }
  }, []);

  // Router simulator
  const renderScreen = () => {
    switch (currentScreen) {
      case 'signup':
        return <SignUp onNavigate={setCurrentScreen} initialMethod="email" key="signup-email" />;
      case 'signup-whatsapp':
        return <SignUp onNavigate={setCurrentScreen} initialMethod="whatsapp" key="signup-wa" />;
      case 'business-profile':
        return <BusinessProfile onNavigate={setCurrentScreen} />;
      case 'connect-marketplaces':
        return <ConnectMarketplaces onNavigate={setCurrentScreen} />;
      case 'celebration':
        return <DashboardCelebration onNavigate={setCurrentScreen} initialFinalReady={false} key="celebration-normal" />;
      case 'ready':
        return <DashboardCelebration onNavigate={setCurrentScreen} initialFinalReady={true} key="celebration-ready" />;
      case 'signin':
        return <SignInModal onNavigate={setCurrentScreen} initialMethod="email" key="signin-modal-email" />;
      case 'signin-otp':
        return <SignInModal onNavigate={setCurrentScreen} initialMethod="otp" key="signin-modal-otp" />;
      case 'cost-data':
        return <CostDataIngestion onNavigate={setCurrentScreen} />;
      default:
        return <SignUp onNavigate={setCurrentScreen} />;
    }
  };

  const devScreens = [
    { id: 'signup', label: '1. Sign Up (Email/Password)', stitchName: 'Create Your Account' },
    { id: 'signup-whatsapp', label: '2. Sign Up (WhatsApp)', stitchName: 'Create Your Account - WhatsApp Login' },
    { id: 'business-profile', label: '3. Business Profile Setup', stitchName: 'Business Profile' },
    { id: 'connect-marketplaces', label: '4. Connect Marketplaces', stitchName: 'Connect Marketplaces' },
    { id: 'signin', label: '5. Sign In Modal (Email/Password)', stitchName: 'Sign In Modal' },
    { id: 'signin-otp', label: '6. Sign In Modal (OTP State)', stitchName: 'Sign In Modal - OTP State' },
    { id: 'celebration', label: '7. Setup Complete Celebration', stitchName: 'Dashboard - Setup Complete Celebration' },
    { id: 'ready', label: '8. Dashboard Final Readiness', stitchName: 'Dashboard - Final Readiness State' },
    { id: 'cost-data', label: '9. Cost Data Ingestion', stitchName: 'Cost Ingestion Dashboard' },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Active Screen rendering */}
      {renderScreen()}

      {/* Floating Developer Control Panel (Screen Switcher) */}
      <div className="fixed bottom-4 right-4 z-50">
        {!showDevPanel ? (
          <button
            onClick={() => setShowDevPanel(true)}
            className="bg-[#1e2532] text-white hover:bg-black p-3 rounded-full flex items-center justify-center shadow-lg border border-gray-700 hover:scale-105 transition-all"
            title="Expand Screen Switcher"
          >
            <span className="material-symbols-outlined text-[20px]">design_services</span>
          </button>
        ) : (
          <div className="bg-[#1e2532] border border-gray-700 rounded-xl shadow-2xl p-4 w-72 text-white animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#00c38b]">design_services</span>
                <span className="font-bold text-xs uppercase tracking-wider text-gray-300">Stitch Screen Switcher</span>
              </div>
              <button
                onClick={() => setShowDevPanel(false)}
                className="text-gray-400 hover:text-white flex items-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
              Use this panel to instantly preview all 8 screens mapped from Stitch Project 7979778160086651962:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {devScreens.map((scr) => (
                <button
                  key={scr.id}
                  onClick={() => setCurrentScreen(scr.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex flex-col ${
                    currentScreen === scr.id 
                      ? 'bg-primary text-[#1e2532] font-semibold' 
                      : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{scr.label}</span>
                  <span className={`text-[9px] ${currentScreen === scr.id ? 'text-[#1e2532]/75' : 'text-gray-500'}`}>
                    Stitch: {scr.stitchName}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-800 flex justify-between items-center text-[9px] text-gray-500">
              <span>Project ID: 7979778160086651962</span>
              <span className="text-[#00c38b] font-semibold">Realify AI</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
