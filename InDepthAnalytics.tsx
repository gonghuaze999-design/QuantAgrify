
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor, DATA_LAYERS, SystemLogStream } from './GlobalState';
import { GLOBAL_EXCHANGE } from './SimulationEngine';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface InDepthAnalyticsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const InDepthAnalytics: React.FC<InDepthAnalyticsProps> = ({ onNavigate }) => {
  // --- LIVE ENGINE SYNC ---
  const [engineStatus, setEngineStatus] = useState(GLOBAL_EXCHANGE.getStatus());
  
  // --- AI STATE ---
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      const interval = setInterval(() => {
          setEngineStatus(GLOBAL_EXCHANGE.getStatus());
      }, 1000); // 1Hz update
      return () => clearInterval(interval);
  }, []);

  const symbol = engineStatus.config.baseCurrency === 'CNY' ? '¥' : '$';

  // --- DERIVED METRICS ---
  const analytics = useMemo(() => {
      const trades = engineStatus.tradeHistory;
      if (!trades || trades.length === 0) return null;

      let grossProfit = 0;
      let grossLoss = 0;
      let winPeriods = 0;
      const history = engineStatus.account.history;
      
      // Calculate Equity Curve for Chart
      const equityCurve = history.map((h, i) => ({
          index: i,
          equity: h.equity
      }));

      for(let i=1; i<history.length; i++) {
          if (history[i].equity > history[i-1].equity) {
              winPeriods++;
              grossProfit += (history[i].equity - history[i-1].equity);
          } else {
              grossLoss += (history[i-1].equity - history[i].equity);
          }
      }
      
      const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
      const winRate = history.length > 1 ? (winPeriods / (history.length - 1)) * 100 : 0;
      const totalPnLPercent = ((engineStatus.account.equity - (engineStatus.config.initialBalance || 1000000)) / (engineStatus.config.initialBalance || 1000000)) * 100;

      return {
          totalTrades: trades.length,
          winRate: winRate.toFixed(1),
          profitFactor: profitFactor.toFixed(2),
          totalPnL: totalPnLPercent.toFixed(2),
          grossProfit,
          grossLoss,
          equityCurve
      };
  }, [engineStatus]);

  const generateNarrative = async () => {
      if (!process.env.API_KEY) return;
      setIsGenerating(true);
      SystemLogStream.push({ type: 'INFO', module: 'Analytics', action: 'GenerateNarrative', message: 'Requesting performance attribution...' });
      
      const context = analytics ? `
        Trading Session Analysis:
        - Total Trades: ${analytics.totalTrades}
        - Win Rate (Time-Weighted): ${analytics.winRate}%
        - Profit Factor: ${analytics.profitFactor}
        - Total Return: ${analytics.totalPnL}%
      ` : "No trades executed yet.";
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `Act as a Portfolio Manager. Write a short professional performance brief (max 3 sentences) based on: ${context}`
          });
          setNarrative(response.text || "Analysis failed.");
          SystemLogStream.push({ type: 'SUCCESS', module: 'Analytics', action: 'NarrativeReady', message: 'Insight generated.', payload: { text: response.text } });
      } catch (e: any) {
          setNarrative("AI Service Unavailable.");
          SystemLogStream.push({ type: 'ERROR', module: 'Analytics', action: 'AI_Error', message: e.message });
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
        {/* Left Sidebar */}
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
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">In-depth Analytics</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0d59f2] fill-1">insights</span>
                Live Session Attribution & Factor Performance
              </p>
            </div>
            {engineStatus.isRunning && (
                <span className="text-[10px] text-[#0d59f2] bg-[#0d59f2]/10 px-3 py-1 rounded-full border border-[#0d59f2]/20 animate-pulse font-bold uppercase">
                    ● Live Stream Active
                </span>
            )}
          </div>

          {!analytics ? (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-[#314368] rounded-xl bg-[#182234]/20 text-[#90a4cb]">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">query_stats</span>
                  <p className="text-sm font-bold uppercase tracking-widest">No Trading Data Available</p>
                  <p className="text-xs mt-2 opacity-70">Execute strategies in the Cockpit to generate analytics.</p>
              </div>
          ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* 1. Performance Overview - STRETCHED TO MATCH RIGHT COLUMN */}
                <div className="col-span-12 lg:col-span-6 rounded-xl bg-[#182234] border border-[#222f49] p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[#0d59f2]">grid_view</span>
                      Performance Attribution
                    </h3>
                    <span className="text-[10px] text-[#90a4cb] uppercase tracking-widest font-bold">Session Metrics</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#0a0c10] p-4 rounded-xl border border-[#314368] flex flex-col justify-center text-center">
                          <span className="text-[10px] text-[#90a4cb] uppercase font-bold mb-1">Total Trades</span>
                          <span className="text-2xl font-black text-white">{analytics.totalTrades}</span>
                      </div>
                      <div className="bg-[#0a0c10] p-4 rounded-xl border border-[#314368] flex flex-col justify-center text-center">
                          <span className="text-[10px] text-[#90a4cb] uppercase font-bold mb-1">Profit Factor</span>
                          <span className="text-2xl font-black text-[#0bda5e]">{analytics.profitFactor}</span>
                      </div>
                      <div className="bg-[#0a0c10] p-4 rounded-xl border border-[#314368] flex flex-col justify-center text-center">
                          <span className="text-[10px] text-[#90a4cb] uppercase font-bold mb-1">Win Rate (Time)</span>
                          <span className={`text-2xl font-black ${Number(analytics.winRate) > 50 ? 'text-[#0bda5e]' : 'text-[#ffb347]'}`}>{analytics.winRate}%</span>
                      </div>
                      <div className="bg-[#0a0c10] p-4 rounded-xl border border-[#314368] flex flex-col justify-center text-center">
                          <span className="text-[10px] text-[#90a4cb] uppercase font-bold mb-1">Net Return</span>
                          {/* Chameleon Color for PnL */}
                          <span className={`text-2xl font-black ${getTrendColor(Number(analytics.totalPnL))}`}>{Number(analytics.totalPnL) > 0 ? '+' : ''}{analytics.totalPnL}%</span>
                      </div>
                  </div>

                  {/* FILLER: EQUITY CURVE MINI CHART */}
                  <div className="flex-1 bg-[#0a0c10] rounded-xl border border-[#314368] p-2 relative overflow-hidden min-h-[100px] flex flex-col">
                      <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-wider absolute top-2 left-3 z-10">Equity Curve Velocity</span>
                      <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.equityCurve}>
                                <defs>
                                    <linearGradient id="eqMini" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="equity" stroke="#0d59f2" strokeWidth={2} fill="url(#eqMini)" />
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                </div>

                {/* 2. PnL Waterfall & Narrative */}
                <div className="col-span-12 lg:col-span-6 rounded-xl bg-[#182234] border border-[#222f49] p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                      PnL Components
                    </h3>
                  </div>
                  
                  <div className="h-48 w-full flex items-end gap-4 px-2 mb-6">
                    {/* Chameleon Colors for Waterfall */}
                    {[
                      { label: 'Gross Gain', val: analytics.grossProfit, color: getTrendColor(1, 'fill') }, // Up Trend Color
                      { label: 'Gross Loss', val: -analytics.grossLoss, color: getTrendColor(-1, 'fill') }, // Down Trend Color
                      { label: 'Fees/Slip', val: (analytics.grossProfit - analytics.grossLoss) * 0.05, color: '#ffb347' }, // Est 5% Friction
                      { label: 'Net PnL', val: (analytics.grossProfit - analytics.grossLoss) * 0.95, color: '#0d59f2' }
                    ].map((bar, i, arr) => {
                        const maxVal = Math.max(...arr.map(b => b.val));
                        const heightPercent = maxVal > 0 ? (bar.val / maxVal) * 80 : 0;
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[9px] font-mono text-white mb-1">{symbol}{Math.floor(bar.val).toLocaleString()}</span>
                            <div 
                              className="w-full rounded-t transition-all duration-500" 
                              style={{ 
                                  height: `${Math.max(5, heightPercent)}%`, 
                                  backgroundColor: bar.color,
                                  opacity: 0.9
                              }}
                            ></div>
                            <span className="text-[9px] mt-2 uppercase font-bold text-[#90a4cb]">{bar.label}</span>
                          </div>
                        );
                    })}
                  </div>

                  {/* AI Narrative Box - FIXED HEIGHT WITH SCROLL */}
                  <div className="flex-1 bg-[#101622] rounded-lg p-4 border border-[#314368] relative flex flex-col min-h-[140px]">
                      <div className="flex justify-between items-center mb-2 shrink-0">
                          <span className="text-[10px] font-black text-[#0d59f2] uppercase tracking-widest flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">smart_toy</span> Gemini Attribution
                          </span>
                          <button 
                            onClick={generateNarrative}
                            disabled={isGenerating}
                            className="text-[9px] font-bold text-white bg-[#0d59f2] px-2 py-1 rounded hover:bg-[#1a66ff] disabled:opacity-50"
                          >
                              {isGenerating ? 'Analyzing...' : 'Generate Insight'}
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar h-24">
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {narrative || "Click 'Generate Insight' to translate your trade stats into a performance report."}
                          </p>
                      </div>
                  </div>
                </div>

                {/* 3. Trade Log Table (Bottom) */}
                <div className="col-span-12 rounded-xl bg-[#182234] border border-[#222f49] overflow-hidden">
                  <div className="p-4 border-b border-[#222f49] bg-[#1c283d]/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Raw Trade Blotter</h3>
                    <span className="text-[10px] text-[#90a4cb] uppercase font-bold">{engineStatus.tradeHistory.length} Executions</span>
                  </div>
                  <div className="overflow-x-auto max-h-64 custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#101622] text-[#90a4cb] uppercase font-black tracking-widest sticky top-0">
                        <tr>
                          <th className="px-6 py-4">Time</th>
                          <th className="px-6 py-4">Symbol</th>
                          <th className="px-6 py-4">Side</th>
                          <th className="px-6 py-4 text-right">Price</th>
                          <th className="px-6 py-4 text-right">Quantity</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222f49]">
                        {[...engineStatus.tradeHistory].reverse().map((trade: any, i) => {
                            // Unified Time Format Logic
                            const d = new Date(trade.timestamp);
                            const dateStr = (engineStatus.config.mode === 'SIMULATION' || engineStatus.config.mode === 'TRAINING')
                                ? `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
                                : d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false});

                            return (
                                <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors group">
                                    <td className="px-6 py-3 font-mono text-[#90a4cb]">
                                        {dateStr}
                                    </td>
                                    <td className="px-6 py-3 font-bold text-white">{trade.symbol}</td>
                                    {/* Chameleon Colors for Side */}
                                    <td className={`px-6 py-3 font-bold ${trade.side === 'LONG' ? 'text-[var(--trend-up)]' : 'text-[var(--trend-down)]'}`}>
                                        {trade.side}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-white">{trade.fillPrice ? trade.fillPrice.toFixed(2) : trade.price.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right font-mono text-[#90a4cb]">{trade.quantity}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#0bda5e]/10 text-[#0bda5e] border border-[#0bda5e]/20">
                                            FILLED
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};
