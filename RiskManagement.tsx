
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor, DATA_LAYERS, SystemLogStream } from './GlobalState';
import { GLOBAL_EXCHANGE } from './SimulationEngine';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface RiskManagementProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

// Math Helper
const calcStdDev = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (arr.length - 1));
};

export const RiskManagement: React.FC<RiskManagementProps> = ({ onNavigate }) => {
  // --- LIVE ENGINE SYNC ---
  const [engineStatus, setEngineStatus] = useState(GLOBAL_EXCHANGE.getStatus());
  
  // --- AI STATE ---
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
      const interval = setInterval(() => {
          setEngineStatus(GLOBAL_EXCHANGE.getStatus());
      }, 500); // 2Hz update
      return () => clearInterval(interval);
  }, []);

  const symbol = engineStatus.config.baseCurrency === 'CNY' ? '¥' : '$';

  // --- REAL-TIME RISK METRICS ---
  const riskMetrics = useMemo(() => {
      const history = engineStatus.account.history;
      const equity = engineStatus.account.equity;
      const margin = engineStatus.account.marginUsed;

      // 1. Returns Analysis & Drawdown Curve
      const returns = [];
      const drawdownCurve = [];
      let peak = -Infinity;
      let maxDD = 0;

      for (let i = 0; i < history.length; i++) {
          if (history[i].equity > peak) peak = history[i].equity;
          const dd = (history[i].equity - peak) / peak; // Negative value
          if (dd < maxDD) maxDD = dd; // Keep track of min (max negative)
          
          drawdownCurve.push({ index: i, value: dd * 100 }); // Convert to %

          if (i > 0) {
              const r = (history[i].equity - history[i-1].equity) / history[i-1].equity;
              returns.push(r);
          }
      }

      // 2. Volatility (Annualized)
      const stdDev = calcStdDev(returns);
      const vol = stdDev * Math.sqrt(252); // Annualized

      // 3. VaR (Parametric 99% 1-Day)
      const dailyVaRPercent = stdDev * 2.33;
      const dailyVaRValue = equity * dailyVaRPercent;

      // 4. Exposure
      const exposure = equity > 0 ? (margin / equity) * 100 : 0;

      return {
          vol: (vol * 100).toFixed(1),
          dailyVaR: (dailyVaRPercent * 100).toFixed(2),
          dailyVaRVal: symbol + Math.floor(dailyVaRValue).toLocaleString(),
          maxDD: (maxDD * 100).toFixed(2),
          exposure: exposure.toFixed(1),
          drawdownCurve
      };
  }, [engineStatus.account.history, engineStatus.account.equity, engineStatus.account.marginUsed, symbol]);

  const runScenarioAnalysis = async (scenario: string) => {
      if (!process.env.API_KEY) return;
      setIsSimulating(true);
      setAiAnalysis(null);
      SystemLogStream.push({ type: 'INFO', module: 'Risk', action: 'ScenarioSim', message: `Testing: ${scenario}` });

      const pos = engineStatus.positions;
      const context = pos 
        ? `Long ${pos.quantity} units of ${pos.symbol} @ ${pos.avgEntryPrice}`
        : `All Cash (${engineStatus.account.equity.toFixed(0)})`;

      const prompt = `
        Act as a Chief Risk Officer (CRO).
        Portfolio Context: ${context}.
        Current Volatility: ${riskMetrics.vol}%.
        Max Drawdown: ${riskMetrics.maxDD}%.
        
        Scenario to Test: "${scenario}"
        
        Provide a stress test assessment (max 30 words). Estimate potential PnL impact.
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          setAiAnalysis(response.text);
          SystemLogStream.push({ type: 'SUCCESS', module: 'Risk', action: 'SimComplete', message: 'Analysis ready.', payload: { text: response.text } });
      } catch (e: any) {
          setAiAnalysis("Risk Engine Offline.");
          SystemLogStream.push({ type: 'ERROR', module: 'Risk', action: 'SimFailed', message: e.message });
      } finally {
          setIsSimulating(false);
      }
  };

  const handleEmergencyHalt = () => {
      GLOBAL_EXCHANGE.stop();
      SystemLogStream.push({ type: 'ERROR', module: 'Risk', action: 'EmergencyHalt', message: 'MANUAL KILL SWITCH TRIGGERED.' });
  }

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
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const, active: true },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  const gauges = [
    { label: 'Daily VaR (99%)', val: riskMetrics.dailyVaR, sub: riskMetrics.dailyVaRVal, color: '#fa6238', max: 5 },
    { label: 'Realized Vol', val: riskMetrics.vol, sub: 'Annualized', color: '#ffb347', max: 50 },
    { label: 'Leverage Use', val: riskMetrics.exposure, sub: 'Margin/Equity', color: '#0d59f2', max: 100 }
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
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Analysis: Risk Management</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#ffb347] fill-1">warning</span>
                Live OEMS Exposure Monitoring • {engineStatus.isRunning ? 'Engine Active' : 'Engine Idle'}
              </p>
            </div>
            {engineStatus.alert && (
                <div className="px-4 py-2 bg-[#fa6238]/10 border border-[#fa6238] rounded-lg animate-pulse flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#fa6238]">error</span>
                    <span className="text-xs font-bold text-[#fa6238] uppercase">Active Alert: {engineStatus.alert.title}</span>
                </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6 auto-rows-max">
            {/* Portfolio VaR Section - SEMI CIRCLE GAUGES */}
            <div className="col-span-12 lg:col-span-6 flex flex-col">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 h-full flex flex-col justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] mb-4">Live Risk Metrics</h3>
                
                <div className="grid grid-cols-3 gap-2 flex-1 items-center">
                  {gauges.map((gauge) => {
                      const pct = Math.min(100, (parseFloat(gauge.val) / gauge.max) * 100);
                      const rotation = -90 + (pct / 100) * 180;
                      
                      return (
                        <div key={gauge.label} className="flex flex-col items-center">
                          <div className="relative w-32 h-16 overflow-hidden">
                              <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[8px] border-[#222f49] box-border" style={{ clipPath: 'inset(0 0 50% 0)' }}></div>
                              <div 
                                className="absolute top-0 left-0 w-32 h-32 rounded-full border-[8px] border-transparent box-border transition-all duration-1000 ease-out"
                                style={{ 
                                    borderColor: gauge.color,
                                    clipPath: 'inset(0 0 50% 0)',
                                    transform: `rotate(${rotation}deg)`,
                                    borderBottomColor: 'transparent',
                                    borderRightColor: 'transparent'
                                }}
                              ></div>
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-1">
                                  <span className="text-lg font-black text-white block leading-none">{gauge.val}%</span>
                              </div>
                          </div>
                          <span className="text-[9px] font-bold text-[#90a4cb] uppercase tracking-wider mt-2">{gauge.label}</span>
                          <span className="text-[8px] text-[#555] font-mono uppercase">{gauge.sub}</span>
                        </div>
                      );
                  })}
                </div>
                
                <div className="mt-4 flex justify-between text-[9px] text-[#90a4cb] uppercase font-bold border-t border-[#222f49] pt-2">
                    <span>Metrics update frequency: 2Hz</span>
                    <span>Confidence Interval: 99%</span>
                </div>
              </div>
            </div>

            {/* Event Radar (Connected to Live Stress Test) */}
            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-5 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#0d59f2]">radar</span>
                      Live Stress Testing
                  </h3>
                  {isSimulating && <span className="text-[9px] bg-[#0d59f2] text-white px-2 py-0.5 rounded animate-pulse">Running...</span>}
                </div>
                
                <div className="space-y-4 flex-1">
                    {[
                        { name: 'Supply Chain Disruption', risk: 'Logistics' },
                        { name: 'Flash Crash (-5% 10min)', risk: 'Liquidity' },
                        { name: 'Interest Rate Spike', risk: 'Macro' },
                    ].map((scenario, i) => (
                        <div key={i} onClick={() => runScenarioAnalysis(scenario.name)} className="flex items-center justify-between gap-4 p-3 rounded bg-[#101622] border border-[#222f49] hover:border-[#0d59f2] cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#90a4cb] group-hover:text-white transition-colors">play_circle</span>
                                <div>
                                    <span className="text-xs font-bold text-white block">{scenario.name}</span>
                                    <span className="text-[9px] text-[#90a4cb] uppercase">{scenario.risk}</span>
                                </div>
                            </div>
                            <span className="text-[9px] text-[#0d59f2] opacity-0 group-hover:opacity-100 font-bold uppercase transition-opacity">Run Sim</span>
                        </div>
                    ))}
                </div>
                
                {/* AI Analysis Result - FIXED HEIGHT CONTAINER */}
                <div className="mt-4 p-3 bg-[#0d59f2]/10 border border-[#0d59f2]/30 rounded-lg animate-in fade-in slide-in-from-bottom-2 h-[100px] flex flex-col">
                    <p className="text-[10px] text-[#90a4cb] font-bold uppercase mb-1 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-xs text-[#0d59f2]">smart_toy</span> Gemini Assessment
                    </p>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <p className="text-xs text-white leading-relaxed">
                            {aiAnalysis || "Select a scenario to estimate portfolio impact."}
                        </p>
                    </div>
                </div>
              </div>
            </div>

            {/* Max Drawdown Monitor - WITH SPARKLINE */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
                  <div className="flex justify-between items-start z-10 relative">
                      <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-tight mb-1">
                            {/* Icon Color now uses trend-down (typically red/green for danger/loss) */}
                            <span className="material-symbols-outlined" style={{color: 'var(--trend-down)'}}>waterfall_chart</span>
                            Current Max Drawdown
                          </h3>
                          <p className="text-[#90a4cb] text-xs max-w-sm">
                              Peak-to-trough decline.
                          </p>
                      </div>
                      <div className="text-right bg-[#0a0c10]/80 p-2 rounded-lg border border-[#222f49] backdrop-blur-sm">
                          {/* Drawdown Text: Uses getTrendColor(negative_value) which maps to trend-down */}
                          <span className={`text-4xl font-black ${getTrendColor(-parseFloat(riskMetrics.maxDD))}`}>
                              {riskMetrics.maxDD}%
                          </span>
                          <span className="block text-[9px] text-[#90a4cb] font-bold uppercase text-right">From HWM</span>
                      </div>
                  </div>
                  
                  {/* DRAWDOWN SPARKLINE */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 z-0 opacity-50 pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={riskMetrics.drawdownCurve}>
                              <defs>
                                  <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="var(--trend-down)" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="var(--trend-down)" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="value" stroke="var(--trend-down)" strokeWidth={2} fill="url(#colorDD)" />
                              <YAxis domain={['dataMin', 0]} hide />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 h-full flex flex-col justify-center gap-3">
                <button 
                    onClick={handleEmergencyHalt} 
                    disabled={!engineStatus.isRunning}
                    className="w-full py-3 text-xs font-black uppercase bg-[#fa6238] hover:bg-[#ff7b5a] text-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                >
                    <span className="material-symbols-outlined text-lg">pan_tool</span> Emergency Halt
                </button>
                <div className="text-center text-[9px] text-[#90a4cb] uppercase font-bold mt-1">
                    Risk engine status: <span className="text-[#0bda5e]">Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
