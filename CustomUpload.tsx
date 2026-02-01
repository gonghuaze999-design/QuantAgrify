
import React from 'react';

interface CustomUploadProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const CustomUpload: React.FC<CustomUploadProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload', active: true }
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
              <h2 className="text-white text-xl font-bold">Custom Data Ingestion</h2>
              <p className="text-[#90a4cb] text-xs mt-1">Import proprietary datasets for factor correlation and strategy backtesting</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-[#182234] hover:bg-[#314368] px-4 py-2 border border-[#314368] transition-all text-sm font-bold">
                <span className="material-symbols-outlined text-lg">history</span> Ingest Logs
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            <div className="grid grid-cols-12 gap-6">
              {/* Upload Zone */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-[#182234]/20 border-2 border-dashed border-[#314368] rounded-2xl p-12 flex flex-col items-center justify-center group hover:border-[#0d59f2] transition-all cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-[#0d59f2]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[#0d59f2] text-4xl">cloud_upload</span>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Drag and drop your dataset</h3>
                  <p className="text-[#90a4cb] text-sm text-center max-w-sm mb-8 leading-relaxed">
                    Support for <span className="text-white font-mono">.CSV</span>, <span className="text-white font-mono">.JSON</span>, <span className="text-white font-mono">.XLSX</span>, and <span className="text-white font-mono">.GEOJSON</span>. Max file size: 256MB.
                  </p>
                  <button className="px-8 py-3 bg-[#0d59f2] text-white rounded-xl font-bold text-sm hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/20">
                    Browse Files
                  </button>
                </div>

                {/* Preview Section */}
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#314368] bg-[#182234]/30 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#90a4cb] uppercase tracking-widest">Parsing Preview: sample_yield_2024.csv</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase tracking-tight">Format Validated</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-black/20 font-bold">
                          <th className="px-4 py-3 border-r border-[#314368]">Timestamp</th>
                          <th className="px-4 py-3 border-r border-[#314368]">Region_ID</th>
                          <th className="px-4 py-3 border-r border-[#314368]">Moisture_Prop</th>
                          <th className="px-4 py-3 border-r border-[#314368]">Yield_Est</th>
                          <th className="px-4 py-3">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#314368]">
                        {[
                          ['2024-03-01 08:00', 'BR-MT-041', '0.842', '2,840 kg', '0.94'],
                          ['2024-03-01 12:00', 'BR-MT-042', '0.791', '2,710 kg', '0.92'],
                          ['2024-03-01 16:00', 'BR-MT-043', '0.815', '2,680 kg', '0.89']
                        ].map((row, i) => (
                          <tr key={i} className="text-[#90a4cb] font-mono text-[11px] hover:bg-[#0d59f2]/5 transition-colors">
                            {row.map((cell, j) => (
                              <td key={j} className={`px-4 py-2 ${j < 4 ? 'border-r border-[#314368]' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mapping Controls */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-6">Field Mapping Configuration</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Date/Time Column', col: 'Timestamp', icon: 'calendar_month' },
                      { label: 'Primary Factor', col: 'Yield_Est', icon: 'bar_chart' },
                      { label: 'Secondary Factor', col: 'Moisture_Prop', icon: 'water_drop' },
                      { label: 'Region Mapping', col: 'Region_ID', icon: 'map' }
                    ].map(field => (
                      <div key={field.label} className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">{field.icon}</span>
                          {field.label}
                        </label>
                        <select className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2]">
                          <option>{field.col}</option>
                          <option>Other Column...</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-[#314368]">
                    <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <span className="material-symbols-outlined text-blue-400">auto_fix_high</span>
                      <p className="text-[11px] text-[#90a4cb] leading-relaxed">
                        AI has automatically detected <span className="text-white font-bold">Time-Series Regression</span> schema for this file.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-4">Ingestion Target</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-[#101622] border border-[#314368] rounded-lg cursor-pointer hover:border-[#0d59f2] transition-colors group">
                      <input type="radio" name="target" defaultChecked className="text-[#0d59f2] focus:ring-[#0d59f2] bg-transparent border-[#314368]" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Factor Sandbox</span>
                        <span className="text-[10px] text-[#90a4cb]">For testing and correlation analysis</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-[#101622] border border-[#314368] rounded-lg cursor-pointer hover:border-[#0d59f2] transition-colors group">
                      <input type="radio" name="target" className="text-[#0d59f2] focus:ring-[#0d59f2] bg-transparent border-[#314368]" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Production Feed</span>
                        <span className="text-[10px] text-[#90a4cb]">Update active models (Requires Admin Audit)</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#90a4cb]">shield</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider leading-none mb-1">Encrypted Transfer</p>
                  <p className="text-[10px] text-[#90a4cb]">TLS 1.3 | AES-256 Data at Rest</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider leading-none mb-1">Queue Readiness</p>
                  <p className="text-[10px] text-emerald-500">Ready for Bulk Ingestion</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold uppercase tracking-widest">Discard</button>
              <button className="px-10 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-sm font-bold shadow-lg shadow-[#0d59f2]/25 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">publish</span> Initiate Ingestion
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
