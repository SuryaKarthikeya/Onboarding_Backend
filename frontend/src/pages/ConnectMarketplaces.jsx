import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function ConnectMarketplaces({ onNavigate }) {
  const [connections, setConnections] = useState({
    Amazon: false,
    Shopify: localStorage.getItem('shopify_connected') === 'true',
    WooCommerce: localStorage.getItem('woocommerce_connected') === 'true',
    eBay: false,
    Walmart: false
  });

  const [skippedCost, setSkippedCost] = useState(false);
  const [costMethod, setCostMethod] = useState(null); // 'csv', 'quickbooks', 'manual'

  // WooCommerce connection modal states
  const [showWooModal, setShowWooModal] = useState(false);
  const [wooUrl, setWooUrl] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');
  const [isWooConnecting, setIsWooConnecting] = useState(false);

  const toggleConnect = (name) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert("A valid session is required to connect marketplaces. Please sign up or sign in.");
      return;
    }

    const isConnected = connections[name];
    if (name === 'Shopify' && !isConnected) {
      const shop = prompt("Enter your Shopify store myshopify.com domain:", "realify-test-store.myshopify.com");
      if (shop) {
        // Fetch the installation URL from the backend and redirect to the real Shopify login page
        fetch(`http://localhost:8000/v1/marketplace/shopify/install?shop=${shop}&state=${token}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => { throw new Error(err.detail || 'Failed to get install URL') });
          }
          return res.json();
        })
        .then(data => {
          if (data.install_url) {
            window.location.href = data.install_url;
          } else {
            alert('Invalid install URL received');
          }
        })
        .catch(err => {
          console.error(err);
          alert(`Error: ${err.message}`);
        });
        return;
      }
    }

    if (name === 'WooCommerce' && !isConnected) {
      setShowWooModal(true);
      return;
    }
    
    // Default local state toggle (for mock mode or other brands)
    const nextVal = !connections[name];
    setConnections(prev => ({
      ...prev,
      [name]: nextVal
    }));
    if (name === 'Shopify') {
      localStorage.setItem('shopify_connected', nextVal ? 'true' : 'false');
    }
    if (name === 'WooCommerce') {
      localStorage.setItem('woocommerce_connected', nextVal ? 'true' : 'false');
    }
  };

  const handleWooConnectSubmit = async (e) => {
    e.preventDefault();
    setIsWooConnecting(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('A valid session is required to connect WooCommerce. Please sign in first.');
      setIsWooConnecting(false);
      return;
    }

    const payload = {
      store_url: wooUrl,
      consumer_key: wooKey,
      consumer_secret: wooSecret
    };

    try {
      const response = await fetch('http://localhost:8000/v1/marketplace/woocommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setConnections(prev => ({ ...prev, WooCommerce: true }));
        localStorage.setItem('woocommerce_connected', 'true');
        setShowWooModal(false);
        // Navigate forward on successful connection
        onNavigate('celebration');
      } else {
        alert(data.detail || 'WooCommerce connection failed');
      }
    } catch (err) {
      console.error(err);
      alert('Could not connect to the server. Please check your backend connection.');
    } finally {
      setIsWooConnecting(false);
    }
  };

  const isAnyConnected = Object.values(connections).some(val => val === true);
  const isContinueEnabled = isAnyConnected || skippedCost || costMethod;

  const marketplacesList = [
    {
      name: 'Amazon',
      desc: 'Connect your Amazon Seller Central',
      bgColor: 'bg-[#FFF3E6]',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoJCyMFoIKFInjwvo4KHtYn7rdIJIEEoCLIShnBqV7UnmXTAdBmOgxGcMEdCfjve3PNervWU8hA82GNacrtAF2VH0pCm5aOVZyicQRA5GewycV6RT7LtTUmJ4nnrHhO5FarxRruOSJVvp3-EQBtHuOPqMCepxzEbEu1hbSbK0EJgBUHEM8pnBWLighsxmB5JMnimH4gBoWy1cmcse5I3WahdA9-Newt60O3dKUP0ZUV3d0hsxO2xiIhpS0QvZOXdj_SaBBIPlyYTI'
    },
    {
      name: 'Shopify',
      desc: 'Connect your Shopify store',
      bgColor: 'bg-[#E8F5E9]',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFJhYybrf1FTLtH50003eUsT5fqzQL_24kOkJlqjY-Vz3mcMVpk6hDzjBhcGaUEL0SBpDZbvtylLzB2Qt91a3a71pgd5uv3QKEAUPc0MVliYxDec-i7QNw3Evhmn4GXK_fm_pWuteozIJ5ekBRK4zJiLwdLkhEGfmdTsGkGKOtEuhiFm2ZdXuaOrry_jVfkrAlh4kea3PPqXRZxKngnR3kr4k0OZOAYwhmdrTbcxQZgRKSPB_vdm1FfWNb2KVKD3htnxgTvBE5xAQ'
    },
    {
      name: 'WooCommerce',
      desc: 'Connect your WooCommerce store',
      bgColor: 'bg-[#F3E5F5]',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_fHHXreaDLDTG7pMcvZnnrJYk-1EHK9Khjkn6UL5lrH0PzUkw42eR_12AyAtQRD_dVfXt5b87wcMEZTHXEXJ0dmbrR-jxD96FVMBV4hEGS2lxKUVqwGsfwxuM2wHYmQMXTA5b4FYOuFlWYu_bJhN2sM5Q4g9jl6ikW8uc8R2rz58OaWQWckTJVfP5ncLZIVQXDGT-A-vqMV_qf5wgP3fjvQQhB3koU09p36qqHP1QqNh3BFlyvgXFPYtfwvOpbMT5GeqT_rCVHtQ'
    },
    {
      name: 'eBay',
      desc: 'Connect your eBay account',
      bgColor: 'bg-[#FFEBEE]',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD55t1Ncr9BeQpg9fglofxfQyLMNP4GIzmPab2bvSB_w_lTV1vd5cR4-QB9iVUck0gQ7XC7jbxf9McxCd-v-TDHXKrn2VPwwp-PqqyX1u6vjRjISmZ33_Uvmb2ps0ndM-sqLkB-QaS5Z7gzGEopz3HzcN_CiXn9yD12OS0rdkLQyMwKE0HlQ1KX_D_RT1ahp4pYEX6wW7LeOY8lKM3Z2DsON0aLyNzJiw-MFYCRDgWW9LCkSXSR3zDFUrb_6kfq8nnPeng-O0WQ1uc'
    },
    {
      name: 'Walmart',
      desc: 'Connect your Walmart seller account',
      bgColor: 'bg-[#E3F2FD]',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9Cmfi1-4A-1s8Tj8eufkVevcPKel3lpSg_ONInOCd-sFTTlB7RklmhWviRzF_FiHh_yEPgiL6t-_MwBlLeZ3aiCgHtGXvNJsMfXaey47dUO6XqERo7V5TfsomCAxVkrWyDVFyatpStho_16q_tT7OiTLaUvWsmEFZj_OLSfJAlDpHwNrGeBg_ojv0IopANrw5XREx7XWKHNuPpMLuBMauUGIGwMf7Zs6BTKaRdfayWYfoY_ZtHFMdT9DFpxLQWVpnlPKJM1IoT_c'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar - Onboarding (Step 3 Active) */}
      <Sidebar activeStep={3} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center bg-white overflow-y-auto text-gray-900" data-purpose="main-content">
        <div className="w-full max-w-2xl py-12 px-8">
          
          {/* Marketplace Connections Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Marketplaces</h2>
            <p className="text-sm text-gray-500">Link your sales channels to start syncing data and generating insights</p>
          </div>

          {/* Marketplace list */}
          <div className="space-y-4 mb-8" data-purpose="marketplace-list">
            {marketplacesList.map((market) => {
              const isConnected = connections[market.name];
              return (
                <div 
                  key={market.name} 
                  className={`flex items-center justify-between p-4 border rounded-custom hover:shadow-sm transition-all duration-200 ${
                    isConnected ? 'border-green-300 bg-green-50/10' : 'border-border-subtle'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${market.bgColor} rounded-lg flex items-center justify-center p-2`}>
                      <img 
                        alt={`${market.name} Logo`} 
                        className="w-full h-full object-contain" 
                        src={market.logoUrl}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{market.name}</h4>
                      <p className="text-xs text-gray-500">{market.desc}</p>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => toggleConnect(market.name)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isConnected 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-[#2d2d2d] text-white hover:bg-black'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cost Data Section */}
          <section className="bg-gray-50 border border-border-subtle rounded-custom p-6 mb-8" data-purpose="cost-data-section">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-900 font-bold text-sm bg-gray-200 w-5 h-5 rounded-full flex items-center justify-center">$</span>
              <h3 className="text-sm font-bold text-gray-900">Add Cost Data</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Upload COGS to unlock margin analysis and profitability insights</p>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <button 
                type="button"
                onClick={() => {
                  setCostMethod('csv');
                  setSkippedCost(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  costMethod === 'csv'
                    ? 'bg-green-50 border-green-600 text-green-700'
                    : 'bg-white border-border-subtle text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-green-600">upload_file</span>
                Upload CSV
              </button>
              <button 
                type="button"
                onClick={() => {
                  setCostMethod('quickbooks');
                  setSkippedCost(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  costMethod === 'quickbooks'
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-white border-border-subtle text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-blue-600">account_balance_wallet</span>
                Connect QuickBooks
              </button>
              <button 
                type="button"
                onClick={() => {
                  setCostMethod('manual');
                  setSkippedCost(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold transition-all ${
                  costMethod === 'manual'
                    ? 'bg-purple-50 border-purple-600 text-purple-700'
                    : 'bg-white border-border-subtle text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-purple-600">edit_note</span>
                Manual Entry
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => {
                setSkippedCost(true);
                setCostMethod(null);
              }}
              className={`text-xs underline transition-all ${
                skippedCost ? 'text-gray-400 font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {skippedCost ? 'Skipped cost data' : 'Skip for now'}
            </button>
          </section>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-100" data-purpose="form-navigation">
            <button 
              type="button"
              onClick={() => onNavigate('business-profile')}
              className="flex items-center gap-2 px-8 py-3 bg-white border border-border-subtle rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              Back
            </button>
            
            {isContinueEnabled ? (
              <button 
                type="button"
                onClick={() => onNavigate('celebration')}
                className="flex items-center justify-center gap-2 px-24 py-4 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-lg active:scale-[0.99]"
              >
                Continue
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            ) : (
              <button 
                type="button"
                disabled
                className="flex items-center justify-center gap-2 px-24 py-4 bg-[#a1a1a1] text-white rounded-lg text-sm font-bold cursor-not-allowed shadow-md"
              >
                Continue
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* WooCommerce Connection Modal Overlay */}
      {showWooModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                Connect WooCommerce
              </h3>
              <button 
                type="button"
                onClick={() => setShowWooModal(false)}
                className="text-gray-400 hover:text-gray-600 flex items-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleWooConnectSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="woo-url">Store URL</label>
                <input 
                  required
                  type="url" 
                  id="woo-url"
                  placeholder="https://yourstore.com"
                  value={wooUrl}
                  onChange={(e) => setWooUrl(e.target.value)}
                  className="border border-gray-300 rounded-custom px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="woo-key">Consumer Key</label>
                <input 
                  required
                  type="text" 
                  id="woo-key"
                  placeholder="ck_..."
                  value={wooKey}
                  onChange={(e) => setWooKey(e.target.value)}
                  className="border border-gray-300 rounded-custom px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="woo-secret">Consumer Secret</label>
                <input 
                  required
                  type="password" 
                  id="woo-secret"
                  placeholder="cs_..."
                  value={wooSecret}
                  onChange={(e) => setWooSecret(e.target.value)}
                  className="border border-gray-300 rounded-custom px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWooModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWooConnecting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isWooConnecting ? 'Connecting...' : 'Connect Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
