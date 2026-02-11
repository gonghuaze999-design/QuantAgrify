
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor } from './GlobalState';

interface PortfolioAssetsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const PortfolioAssets: React.FC<PortfolioAssetsProps> = ({ onNavigate }) => {
  const [gateway, setGateway] = useState<'SIMULATION' | 'CTP_REAL' | 'IBKR'>('SIMULATION');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTip, setOptimizationTip] = useState<string | null>(null);

  const runOptimization = async () => {
      if (!process.env.API_KEY) return;
      setIsOptimizing(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Act as a Portfolio Manager.
            Current Allocation: 45% Corn, 30% Soybeans, 25% Wheat.
            Context: Corn and Soy have high correlation (0.85).
            
            Suggest ONE specific rebalancing action to reduce risk while maintaining exposure.
            Max 2 sentences.
          `;
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          setOptimizationTip(response.text);
      } catch (e) {
          setOptimizationTip("Optimization Service Unavailable.");
      } finally {
          setIsOptimizing(false);
      }
  };

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
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const, active: true }
  ];

  return (
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Global Header */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0c10] px-6 flex items-center justify-between z-[60] shrink-0">
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
              onClick={() => item.view !== 'cockpit' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d59f2] transition-colors">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - STANDARDIZED */}
        <aside className="w-20 border-r border-[#222f49] bg-[#0a0c10] flex flex-col items-center py-6 gap-8 shrink-0">
          {sideNavItems.map(item => (
            <div 
              key={item.label} 
              onClick={() => item.view && onNavigate(item.view)}
              className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-[#0d59f2] text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]' : 'hover:bg-[#182234]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
          <div className="mt-auto group flex flex-col items-center gap-1 cursor-pointer text-[#fa6238] transition-colors" onClick={() => onNavigate('login')}>
            <div className="p-2.5 rounded-xl hover:bg-red-500/10"><span className="material-symbols-outlined">logout</span></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Logout</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Portfolio Analysis</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0bda5e] fill-1">account_balance_wallet</span>
                Consolidated Asset Overview & Margin Tracking
              </p>
            </div>
            {/* Gateway Status Module (NEW) */}
            <div className="flex gap-4 items-center bg-[#182234] border border-[#222f49] rounded-lg p-2 px-4">
                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Execution Gateway:</span>
                <div className="flex gap-2">
                    <button onClick={() => setGateway('SIMULATION')} className={`size-3 rounded-full ${gateway === 'SIMULATION' ? 'bg-[#0d59f2] shadow-[0_0_5px_#0d59f2]' : 'bg-[#314368]'}`} title="Simulation"></button>
                    <button onClick={() => setGateway('CTP_REAL')} className={`size-3 rounded-full ${gateway === 'CTP_REAL' ? 'bg-[#0bda5e] shadow-[0_0_5px_#0bda5e]' : 'bg-[#314368]'}`} title="CTP (Real)"></button>
                    <button onClick={() => setGateway('IBKR')} className={`size-3 rounded-full ${gateway === 'IBKR' ? 'bg-[#ffb347] shadow-[0_0_5px_#ffb347]' : 'bg-[#314368]'}`} title="IBKR"></button>
                </div>
                <span className="text-[10px] font-mono text-white font-bold">{gateway === 'SIMULATION' ? 'SIM MODE (Local)' : gateway === 'CTP_REAL' ? 'CTP (Direct)' : 'IBKR (Gateway)'}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Allocation Section with Optimization Doctor */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 h-full flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[#90a4cb] mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">pie_chart</span>
                  Asset Allocation
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                      <circle className="text-[#0d59f2]" cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeDasharray="45 100" strokeWidth="4"></circle>
                      <circle className="text-[#0bda5e]" cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeDasharray="30 100" strokeDashoffset="-45" strokeWidth="4"></circle>
                      <circle className="text-[#fa6238]" cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeDasharray="25 100" strokeDashoffset="-75" strokeWidth="4"></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest leading-none">Equity</span>
                      <span className="text-2xl font-black text-white mt-1">$1.2M</span>
                    </div>
                  </div>
                  
                  {/* Optimization Doctor */}
                  <div className="w-full mt-6 bg-[#101622] p-3 rounded-lg border border-[#314368] flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#90a4cb] uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#0d59f2]">medical_services</span> Optimization Doctor
                          </span>
                          <button 
                            onClick={runOptimization} 
                            disabled={isOptimizing}
                            className="text-[9px] text-white bg-[#0d59f2] px-2 py-1 rounded hover:bg-[#1a66ff]"
                          >
                              {isOptimizing ? 'Scanning...' : 'Scan Portfolio'}
                          </button>
                      </div>
                      {optimizationTip && (
                          <p className="text-[10px] text-slate-300 leading-tight border-l-2 border-[#0bda5e] pl-2">
                              {optimizationTip}
                          </p>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* NAV Trend Section */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[#90a4cb] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-lg">trending_up</span>
                    Net Asset Value (NAV) Trend
                  </h3>
                  <div className="flex bg-[#0a0c10] border border-[#222f49] rounded-lg p-1">
                    {['1W', '1M', '3M', 'YTD'].map((t, i) => (
                      <button key={t} className={`px-4 py-1 text-[10px] font-black uppercase rounded transition-all ${i === 1 ? 'bg-[#0d59f2] text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-h-[280px] w-full relative group">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 280">
                    <line stroke="#222f49" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
                    <line stroke="#222f49" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="110" y2="110" />
                    <line stroke="#222f49" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="170" y2="170" />
                    <line stroke="#222f49" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="230" y2="230" />
                    <path d="M0 200 Q 100 180, 200 190 T 350 120 T 500 140 T 650 60 T 800 40" fill="none" stroke="#0d59f2" strokeWidth="4" />
                    <path d="M0 200 Q 100 180, 200 190 T 350 120 T 500 140 T 650 60 T 800 40 V 280 H 0 Z" fill="url(#navAssetsGradient)" />
                    <defs>
                      <linearGradient id="navAssetsGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0d59f2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-black text-[#90a4cb] py-2 pointer-events-none uppercase tracking-tighter">
                    <span>$1.30M</span>
                    <span>$1.25M</span>
                    <span>$1.20M</span>
                    <span>$1.15M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Positions Table (kept similar to before but with improved styling) */}
            <div className="col-span-12">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[#222f49] flex justify-between items-center bg-[#101622]/50 backdrop-blur-sm">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-lg">list_alt</span>
                    Active Derivatives Positions
                  </h3>
                  <button className="text-[10px] font-black text-[#0d59f2] hover:underline uppercase tracking-widest">Download Statement</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1a2539]/50 text-[#90a4cb] font-black uppercase tracking-widest text-[9px]">
                      <tr>
                        <th className="px-6 py-4">Asset / Instrument</th>
                        <th className="px-6 py-4">Side</th>
                        <th className="px-6 py-4 text-right">Size</th>
                        <th className="px-6 py-4 text-right">Entry Price</th>
                        <th className="px-6 py-4 text-right">Market Price</th>
                        <th className="px-6 py-4 text-right">Unrealized PnL</th>
                        <th className="px-6 py-4 text-center">Leverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222f49] text-xs font-bold">
                      {[
                        { symbol: 'ZC', name: 'Corn Futures', contract: 'Dec 24 (ZCZ4)', side: 'Long', size: '50 Contracts', entry: '458.50', market: '462.25', pnl: '+$18,750.00', pnlPct: '+3.2%', lev: '5.0x' },
                        { symbol: 'ZS', name: 'Soybean Futures', contract: 'Nov 24 (ZSX4)', side: 'Short', size: '20 Contracts', entry: '1,192.00', market: '1,184.50', pnl: '+$7,500.00', pnlPct: '+0.6%', lev: '3.0x' },
                      ].map((pos, i) => {
                          const pnlValue = parseFloat(pos.pnlPct.replace('%', ''));
                          const trendColor = getTrendColor(pnlValue, 'text');
                          
                          return (
                            <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className={`size-10 rounded border flex items-center justify-center font-black text-[11px] uppercase ${pos.side === 'Long' ? 'bg-[#0d59f2]/20 border-[#0d59f2]/40 text-[#0d59f2]' : 'bg-[#fa6238]/20 border-[#fa6238]/40 text-[#fa6238]'}`}>
                                    {pos.symbol}
                                  </div>
                                  <div className="flex flex-col">
                                    <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{pos.name}</p>
                                    <p className="text-[10px] text-[#90a4cb] font-black uppercase mt-1.5 opacity-60">{pos.contract}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded ${pos.side === 'Long' ? 'bg-[#0d59f2]/10 text-[#0d59f2] border border-[#0d59f2]/20' : 'bg-[#fa6238]/10 text-[#fa6238] border border-[#fa6238]/20'} text-[10px] font-black uppercase tracking-tighter`}>{pos.side}</span>
                              </td>
                              <td className="px-6 py-4 text-right tabular-nums text-white">{pos.size}</td>
                              <td className="px-6 py-4 text-right tabular-nums text-[#90a4cb]">{pos.entry}</td>
                              <td className="px-6 py-4 text-right tabular-nums text-white">{pos.market}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`text-sm font-black tabular-nums ${trendColor}`}>{pos.pnl}</span>
                                <span className={`block text-[10px] font-black ${trendColor} mt-0.5`}>{pos.pnlPct}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-[11px] font-black text-white px-2 py-0.5 border border-[#222f49] rounded tabular-nums bg-[#0a0c10]/40">{pos.lev}</span>
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
