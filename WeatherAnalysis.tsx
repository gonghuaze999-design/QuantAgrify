import React from 'react';

interface WeatherAnalysisProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const WeatherAnalysis: React.FC<WeatherAnalysisProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis', active: true },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
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
      {/* Navigation Bar (Updated to match Algorithm style) */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#90a4cb] uppercase mt-1">Big Data Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => item.view !== 'dataSource' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-medium transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
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
              <h2 className="text-white text-xl font-bold">Data Source: Weather Analysis</h2>
              <div className="flex gap-2 mt-2">
                {['Live Feed: ECMWF / NOAA', 'Agri-Belts: Midwest, Mato Grosso'].map(tag => (
                  <div key={tag} className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                    <span className="text-[#0d59f2] text-[10px] font-bold">●</span>
                    <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">{tag}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-[#182234] hover:bg-[#314368] px-4 py-2 border border-[#314368] transition-all text-sm font-bold">
                <span className="material-symbols-outlined text-lg">map</span> Layer Config
              </button>
              <button className="flex items-center justify-center rounded-lg bg-[#0d59f2] hover:bg-[#0d59f2]/90 p-2 border border-[#0d59f2] transition-all">
                <span className="material-symbols-outlined text-white text-lg">download</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Filters */}
            <section className="grid grid-cols-4 gap-4 bg-[#182234]/30 p-4 rounded-xl border border-[#314368]">
              {['Precipitation', 'Temperature', 'Soil Moisture'].map((label) => (
                <label key={label} className="flex flex-col">
                  <span className="text-[#90a4cb] text-xs font-bold uppercase mb-2 tracking-wide">{label}</span>
                  <select className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-11 px-3 focus:ring-1 focus:ring-[#0d59f2] outline-none">
                    <option>Select Parameter...</option>
                    <option selected>{label === 'Precipitation' ? 'Cumulative Rainfall (30d)' : label === 'Temperature' ? 'Surface Temperature Range' : 'Root Zone (0-100cm)'}</option>
                  </select>
                </label>
              ))}
              <div className="flex items-end">
                <button className="w-full bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white rounded-lg h-11 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-[#0d59f2]/20">
                  <span className="material-symbols-outlined text-sm">refresh</span> Apply Parameters
                </button>
              </div>
            </section>

            {/* Map Area */}
            <div className="bg-[#182234]/20 border border-[#314368] rounded-xl relative h-[450px] overflow-hidden map-grid">
              <div className="absolute top-4 left-4 z-20 space-y-2">
                <div className="bg-[#101622]/80 backdrop-blur border border-[#314368] p-3 rounded-lg">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Map Overlays</h4>
                  <div className="space-y-2">
                    {['Drought Index (PDSI)', 'Agricultural Belts', 'Cyclone Paths'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input defaultChecked={item !== 'Cyclone Paths'} className="rounded bg-[#101622] border-[#314368] text-[#0d59f2] focus:ring-[#0d59f2] h-3 w-3" type="checkbox" />
                        <span className="text-[11px] text-[#90a4cb] font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 z-20 bg-[#101622]/80 backdrop-blur border border-[#314368] p-3 rounded-lg">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-24 bg-gradient-to-t from-rose-600 via-amber-400 to-emerald-500 rounded"></div>
                  <span className="text-[9px] text-[#90a4cb] font-bold">VH</span>
                  <span className="text-[9px] text-[#90a4cb] font-bold">VL</span>
                </div>
              </div>

              {/* Simplified SVG Map representation */}
              <svg className="absolute inset-0 w-full h-full opacity-40" fill="none" viewBox="0 0 1000 500">
                <path d="M150,100 Q200,80 250,120 T350,110 T450,150 T600,100 T800,130 T950,100 V400 H50 Z" fill="#314368" fillOpacity="0.2" />
                <rect x="200" y="160" width="120" height="60" rx="4" fill="#0d59f2" fillOpacity="0.1" stroke="#0d59f2" strokeDasharray="4" strokeWidth="1" />
                <text x="210" y="175" fill="#0d59f2" fontSize="10" fontWeight="bold">US MIDWEST</text>
                <rect x="320" y="320" width="100" height="80" rx="4" fill="#0d59f2" fillOpacity="0.1" stroke="#0d59f2" strokeDasharray="4" strokeWidth="1" />
                <text x="330" y="335" fill="#0d59f2" fontSize="10" fontWeight="bold">MATO GROSSO</text>
                <circle cx="280" cy="190" r="15" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="370" cy="360" r="25" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="2" />
              </svg>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#101622]/90 px-6 py-2 rounded-full border border-[#314368] flex gap-8 items-center backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#0d59f2]"></span>
                  <span className="text-xs font-bold text-[#90a4cb]">Optimal Hydration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-[#90a4cb]">Severe Drought Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                  <span className="text-xs font-bold text-[#90a4cb]">Critical Crop Stress</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-white text-lg font-bold">Rainfall-Yield Correlation Index</h3>
                    <p className="text-[#90a4cb] text-xs">Cumulative precipitation (mm) mapped against forecasted harvest tonnage (MT/ha)</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Correlation Score</span>
                      <span className="text-xl font-bold text-emerald-400">0.88 R²</span>
                    </div>
                    <div className="h-8 w-px bg-[#314368]"></div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-2"><i className="w-3 h-3 bg-blue-400 rounded-full"></i> Cum. Rainfall</span>
                      <span className="flex items-center gap-2"><i className="w-3 h-3 bg-[#0d59f2] rounded-full"></i> Yield Forecast</span>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
                    <defs>
                      <linearGradient id="rainGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" x2="1000" y1="60" y2="60" stroke="#314368" strokeDasharray="4" />
                    <line x1="0" x2="1000" y1="120" y2="120" stroke="#314368" strokeDasharray="4" />
                    <line x1="0" x2="1000" y1="180" y2="180" stroke="#314368" strokeDasharray="4" />
                    <path d="M0,200 L100,180 L200,190 L300,140 L400,160 L500,100 L600,120 L700,70 L800,80 L900,40 L1000,50 L1000,240 L0,240 Z" fill="url(#rainGrad)" />
                    <path d="M0,200 L100,180 L200,190 L300,140 L400,160 L500,100 L600,120 L700,70 L800,80 L900,40 L1000,50" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    <path d="M0,210 L100,195 L200,205 L300,160 L400,175 L500,120 L600,135 L700,90 L800,105 L900,65 L1000,75" fill="none" stroke="#0d59f2" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                  <div className="flex justify-between mt-4 text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest px-2">
                    {['Pre-Planting', 'Emergence', 'V-Stage', 'Tasseling', 'Grain Fill', 'Maturity', 'Harvest'].map(s => <span key={s}>{s}</span>)}
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
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Integrity Check</p>
                  <p className="text-[10px] text-[#90a4cb]">Weather Nodes Synced: 142/142</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Analysis Scope</p>
                  <p className="text-[10px] text-[#90a4cb]">Multi-layered Weather Overlays Active</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold">Export Raw Data</button>
              <button className="px-6 py-2.5 rounded-lg bg-[#182234] border border-[#314368] text-white hover:bg-[#314368] transition-all text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span> Verify Data Quality
              </button>
              <button className="px-8 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-sm font-bold shadow-lg shadow-[#0d59f2]/25">Include in Analysis</button>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        .map-grid { background-image: radial-gradient(circle, #314368 1px, transparent 1px); background-size: 30px 30px; }
      `}</style>
    </div>
  );
};