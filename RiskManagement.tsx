
import React from 'react';
import { SystemClock } from './SystemClock';
import { getTrendColor } from './GlobalState';

interface RiskManagementProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const RiskManagement: React.FC<RiskManagementProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
    { label: 'Risk Mgmt', icon: 'shield', view: 'riskManagement' as const, active: true },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  // VaR Gauges use CSS variables now. 
  // Note: VaR is "Risk", usually negative/bad is RED. But in "Trend Color" logic, 
  // if risk increases (bad), it aligns with "Down/Bad" -> Red in US, Green in CN? 
  // Actually, Risk is always Bad. Let's keep VaR colors consistent with "Bad = Trend Down Color" 
  // so the user knows what "Red" means in their context.
  const varGauges = [
    { label: 'Daily VaR', val: '2.4%', color: 'var(--trend-up)', offset: 180 }, // Low risk = Good = Up Color
    { label: 'Weekly VaR', val: '8.1%', color: '#ffb347', offset: 100 }, // Medium = Yellow
    { label: 'Monthly VaR', val: '14.2%', color: 'var(--trend-down)', offset: 40 } // High Risk = Bad = Down Color
  ];

  return (
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Global Header */}
      <header className="flex items-center justify-between border-b border-[#222f49] bg-[#0a0c10] px-6 h-16 shrink-0 z-50">
        <div className="flex items-center gap-3 w-1/4 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-white text-xl font-bold tracking-tight">QuantAgrify</h1>
            <span className="text-[9px] text-[#90a4cb] font-bold tracking-[0.2em] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>

        <nav className="flex-1 flex justify-center items-center gap-10 h-full">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.view !== 'cockpit' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all relative border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-20 border-r border-[#222f49] bg-[#0a0c10] flex flex-col items-center py-6 gap-8 shrink-0">
          {sideNavItems.map(item => (
            <div 
              key={item.label} 
              onClick={() => item.view && onNavigate(item.view)}
              className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[var(--trend-down)]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl ${item.active ? 'bg-[var(--trend-down)] text-white shadow-[0_0_15px_rgba(250,98,56,0.3)]' : 'hover:bg-[#182234]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.active ? 'text-[var(--trend-down)]' : ''}`}>{item.label}</span>
            </div>
          ))}
          <div className="mt-auto flex flex-col items-center gap-1 cursor-pointer text-[#fa6238] transition-colors" onClick={() => onNavigate('login')}>
            <div className="p-2.5 rounded-xl hover:bg-red-500/10"><span className="material-symbols-outlined">logout</span></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Logout</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Analysis: Risk Management</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#ffb347] fill-1">warning</span>
                System Exposure Monitoring — 4 Active Warnings
              </p>
            </div>
            <div className="flex gap-2">
              <button className="bg-[#182234] border border-[#222f49] px-4 py-2 rounded text-xs font-bold uppercase hover:bg-[#222f49] transition-colors text-white">Risk Report PDF</button>
              <button className="bg-[var(--trend-down)] px-4 py-2 rounded text-xs font-bold uppercase text-white shadow-lg shadow-[var(--trend-down)]/20 hover:opacity-90 transition-all">Emergency De-risk</button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 auto-rows-max">
            {/* Portfolio VaR Section */}
            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-5 h-full">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] mb-8">Portfolio VaR (99% Confidence)</h3>
                <div className="flex items-center justify-around gap-4 pb-4">
                  {varGauges.map((gauge) => (
                    <div key={gauge.label} className="flex flex-col items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" fill="transparent" stroke="#222f49" strokeWidth="8" />
                          <circle 
                            cx="48" cy="48" r="40" fill="transparent" 
                            stroke={gauge.color} strokeWidth="8" 
                            strokeDasharray="251.2" strokeDashoffset={gauge.offset}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <span className="absolute text-lg font-black text-white">{gauge.val}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">{gauge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Margin Utilization Section */}
            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-5 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb]">Margin Utilization by Exchange</h3>
                  <span className="text-[10px] font-black text-[#ffb347] uppercase tracking-tighter bg-[#ffb347]/10 px-2 py-0.5 rounded border border-[#ffb347]/20 animate-pulse">Warning: CBOT Near Limit</span>
                </div>
                <div className="space-y-6 mt-4">
                  {[
                    { label: 'CBOT (Chicago)', val: '88%', color: 'bg-[var(--trend-down)]' },
                    { label: 'ICE (Atlanta)', val: '42%', color: 'bg-[#0d59f2]' },
                    { label: 'MATIF (Paris)', val: '15%', color: 'bg-[#0d59f2]' }
                  ].map(row => (
                    <div key={row.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-white">{row.label}</span>
                        <span className={row.val === '88%' ? 'text-[var(--trend-down)]' : 'text-white'}>{row.val}</span>
                      </div>
                      <div className="h-2 w-full bg-[#222f49] rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} transition-all duration-1000 ease-out`} style={{ width: row.val }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Correlation Network Map */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 relative overflow-hidden min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                    <span className="material-symbols-outlined text-[#0d59f2]">hub</span>
                    Inter-Commodity Correlation Network
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-[#222f49] rounded text-[#90a4cb] font-black uppercase tracking-widest">Live Linkages</span>
                </div>
                
                <div className="h-[300px] w-full relative">
                  <svg className="w-full h-full opacity-60">
                    <line stroke="var(--trend-down)" strokeDasharray="4" strokeWidth="3" x1="20%" y1="30%" x2="50%" y2="50%" />
                    <line stroke="#0d59f2" strokeWidth="1" x1="80%" y1="30%" x2="50%" y2="50%" />
                    <line stroke="#0d59f2" strokeWidth="2" x1="50%" y1="80%" x2="50%" y2="50%" />
                    <line stroke="var(--trend-up)" strokeWidth="1" x1="20%" y1="30%" x2="80%" y2="30%" />
                  </svg>
                  
                  <div className="absolute top-[30%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="size-12 rounded-full bg-[var(--trend-down)]/20 border-2 border-[var(--trend-down)] flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(250,98,56,0.2)]">CORN</div>
                  </div>
                  <div className="absolute top-[30%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="size-10 rounded-full bg-[#0d59f2]/20 border-2 border-[#0d59f2] flex items-center justify-center text-[9px] font-black">WHEAT</div>
                  </div>
                  <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="size-14 rounded-full bg-[#ffb347]/20 border-2 border-[#ffb347] flex items-center justify-center text-[11px] font-black shadow-lg shadow-[#ffb347]/20">SOY</div>
                  </div>
                  <div className="absolute top-[80%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="size-10 rounded-full bg-[#0d59f2]/20 border-2 border-[#0d59f2] flex items-center justify-center text-[9px] font-black">FERT</div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 text-[9px] font-black uppercase tracking-widest text-[#90a4cb] flex gap-4 bg-[#0a0c10]/40 p-2 rounded">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--trend-down)]"></span> Strong Correlation</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0d59f2]"></span> Neutral</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--trend-up)]"></span> Strong Negative</span>
                </div>
              </div>
            </div>

            {/* Stress Test Scenarios */}
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 h-full flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#90a4cb] mb-6">Stress Test Scenarios</h3>
                <div className="space-y-4 flex-1">
                  {[
                    { label: 'Price Crash (-10%)', val: '-$1.2M', desc: 'Estimated impact of sudden liquidity withdrawal in major ag-exchanges.', color: getTrendColor(-1200000, 'text') },
                    { label: 'Sudden Drought (Brazil)', val: '-$420K', desc: 'Impact on Soybean futures due to supply shock and yield downward revisions.', color: getTrendColor(-420000, 'text') },
                    { label: 'Rate Hike (+50bps)', val: '+$112K', desc: 'USD strength impact on international export contracts hedging.', color: getTrendColor(112000, 'text') }
                  ].map((scenario, i) => (
                    <div key={i} className={`p-3 bg-[#0a0c10]/40 border-l-4 rounded-r-lg group hover:bg-[#0a0c10] transition-colors`} style={{ borderLeftColor: 'var(--trend-down)' }}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">{scenario.label}</span>
                        <span className={`text-xs font-black ${scenario.color}`}>{scenario.val}</span>
                      </div>
                      <p className="text-[10px] text-[#90a4cb] leading-relaxed font-medium">{scenario.desc}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 text-xs font-black uppercase border border-[#222f49] rounded-lg hover:bg-[#222f49] transition-all text-white tracking-widest">
                  Run Monte Carlo Simulation
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Ticker */}
      <footer className="h-8 bg-[#0a0c10] border-t border-[#222f49] flex items-center gap-8 px-6 overflow-hidden whitespace-nowrap shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-[0.2em]">Risk Ticker:</span>
        </div>
        <div className="flex gap-8 text-[11px] font-bold items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-white uppercase">VIX (VOL)</span>
            <span className={getTrendColor(4.2, 'text')}>24.22 (+4.2%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white uppercase">Margin Call Alert</span>
            <span className="text-[var(--trend-down)] font-black">CBOT-22</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white uppercase">Drawdown</span>
            <span className={getTrendColor(-3.8, 'text')}>-3.8% (24h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white uppercase">Liquidity Index</span>
            <span className="text-[var(--trend-up)]">Healthy</span>
          </div>
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
