import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardCelebration({ onNavigate, initialFinalReady = false }) {
  const [isFinalReady, setIsFinalReady] = useState(initialFinalReady);
  const [completedTasks, setCompletedTasks] = useState({
    createAccount: true,
    connectMarketplaces: true,
    uploadCostData: false,
    setUpAlerts: false
  });

  const canvasRef = useRef(null);

  // Confetti Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.size = Math.random() * 8 + 6;
        this.speedY = Math.random() * -15 - 5;
        this.speedX = Math.random() * 6 - 3;
        this.color = ['#006c4b', '#64fcbf', '#4646d8', '#ff8b6f'][Math.floor(Math.random() * 4)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.speedY += 0.2; // Gravity
        this.rotation += this.rotationSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    const celebrate = () => {
      for (let i = 0; i < 120; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].y > canvas.height + 20) {
          particles.splice(i, 1);
          i--;
        }
      }
      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Shoot confetti on mount
    setTimeout(() => {
      celebrate();
      animate();
    }, 300);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFinalReady]);

  // Sync state with prop if switcher updates it
  useEffect(() => {
    setIsFinalReady(initialFinalReady);
  }, [initialFinalReady]);

  const toggleTask = (taskKey) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  const completedCount = Object.values(completedTasks).filter(v => v).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9ff]">
      {/* Sidebar - Onboarding (Active step 4) */}
      <Sidebar activeStep={4} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col relative min-h-screen md:h-screen md:overflow-hidden bg-[#f8f9ff]">
        {/* Top App Bar */}
        <header className="flex justify-end items-center w-full px-gutter py-stack-md shrink-0">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Interaction Pane */}
        <main className="flex-1 overflow-y-auto flex flex-col items-center relative py-6 px-4 md:px-8">
          
          {/* Background Decorative Blur Elements */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[100px]"></div>
          </div>

          <div className="w-full max-w-[800px] z-10 text-center space-y-12 pb-16">
            
            {/* Header section */}
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                </div>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-background">Welcome to Your Command Center!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Your Intelligence dashboard is ready with powerful AI-driven tools and insights</p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="p-6 bg-secondary-container/10 border border-secondary/20 rounded-xl hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center text-white mb-4">
                  <span className="material-symbols-outlined text-[22px]">monitoring</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-sm font-semibold">Real-Time Analytics</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  Monitor your revenue, margins, and performance across all marketplaces in one unified dashboard.
                </p>
              </div>

              <div className="p-6 bg-primary-container/10 border border-primary/20 rounded-xl hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-white mb-4">
                  <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-sm font-semibold">AI Intelligence Agents</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  Get automated recommendations for pricing, inventory, and marketing from our AI-powered agents.
                </p>
              </div>

              <div className="p-6 bg-primary-fixed/20 border border-primary-fixed/50 rounded-xl hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-[#64fcbf] rounded-lg flex items-center justify-center text-[#005138] mb-4">
                  <span className="material-symbols-outlined text-[22px]">notifications_active</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-sm font-semibold">Smart Alerts</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  Receive instant notifications about stockouts, pricing changes, and opportunities to optimize.
                </p>
              </div>

              <div className="p-6 bg-tertiary-container/10 border border-tertiary/20 rounded-xl hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-tertiary-container rounded-lg flex items-center justify-center text-on-tertiary mb-4">
                  <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-sm font-semibold">SKU Intelligence</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  Deep dive into individual product performance with detailed metrics and actionable insights.
                </p>
              </div>
            </div>

            {/* Quick Start Guide Checklist */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-left shadow-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-background text-sm font-semibold">Quick Start Guide</h3>
                  <p className="text-body-sm text-on-surface-variant text-xs">Complete these tasks to unlock the full potential of MarketPulse</p>
                </div>
                <div className="text-right">
                  <span className="text-primary font-bold text-xl">{completedCount}/5</span>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tasks Completed</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Task 1 */}
                <div className="flex items-center justify-between p-4 bg-primary-container/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create Account</p>
                      <p className="text-xs text-gray-400">Set up your Realify account</p>
                    </div>
                  </div>
                  <span className="text-primary text-xs font-bold">Completed</span>
                </div>

                {/* Task 2 */}
                <div className="flex items-center justify-between p-4 bg-primary-container/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Connect Marketplaces</p>
                      <p className="text-xs text-gray-400">Link your sales channels</p>
                    </div>
                  </div>
                  <span className="text-primary text-xs font-bold">Completed</span>
                </div>

                {/* Task 3 */}
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  completedTasks.uploadCostData 
                    ? 'bg-primary-container/10 border-primary/20' 
                    : 'bg-surface-container border-outline-variant/30'
                }`}>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => toggleTask('uploadCostData')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${
                        completedTasks.uploadCostData ? 'bg-primary' : 'bg-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      {completedTasks.uploadCostData ? (
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      ) : (
                        <span className="text-xs font-bold">3</span>
                      )}
                    </button>
                    <div>
                      <p className="font-medium text-sm">Upload Cost Data</p>
                      <p className="text-xs text-gray-400">Add COGS for margin analysis</p>
                    </div>
                  </div>
                  {completedTasks.uploadCostData ? (
                    <span className="text-primary text-xs font-bold">Completed</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => toggleTask('uploadCostData')}
                      className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline"
                    >
                      Start Now 
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>

                {/* Task 4 */}
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  completedTasks.setUpAlerts 
                    ? 'bg-primary-container/10 border-primary/20' 
                    : 'bg-surface-container border-outline-variant/30'
                }`}>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => toggleTask('setUpAlerts')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${
                        completedTasks.setUpAlerts ? 'bg-primary' : 'bg-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      {completedTasks.setUpAlerts ? (
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      ) : (
                        <span className="text-xs font-bold">4</span>
                      )}
                    </button>
                    <div>
                      <p className="font-medium text-sm">Set Up Alerts</p>
                      <p className="text-xs text-gray-400">Configure notifications for key events</p>
                    </div>
                  </div>
                  {completedTasks.setUpAlerts ? (
                    <span className="text-primary text-xs font-bold">Completed</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => toggleTask('setUpAlerts')}
                      className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline"
                    >
                      Start Now 
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Final Readiness Cards (Screen 7 View) */}
            {isFinalReady && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
                <div className="bg-secondary p-8 rounded-xl text-center text-on-secondary shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-surface-container-lowest rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <div className="relative z-10 space-y-6 text-white">
                    <div className="flex justify-center">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        auto_fix_high
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">You're Ready to Go!</h3>
                      <p className="text-sm opacity-80">Your intelligence command center is fully operational and syncing live data</p>
                    </div>
                    <div className="flex justify-center">
                      <button 
                        type="button"
                        onClick={() => alert('Welcome to your Dashboard! Connected to local backend.')}
                        className="bg-white text-secondary px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-all shadow-md active:scale-95"
                      >
                        Enter Dashboard
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    type="button"
                    onClick={() => onNavigate('connect-marketplaces')}
                    className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-xs font-bold">arrow_back</span>
                    Back to Marketplace Connection
                  </button>
                </div>
              </div>
            )}
            
            {/* If not final ready, show a toggle helper button to showcase Screen 7 */}
            {!isFinalReady && (
              <div className="pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsFinalReady(true)}
                  className="bg-primary/20 text-[#006c4b] border border-primary/30 px-6 py-2 rounded-full text-xs font-semibold hover:bg-primary/30 transition-all"
                >
                  Proceed to Final Readiness State (Show Screen 7)
                </button>
              </div>
            )}
          </div>

          {/* Canvas Confetti overlay */}
          <canvas ref={canvasRef} className="confetti-canvas absolute inset-0 pointer-events-none" />
        </main>
      </div>
    </div>
  );
}
