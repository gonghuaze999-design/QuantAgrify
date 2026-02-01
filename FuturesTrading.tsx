
import React from 'react';

interface FuturesTradingProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const FuturesTrading: React.FC<FuturesTradingProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading', active: true },
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
                <p className="text-sm font-bold truncate text-white">Trader 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Commodity Desk</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold">Futures Trading Analysis</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-wider">Market Data Module</span>
                <span className="text-[#90a4cb] text-xs">/</span>
                <span className="text-[#90a4cb] text-xs">Real-time K-Line Visualization</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center bg-[#182234] border border-[#314368] rounded-lg px-3 py-1 gap-2">
                <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-tighter">Sync:</span>
                <span className="text-xs font-mono text-emerald-400">0.04ms</span>
              </div>
              <button className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all">
                <span className="material-symbols-outlined text-white text-lg">fullscreen</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Chart Config */}
            <section className="grid grid-cols-5 gap-4 bg-[#182234]/30 p-4 rounded-xl border border-[#314368] backdrop-blur-sm">
              {['Exchange', 'Symbol / Contract', 'Timeframe', 'Indicators'].map((label) => (
                <label key={label} className="flex flex-col">
                  <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide">{label}</span>
                  <select className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2]">
                    <option>{label === 'Exchange' ? 'CBOT (Chicago)' : label === 'Symbol / Contract' ? "ZS (Soybeans) Nov '24" : label === 'Timeframe' ? '1 Hour' : 'EMA (20, 50, 200)'}</option>
                  </select>
                </label>
              ))}
              <div className="flex items-end">
                <button className="w-full bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white rounded-lg h-10 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-[#0d59f2]/20">
                  <span className="material-symbols-outlined text-sm">query_stats</span> Refresh Chart
                </button>
              </div>
            </section>

            <div className="grid grid-cols-12 gap-6">
              {/* K-Line Chart Area */}
              <div className="col-span-12 lg:col-span-9 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-white text-lg font-bold">ZS NOV24 <span className="text-[#90a4cb] text-sm font-normal ml-2">Soybeans</span></h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-[#90a4cb]">H: <span className="text-white font-mono">1,184.2</span></span>
                        <span className="text-xs text-[#90a4cb]">L: <span className="text-white font-mono">1,162.5</span></span>
                        <span className="text-xs text-[#90a4cb]">C: <span className="text-white font-mono">1,178.6</span></span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      <span className="text-emerald-500 text-sm font-bold font-mono">+12.4 (1.06%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#90a4cb] uppercase"><i className="w-2 h-2 bg-[#0d59f2] rounded-sm"></i> Open Interest</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#90a4cb] uppercase"><i className="w-2 h-2 bg-[#00f2ff] rounded-sm"></i> Volume</span>
                  </div>
                </div>
                
                <div className="h-96 w-full grid-bg border-l border-b border-[#314368]/50 relative overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    {/* Volume profile background */}
                    {[100, 125, 150, 175].map((x, i) => (
                      <rect key={i} x={x} y={400 - [80, 120, 60, 140][i]} width="15" height={[80, 120, 60, 140][i]} fill="rgba(0, 242, 255, 0.05)" />
                    ))}
                    {/* Candles */}
                    <line x1="200" y1="180" x2="200" y2="280" stroke="#ef4444" strokeWidth="1" />
                    <rect x="194" y="200" width="12" height="60" fill="#ef4444" />
                    <line x1="230" y1="160" x2="230" y2="240" stroke="#22c55e" strokeWidth="1" />
                    <rect x="224" y="180" width="12" height="40" fill="#22c55e" />
                    <line x1="260" y1="140" x2="260" y2="220" stroke="#22c55e" strokeWidth="1" />
                    <rect x="254" y="150" width="12" height="50" fill="#22c55e" />
                    <line x1="290" y1="170" x2="290" y2="270" stroke="#ef4444" strokeWidth="1" />
                    <rect x="284" y="190" width="12" height="40" fill="#ef4444" />
                    
                    <path d="M 0 300 Q 150 250 300 200 T 600 150 T 1000 100" fill="none" stroke="#0d59f2" strokeWidth="2" />
                    <path d="M 0 350 L 200 320 L 400 340 L 600 300 L 800 310 L 1000 280" fill="none" stroke="rgba(13, 89, 242, 0.4)" strokeDasharray="4" strokeWidth="1.5" />
                  </svg>
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2 pr-2 border-l border-[#314368]/30 bg-[#101622]/40">
                    {['1,250.0', '1,200.0', '1,178.6', '1,150.0', '1,100.0'].map((price, i) => (
                      <span key={i} className={`text-[10px] font-mono ${price === '1,178.6' ? 'text-white bg-[#0d59f2] px-1' : 'text-[#90a4cb]'}`}>{price}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                {/* Radar Sentiment */}
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5 flex flex-col items-center">
                  <h3 className="text-white text-[11px] font-bold mb-6 uppercase tracking-widest w-full border-b border-[#314368] pb-2">Market Sentiment</h3>
                  <div className="relative w-48 h-48 mb-6">
                    <svg className="w-full h-full" viewBox="0 0 1000 1000">
                      {[150, 300, 450].map(r => <circle key={r} cx="500" cy="500" r={r} fill="none" stroke="#314368" strokeDasharray="10 30" strokeWidth="5" />)}
                      <line x1="500" y1="50" x2="500" y2="950" stroke="#314368" strokeWidth="5" />
                      <line x1="50" y1="500" x2="950" y2="500" stroke="#314368" strokeWidth="5" />
                      <polygon points="500,200 800,500 500,700 300,500" fill="rgba(13, 89, 242, 0.4)" stroke="#0d59f2" strokeWidth="15" />
                    </svg>
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] text-[#90a4cb] uppercase font-bold">Bullish</span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-[#90a4cb] uppercase font-bold">Bearish</span>
                    <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[9px] text-[#90a4cb] uppercase font-bold">Volatility</span>
                    <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[9px] text-[#90a4cb] uppercase font-bold">Liquidity</span>
                  </div>
                  <div className="w-full space-y-4">
                    {[
                      { label: 'Long Ratio', val: '62%', color: 'bg-emerald-500', text: 'text-emerald-400' },
                      { label: 'Short Ratio', val: '38%', color: 'bg-rose-500', text: 'text-rose-400' }
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-[#90a4cb] mb-1">
                          <span>{item.label}</span>
                          <span className={item.text}>{item.val}</span>
                        </div>
                        <div className="w-full h-1 bg-[#314368] rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[#00f2ff]">info</span>
                    <h3 className="text-white text-xs font-bold uppercase tracking-tight">Technical Summary</h3>
                  </div>
                  <p className="text-[#90a4cb] text-xs leading-relaxed">
                    Moving averages show a <span className="text-emerald-400 font-bold">STRONG BUY</span> signal on the 4H timeframe. RSI is currently at 58.4, indicating upward momentum with room to grow.
                  </p>
                </div>
              </div>

              {/* Execution Flow Table */}
              <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#314368] flex justify-between items-center bg-[#182234]/10">
                  <h3 className="text-white text-md font-bold">Recent Trade Executions & Flow</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-[#314368]/50 rounded text-[10px] text-[#90a4cb] font-mono uppercase tracking-tighter">DCE: OPEN</span>
                    <span className="px-2 py-1 bg-[#314368]/50 rounded text-[10px] text-[#90a4cb] font-mono uppercase tracking-tighter">CBOT: OPEN</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-[#182234]/40">
                        <th className="px-6 py-4 font-bold">Time (UTC)</th>
                        <th className="px-6 py-4 font-bold">Contract</th>
                        <th className="px-6 py-4 font-bold">Side</th>
                        <th className="px-6 py-4 font-bold">Price</th>
                        <th className="px-6 py-4 font-bold">Size (Lots)</th>
                        <th className="px-6 py-4 font-bold">Exchange Feed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#314368]">
                      {[
                        { time: '14:22:05', side: 'BUY', price: '1,178.6', size: '125', color: 'text-emerald-400' },
                        { time: '14:21:58', side: 'SELL', price: '1,178.4', size: '45', color: 'text-rose-400' }
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors cursor-default">
                          <td className="px-6 py-4 font-mono text-[#90a4cb]">{row.time}</td>
                          <td className="px-6 py-4 font-medium text-white">ZS NOV24</td>
                          <td className={`px-6 py-4 font-bold ${row.color}`}>{row.side}</td>
                          <td className="px-6 py-4 text-[#90a4cb] font-mono">{row.price}</td>
                          <td className="px-6 py-4 text-[#90a4cb]">{row.size}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-[#90a4cb] uppercase">CBOT-L1</span>
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
                <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider leading-none mb-1">Exchange Verification</p>
                  <p className="text-[10px] text-[#90a4cb] font-mono">Integrity: 100% | Latency: 12ms</p>
                </div>
              </div>
              <div className="h-8 w-px bg-[#314368]"></div>
              <div className="flex flex-col">
                <p className="text-[10px] text-[#90a4cb] uppercase font-bold mb-1">Last Update</p>
                <p className="text-xs font-mono text-white">2024-10-27 14:22:12</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">history</span> Audit Log
              </button>
              <button className="px-6 py-2.5 rounded-lg bg-[#182234] border border-[#314368] text-white hover:bg-[#314368] transition-all text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">task_alt</span> Verify Data Consistency
              </button>
              <button className="px-8 py-2.5 rounded-lg bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 transition-all text-sm font-bold shadow-lg shadow-[#0d59f2]/25 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">publish</span> Push to Production
              </button>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        .grid-bg { 
          background-image: linear-gradient(to right, rgba(49, 67, 104, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(49, 67, 104, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};
