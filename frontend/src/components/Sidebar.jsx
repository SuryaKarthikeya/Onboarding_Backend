import React from 'react';

export default function Sidebar({ activeStep }) {
  const steps = [
    {
      number: 1,
      title: "Create Your Account",
      description: "Sign up with email, phone, or social login to get started on your intelligence journey."
    },
    {
      number: 2,
      title: "Business Profile",
      description: "Tell us about your store, revenue scale, and marketplace channels to personalize your experience."
    },
    {
      number: 3,
      title: "Connect Marketplaces",
      description: "Link your Amazon, Shopify, eBay, and other sales channels to start syncing your data."
    },
    {
      number: 4,
      title: "Welcome to Your Dashboard",
      description: "Your command center is ready with powerful tools and AI-driven insights."
    }
  ];

  return (
    <aside className="w-full md:w-[400px] shrink-0 bg-[#1e2532] text-white p-8 md:p-12 flex flex-col justify-between overflow-y-auto md:h-screen md:sticky top-0 border-r border-gray-800">
      <div>
        {/* Header Branding */}
        <div className="mb-12" data-purpose="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-white text-[24px]">token</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Realify Ai</h1>
              <p className="text-xs text-white/50 uppercase tracking-widest">Intelligence Command Center</p>
            </div>
          </div>
        </div>

        {/* Stepper Navigation */}
        <nav className="flex-grow space-y-6" data-purpose="onboarding-stepper">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isCompleted = activeStep > stepNum;
            const isActive = activeStep === stepNum;
            const isUpcoming = activeStep < stepNum;
            const isLineGreen = activeStep > stepNum;

            return (
              <div key={stepNum} className="flex gap-4 relative transition-all duration-300">
                {/* Visual connectors */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute left-[15px] top-[32px] w-[2px] transition-all duration-550 ${
                      isLineGreen ? 'bg-[#00c38b]' : 'bg-[#374151]'
                    }`}
                    style={{ height: 'calc(100% + 8px)' }}
                  />
                )}
                
                {/* Step Circle */}
                <div className="relative z-10 shrink-0">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-[#00c38b] flex items-center justify-center text-white transition-all duration-500 scale-100 shadow-md shadow-[#00c38b]/20">
                      <span className="material-symbols-outlined text-sm font-bold animate-fade-in">check</span>
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-white text-[#1e2532] flex items-center justify-center font-bold text-sm animate-step-pulse transition-all duration-500 scale-105 shadow-lg shadow-white/25">
                      {stepNum}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-600 text-gray-500 bg-[#1e2532] flex items-center justify-center font-bold text-sm transition-all duration-500 scale-95">
                      {stepNum}
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="transition-all duration-300">
                  <h3 className={`font-semibold text-sm transition-all duration-300 ${
                    isActive ? "text-white translate-x-0.5 font-bold" : isCompleted ? "text-white/80" : "text-white/40"
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed transition-all duration-300 ${
                    isActive ? "text-white/60" : isCompleted ? "text-white/50" : "text-white/20"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info Card */}
      <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-custom" data-purpose="quick-setup-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-white/60 text-sm">schedule</span>
          <span className="text-sm font-semibold text-white/80">Quick Setup</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Complete onboarding in under 15 minutes and start making data-driven decisions immediately.
        </p>
      </div>
    </aside>
  );
}
