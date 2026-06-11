import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const gmvRanges = [
  { label: '$0 - $100K', text: '$0 - $100K' },
  { label: '$100K - $500K', text: '$100K - $500K' },
  { label: '$500K - $1M', text: '$500K - $1M' },
  { label: '$1M - $5M', text: '$1M - $5M' },
  { label: '$5M - $10M', text: '$5M - $10M' },
  { label: '$10M+', text: '$10M+' }
];

const initialGoals = [
  { id: 'profit', title: 'Increase Profitability', desc: 'Optimize pricing and reduce costs to maximize margins' },
  { id: 'revenue', title: 'Scale Revenue', desc: 'Grow sales across channels with intelligent automation' },
  { id: 'inventory', title: 'Optimize Inventory', desc: 'Reduce stockouts and overstock with predictive insights' },
  { id: 'time', title: 'Save Time', desc: 'Free up resources from manual operations and reporting' }
];

export default function BusinessProfile({ onNavigate }) {
  const [storeName, setStoreName] = useState('');
  const [sliderVal, setSliderVal] = useState(2);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState(['Walmart']); // Default selected

  // Profile fields for OTP users (AWAITING_PROFILE state)
  const [onboardingState, setOnboardingState] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && !token.startsWith('mock_')) {
      fetch('http://localhost:8000/v1/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (data) {
          setOnboardingState(data.onboarding_state);
          if (data.profile) {
            setFirstName(data.profile.first_name || '');
            setLastName(data.profile.last_name || '');
          }
          if (data.workspace) {
            setStoreName(data.workspace.store_name || '');
            const rangeIndex = gmvRanges.findIndex(r => r.label === data.workspace.annual_gmv_range);
            if (rangeIndex !== -1) {
              setSliderVal(rangeIndex);
            }
            if (data.workspace.primary_marketplaces) {
              setSelectedMarketplaces(data.workspace.primary_marketplaces);
            }
            if (data.workspace.goals) {
              const goalsOrder = data.workspace.goals;
              const reorderedGoals = [];
              goalsOrder.forEach(title => {
                const foundGoal = initialGoals.find(g => g.title === title);
                if (foundGoal) {
                  reorderedGoals.push(foundGoal);
                }
              });
              initialGoals.forEach(g => {
                if (!reorderedGoals.some(rg => rg.id === g.id)) {
                  reorderedGoals.push(g);
                }
              });
              setGoals(reorderedGoals);
            }
          }
        }
      })
      .catch(err => {
        console.error('Error fetching status in BusinessProfile:', err);
      });
    }
  }, []);

  const marketplaces = [
    { id: 'Amazon', label: 'Amazon', prefix: 'a', colorClass: 'text-orange-500 font-bold', activeClass: 'border-orange-500 bg-orange-50/50 text-orange-700' },
    { id: 'Shopify', label: 'Shopify', prefix: 's', colorClass: 'text-green-600 font-bold', activeClass: 'border-green-600 bg-green-50/50 text-green-700' },
    { id: 'eBay', label: 'eBay', prefix: 'ebay', colorClass: 'text-red-500 font-bold text-xs', activeClass: 'border-red-500 bg-red-50/50 text-red-700' },
    { id: 'Walmart', label: 'Walmart', prefix: 'star', colorClass: 'text-blue-600', activeClass: 'border-brand-accent bg-blue-50 text-brand-accent' },
    { id: 'Etsy', label: 'Etsy', prefix: 'E', colorClass: 'text-orange-600 font-bold', activeClass: 'border-orange-700 bg-orange-50/50 text-orange-900' },
    { id: 'Other', label: 'Other', prefix: 'dots', colorClass: 'text-purple-500', activeClass: 'border-purple-500 bg-purple-50 text-purple-700' }
  ];

  // Draggable Goals List
  const [goals, setGoals] = useState(initialGoals);

  const [draggedIndex, setDraggedIndex] = useState(null);

  const toggleMarketplace = (id) => {
    if (selectedMarketplaces.includes(id)) {
      setSelectedMarketplaces(selectedMarketplaces.filter(item => item !== id));
    } else {
      setSelectedMarketplaces([...selectedMarketplaces, id]);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const remaining = [...goals];
    const draggedItem = remaining[draggedIndex];
    
    remaining.splice(draggedIndex, 1);
    remaining.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setGoals(remaining);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleContinue = async () => {
    const token = localStorage.getItem('auth_token');
    const payload = {
      store_name: storeName || "My Realify Store",
      annual_gmv_range: gmvRanges[sliderVal].label,
      primary_marketplaces: selectedMarketplaces.length > 0 ? selectedMarketplaces : ["Walmart"],
      goals: goals.map(g => g.title)
    };

    if (token && !token.startsWith('mock_')) {
      try {
        // 1. If user is in AWAITING_PROFILE, submit profile details first
        if (onboardingState === 'AWAITING_PROFILE') {
          if (!firstName.trim() || !lastName.trim()) {
            alert('Please enter your first name and last name to complete your profile.');
            return;
          }
          const profileRes = await fetch('http://localhost:8000/v1/onboarding/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName
            })
          });
          const profileData = await profileRes.json();
          if (!profileRes.ok) {
            alert(profileData.detail || 'Failed to update profile details.');
            return;
          }
          // Update state to allow workspace creation next
          setOnboardingState('AWAITING_WORKSPACE');
        }

        // 2. Submit workspace setup
        const response = await fetch('http://localhost:8000/v1/onboarding/workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
          onNavigate('connect-marketplaces');
        } else {
          alert(data.detail || 'Failed to register business workspace metadata');
        }
      } catch (err) {
        console.error(err);
        alert('Could not connect to the server. Please try again.');
      }
    } else {
      alert('A valid session is required to proceed. Please sign up or sign in first.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar Onboarding navigation (Active step 2) */}
      <Sidebar activeStep={2} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-white flex justify-center text-gray-900">
        <div className="max-w-3xl w-full animate-fade-in-up" data-purpose="form-container">
          
          {/* Section Header */}
          <header className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Your Business</h2>
            <p className="text-gray-500">Help us personalize your experience with some basic information</p>
          </header>

          {/* Form Elements */}
          <div className="space-y-10">
            
            {/* Profile fields for OTP / signup updates */}
            {onboardingState === 'AWAITING_PROFILE' && (
              <section className="space-y-4 p-6 border border-[#00c38b]/20 bg-[#00c38b]/5 rounded-custom animate-in fade-in duration-200">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00c38b]">account_circle</span>
                  Complete Your Personal Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700" htmlFor="prof-first-name">First Name</label>
                    <input 
                      required
                      type="text" 
                      id="prof-first-name" 
                      placeholder="John" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-2.5 focus:ring-brand-accent focus:border-brand-accent text-xs bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700" htmlFor="prof-last-name">Last Name</label>
                    <input 
                      required
                      type="text" 
                      id="prof-last-name" 
                      placeholder="Doe" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border-gray-300 rounded-custom px-4 py-2.5 focus:ring-brand-accent focus:border-brand-accent text-xs bg-white text-gray-900"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Store Name Input */}
            <section data-purpose="input-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="store-name">Store Name</label>
              <input 
                type="text" 
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter your store or business name"
                className="w-full px-4 py-3 border border-gray-300 rounded-custom focus:ring-brand-accent focus:border-brand-accent placeholder:text-gray-400 text-sm"
              />
            </section>

            {/* Annual GMV Range Slider */}
            <section data-purpose="gmv-slider">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Annual GMV Range</label>
              <div className="p-6 border border-gray-200 rounded-custom bg-[#f8f9ff]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-gray-500">Selected Range:</span>
                  <span className="text-lg font-bold text-gray-900">{gmvRanges[sliderVal].text}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={sliderVal}
                  onChange={(e) => setSliderVal(parseInt(e.target.value))}
                  className="range-slider mb-4" 
                />
                <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  <span>$0</span>
                  <span>$100K</span>
                  <span>$500K</span>
                  <span>$1M</span>
                  <span>$5M</span>
                  <span>$10M+</span>
                </div>
              </div>
            </section>

            {/* Primary Marketplaces Multi-select */}
            <section data-purpose="marketplaces-selection">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Primary Marketplaces <span className="text-xs font-normal text-gray-500 ml-1">(Select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {marketplaces.map((m) => {
                  const isSelected = selectedMarketplaces.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMarketplace(m.id)}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition-all duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer ${
                        isSelected 
                          ? m.activeClass + ' border-2 shadow-sm font-semibold' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {m.prefix === 'star' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L15 8H22L17 12L19 19L12 15L5 19L7 12L2 8H9L12 2Z"></path>
                        </svg>
                      ) : m.prefix === 'dots' ? (
                        <span className="material-symbols-outlined text-[16px] text-purple-500">more_vert</span>
                      ) : (
                        <span className={m.colorClass}>{m.prefix}</span>
                      )}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Business Goals Priority List */}
            <section data-purpose="prioritize-goals">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's your primary goal? <span className="text-xs font-normal text-gray-500 ml-1">(Drag to rank by priority)</span>
              </label>
              
              <div className="space-y-3" id="goals-list">
                {goals.map((goal, index) => (
                  <div 
                    key={goal.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 border border-gray-200 rounded-custom hover:shadow-md hover:border-brand-accent/50 bg-white cursor-move group transition-all duration-250 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 active:scale-[0.98] ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-brand-accent bg-gray-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center font-bold text-sm text-gray-600">
                        {index + 1}
                      </span>
                      <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-400 text-[18px]">drag_indicator</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{goal.title}</p>
                      <p className="text-xs text-gray-500">{goal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center">
            <button 
              type="button"
              onClick={() => onNavigate('signup')}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              Back
            </button>
            <button 
              type="button"
              onClick={handleContinue}
              className="flex items-center gap-2 px-12 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors shadow-lg text-sm"
            >
              Continue
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
