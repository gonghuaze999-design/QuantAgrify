import React, { useState } from 'react';

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
              <h2 className="text-white text-xl font-bold">Data Source Configuration</h2>
              <div className="flex gap-2 mt-2">
                {['Soybeans (CBOT)', 'Source: NOAA Satellite', 'Region: Brazil/Midwest'].map(tag => (
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
            {/* Filter Section */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#182234]/30 p-4 rounded-xl border border-[#314368]">
              {['Time Range', 'Indicator set', 'Commodity Type'].map((label) => (
                <label key={label} className="flex flex-col">
                  <span className="text-[#90a4cb] text-xs font-bold uppercase mb-2 tracking-wide">{label}</span>
                  <select className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-11 px-3 focus:ring-1 focus:ring-[#0d59f2] outline-none">
                    <option>Select Option...</option>
                    <option selected>{label === 'Time Range' ? 'Last 12 Months (Rolling)' : (label === 'Indicator set' ? 'Vegetation Health Index (VHI)' : 'Soybeans')}</option>
                  </select>
                </label>
              ))}
              <div className="flex items-end">
                <button className="w-full bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white rounded-lg h-11 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-[#0d59f2]/20">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Update Filters
                </button>
              </div>
            </section>

            {/* Middle Visualization Row */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Normalized Health Index (NHI) vs Futures Price</h3>
                    <p className="text-[#90a4cb] text-xs">Correlating satellite biomass readings with CBOT front-month contracts</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-[#90a4cb]">
                    <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 bg-[#0d59f2] rounded-full"></i> NHI Trend</span>
                    <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 bg-[#90a4cb]/40 rounded-full border border-[#90a4cb]/20"></i> Market Price</span>
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
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5 flex-1">
                  <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wide">Yield Heatmap (Regional)</h3>
                  <div className="grid grid-cols-4 gap-1 h-32">
                    {[0.2, 0.4, 0.6, 0.8, 0.9, 0.3, 0.5, 0.1, 0.7, 0.4, 0.6, 0.2, 0.5, 0.8, 0.3, 0.9].map((v, i) => (
                      <div key={i} className="rounded-sm" style={{ backgroundColor: `rgba(13, 89, 242, ${v})` }}></div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Confidence Score</span>
                    <span className="text-sm font-bold text-white">94.2%</span>
                  </div>
                  <div className="w-full bg-[#314368] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#0d59f2] h-full w-[94.2%]"></div>
                  </div>
                </div>
                <div className="bg-[#0d59f2]/10 border border-[#0d59f2]/30 rounded-xl p-5 group hover:border-[#0d59f2] transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-[#0d59f2] animate-pulse">warning</span>
                    <h3 className="text-white text-sm font-bold">Data Quality Alert</h3>
                  </div>
                  <p className="text-[#90a4cb] text-xs leading-relaxed">Latency detected in Brazilian satellite feed. Current data offset: 14 mins.</p>
                </div>
              </div>
            </div>

            {/* Benchmarking Table */}
            <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#314368] flex justify-between items-center">
                <h3 className="text-white text-lg font-bold">Year-Over-Year Source Benchmarking</h3>
                <button className="text-[#90a4cb] text-xs flex items-center gap-1 hover:text-white transition-colors font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-[#90a4cb] uppercase text-[10px] tracking-[0.2em] bg-[#182234]/40 font-bold">
                      <th className="px-6 py-4">Source Provider</th>
                      <th className="px-6 py-4">Current Value</th>
                      <th className="px-6 py-4">5-Year Avg</th>
                      <th className="px-6 py-4">Δ (Delta)</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#314368]">
                    {[
                      { name: 'NOAA Satellite BI-7', current: '0.842 NHI', avg: '0.790 NHI', delta: '+6.58%', type: 'up' },
                      { name: 'USDA Crop Progress', current: '72% Good/Ex', avg: '68% Good/Ex', delta: '+4.00%', type: 'up' },
                      { name: 'Sentinel-2 Multispectral', current: '1.22 LAI', avg: '1.35 LAI', delta: '-9.63%', type: 'down' }
                    ].map((row) => (
                      <tr key={row.name} className="hover:bg-[#0d59f2]/5 transition-colors cursor-default">
                        <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                        <td className="px-6 py-4 text-[#90a4cb] font-mono">{row.current}</td>
                        <td className="px-6 py-4 text-[#90a4cb] font-mono">{row.avg}</td>
                        <td className={`px-6 py-4 font-bold ${row.type === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>{row.delta}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${row.type === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {row.type === 'up' ? 'Reliable' : 'Incomplete'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#080b14]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex flex-wrap items-center justify-between shadow-2xl z-20 gap-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-1">Integrity Check</p>
                  <p className="text-[10px] text-[#90a4cb]">9 Sources Passed Quality Audit</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-1">Current Model</p>
                  <p className="text-[10px] text-[#90a4cb]">SOY-24-BRAZIL-QUANT</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg bg-[#182234] border border-[#314368] text-white hover:bg-[#314368] transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Verify Data
              </button>
              <button className="px-8 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#0d59f2]/25">
                Include in Analysis
              </button>
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