import React from 'react';
import { SystemClock } from './SystemClock';

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
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30 uppercase-headings">
      {/* Global Precision Header */}
      <header className="flex items-center justify-between border-b border-[#222f49] bg-[#0a0c10] px-6 h-16 shrink-0 z-50">
        <div className="flex items-center gap-3 w-1/4 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="bg-[#0d59f2] h-10 w-10 flex items-center justify-center rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-xl font-bold tracking-tight text-white leading-[1.1]">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-white uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>

        <nav className="flex-1 flex justify-center items-center gap-10 h-full">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.view !== 'cockpit' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors relative border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-4 w-1/4">
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </header>

      {/* Cockpit Sub-Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#222f49] bg-[#101622] shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0d59f2] text-xl">monitoring</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-wider leading-none mb-1">Active Analysis</span>
              <h2 className="text-sm font-bold text-white uppercase">CORN FUTURES (ZC1!)</h2>
            </div>
          </div>
          <div className="flex items-center gap-6 border-l border-[#222f49] pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-wider leading-none mb-1">Last Price</span>
              <span className="text-sm font-medium text-white">462.25 <span className="text-[#0bda5e] font-bold text-xs">+1.24%</span></span>
            </div>
            <div className="flex flex-col border-l border-[#222f49] pl-6">
              <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-wider leading-none mb-1">Volume (24h)</span>
              <span className="text-sm font-medium text-white">32.4K <span className="text-[#fa6238] font-bold text-xs">-2.1%</span></span>
            </div>
          </div>
          <div className="h-6 w-px bg-[#222f49] mx-2"></div>
          <div className="flex items-center gap-1.5 h-1">
            {[1, 1, 1, 0, 0].map((v, i) => (
              <div key={i} className={`w-10 h-1 rounded-full ${v ? 'bg-[#0d59f2]' : 'bg-[#222f49]'}`}></div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[#182234] border border-[#222f49] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#222f49] transition-colors">
            <span className="material-symbols-outlined text-sm">download</span> Export Data
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#182234] border border-[#222f49] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#222f49] transition-colors">
            <span className="material-symbols-outlined text-sm">share</span> Share Report
          </button>
          <button className="ml-2 flex items-center gap-2 rounded-lg bg-[#0d59f2] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1a66ff] transition-colors shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-sm">rocket_launch</span> Live Trading
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-20 border-r border-[#222f49] bg-[#0a0c10] flex flex-col items-center py-6 gap-8 shrink-0">
          {sideNavItems.map(item => (
            <div 
              key={item.label} 
              onClick={() => item.view && onNavigate(item.view)}
              className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-[#0d59f2] text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]' : 'hover:bg-[#182234]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
          <div className="mt-auto group flex flex-col items-center gap-1 cursor-pointer text-[#fa6238] transition-colors" onClick={() => onNavigate('login')}>
            <div className="p-2.5 rounded-xl hover:bg-red-500/10 transition-all"><span className="material-symbols-outlined">logout</span></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Logout</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6 pb-24">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase italic">Results Cockpit</h1>
            <p className="text-[#90a4cb] text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-[#0bda5e] animate-pulse">circle</span>
              Real-time Quant Analysis Engine — System Running
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6 auto-rows-max">
            {/* Action Card */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-1 overflow-hidden shadow-[0_0_15px_rgba(11,218,94,0.1)] border-l-4 border-l-[#0bda5e]">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0bda5e] px-2 py-0.5 bg-[#0bda5e]/10 rounded border border-[#0bda5e]/20">Signal: Strong Buy</span>
                      <span className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest">Updated: UTC 14:22:10</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-5 uppercase tracking-tight italic">Action: Open Long</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#90a4cb] uppercase tracking-wider font-bold mb-1">Confidence</span>
                        <span className="text-lg font-bold text-white tabular-nums">88.4%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#90a4cb] uppercase tracking-wider font-bold mb-1">Pos Size</span>
                        <span className="text-lg font-bold text-white tabular-nums">15.0%</span>
                      </div>
                      <div className="flex flex-col border-l border-[#222f49] pl-6">
                        <span className="text-[10px] text-[#90a4cb] uppercase tracking-wider font-bold mb-1">Stop Loss</span>
                        <span className="text-lg font-bold text-[#fa6238] tabular-nums">452.50</span>
                      </div>
                      <div className="flex flex-col border-l border-[#222f49] pl-6">
                        <span className="text-[10px] text-[#90a4cb] uppercase tracking-wider font-bold mb-1">Take Profit</span>
                        <span className="text-lg font-bold text-[#0bda5e] tabular-nums">478.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-3">
                    <button className="bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-[#0d59f2]/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-xs tracking-[0.2em]">
                      <span className="material-symbols-outlined text-lg">bolt</span> Execute Order
                    </button>
                    <button className="bg-[#222f49] hover:bg-[#2b3a5a] text-white font-bold py-3.5 px-10 rounded-xl border border-[#314368] transition-all uppercase text-xs tracking-[0.2em]">
                      Wait for Re-test
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Factor Contribution Card */}
            <div className="col-span-12 lg:col-span-4">
              <div className="h-full rounded-xl bg-[#182234] border border-[#222f49] p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb]">Factor Contribution</h3>
                  <span className="material-symbols-outlined text-[#90a4cb] text-sm cursor-grab active:cursor-grabbing">drag_indicator</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Weather Impact', val: '+42%', color: '#0bda5e', width: '75%' },
                    { label: 'Macro (USD)', val: '-12%', color: '#fa6238', width: '30%' },
                    { label: 'Export Demand', val: '+28%', color: '#0bda5e', width: '55%' },
                    { label: 'Supply Chain', val: 'Neutral', color: '#fff', width: '5%' }
                  ].map((factor, idx) => (
                    <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border ${idx === 0 ? 'bg-[#0d59f2]/10 border-[#0d59f2]/30' : 'bg-[#0a0c10]/40 border-[#222f49]'}`}>
                      <span className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-tight">{factor.label}</span>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black tabular-nums" style={{ color: factor.color }}>{factor.val}</span>
                        <div className="h-1 flex-1 bg-[#222f49] mx-2 mb-1.5 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-1000" style={{ width: factor.width, backgroundColor: factor.color }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prediction Chart Area */}
            <div className="col-span-12 lg:col-span-7">
              <div className="rounded-2xl bg-[#182234] border border-[#222f49] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-base font-bold text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <span className="material-symbols-outlined text-[#0d59f2]">show_chart</span>
                    Trend Prediction & Volume
                  </h3>
                  <div className="flex bg-[#0a0c10] rounded-xl p-1 border border-[#222f49]">
                    <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg bg-[#0d59f2] text-white shadow-lg">1H</button>
                    <button className="px-4 py-1.5 text-[10px] font-black uppercase text-[#90a4cb] hover:text-white transition-all">4H</button>
                    <button className="px-4 py-1.5 text-[10px] font-black uppercase text-[#90a4cb] hover:text-white transition-all">1D</button>
                  </div>
                </div>
                <div className="relative h-64 w-full">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 500 200">
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="500" y1="50" y2="50" />
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="500" y1="100" y2="100" />
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="500" y1="150" y2="150" />
                    <path d="M0 160 Q 50 150, 100 130 T 200 140 T 300 80 T 400 60 T 500 40" fill="none" stroke="#0bda5e" strokeWidth="3" />
                    <path d="M500 40 L 520 30 L 540 35" fill="none" stroke="#0bda5e" strokeDasharray="4 4" strokeWidth="2" />
                    <path d="M0 160 Q 50 150, 100 130 T 200 140 T 300 80 T 400 60 T 500 40 V 200 H 0 Z" fill="url(#trendGradient)" />
                    <defs>
                      <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0bda5e" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#0bda5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#90a4cb] font-black pl-4 border-l border-[#222f49] tabular-nums">
                    <span>480.00</span>
                    <span>470.00</span>
                    <span>460.00</span>
                    <span>450.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equity Curve Area */}
            <div className="col-span-12 lg:col-span-5">
              <div className="rounded-2xl bg-[#182234] border border-[#222f49] p-8 h-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <span className="material-symbols-outlined text-[#0d59f2]">timeline</span>
                    Historical Equity Curve
                  </h3>
                  <span className="text-xs font-black text-[#0bda5e] uppercase tracking-widest bg-[#0bda5e]/10 px-2 py-0.5 rounded border border-[#0bda5e]/20">Sharpe: 2.4</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#0a0c10]/60 rounded-xl p-4 border border-[#222f49] shadow-inner">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-black tracking-widest block mb-1">CAGR</span>
                    <p className="text-2xl font-black text-white tabular-nums">24.5%</p>
                  </div>
                  <div className="bg-[#0a0c10]/60 rounded-xl p-4 border border-[#222f49] shadow-inner">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-black tracking-widest block mb-1">Drawdown</span>
                    <p className="text-2xl font-black text-[#fa6238] tabular-nums">-4.2%</p>
                  </div>
                </div>
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 400 150">
                    <path d="M0 140 L 40 130 L 80 135 L 120 110 L 160 120 L 200 90 L 240 100 L 280 60 L 320 70 L 360 40 L 400 30" fill="none" stroke="#0d59f2" strokeWidth="3" />
                    <path d="M0 140 L 40 130 L 80 135 L 120 110 L 160 120 L 200 90 L 240 100 L 280 60 L 320 70 L 360 40 L 400 30 V 150 H 0 Z" fill="url(#equityGradient)" />
                    <defs>
                      <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0d59f2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Quant AI Agent Sidebar */}
        <aside className="w-80 border-l border-[#222f49] bg-[#101622] flex flex-col shrink-0 shadow-2xl relative z-40">
          <div className="p-5 border-b border-[#222f49] flex items-center justify-between bg-[#182234]/50">
            <div className="flex items-center gap-3">
              <div className="size-2.5 bg-[#0bda5e] rounded-full animate-pulse shadow-[0_0_8px_#0bda5e]"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white italic">Quant AI Agent</h3>
            </div>
            <button className="material-symbols-outlined text-[#90a4cb] text-lg hover:text-white transition-colors">close_fullscreen</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
            <div className="flex flex-col gap-2 max-w-[95%]">
              <div className="bg-[#182234] p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-md">
                <p className="text-sm text-white leading-relaxed font-medium">I've analyzed the recent USDA report and El Niño weather patterns. The bullish signal for Corn is supported by a 4% projected yield reduction.</p>
              </div>
              <span className="text-[10px] text-[#90a4cb] font-black uppercase tracking-widest ml-1">AI Assistant • 14:25</span>
            </div>
            <div className="flex flex-col gap-2 max-w-[95%] self-end">
              <div className="bg-[#0d59f2]/10 border border-[#0d59f2]/30 p-4 rounded-2xl rounded-tr-none shadow-md">
                <p className="text-sm text-white leading-relaxed font-medium">Explain the impact of the latest weather data on corn prices.</p>
              </div>
              <span className="text-[10px] text-[#90a4cb] font-black uppercase tracking-widest mr-1 text-right">You • 14:26</span>
            </div>
            <div className="flex items-center gap-3 text-[#90a4cb] italic text-xs font-bold uppercase tracking-tighter mt-2">
              <div className="flex gap-1">
                <span className="size-1.5 bg-[#0d59f2] rounded-full animate-bounce"></span>
                <span className="size-1.5 bg-[#0d59f2] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1.5 bg-[#0d59f2] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              Processing climate datasets...
            </div>
          </div>
          <div className="p-5 border-t border-[#222f49] flex flex-col gap-4 bg-[#0a0c10]/40">
            <div className="flex flex-wrap gap-2">
              <button className="text-[9px] px-3 py-1.5 bg-[#182234] hover:bg-[#222f49] rounded-lg border border-[#222f49] text-[#90a4cb] transition-colors font-black uppercase tracking-[0.2em]">Risk Report</button>
              <button className="text-[9px] px-3 py-1.5 bg-[#182234] hover:bg-[#222f49] rounded-lg border border-[#222f49] text-[#90a4cb] transition-colors font-black uppercase tracking-[0.2em]">Yield Analysis</button>
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-[#182234] border border-[#222f49] rounded-xl text-sm text-white placeholder:text-[#90a4cb]/50 focus:ring-1 focus:ring-[#0d59f2] focus:border-[#0d59f2] outline-none resize-none custom-scrollbar p-4 pr-12 shadow-inner" 
                placeholder="Ask AI anything..." 
                rows={2}
              ></textarea>
              <button className="absolute right-4 bottom-4 p-1.5 bg-[#0d59f2] rounded-lg text-white hover:bg-[#1a66ff] transition-all shadow-lg active:scale-95">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Persistent Ticker Footer */}
      <footer className="h-10 bg-[#0a0c10] border-t border-[#222f49] flex items-center px-6 fixed bottom-0 left-0 right-0 z-[60] overflow-hidden whitespace-nowrap shrink-0">
        <div className="flex items-center gap-4 border-r border-[#222f49] pr-6 mr-6 h-full">
           <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-[0.2em]">Live Pulse</span>
           <div className="size-2 rounded-full bg-[#0bda5e] animate-pulse shadow-[0_0_8px_#0bda5e]"></div>
        </div>
        <div className="flex gap-10 text-[11px] font-bold uppercase tracking-widest items-center">
           <div className="flex items-center gap-2"><span className="text-white">CORN (ZC)</span> <span className="text-[#0bda5e] tabular-nums">462.25 (+1.2%)</span></div>
           <div className="flex items-center gap-2"><span className="text-white">WHEAT (ZW)</span> <span className="text-[#fa6238] tabular-nums">542.75 (-0.8%)</span></div>
           <div className="flex items-center gap-2"><span className="text-white">SOYBEANS (ZS)</span> <span className="text-[#0bda5e] tabular-nums">1,184.50 (+0.3%)</span></div>
           <div className="flex items-center gap-2"><span className="text-white">USD INDEX (DXY)</span> <span className="text-[#0bda5e] tabular-nums">104.22 (+0.05%)</span></div>
           <div className="flex items-center gap-2 opacity-40"><span className="text-white">CRUDE OIL</span> <span className="text-[#0bda5e] tabular-nums">74.22 (+0.4%)</span></div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};