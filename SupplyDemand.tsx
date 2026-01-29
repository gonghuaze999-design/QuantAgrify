import React from 'react';

interface SupplyDemandProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const SupplyDemand: React.FC<SupplyDemandProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand', active: true },
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
              <h2 className="text-white text-xl font-bold">Supply & Demand Analysis</h2>
              <div className="flex gap-2 mt-2">
                {['Import/Export Flow', 'WASDE Report Integration', 'Global Reserves'].map(tag => (
                  <div key={tag} className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                    <span className="text-[#0d59f2] text-[10px] font-bold">●</span>
                    <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">{tag}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-[#182234] hover:bg-[#314368] px-4 py-2 border border-[#314368] transition-all text-sm font-bold">
                <span className="material-symbols-outlined text-lg">description</span> View WASDE
              </button>
              <button className="flex items-center justify-center rounded-lg bg-[#0d59f2] hover:bg-[#0d59f2]/90 p-2 border border-[#0d59f2] transition-all">
                <span className="material-symbols-outlined text-white text-lg">download</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Global Inventory Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Global Stocks', val: '298.4M', unit: 'MT', trend: '-2.1%', color: 'text-rose-400' },
                { label: 'Export Volume', val: '184.2M', unit: 'MT', trend: '+4.5%', color: 'text-emerald-400' },
                { label: 'Import Demand', val: '192.1M', unit: 'MT', trend: '+1.2%', color: 'text-emerald-400' },
                { label: 'Stocks-to-Use', val: '26.8%', unit: 'Ratio', trend: 'STABLE', color: 'text-[#0d59f2]' }
              ].map(stat => (
                <div key={stat.label} className="bg-[#182234]/30 border border-[#314368] p-5 rounded-xl">
                  <p className="text-[#90a4cb] text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold">{stat.val}</h3>
                    <span className="text-[10px] text-[#90a4cb] mb-1 font-medium">{stat.unit}</span>
                  </div>
                  <p className={`text-[10px] font-bold mt-2 ${stat.color}`}>{stat.trend}</p>
                </div>
              ))}
            </div>

            {/* Middle Section: Supply vs Demand Chart */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-white text-lg font-bold">Historical Supply vs Demand Curve</h3>
                    <p className="text-[#90a4cb] text-xs">5-year rolling baseline vs current season projections</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase">
                    <span className="flex items-center gap-1.5"><i className="w-3 h-3 bg-[#0d59f2] rounded-full"></i> Supply</span>
                    <span className="flex items-center gap-1.5"><i className="w-3 h-3 bg-amber-400 rounded-full"></i> Demand</span>
                  </div>
                </div>
                <div className="h-72 w-full relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
                    <line x1="0" x2="1000" y1="60" y2="60" stroke="#314368" strokeDasharray="4" />
                    <line x1="0" x2="1000" y1="120" y2="120" stroke="#314368" strokeDasharray="4" />
                    <line x1="0" x2="1000" y1="180" y2="180" stroke="#314368" strokeDasharray="4" />
                    {/* Supply Path */}
                    <path d="M0,180 C150,160 300,200 450,120 S750,80 1000,100" fill="none" stroke="#0d59f2" strokeWidth="3" />
                    {/* Demand Path */}
                    <path d="M0,200 C150,190 300,180 450,150 S750,130 1000,120" fill="none" stroke="#f59e0b" strokeWidth="3" />
                  </svg>
                  <div className="flex justify-between mt-4 text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest">
                    <span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024 (E)</span>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-6">Major Exporter Share</h3>
                <div className="space-y-6">
                  {[
                    { country: 'United States', share: '32%', color: 'bg-[#0d59f2]' },
                    { country: 'Brazil', share: '28%', color: 'bg-emerald-500' },
                    { country: 'Argentina', share: '15%', color: 'bg-blue-400' },
                    { country: 'Others', share: '25%', color: 'bg-[#314368]' }
                  ].map(row => (
                    <div key={row.country}>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span>{row.country}</span>
                        <span className="text-[#90a4cb]">{row.share}</span>
                      </div>
                      <div className="w-full bg-[#101622] h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color}`} style={{ width: row.share }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[#314368]">
                  <p className="text-[11px] text-[#90a4cb] leading-relaxed italic">
                    Note: Brazilian export window is currently narrowing due to port congestion in Santos.
                  </p>
                </div>
              </div>
            </div>

            {/* Regional Stockpiles Table */}
            <div className="bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#314368] flex justify-between items-center">
                <h3 className="text-white text-lg font-bold">Regional Port Inventory & Stocks</h3>
                <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Updated 4h ago</span>
              </div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-[#182234]/40">
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4">Current Inventory</th>
                    <th className="px-6 py-4">Outflow (24h)</th>
                    <th className="px-6 py-4">Waiting Vessels</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#314368]">
                  {[
                    { region: 'Santos, Brazil', inv: '4.2M MT', flow: '120K MT', vessels: '14', status: 'CONGESTED', color: 'text-rose-400' },
                    { region: 'Gulf Coast, USA', inv: '8.5M MT', flow: '250K MT', vessels: '8', status: 'FLUID', color: 'text-emerald-400' },
                    { region: 'Rosario, Argentina', inv: '2.1M MT', flow: '85K MT', vessels: '5', status: 'NOMINAL', color: 'text-[#0d59f2]' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors cursor-default">
                      <td className="px-6 py-4 font-bold">{row.region}</td>
                      <td className="px-6 py-4 font-mono text-[#90a4cb]">{row.inv}</td>
                      <td className="px-6 py-4 font-mono text-[#90a4cb]">{row.flow}</td>
                      <td className="px-6 py-4 font-mono text-[#90a4cb]">{row.vessels}</td>
                      <td className={`px-6 py-4 font-bold text-[10px] ${row.color}`}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Audit Complete</p>
                  <p className="text-[10px] text-[#90a4cb]">Supply Nodes Synced: 98.4%</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">public</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Global Scope</p>
                  <p className="text-[10px] text-[#90a4cb]">42 Major Port Feeds Active</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white transition-all text-sm font-bold uppercase tracking-widest">Trade Logs</button>
              <button className="px-8 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-sm font-bold shadow-lg shadow-[#0d59f2]/25">Include in Analysis</button>
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