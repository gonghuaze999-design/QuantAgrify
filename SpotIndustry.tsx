
import React from 'react';

interface SpotIndustryProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const SpotIndustry: React.FC<SpotIndustryProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry', active: true },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: true },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30">
      {/* Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col text-left leading-none">
            <h1 className="text-xl font-bold tracking-tight text-white">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#90a4cb] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-10 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => item.view !== 'dataSource' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <button className="text-[#90a4cb] hover:text-[#0d59f2]"><span className="material-symbols-outlined">notifications</span></button>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-72 bg-[#101622] border-r border-[#314368] flex flex-col shrink-0">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-[#90a4cb]/50 uppercase tracking-widest mb-4">Data Categories</p>
            {categories.map((cat) => (
              <div 
                key={cat.name}
                onClick={() => cat.id && onNavigate(cat.id as any)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 transition-all group cursor-pointer ${
                  cat.active 
                  ? 'bg-[#0d59f2]/10 border-[#0d59f2] text-white' 
                  : 'border-transparent text-[#90a4cb] hover:bg-[#182234] hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined ${cat.active ? 'text-[#0d59f2]' : 'group-hover:text-[#0d59f2]'}`}>{cat.icon}</span>
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-[#314368]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#182234]/50 border border-[#314368]/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0d59f2] to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">JD</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">Analyst 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Quant Ops Team</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold">Spot & Industry Analytics</h2>
              <div className="flex gap-2 mt-2">
                <div className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                  <span className="text-[#0d59f2] text-[10px] font-bold">●</span>
                  <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">Asset: Corn (DCE)</p>
                </div>
                <div className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                  <span className="text-[#0d59f2] text-[10px] font-bold">●</span>
                  <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">Regional Hub: Shandong/Henan</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">sync</span>
              </button>
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">tune</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Basis Analysis: Futures vs. Local Spot Spread</h3>
                    <p className="text-[#90a4cb] text-xs">Tracking convergence and arbitrage opportunities across domestic trading hubs</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><i className="w-3 h-3 bg-[#0d59f2] rounded-full"></i> DCE Futures</span>
                    <span className="flex items-center gap-1"><i className="w-3 h-3 bg-amber-400 rounded-full"></i> Avg. Spot Price</span>
                    <span className="flex items-center gap-1 font-bold text-white"><i className="w-3 h-3 border border-[#90a4cb] rounded-sm"></i> Basis (Spread)</span>
                  </div>
                </div>
                <div className="h-64 w-full relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
                    <defs>
                      <linearGradient id="basisGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#0d59f2', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#0d59f2', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <line x1="0" x2="1000" y1="40" y2="40" stroke="#314368" strokeDasharray="4" opacity="0.3" />
                    <line x1="0" x2="1000" y1="120" y2="120" stroke="#314368" strokeDasharray="4" opacity="0.3" />
                    <line x1="0" x2="1000" y1="200" y2="200" stroke="#314368" strokeDasharray="4" opacity="0.3" />
                    <path d="M0 120 L 100 110 L 200 130 L 300 115 L 400 90 L 500 100 L 600 70 L 700 85 L 800 60 L 900 75 L 1000 50" fill="none" stroke="#0d59f2" strokeWidth="3" />
                    <path d="M0 140 L 100 135 L 200 150 L 300 140 L 400 120 L 500 125 L 600 100 L 700 110 L 800 90 L 900 100 L 1000 80" fill="none" stroke="#fbbf24" strokeDasharray="4" strokeWidth="2" />
                    <path d="M0 120 L 100 110 L 200 130 L 300 115 L 400 90 L 500 100 L 600 70 L 700 85 L 800 60 L 900 75 L 1000 50 L 1000 80 L 900 100 L 800 90 L 700 110 L 600 100 L 500 125 L 400 120 L 300 140 L 200 150 L 100 135 L 0 140 Z" fill="url(#basisGrad)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <span className="text-[10px] text-[#90a4cb] -mt-40">-200</span>
                    <span className="text-[10px] text-[#90a4cb] -mt-10">0</span>
                    <span className="text-[10px] text-[#90a4cb] mt-20">+200</span>
                  </div>
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-[#90a4cb] font-bold uppercase tracking-wider">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5">
                  <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-sm">inventory</span> Warehouse Stock Levels
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Dalian Port Hub', cap: '82%', color: 'bg-[#0d59f2]' },
                      { label: 'Zhengzhou Storage B', cap: '96%', color: 'bg-rose-500', alert: 'CRITICAL' },
                      { label: 'Shanghai Logistics Center', cap: '45%', color: 'bg-emerald-500', alert: 'Optimal' }
                    ].map(row => (
                      <div key={row.label}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-[#90a4cb]">{row.label}</span>
                          <span className={`font-bold ${row.alert === 'CRITICAL' ? 'text-rose-400' : (row.alert === 'Optimal' ? 'text-emerald-400' : 'text-white')}`}>
                            {row.cap} Capacity {row.alert && <span className="ml-1 uppercase text-[10px]">{row.alert}</span>}
                          </span>
                        </div>
                        <div className="w-full bg-[#314368] h-2 rounded-full overflow-hidden">
                          <div className={`${row.color} h-full`} style={{ width: row.cap }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5">
                  <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-sm">local_shipping</span> Logistics Bottlenecks
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-500">warning</span>
                      <div>
                        <p className="text-[11px] font-bold text-white">Northern Rail Delay</p>
                        <p className="text-[10px] text-[#90a4cb]">48h maintenance impact on grain traffic</p>
                      </div>
                    </div>
                    <div className="p-3 bg-[#182234] border border-[#314368] rounded-lg flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                      <div>
                        <p className="text-[11px] font-bold text-white">Yangtze Port Clearance</p>
                        <p className="text-[10px] text-[#90a4cb]">Flow normalized; wait time &lt; 12h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-bold">Regional Spot Price Heatmap</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-[#182234] border border-[#314368] text-[10px] text-[#90a4cb]">Yuan/MT</span>
                  </div>
                </div>
                <div className="w-full h-80 rounded-lg bg-[#101622] border border-[#314368] relative overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
                    <path d="M50 150 Q 100 50, 200 100 T 350 150 T 200 250 T 50 150" fill="none" stroke="#314368" strokeWidth="1" />
                    <path d="M80 120 Q 130 80, 180 120 T 280 100" fill="none" stroke="#314368" strokeWidth="0.5" />
                  </svg>
                  <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-rose-500/30 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-[#0d59f2]/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  
                  <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                    <div className="w-2 h-2 bg-rose-500 rounded-full ring-4 ring-rose-500/20"></div>
                    <span className="text-[10px] text-white font-bold bg-[#101622]/80 px-1 mt-1 rounded">Hebei: 2,840</span>
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 flex flex-col items-center">
                    <div className="w-2 h-2 bg-[#0d59f2] rounded-full ring-4 ring-[#0d59f2]/20"></div>
                    <span className="text-[10px] text-white font-bold bg-[#101622]/80 px-1 mt-1 rounded">Anhui: 2,710</span>
                  </div>
                  <div className="absolute top-1/2 right-1/4 flex flex-col items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></div>
                    <span className="text-[10px] text-white font-bold bg-[#101622]/80 px-1 mt-1 rounded">Jiangsu: 2,680</span>
                  </div>

                  <div className="absolute bottom-4 right-4 p-3 bg-[#182234]/80 backdrop-blur rounded-lg border border-[#314368] text-[10px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
                      <span className="text-[#90a4cb]">High Prem (&gt;+5%)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-[#0d59f2] rounded-sm"></div>
                      <span className="text-[#90a4cb]">Neutral (±1%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                      <span className="text-[#90a4cb]">Low Disc (&lt;-3%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Spot-Price Integrity</p>
                  <p className="text-[10px] text-[#90a4cb]">Live Feed: 14 regional markets synced</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">hub</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Active Region</p>
                  <p className="text-[10px] text-[#90a4cb]">North-East China Grain Belt</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold uppercase tracking-widest">Export Report</button>
              <button className="px-6 py-2.5 rounded-lg bg-[#182234] border border-[#314368] text-white hover:bg-[#314368] transition-all text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">analytics</span> Run Basis Model
              </button>
              <button className="px-8 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-sm font-bold shadow-lg shadow-[#0d59f2]/25">Update Global Matrix</button>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};
