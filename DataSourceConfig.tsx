
import React, { useState, useEffect } from 'react';

interface DataSourceConfigProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource', active: true },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
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

  // --- New Logic State ---
  const [commodity, setCommodity] = useState('Corn');
  const [exchange, setExchange] = useState('CBOT (USA)');
  const [vectorRegion, setVectorRegion] = useState({ name: 'US Midwest (Corn Belt)', center: 'Iowa', coords: '41.87, -93.62' });

  // Logic: Map Commodity + Exchange -> Major Production Area (70% Price Driver)
  useEffect(() => {
    if (commodity === 'Corn') {
        if (exchange.includes('CBOT')) setVectorRegion({ name: 'US Midwest (Corn Belt)', center: 'Iowa/Illinois', coords: '41.87, -93.62' });
        if (exchange.includes('DCE')) setVectorRegion({ name: 'China Northeast (Golden Corn Belt)', center: 'Heilongjiang/Jilin', coords: '45.75, 126.63' });
        if (exchange.includes('MATIF')) setVectorRegion({ name: 'Black Sea / Ukraine', center: 'Poltava', coords: '49.58, 34.55' });
    } else if (commodity === 'Soybeans') {
        if (exchange.includes('CBOT')) setVectorRegion({ name: 'Brazil (Mato Grosso)', center: 'Sorriso', coords: '-12.55, -55.72' }); // Brazil drives soy price heavily now
        if (exchange.includes('DCE')) setVectorRegion({ name: 'China Northeast (Non-GMO)', center: 'Heilongjiang', coords: '47.35, 130.33' });
    } else if (commodity === 'Wheat') {
        if (exchange.includes('CBOT')) setVectorRegion({ name: 'US Great Plains (HRW)', center: 'Kansas', coords: '38.50, -98.35' });
        if (exchange.includes('MATIF')) setVectorRegion({ name: 'France / Germany', center: 'Beauce', coords: '48.45, 1.55' });
    }
  }, [commodity, exchange]);

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
              <h2 className="text-white text-xl font-bold">Data Source Configuration</h2>
              <div className="flex gap-2 mt-2">
                {['Satellite: Sentinel-2', 'Freq: Daily', 'Res: 10m'].map(tag => (
                  <div key={tag} className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                    <span className="text-[#0d59f2] text-[10px] font-bold">●</span>
                    <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">{tag}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">refresh</span>
              </button>
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">settings</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Filter Section - Visual Only for Context */}
            <section className="bg-[#182234]/20 p-4 rounded-xl border border-[#314368] flex items-center justify-between">
               <div className="flex gap-4">
                  <div className="px-4 py-2 bg-[#0d59f2]/10 border border-[#0d59f2]/30 rounded-lg text-[#0d59f2] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">satellite</span>
                    Remote Sensing Layer
                  </div>
                  <div className="px-4 py-2 bg-[#182234] border border-[#314368] rounded-lg text-[#90a4cb] text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-60">
                    <span className="material-symbols-outlined text-sm">cloud</span>
                    Meteorology Layer
                  </div>
               </div>
               <span className="text-[10px] text-[#90a4cb] uppercase tracking-widest">Active Pipeline Configuration</span>
            </section>

            {/* Middle Visualization Row */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Normalized Health Index (NHI) vs Futures Price</h3>
                    <p className="text-[#90a4cb] text-xs">Correlating satellite biomass readings with selected exchange contracts</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-[#90a4cb]">
                    <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 bg-[#0d59f2] rounded-full"></i> NHI Trend</span>
                    <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 bg-[#90a4cb]/40 rounded-full border border-[#90a4cb]/20"></i> {commodity} Price</span>
                  </div>
                </div>
                <div className="h-64 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                    <line stroke="#314368" strokeDasharray="4" x1="0" x2="800" y1="200" y2="200" />
                    <line stroke="#314368" strokeDasharray="4" x1="0" x2="800" y1="100" y2="100" />
                    <path d="M0 160 C 50 140, 100 180, 150 150 S 250 80, 300 100 S 400 160, 450 140 S 550 40, 600 60 S 750 100, 800 80 V 240 H 0 Z" fill="url(#grad1)" />
                    <path d="M0 160 C 50 140, 100 180, 150 150 S 250 80, 300 100 S 400 160, 450 140 S 550 40, 600 60 S 750 100, 800 80" fill="none" stroke="#0d59f2" strokeWidth="3" />
                    <path d="M0 180 C 80 160, 160 140, 240 150 S 320 180, 400 170 S 480 110, 560 130 S 640 150, 720 160 S 800 140, 800 140" fill="none" stroke="#90a4cb" strokeDasharray="4" strokeWidth="2" opacity="0.4" />
                    <defs>
                      <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#0d59f2', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#0d59f2', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest">
                  <span>Q1 2024</span>
                  <span>Q2 2024</span>
                  <span>Q3 2024</span>
                  <span>Q4 2024</span>
                  <span className="text-[#0d59f2]">Forecast</span>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5 flex-1 flex flex-col">
                  <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wide">Target Vector: {vectorRegion.center}</h3>
                  <div className="flex-1 bg-[#101622] rounded-lg border border-[#314368] relative overflow-hidden flex items-center justify-center">
                     {/* Abstract Vector Map Representation */}
                     <svg viewBox="0 0 100 100" className="w-full h-full p-4 opacity-50">
                        <polygon points="20,80 30,30 70,20 90,60 60,90" fill="#0d59f2" fillOpacity="0.1" stroke="#0d59f2" strokeWidth="1" strokeDasharray="2" />
                        <circle cx="55" cy="55" r="2" fill="#0bda5e" />
                        <text x="58" y="55" fill="#white" fontSize="4" className="uppercase font-mono">Centroid</text>
                     </svg>
                     <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] text-[#90a4cb] font-mono">
                        GEOJSON_ID: 8842_A
                     </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Data Coverage</span>
                    <span className="text-sm font-bold text-white">100%</span>
                  </div>
                  <div className="w-full bg-[#314368] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#0bda5e] h-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer - UPDATED LOGIC */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#080b14]/95 backdrop-blur-xl border-t border-[#314368] p-6 shadow-2xl z-20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-6 w-full lg:w-auto">
                {/* Commodity Selector */}
                <div className="flex flex-col gap-1.5 relative group">
                   <label className="text-[9px] font-black text-[#90a4cb] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">grass</span> Commodity Product
                   </label>
                   <select 
                      value={commodity}
                      onChange={(e) => setCommodity(e.target.value)}
                      className="bg-[#101622] border border-[#314368] text-white text-sm font-bold rounded-lg py-2.5 px-4 pr-10 appearance-none outline-none focus:border-[#0d59f2] min-w-[180px] cursor-pointer"
                   >
                      <option>Corn</option>
                      <option>Soybeans</option>
                      <option>Wheat</option>
                   </select>
                   <span className="material-symbols-outlined absolute right-3 bottom-2.5 text-[#90a4cb] text-sm pointer-events-none group-hover:text-white transition-colors">expand_more</span>
                </div>

                {/* Exchange Selector */}
                <div className="flex flex-col gap-1.5 relative group">
                   <label className="text-[9px] font-black text-[#90a4cb] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">account_balance</span> Futures Exchange
                   </label>
                   <select 
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                      className="bg-[#101622] border border-[#314368] text-white text-sm font-bold rounded-lg py-2.5 px-4 pr-10 appearance-none outline-none focus:border-[#0d59f2] min-w-[200px] cursor-pointer"
                   >
                      <option>CBOT (USA)</option>
                      <option>DCE (China)</option>
                      <option>MATIF (Europe)</option>
                   </select>
                   <span className="material-symbols-outlined absolute right-3 bottom-2.5 text-[#90a4cb] text-sm pointer-events-none group-hover:text-white transition-colors">expand_more</span>
                </div>
              </div>

              {/* Dynamic Region Display */}
              <div className="flex-1 flex items-center justify-center lg:justify-end gap-6">
                 <div className="h-10 w-px bg-[#314368] hidden lg:block"></div>
                 
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-[#90a4cb] uppercase tracking-[0.2em] mb-1">Target Major Production Area (70% Driver)</span>
                    <div className="flex items-center gap-3 bg-[#0d59f2]/10 border border-[#0d59f2]/30 px-4 py-2 rounded-lg">
                       <span className="material-symbols-outlined text-[#0d59f2] animate-pulse">polyline</span>
                       <div>
                          <p className="text-sm font-bold text-white leading-none">{vectorRegion.name}</p>
                          <p className="text-[9px] text-[#90a4cb] font-mono mt-0.5">Centroid: {vectorRegion.coords}</p>
                       </div>
                    </div>
                 </div>

                 <button className="h-11 px-6 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-[#0d59f2]/25 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">layers</span>
                    Load Vector Boundary
                 </button>
              </div>

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
