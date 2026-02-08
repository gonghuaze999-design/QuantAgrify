import React from 'react';
import { SystemClock } from './SystemClock';

interface InDepthAnalyticsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const InDepthAnalytics: React.FC<InDepthAnalyticsProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const, active: true },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  const heatmapData = [
    [1.0, 0.12, 0.45, 0.82, 0.23, -0.15],
    [0.12, 1.0, -0.52, 0.05, 0.68, -0.08],
    [0.45, -0.52, 1.0, 0.18, 0.02, 0.55],
    [0.82, 0.05, 0.18, 1.0, -0.21, 0.29],
    [0.23, 0.68, 0.02, -0.21, 1.0, 0.41],
    [-0.15, -0.08, 0.55, 0.29, 0.41, 1.0]
  ];

  return (
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Global Header */}
      <header className="flex items-center justify-between border-b border-[#222f49] bg-[#0a0c10] px-6 h-16 shrink-0 z-50">
        <div className="flex items-center gap-3 w-1/4 cursor-pointer" onClick={() => onNavigate('hub')}>
          <div className="bg-[#0d59f2] h-10 w-10 flex items-center justify-center rounded-lg shadow-lg shadow-[#0d59f2]/20">
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
              className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl ${item.active ? 'bg-[#0d59f2] text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]' : 'hover:bg-[#182234]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
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
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">In-depth Analytics</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0d59f2] fill-1">insights</span>
                Advanced Factor Correlation & Attribution Models
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-[#182234] border border-[#222f49] rounded-lg p-1">
                <button className="px-4 py-1.5 text-xs font-bold uppercase rounded bg-[#0d59f2] text-white shadow-lg">Full Analysis</button>
                <button className="px-4 py-1.5 text-xs font-bold uppercase text-[#90a4cb] hover:text-white transition-colors">Raw Data</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Correlation Matrix */}
            <div className="col-span-12 lg:col-span-6 rounded-xl bg-[#182234] border border-[#222f49] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[#0d59f2]">grid_view</span>
                  Factor Correlation Matrix
                </h3>
                <span className="text-[10px] text-[#90a4cb] uppercase tracking-widest font-bold">Pearson Coefficients</span>
              </div>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {['WTHR', 'MACR', 'TRDF', 'YELD', 'EXPT', 'STCK'].map(tag => (
                  <div key={tag} className="text-[9px] text-[#90a4cb] uppercase font-black text-center">{tag}</div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {heatmapData.flat().map((val, i) => {
                  const isPositive = val >= 0;
                  const absVal = Math.abs(val);
                  const baseColor = isPositive ? 'bg-[#0d59f2]' : 'bg-[#fa6238]';
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm ${baseColor} ${absVal > 0.5 ? 'text-white' : 'text-white/70'}`}
                      style={{ opacity: 0.1 + absVal * 0.9 }}
                    >
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PnL Attribution */}
            <div className="col-span-12 lg:col-span-6 rounded-xl bg-[#182234] border border-[#222f49] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                  PnL Attribution (Waterfall)
                </h3>
                <span className="text-xs font-bold text-[#0bda5e] uppercase tracking-tighter">+14.2% Total</span>
              </div>
              <div className="h-48 w-full flex items-end gap-4 px-2">
                {[
                  { label: 'Weather', val: '30%', color: 'bg-[#0bda5e]/80', mb: '0%' },
                  { label: 'Macro', val: '15%', color: 'bg-[#fa6238]/80', mb: '30%' },
                  { label: 'Flow', val: '40%', color: 'bg-[#0bda5e]/80', mb: '15%' },
                  { label: 'Final', val: '55%', color: 'bg-[#0d59f2]', mb: '0%', bold: true }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full ${bar.color} rounded-t transition-all duration-500`} 
                      style={{ height: bar.val, marginBottom: bar.mb }}
                    ></div>
                    <span className={`text-[9px] mt-2 uppercase font-bold ${bar.bold ? 'text-white' : 'text-[#90a4cb]'}`}>{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#222f49] grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Alpha</p>
                  <p className="text-sm font-bold text-white">8.4%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Beta</p>
                  <p className="text-sm font-bold text-white">5.8%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Residual</p>
                  <p className="text-sm font-bold text-[#fa6238]">-1.2%</p>
                </div>
              </div>
            </div>

            {/* Return Distribution */}
            <div className="col-span-12 lg:col-span-4 rounded-xl bg-[#182234] border border-[#222f49] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[#0d59f2]">bar_chart_4_bars</span>
                  Return Distribution
                </h3>
              </div>
              <div className="h-40 flex items-end gap-1">
                {[10, 25, 45, 85, 100, 75, 35, 15, 5].map((h, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t transition-all duration-700 ${h > 70 ? 'bg-[#0d59f2]' : 'bg-[#222f49]'}`} 
                    style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-[#90a4cb] font-black uppercase">
                <span>-5%</span>
                <span>0%</span>
                <span>+5%</span>
              </div>
            </div>

            {/* Factor Scores Table */}
            <div className="col-span-12 lg:col-span-8 rounded-xl bg-[#182234] border border-[#222f49] overflow-hidden">
              <div className="p-4 border-b border-[#222f49] bg-[#1c283d]/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Commodity Factor Scores</h3>
                <button className="text-[10px] px-3 py-1 bg-[#222f49] rounded hover:bg-[#0d59f2] transition-colors font-black uppercase tracking-tighter border border-[#314368]">Filter Assets</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#101622] text-[#90a4cb] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Commodity</th>
                      <th className="px-6 py-4">Wthr Score</th>
                      <th className="px-6 py-4">Macro Sent.</th>
                      <th className="px-6 py-4">Flow Vol.</th>
                      <th className="px-6 py-4">Composite</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222f49]">
                    {[
                      { name: 'Corn (ZC)', wthr: '+0.82', macro: '-0.14', flow: '0.45', comp: 'Strong Buy', color: 'text-[#0bda5e]', bg: 'bg-[#0bda5e]/20' },
                      { name: 'Wheat (ZW)', wthr: '-0.45', macro: '+0.32', flow: '0.12', comp: 'Sell', color: 'text-[#fa6238]', bg: 'bg-[#fa6238]/20' },
                      { name: 'Soybeans (ZS)', wthr: '0.10', macro: '+0.55', flow: '0.89', comp: 'Accumulate', color: 'text-[#0d59f2]', bg: 'bg-[#0d59f2]/20' }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-white uppercase">{row.name}</td>
                        <td className={`px-6 py-4 font-bold ${row.wthr.startsWith('+') ? 'text-[#0bda5e]' : row.wthr.startsWith('-') ? 'text-[#fa6238]' : 'text-white'}`}>{row.wthr}</td>
                        <td className={`px-6 py-4 font-bold ${row.macro.startsWith('+') ? 'text-[#0bda5e]' : row.macro.startsWith('-') ? 'text-[#fa6238]' : 'text-white'}`}>{row.macro}</td>
                        <td className="px-6 py-4 text-white font-mono">{row.flow}</td>
                        <td className="px-6 py-4">
                          <span className={`${row.bg} ${row.color} px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight`}>{row.comp}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="material-symbols-outlined text-[#0d59f2] cursor-pointer group-hover:scale-110 transition-transform">open_in_new</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Quant AI Agent Sidebar */}
        <aside className="w-80 border-l border-[#222f49] bg-[#101622] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#222f49] flex items-center justify-between bg-[#182234]/50">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#0bda5e] rounded-full animate-pulse shadow-[0_0_8px_#0bda5e]"></div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Quant AI Agent</h3>
            </div>
            <button className="material-symbols-outlined text-[#90a4cb] text-lg hover:text-white transition-colors">close_fullscreen</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
            <div className="flex flex-col gap-2 max-w-[90%]">
              <div className="bg-[#182234] p-3 rounded-lg rounded-tl-none border border-white/5">
                <p className="text-sm text-white leading-relaxed font-medium">The Factor Correlation Matrix indicates a high positive sensitivity (0.82) between Weather data and Yield projections for Corn. This suggests current drought patterns are heavily priced in.</p>
              </div>
              <span className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest ml-1 leading-none">AI Assistant • 15:02</span>
            </div>
            <div className="flex flex-col gap-2 max-w-[90%] self-end">
              <div className="bg-[#0d59f2]/20 border border-[#0d59f2]/30 p-3 rounded-lg rounded-tr-none">
                <p className="text-sm text-white leading-relaxed font-medium">Why is Macro contributing negatively to the Corn PnL in the waterfall chart?</p>
              </div>
              <span className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest mr-1 text-right leading-none">You • 15:05</span>
            </div>
            <div className="flex items-center gap-2 text-[#90a4cb] italic text-xs font-bold uppercase tracking-tighter">
              <div className="flex gap-1">
                <span className="size-1 bg-[#90a4cb] rounded-full animate-bounce"></span>
                <span className="size-1 bg-[#90a4cb] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1 bg-[#90a4cb] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              Analyzing DXY correlation...
            </div>
          </div>
          <div className="p-4 border-t border-[#222f49] flex flex-col gap-3 bg-[#182234]/20">
            <div className="flex flex-wrap gap-2">
              <button className="text-[10px] px-2 py-1 bg-[#182234] hover:bg-[#222f49] rounded border border-[#222f49] text-[#90a4cb] transition-colors font-bold uppercase tracking-widest">Factor Deep Dive</button>
              <button className="text-[10px] px-2 py-1 bg-[#182234] hover:bg-[#222f49] rounded border border-[#222f49] text-[#90a4cb] transition-colors font-bold uppercase tracking-widest">Export Report</button>
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-[#182234] border border-[#222f49] rounded-lg text-sm text-white placeholder:text-[#90a4cb] focus:ring-1 focus:ring-[#0d59f2] focus:border-[#0d59f2] outline-none resize-none custom-scrollbar p-3 pr-10" 
                placeholder="Ask AI about these charts..." 
                rows={2}
              ></textarea>
              <button className="absolute right-2 bottom-3 p-1 text-[#0d59f2] hover:text-white transition-colors">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Ticker */}
      <footer className="h-8 bg-[#0a0c10] border-t border-[#222f49] flex items-center gap-8 px-6 overflow-hidden whitespace-nowrap shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-[0.2em]">Market Pulse:</span>
        </div>
        <div className="flex gap-8 text-[11px] font-bold items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-white">CORN (ZC)</span>
            <span className="text-[#0bda5e]">462.25 (+1.2%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white">WHEAT (ZW)</span>
            <span className="text-[#fa6238]">542.75 (-0.8%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white">SOYBEANS (ZS)</span>
            <span className="text-[#0bda5e]">1,184.50 (+0.3%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white">USD INDEX (DXY)</span>
            <span className="text-[#0bda5e]">104.22 (+0.05%)</span>
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