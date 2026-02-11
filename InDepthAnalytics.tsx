
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor } from './GlobalState';

interface InDepthAnalyticsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const InDepthAnalytics: React.FC<InDepthAnalyticsProps> = ({ onNavigate }) => {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNarrative = async () => {
      if (!process.env.API_KEY) return;
      setIsGenerating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          // Mock data context - in real app this comes from props or state
          const context = `
            Attribution Data:
            - Total Return: +14.2%
            - Weather Factor: +4.2% (Contribution), trend positive.
            - Macro Factor: -2.1% (Contribution), trend negative due to USD strength.
            - Momentum Factor: +5.6% (Contribution), strong signal.
            - Residual: -1.2%
          `;
          
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `
                Act as a Senior Portfolio Manager.
                Analyze this attribution data and write a short, professional "Daily Attribution Brief" (max 3 sentences).
                Explain WHY the return happened.
                
                ${context}
              `
          });
          setNarrative(response.text || "Analysis failed.");
      } catch (e) {
          setNarrative("AI Service Unavailable.");
      } finally {
          setIsGenerating(false);
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
                  const bgColor = isPositive ? 'var(--trend-up)' : 'var(--trend-down)';
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-sm ${absVal > 0.5 ? 'text-[#0a0c10]' : 'text-white/70'}`}
                      style={{ backgroundColor: bgColor, opacity: 0.2 + absVal * 0.8 }}
                    >
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PnL Attribution & AI Narrative */}
            <div className="col-span-12 lg:col-span-6 rounded-xl bg-[#182234] border border-[#222f49] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                  PnL Attribution (Waterfall)
                </h3>
                <span className={`text-xs font-bold uppercase tracking-tighter ${getTrendColor(14.2)}`}>+14.2% Total</span>
              </div>
              
              <div className="h-48 w-full flex items-end gap-4 px-2 mb-6">
                {[
                  { label: 'Weather', val: '30%', trend: 1, mb: '0%' },
                  { label: 'Macro', val: '15%', trend: -1, mb: '30%' },
                  { label: 'Flow', val: '40%', trend: 1, mb: '15%' },
                  { label: 'Final', val: '55%', trend: 0, mb: '0%', bold: true }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all duration-500`} 
                      style={{ 
                          height: bar.val, 
                          marginBottom: bar.mb,
                          backgroundColor: bar.trend === 0 ? '#0d59f2' : (bar.trend > 0 ? 'var(--trend-up)' : 'var(--trend-down)'),
                          opacity: bar.trend === 0 ? 1 : 0.8
                      }}
                    ></div>
                    <span className={`text-[9px] mt-2 uppercase font-bold ${bar.bold ? 'text-white' : 'text-[#90a4cb]'}`}>{bar.label}</span>
                  </div>
                ))}
              </div>

              {/* AI Narrative Box */}
              <div className="flex-1 bg-[#101622] rounded-lg p-4 border border-[#314368] relative">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-[#0d59f2] uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">smart_toy</span> Factor Storyteller
                      </span>
                      <button 
                        onClick={generateNarrative}
                        disabled={isGenerating}
                        className="text-[9px] font-bold text-white bg-[#0d59f2] px-2 py-1 rounded hover:bg-[#1a66ff] disabled:opacity-50"
                      >
                          {isGenerating ? 'Analyzing...' : 'Generate Insight'}
                      </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {narrative || "Click 'Generate Insight' to translate these factors into a readable attribution report."}
                  </p>
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
                      { name: 'Corn (ZC)', wthr: '+0.82', macro: '-0.14', flow: '0.45', comp: 'Strong Buy', trend: 1 },
                      { name: 'Wheat (ZW)', wthr: '-0.45', macro: '+0.32', flow: '0.12', comp: 'Sell', trend: -1 },
                      { name: 'Soybeans (ZS)', wthr: '0.10', macro: '+0.55', flow: '0.89', comp: 'Accumulate', trend: 1 }
                    ].map((row, i) => {
                        const trendClass = getTrendColor(row.trend, 'text');
                        return (
                          <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors group">
                            <td className="px-6 py-4 font-bold text-white uppercase">{row.name}</td>
                            <td className={`px-6 py-4 font-bold ${row.wthr.startsWith('+') ? 'text-[var(--trend-up)]' : row.wthr.startsWith('-') ? 'text-[var(--trend-down)]' : 'text-white'}`}>{row.wthr}</td>
                            <td className={`px-6 py-4 font-bold ${row.macro.startsWith('+') ? 'text-[var(--trend-up)]' : row.macro.startsWith('-') ? 'text-[var(--trend-down)]' : 'text-white'}`}>{row.macro}</td>
                            <td className="px-6 py-4 text-white font-mono">{row.flow}</td>
                            <td className="px-6 py-4">
                              <span 
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${trendClass}`}
                                  style={{ backgroundColor: row.trend > 0 ? 'rgba(var(--trend-up-rgb), 0.1)' : 'rgba(var(--trend-down-rgb), 0.1)' }} 
                              >
                                  <span className="relative z-10">{row.comp}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="material-symbols-outlined text-[#0d59f2] cursor-pointer group-hover:scale-110 transition-transform">open_in_new</span>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
