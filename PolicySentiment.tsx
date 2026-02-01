
import React from 'react';

interface PolicySentimentProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const PolicySentiment: React.FC<PolicySentimentProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment', active: true },
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
              <h2 className="text-white text-xl font-bold">Data Source: Policy & Sentiment</h2>
              <div className="flex gap-2 mt-2">
                {[
                  { label: 'News API', color: 'text-[#0d59f2]' },
                  { label: 'Global Policy Database', color: 'text-emerald-500' },
                  { label: 'Social Sentiment (Real-time)', color: 'text-rose-500' }
                ].map(tag => (
                  <div key={tag.label} className="flex h-6 items-center gap-x-2 rounded bg-[#182234] border border-[#314368] px-3">
                    <span className={`${tag.color} text-[10px] font-bold`}>●</span>
                    <p className="text-[#90a4cb] text-[11px] font-medium leading-normal">{tag.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">refresh</span>
              </button>
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">tune</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Timeline Section */}
            <section className="bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-white text-lg font-bold">Global Policy & Event Timeline</h3>
                  <p className="text-[#90a4cb] text-xs">Event impact scores correlated with market sentiment fluctuations</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-[#90a4cb] uppercase font-bold tracking-wider">Positive Impact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-xs text-[#90a4cb] uppercase font-bold tracking-wider">Negative Impact</span>
                  </div>
                </div>
              </div>
              
              <div className="relative h-48 flex items-end justify-between px-4 pb-12 mt-12">
                <div className="absolute bottom-12 left-0 right-0 h-px bg-[#314368]"></div>
                {[
                  { label: 'USDA WASDE Report', date: 'Oct 12', impact: '+8.2', color: 'emerald' },
                  { label: 'Export Tariff Increase (AR)', date: 'Oct 28', impact: '-12.5', color: 'rose' },
                  { label: 'Port Logistics Subsidy', date: 'Nov 05', impact: '+4.1', color: 'emerald' },
                  { label: 'Trade Route Closure', date: 'Nov 18', impact: '-9.8', color: 'rose' },
                  { label: 'Biofuel Mandate Expansion', date: 'Dec 01', impact: '+14.2', color: 'emerald' }
                ].map((event, i) => (
                  <div key={i} className="relative flex flex-col items-center group cursor-pointer">
                    <div className={`absolute bottom-8 mb-4 w-px h-${event.color === 'emerald' ? '16' : '24'} bg-${event.color}-500/50 group-hover:bg-${event.color}-500 transition-all`}></div>
                    <div className={`mb-20 bg-${event.color}-500/20 text-${event.color}-500 text-[10px] font-bold px-2 py-1 rounded border border-${event.color}-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all`}>
                      {event.impact} Impact
                    </div>
                    <div className={`w-3 h-3 bg-${event.color}-500 rounded-full ring-4 ring-${event.color}-500/10 z-10`}></div>
                    <div className="absolute top-6 flex flex-col items-center w-32">
                      <span className="text-white text-[11px] font-bold text-center leading-tight">{event.label}</span>
                      <span className="text-[#90a4cb] text-[9px] font-bold uppercase mt-1">{event.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-12 gap-6">
              {/* Trending Topics (Word Cloud Simulation) */}
              <div className="col-span-12 lg:col-span-7 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white text-lg font-bold">Trending Agricultural Topics</h3>
                    <p className="text-[#90a4cb] text-xs">Based on 12k+ daily news articles and social feeds</p>
                  </div>
                  <span className="material-symbols-outlined text-[#90a4cb]">cloud_queue</span>
                </div>
                <div className="relative h-64 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 p-4 border border-[#314368]/30 rounded-lg bg-[#101622]/30">
                  <span className="text-4xl font-bold text-[#0d59f2] hover:text-white cursor-pointer transition-all">Soybean Yield</span>
                  <span className="text-2xl font-semibold text-[#90a4cb] hover:text-emerald-400 cursor-pointer">Export Ban</span>
                  <span className="text-3xl font-bold text-white hover:text-[#0d59f2] cursor-pointer">La Niña</span>
                  <span className="text-xl font-medium text-[#90a4cb]/70 hover:text-white cursor-pointer">Fertilizer Cost</span>
                  <span className="text-4xl font-black text-emerald-500 hover:text-white cursor-pointer">CBOT Bullish</span>
                  <span className="text-lg font-bold text-rose-400 hover:text-white cursor-pointer">Drought Stress</span>
                  <span className="text-3xl font-bold text-[#90a4cb] hover:text-[#0d59f2] cursor-pointer">Trade War</span>
                  <span className="text-xl font-medium text-[#0d59f2]/80 hover:text-white cursor-pointer">Palm Oil</span>
                  <span className="text-2xl font-semibold text-white/80 hover:text-emerald-400 cursor-pointer">Ethanol Policy</span>
                </div>
              </div>

              {/* Regional Sentiment Table */}
              <div className="col-span-12 lg:col-span-5 bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-[#314368]">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wide">Regional Sentiment Polarity</h3>
                </div>
                <div className="flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-[#182234]/40 border-b border-[#314368]">
                        <th className="px-6 py-3 font-bold">Region</th>
                        <th className="px-6 py-3 font-bold">Sentiment Score</th>
                        <th className="px-6 py-3 font-bold">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#314368]">
                      {[
                        { name: 'North America', score: '68%', pos: 68, neg: 32, label: 'Bullish', color: 'emerald', trend: '+12%' },
                        { name: 'South America', score: '41%', pos: 41, neg: 59, label: 'Bearish', color: 'rose', trend: '-08%' },
                        { name: 'Asia Pacific', score: '52%', pos: 52, neg: 48, label: 'Neutral', color: 'silver', trend: '02%' },
                        { name: 'European Union', score: '74%', pos: 74, neg: 26, label: 'Bullish', color: 'emerald', trend: '+15%' }
                      ].map((row) => (
                        <tr key={row.name} className="hover:bg-[#0d59f2]/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#314368] rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${row.pos}%` }}></div>
                                <div className="bg-rose-500 h-full" style={{ width: `${row.neg}%` }}></div>
                              </div>
                              <span className={`text-[11px] font-bold text-${row.color === 'silver' ? '[#90a4cb]' : row.color + '-400'}`}>{row.label}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 font-bold text-${row.color === 'silver' ? '[#90a4cb]' : row.color + '-400'}`}>
                            <span className="material-symbols-outlined text-sm align-middle mr-1">
                              {row.trend.startsWith('+') ? 'trending_up' : row.trend.startsWith('-') ? 'trending_down' : 'horizontal_rule'}
                            </span>
                            {row.trend}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Sentiment Integrity</p>
                  <p className="text-[10px] text-[#90a4cb]">NLP confidence score: 88.4%</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">psychology</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Processing Engine</p>
                  <p className="text-[10px] text-[#90a4cb]">BERT-V3-AGRI-FINANCE</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white transition-all text-sm font-bold">Export Full Report</button>
              <button className="px-6 py-2.5 rounded-lg bg-[#182234] border border-[#314368] text-white hover:bg-[#314368] transition-all text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">fact_check</span> Verify Data Quality
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
      `}</style>
    </div>
  );
};
