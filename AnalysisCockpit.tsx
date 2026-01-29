import React from 'react';

interface AnalysisCockpitProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const AnalysisCockpit: React.FC<AnalysisCockpitProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const, active: true },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  return (
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Global Precision Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0a0e17]/80 backdrop-blur-2xl px-8 h-16 shrink-0 z-50">
        <div className="flex items-center gap-4 w-1/4 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="bg-[#0d59f2] h-10 w-10 flex items-center justify-center rounded shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter text-white">QuantAgrify</h1>
            <span className="text-[9px] font-black tracking-[0.4em] text-[#90a4cb] uppercase mt-0.5 opacity-60">Global Intelligence</span>
          </div>
        </div>

        <nav className="flex items-center gap-12 h-full">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.view !== 'cockpit' && onNavigate(item.view)}
              className={`h-full flex items-center text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              {item.label}
              {item.active && <div className="absolute -bottom-[1px] left-0 w-full h-[3px] bg-[#0d59f2] shadow-[0_0_10px_#0d59f2]"></div>}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <div className="hidden xl:flex items-center rounded-lg bg-white/5 border border-white/5 px-4 py-2 transition-all focus-within:border-[#0d59f2] group w-48">
            <span className="material-symbols-outlined text-[#90a4cb] text-sm group-focus-within:text-[#0d59f2]">search</span>
            <input className="w-full border-none bg-transparent text-[11px] text-white placeholder:text-[#90a4cb]/50 focus:ring-0 font-bold uppercase tracking-widest" placeholder="Asset search..." />
          </div>
          <button className="text-[#90a4cb] hover:text-[#0d59f2] relative group">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 size-2 bg-[#0d59f2] rounded-full border-2 border-[#0a0e17] group-hover:scale-110 transition-transform"></span>
          </button>
          <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#0d59f2] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </header>

      {/* Real-time Market Ticker Sub-bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-[#0d1117]/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0d59f2] text-xl animate-pulse">monitoring</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-[0.2em] leading-none opacity-60">Instrument Profile</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-1 font-mono">CORN_FUT_CBOT_ZCZ24</h2>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-widest leading-none opacity-60">Front Month</span>
              <span className="text-sm font-bold text-white mt-1 font-mono">462.25 <span className="text-[#0bda5e] ml-1 text-xs">+1.24%</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-widest leading-none opacity-60">Cycle Volume</span>
              <span className="text-sm font-bold text-white mt-1 font-mono">32,442 <span className="text-[#fa6238] ml-1 text-xs">-2.1%</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded bg-white/5 border border-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span> Snapshot
          </button>
          <button className="flex items-center gap-2 rounded bg-[#0d59f2] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#1a66ff] transition-all shadow-lg shadow-[#0d59f2]/20 ring-2 ring-[#0d59f2] ring-offset-2 ring-offset-[#0a0e17]">
            <span className="material-symbols-outlined text-sm animate-bounce">rocket_launch</span> Execute Algo
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-20 border-r border-white/10 bg-[#05070a] flex flex-col items-center py-8 gap-10 shrink-0">
          {sideNavItems.map(item => (
            <div 
              key={item.label} 
              onClick={() => item.view && onNavigate(item.view)}
              className={`group flex flex-col items-center gap-1.5 cursor-pointer transition-all ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-3 rounded-2xl border transition-all ${item.active ? 'bg-[#0d59f2]/10 border-[#0d59f2]/40 text-[#0d59f2] shadow-[0_0_20px_rgba(13,89,242,0.15)]' : 'border-transparent hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
          <div className="mt-auto flex flex-col items-center gap-1.5 cursor-pointer text-[#fa6238] hover:text-red-400 transition-all opacity-60 hover:opacity-100" onClick={() => onNavigate('login')}>
            <div className="p-3 rounded-2xl hover:bg-red-500/10">
              <span className="material-symbols-outlined text-2xl">logout</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Logout</span>
          </div>
        </aside>

        {/* Dashboard Grid */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#05070a] p-8">
          <div className="mb-10 flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Strategy Execution Cockpit</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#0bda5e] animate-pulse"></span>
                <span className="text-[10px] font-black text-[#0bda5e] uppercase tracking-widest">Engine Online</span>
              </div>
              <span className="text-[#90a4cb] opacity-20 text-xs">|</span>
              <p className="text-[#90a4cb] text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">Session ID: 0x77A-921-X32</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Primary Signal Indicator */}
            <div className="col-span-12 lg:col-span-8">
              <div className="glass-panel border-l-4 border-l-[#0bda5e] rounded-3xl overflow-hidden shadow-2xl relative group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-white">trending_up</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-10 p-10 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0bda5e] px-3 py-1.5 bg-[#0bda5e]/10 rounded border border-[#0bda5e]/20">AI Directive: High Buy</span>
                      <span className="text-[10px] text-[#90a4cb] font-mono font-bold uppercase opacity-50">Sync: 0.04s Ago</span>
                    </div>
                    <h2 className="text-5xl font-black text-white mb-8 tracking-tighter uppercase">Initiate Long Position</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                      {[
                        { label: 'Conviction', val: '88.4%', color: 'text-white' },
                        { label: 'Asset Load', val: '15.0%', color: 'text-white' },
                        { label: 'Safety Cut', val: '452.50', color: 'text-[#fa6238]' },
                        { label: 'Target Exit', val: '478.00', color: 'text-[#0bda5e]' }
                      ].map(stat => (
                        <div key={stat.label} className="flex flex-col gap-1.5 border-l border-white/5 pl-4">
                          <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-[0.2em] opacity-60">{stat.label}</span>
                          <span className={`text-2xl font-black font-mono tracking-tighter ${stat.color}`}>{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-4 w-full md:w-64">
                    <button className="bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-black text-[11px] uppercase tracking-[0.3em] h-16 rounded-2xl shadow-xl shadow-[#0d59f2]/30 flex items-center justify-center gap-3 transition-all active:scale-95 group/btn">
                      Confirm Trade <span className="material-symbols-outlined group-hover/btn:rotate-12 transition-transform">check_circle</span>
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.3em] h-16 rounded-2xl border border-white/10 transition-all">
                      Analysis Drift
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Factor Cloud */}
            <div className="col-span-12 lg:col-span-4">
              <div className="h-full glass-panel rounded-3xl p-8 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#90a4cb]">Neural Attribution</h3>
                  <span className="material-symbols-outlined text-[#0d59f2] animate-spin-slow">hub</span>
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  {[
                    { label: 'Meteorological Flux', val: '+42%', color: '#0bda5e', width: '75%' },
                    { label: 'Macro Currency DXY', val: '-12%', color: '#fa6238', width: '30%' },
                    { label: 'Port Inflow Delta', val: '+28%', color: '#0bda5e', width: '55%' },
                    { label: 'Systemic Skew', val: '0.04σ', color: 'white', width: '10%' }
                  ].map(factor => (
                    <div key={factor.label} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-[#90a4cb] font-black uppercase tracking-widest">{factor.label}</span>
                        <span className="text-xs font-black font-mono" style={{ color: factor.color }}>{factor.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-1000 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: factor.color, width: factor.width }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[10px] text-[#90a4cb] font-bold italic opacity-40 uppercase tracking-widest">Top correlated features in current 4h epoch.</p>
                </div>
              </div>
            </div>

            {/* Predictive Trend Chart */}
            <div className="col-span-12 lg:col-span-7">
              <div className="glass-panel rounded-3xl p-10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Price Convergence Forecast</h3>
                    <p className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest opacity-60">Simulated projection v. Historical average</p>
                  </div>
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                    {['H1', 'H4', 'D1'].map((t, i) => (
                      <button key={t} className={`px-5 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${i === 1 ? 'bg-[#0d59f2] text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="relative h-80 w-full">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <line stroke="rgba(255,255,255,0.05)" strokeDasharray="8 8" x1="0" x2="1000" y1="75" y2="75" />
                    <line stroke="rgba(255,255,255,0.05)" strokeDasharray="8 8" x1="0" x2="1000" y1="150" y2="150" />
                    <line stroke="rgba(255,255,255,0.05)" strokeDasharray="8 8" x1="0" x2="1000" y1="225" y2="225" />
                    {/* Forecast Area */}
                    <path d="M0 250 Q 150 240, 300 200 T 500 180 T 750 100 T 1000 40 V 300 H 0 Z" fill="url(#forecastGrad)" className="opacity-60" />
                    {/* Historical Baseline */}
                    <path d="M 0 260 L 200 240 L 400 250 L 600 220 L 800 230 L 1000 210" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="5 10" />
                    {/* Forecast Line */}
                    <path d="M0 250 Q 150 240, 300 200 T 500 180 T 750 100 T 1000 40" fill="none" stroke="#0d59f2" strokeWidth="4" className="drop-shadow-[0_0_15px_#0d59f2]" />
                    
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0d59f2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#90a4cb] font-black pr-2 py-1 font-mono opacity-60">
                    <span>480.00</span><span>470.00</span><span>460.00</span><span>450.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cumulative Performance */}
            <div className="col-span-12 lg:col-span-5">
              <div className="glass-panel rounded-3xl p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Equity Evolution</h3>
                  <span className="text-[10px] font-black text-[#0bda5e] uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/10 rounded">SR: 2.84</span>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="glass-panel bg-white/5 rounded-2xl p-6 border-white/5">
                    <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-widest opacity-60">Annualized ROR</span>
                    <p className="text-3xl font-black text-white mt-2 font-mono tracking-tighter">+24.52%</p>
                  </div>
                  <div className="glass-panel bg-white/5 rounded-2xl p-6 border-white/5">
                    <span className="text-[9px] text-[#90a4cb] uppercase font-black tracking-widest opacity-60">Max Drawdown</span>
                    <p className="text-3xl font-black text-[#fa6238] mt-2 font-mono tracking-tighter">-4.18%</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 500 200">
                    <path d="M0 180 L 50 170 L 100 175 L 150 140 L 200 150 L 250 100 L 300 110 L 350 60 L 400 70 L 450 30 L 500 20" fill="none" stroke="#0bda5e" strokeWidth="3" />
                    <path d="M0 180 L 50 170 L 100 175 L 150 140 L 200 150 L 250 100 L 300 110 L 350 60 L 400 70 L 450 30 L 500 20 V 200 H 0 Z" fill="url(#perfGrad)" />
                    <defs>
                      <linearGradient id="perfGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0bda5e" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0bda5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Global Market Pulse Ticker */}
        <footer className="h-8 bg-black/60 backdrop-blur-xl border-t border-white/5 flex items-center gap-12 px-8 overflow-hidden whitespace-nowrap shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-[#90a4cb] uppercase tracking-[0.3em]">Global Feed:</span>
            <span className="size-2 rounded-full bg-[#0bda5e] animate-pulse"></span>
          </div>
          <div className="flex gap-10 text-[10px] font-bold items-center font-mono uppercase tracking-tighter">
            <span>Corn (ZC) <span className="text-[#0bda5e] ml-1">462.25 (+1.2%)</span></span>
            <span className="opacity-20">|</span>
            <span>Wheat (ZW) <span className="text-[#fa6238] ml-1">542.75 (-0.8%)</span></span>
            <span className="opacity-20">|</span>
            <span>Soybeans (ZS) <span className="text-[#0bda5e] ml-1">1,184.50 (+0.3%)</span></span>
            <span className="opacity-20">|</span>
            <span>DXY INDEX <span className="text-[#0bda5e] ml-1">104.22 (+0.05%)</span></span>
          </div>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};