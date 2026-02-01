import React, { useState, useRef } from 'react';

interface WelcomeHubProps {
  onNavigate: (view: 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'userMgmt' | 'login') => void;
}

export const WelcomeHub: React.FC<WelcomeHubProps> = ({ onNavigate }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'dataSource', label: 'Data Source', icon: 'database', cardIcon: 'database_off', desc: 'Unified stream management for multispectral imagery, weather grids, and historical series.' },
    { id: 'algorithm', label: 'Algorithm', icon: 'precision_manufacturing', cardIcon: 'precision_manufacturing', desc: 'Orchestrate hybrid intelligence pipelines using Bayesian inference and XGBoost ensembles.' },
    { id: 'cockpit', label: 'Cockpit', icon: 'monitoring', cardIcon: 'monitoring', desc: 'Real-time multi-asset oversight with proprietary signal alerts and precision backtesting.' },
    { id: 'api', label: 'API Console', icon: 'terminal', cardIcon: 'terminal', desc: 'Secure programmatic infrastructure for large-scale data harvesting and third-party delivery.' }
  ];

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col relative selection:bg-[#0d59f2]/30">
      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ 
             backgroundImage: 'linear-gradient(#0d59f2 0.5px, transparent 0.5px), linear-gradient(90deg, #0d59f2 0.5px, transparent 0.5px)',
             backgroundSize: '40px 40px'
           }}></div>

      {/* Navigation Bar - Refined and Centered */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0e17]/80 backdrop-blur-2xl px-6 flex items-center justify-between z-[100] relative">
        {/* Left Side: Standardized Logo */}
        <div className="flex items-center gap-3 w-80 cursor-pointer group" onClick={() => onNavigate('hub' as any)}>
          <div className="bg-[#0d59f2] p-1.5 rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform flex items-center justify-center size-10">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-white tracking-tight">QuantAgrify</span>
            <span className="text-[9px] font-bold text-white tracking-[0.2em] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        {/* Center: Centered Menu Items */}
        <div className="flex-1 flex justify-center items-center gap-8 h-full">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id as any)}
              className="flex items-center gap-2 text-sm font-medium text-[#90a4cb] hover:text-white transition-all group relative h-16"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#0d59f2]">{item.icon}</span>
              {item.label}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#0d59f2] transition-all group-hover:w-full"></div>
            </button>
          ))}
        </div>
        
        {/* Right Side: User Profile and Status */}
        <div className="flex items-center gap-6 w-80 justify-end">
          <div className="hidden md:flex items-center gap-4 bg-white/[0.03] px-5 py-2 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0bda5e] shadow-[0_0_8px_#0bda5e]"></span>
              <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest font-mono">Engine: Online</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest font-mono">Ping: 12ms</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-4 border-l border-white/10 group transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-white uppercase tracking-tighter">Chief Strategist</p>
                <p className="text-[9px] text-[#0d59f2] font-black uppercase font-mono">Access: Level 7</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0d59f2] to-[#00f2ff] p-[1px] shadow-lg shadow-[#0d59f2]/20 group-hover:rotate-3 transition-transform overflow-hidden">
                <div className="w-full h-full bg-[#080b14] rounded-[9px] flex items-center justify-center overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} className="w-full h-full object-cover" alt="User" />
                  ) : (
                    <span className="material-symbols-outlined text-[#0d59f2] text-xl">account_circle</span>
                  )}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute right-0 mt-3 w-72 bg-[#0d1117]/95 backdrop-blur-2xl border border-[#314368] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="relative size-16 rounded-2xl overflow-hidden border border-[#0d59f2]/30 group/avatar">
                          {userAvatar ? (
                            <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            <div className="w-full h-full bg-[#161d2b] flex items-center justify-center">
                              <span className="material-symbols-outlined text-3xl text-[#90a4cb]">person</span>
                            </div>
                          )}
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-white text-lg">edit</span>
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white uppercase tracking-tight">Admin Principal</p>
                         <p className="text-[10px] text-[#90a4cb] font-mono mt-0.5">mcfly_hq_alpha@quant.io</p>
                         <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-[#0d59f2]/10 text-[#0d59f2] border border-[#0d59f2]/20">Superuser</span>
                       </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { onNavigate('userMgmt'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#90a4cb] hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-lg">manage_accounts</span>
                      Admin User Management
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#90a4cb] hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-lg">settings</span>
                      Platform Preferences
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[#90a4cb] hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-lg">security</span>
                      MFA & Security Audit
                    </button>
                    <div className="h-px bg-white/5 my-2 mx-4"></div>
                    <button 
                      onClick={() => onNavigate('login')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Terminate Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Abstract Data Visualization Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0d59f2]/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Dynamic Workflow Map */}
        <div className="w-full max-w-5xl mb-24 relative px-12 pt-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center z-50 mb-12">
            <h3 className="text-xs font-black text-[#00f2ff] tracking-[0.8em] uppercase mb-1 drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">Platform Pipeline</h3>
            <p className="text-[9px] text-[#94a3b8] font-mono opacity-60 uppercase tracking-[0.4em]">End-to-End Processing Engine Ready</p>
          </div>

          <div className="flex items-center justify-between relative mt-8">
            {[
              { label: 'Multisource Ingest', icon: 'cyclone' },
              { label: 'Neural Fusion', icon: 'psychology' },
              { label: 'Actionable Alpha', icon: 'trending_up' },
              { label: 'Global Endpoint', icon: 'hub' }
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-5 z-10 group cursor-default">
                  <div className="w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center bg-[#111827]/60 backdrop-blur-xl group-hover:border-[#0d59f2] transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(13,89,242,0.2)]">
                    <span className="material-symbols-outlined text-[#0d59f2] text-4xl glow-text">{step.icon}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94a3b8] group-hover:text-white transition-colors">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-[2px] w-full bg-gradient-to-r from-[#0d59f2]/30 via-[#0d59f2] to-[#0d59f2]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/40 animate-[shimmer_2s_infinite] -translate-x-full"></div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Functional Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1280px]">
          {navItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onNavigate(item.id as any)}
              className="group glass-panel rounded-3xl p-10 flex flex-col justify-between transition-all duration-500 hover:border-[#0d59f2]/50 hover:-translate-y-2 cursor-pointer shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[#0d59f2] text-sm">open_in_new</span>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#0d59f2]/10 flex items-center justify-center mb-8 border border-[#0d59f2]/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#0d59f2] text-3xl glow-text">{item.cardIcon}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase">{item.label}</h2>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-10 opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
              <div className="w-full py-4 bg-[#0d59f2]/10 group-hover:bg-[#0d59f2] text-[#0d59f2] group-hover:text-white border border-[#0d59f2]/30 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3">
                Configure Module <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer HUD Components */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent pointer-events-none">
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.3em] opacity-60">System Feed Status</span>
              <div className="flex gap-1.5">
                {[1, 1, 1, 1, 0].map((v, i) => (
                  <div key={i} className={`w-10 h-1 rounded-full ${v ? 'bg-[#0d59f2] shadow-[0_0_8px_#0d59f2]' : 'bg-white/10'}`}></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.3em] opacity-60">Global Computation</span>
              <span className="text-xs font-mono text-white mt-1">422 TFLOPS <span className="text-[#0bda5e] ml-2">+4.2%</span></span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2">Node: <span className="text-white font-mono uppercase tracking-tighter">Frankfurt-AWS-9</span></span>
            <span className="size-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-2">Integrity: <span className="text-[#0bda5e] font-mono">100%</span></span>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
};