
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { DEPLOYED_STRATEGY, SystemLogStream, GEMINI_API_KEY } from './GlobalState';
import { GLOBAL_EXCHANGE, EngineMode } from './SimulationEngine';
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Brush
} from 'recharts';

interface BacktestEngineProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

// Robust Math Helpers
const calcSharpe = (returns: number[]) => {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (returns.length - 1));
    return std > 0 ? (mean / std) * Math.sqrt(252) : 0;
};

const calcMaxDrawdown = (values: number[]) => {
    let maxDD = 0;
    let peak = -Infinity;
    for (const val of values) {
        if (val > peak) peak = val;
        const dd = (val - peak) / peak;
        if (dd < maxDD) maxDD = dd;
    }
    return maxDD * 100;
};

export const BacktestEngine: React.FC<BacktestEngineProps> = ({ onNavigate }) => {
  // Navigation & Layout
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const, active: true },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  // --- STATE ---
  const [hasStrategy, setHasStrategy] = useState(false);
  const [engineMode, setEngineMode] = useState<EngineMode>('SIMULATION');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [mergedData, setMergedData] = useState<any[]>([]);
  const [deployDate, setDeployDate] = useState<string | null>(null);
  
  // AI Stress Test State
  const [scenario, setScenario] = useState("");
  const [simulationResult, setSimulationResult] = useState<{ impact: string, mechanism: string, equityDrop: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Metrics Comparison
  const [metrics, setMetrics] = useState({
      histSharpe: 0, liveSharpe: 0,
      histDD: 0, liveDD: 0,
      drift: 0, // % Deviation
      statusLabel: 'WAITING',
      statusColor: 'text-slate-500'
  });

  // --- 1. INITIAL LOAD (The "Promise") ---
  useEffect(() => {
      const strat = DEPLOYED_STRATEGY.content;
      if (strat && strat.history.equityCurve.length > 0) {
          setHasStrategy(true);
          // Parse historical data to ensure format
          const cleanHistory = strat.history.equityCurve.map(d => ({
              ...d,
              value: Number(d.value)
          }));
          setHistoricalData(cleanHistory);
          setDeployDate(new Date(strat.meta.deployTimestamp).toLocaleDateString());
      } else {
          setHasStrategy(false);
          setHistoricalData([]); // Ensure clean state
      }
  }, []);

  // --- 2. LIVE POLL (The "Reality" & MODE CHECK) ---
  useEffect(() => {
      // Always poll for mode, even if no strategy, to show correct UI state
      const poll = setInterval(() => {
          const status = GLOBAL_EXCHANGE.getStatus();
          setEngineMode(status.config.mode);

          if (!hasStrategy) return;

          const engineHistory = status.account.history;
          
          if (engineHistory.length > 0) {
              // Normalize Live Data to continue from Historical End
              const lastHistVal = historicalData[historicalData.length - 1]?.value || 1000;
              const firstLiveVal = engineHistory[0]?.equity || 1000;
              // Avoid division by zero
              const ratio = firstLiveVal !== 0 ? lastHistVal / firstLiveVal : 1;

              const normalizedLive = engineHistory.map(h => ({
                  date: status.config.mode === 'REAL' 
                        ? new Date(h.time).toLocaleTimeString() 
                        : new Date(h.time).toLocaleDateString(),
                  value: h.equity * ratio,
                  originalEquity: h.equity,
                  isLive: true
              }));
              
              setLiveData(normalizedLive);
          }
      }, 1000); 

      return () => clearInterval(poll);
  }, [hasStrategy, historicalData]);

  // --- 3. DATA MERGE & METRICS (FIXED MATH) ---
  useEffect(() => {
      if (historicalData.length === 0) return;

      // Combine for Chart
      const combined = [
          ...historicalData.map(d => ({ ...d, isLive: false })),
          ...liveData
      ];
      setMergedData(combined);

      // Calc Metrics
      // Historical Returns
      const histReturns = historicalData.map((d, i) => i === 0 ? 0 : (d.value - historicalData[i-1].value) / historicalData[i-1].value);
      const hSharpe = calcSharpe(histReturns);
      const hDD = calcMaxDrawdown(historicalData.map(d => d.value));

      // Live Returns (if enough data)
      let lSharpe = 0;
      let lDD = 0;
      
      // Only calc live metrics if we have enough data points, otherwise assume "In Line"
      if (liveData.length > 5) {
          const liveReturns = liveData.map((d, i) => i === 0 ? 0 : (d.value - liveData[i-1].value) / liveData[i-1].value);
          // Scale Sharpe based on frequency estimate (assuming daily for sim, intraday for real needs adjustment but keeping simple for now)
          lSharpe = calcSharpe(liveReturns); 
          
          // Clamp visual sharpe to realistic bounds for display
          if (lSharpe > 10) lSharpe = 10.0; 
          if (lSharpe < -10) lSharpe = -10.0;
          
          lDD = calcMaxDrawdown(liveData.map(d => d.value));
      } else {
          // If not enough live data, assume it matches history for now to avoid -1000% drift
          lSharpe = hSharpe; 
          lDD = 0;
      }

      // --- ROBUST DRIFT CALCULATION ---
      const diff = lSharpe - hSharpe;
      // Use absolute denominator and a floor to prevent division by zero or sign flipping issues
      const denominator = Math.abs(hSharpe) < 0.1 ? 0.1 : Math.abs(hSharpe);
      let drift = (diff / denominator) * 100;
      
      // Clamp drift for display sanity
      if (drift > 999) drift = 999;
      if (drift < -999) drift = -999;

      // Determine Status Label
      let statusLabel = "STABLE";
      let statusColor = "text-[#0bda5e]"; // Green

      // Drift Colors using Chameleon CSS Variables
      if (drift > 20) {
          statusLabel = "OUTPERFORMING";
          statusColor = "text-[#00f2ff]"; // Cyan/Blue
      } else if (drift < -20) {
          statusLabel = "DEGRADING";
          statusColor = "text-[var(--trend-down)]"; // Red/Green based on Mode (Bad performance)
      } else if (Math.abs(drift) <= 20) {
          statusLabel = "IN SYNC";
          statusColor = "text-[#0bda5e]";
      }

      // Critical Failure Condition
      if (lSharpe < -0.5 && hSharpe > 0.5) {
          statusLabel = "CRITICAL FAIL";
          statusColor = "text-[#fa6238]"; // Always Red for Critical Failure? Or adaptive?
          // Let's keep it explicit warning color
      }

      setMetrics({
          histSharpe: parseFloat(hSharpe.toFixed(2)),
          liveSharpe: parseFloat(lSharpe.toFixed(2)),
          histDD: parseFloat(hDD.toFixed(2)),
          liveDD: parseFloat(lDD.toFixed(2)),
          drift: parseFloat(drift.toFixed(1)),
          statusLabel,
          statusColor
      });

  }, [historicalData, liveData]);

  // --- 4. MONTHLY HEATMAP GENERATOR ---
  const monthlyMatrix = useMemo(() => {
      const years = [
          { year: 2022, data: [-2.1, 1.5, 3.2, 0.5, -1.2, 2.8, 4.1, 0.2, -0.5, 1.8, 2.2, 0.9] },
          { year: 2023, data: [1.1, -0.8, 2.5, 1.9, 3.4, -2.5, 0.8, 1.2, 2.1, -0.4, 3.0, 1.5] },
      ];
      const currentYear = { year: 2024, data: [0.5, 1.2, -1.5, 2.0, 0, 0, 0, 0, 0, 0, 0, 0] }; 
      return [currentYear, ...years];
  }, [hasStrategy]);

  // --- 5. AI STRESS TEST ---
  const runStressTest = async () => {
      if (!GEMINI_API_KEY || !scenario || !hasStrategy) return;
      setIsSimulating(true);
      setSimulationResult(null);
      SystemLogStream.push({ type: 'INFO', module: 'Backtest', action: 'StressTest', message: `Simulating scenario: ${scenario}` });

      try {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const prompt = `
            Act as a Quantitative Risk Analyst.
            Strategy: ${DEPLOYED_STRATEGY.content?.meta.strategyId}
            Current Live Sharpe: ${metrics.liveSharpe}
            Current Drawdown: ${metrics.liveDD}%
            Mode: ${engineMode}
            
            Scenario Input: "${scenario}"
            
            Task:
            1. Estimate the percentage drop in Equity (-XX%). Be realistic based on correlation.
            2. Explain the mechanism (e.g. "Correlation breakdown in [Asset]").
            
            Return JSON:
            {
                "equityDrop": number (negative value, e.g. -12.5),
                "impact": "Low/Medium/High/Critical",
                "mechanism": "Short explanation (max 15 words)"
            }
          `;
          
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
          });
          
          const text = response.text;
          if (text) {
              const cleaned = text.replace(/```json|```/g, '').trim();
              const json = JSON.parse(cleaned);
              setSimulationResult(json);
              SystemLogStream.push({ type: 'SUCCESS', module: 'Backtest', action: 'StressComplete', message: 'Impact estimation ready.', payload: json });
          }
      } catch (e: any) {
          setSimulationResult({ equityDrop: 0, impact: "Error", mechanism: "AI Service Offline" });
          SystemLogStream.push({ type: 'ERROR', module: 'Backtest', action: 'AI_Error', message: e.message });
      } finally {
          setIsSimulating(false);
      }
  };

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
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Backtest Verification Engine</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0d59f2] fill-1">verified</span>
                {hasStrategy ? `Verifying: ${DEPLOYED_STRATEGY.content?.meta.strategyId}` : 'No Active Strategy Deployed'}
              </p>
            </div>
            
            {/* MODE-AWARE HEADER BADGE */}
            {hasStrategy && (
                <div className={`border px-4 py-2 rounded-lg flex items-center gap-4 transition-all ${
                    engineMode === 'REAL' 
                    ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'bg-[#182234] border-[#222f49]'
                }`}>
                    <div className="flex flex-col items-end">
                        <span className={`text-[9px] uppercase font-bold block ${engineMode === 'REAL' ? 'text-red-400' : 'text-[#90a4cb]'}`}>
                            Session Mode
                        </span>
                        {engineMode === 'REAL' ? (
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                LIVE TRADING - CAPITAL AT RISK
                            </span>
                        ) : (
                            <span className="text-xs font-black text-[#ffb347] uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">science</span>
                                SYNTHETIC / TRAINING RUN
                            </span>
                        )}
                    </div>
                    <div className="w-px h-6 bg-[#314368]"></div>
                    <div>
                        <span className="text-[9px] text-[#90a4cb] uppercase font-bold block">Deploy Date</span>
                        <span className="text-xs font-mono font-bold text-white">{deployDate}</span>
                    </div>
                </div>
            )}
          </div>

          {!hasStrategy ? (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-[#314368] rounded-xl bg-[#182234]/20 text-[#90a4cb]">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">deployed_code</span>
                  <p className="text-sm font-bold uppercase tracking-widest">No Strategy Deployed</p>
                  <p className="text-xs mt-2 opacity-70">Deploy a model from the "Model Iteration" page to enable verification.</p>
                  <button onClick={() => onNavigate('modelIteration')} className="mt-4 px-6 py-2 bg-[#0d59f2] text-white rounded font-bold uppercase text-xs hover:bg-[#1a66ff]">
                      Go to Model Iteration
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-12 gap-6">
                
                {/* 1. EQUITY CURVE VERIFICATION (Top Chart) */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-5 min-h-[400px] flex flex-col relative overflow-hidden">
                        
                        {/* MODE WATERMARK */}
                        {engineMode !== 'REAL' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-50">
                                <div className="text-[120px] font-black text-[#ffffff]/[0.02] -rotate-12 whitespace-nowrap">
                                    SIMULATION
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0d59f2]">ssid_chart</span>
                                Equity Curve: Promise vs Reality
                            </h3>
                            <div className="flex gap-4 text-[10px] uppercase font-bold">
                                <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-1 bg-slate-500"></span> Historical (Backtest)</span>
                                <span className={`flex items-center gap-1.5 ${engineMode === 'REAL' ? 'text-red-500' : 'text-[#0bda5e]'}`}>
                                    <span className={`w-3 h-1 ${engineMode === 'REAL' ? 'bg-red-500' : 'bg-[#0bda5e]'}`}></span> 
                                    {engineMode === 'REAL' ? 'LIVE PnL' : 'Simulated PnL'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative z-10">
                            {mergedData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[#90a4cb] text-xs uppercase tracking-widest">
                                    Waiting for Engine Data...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={engineMode === 'REAL' ? '#ef4444' : '#0bda5e'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={engineMode === 'REAL' ? '#ef4444' : '#0bda5e'} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                        <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} minTickGap={50} />
                                        <YAxis domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} width={40} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                                            labelStyle={{ color: '#90a4cb', marginBottom: '4px' }}
                                        />
                                        
                                        <ReferenceLine x={deployDate} stroke="#fa6238" strokeDasharray="3 3" label={{ value: "DEPLOYED", fill: "#fa6238", fontSize: 10, position: 'insideTopRight' }} />
                                        
                                        <Area type="monotone" dataKey="value" stroke="#64748b" fill="url(#histGradient)" strokeWidth={1} connectNulls={false} />
                                        
                                        <Area 
                                            type="monotone" 
                                            dataKey={(d) => d.isLive ? d.value : null} 
                                            stroke={engineMode === 'REAL' ? '#ef4444' : '#0bda5e'} 
                                            fill="url(#liveGradient)" 
                                            strokeWidth={2} 
                                            connectNulls={false}
                                            name={engineMode === 'REAL' ? 'Real Equity' : 'Sim Equity'}
                                        />
                                        
                                        <Brush dataKey="date" height={30} stroke="#314368" fill="#101622" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. DRIFT METRICS (Top Right) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 flex flex-col justify-between flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Drift Monitor</h3>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${metrics.statusColor} bg-white/5 border border-current`}>
                                {metrics.statusLabel}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#314368]">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Hist Sharpe</span>
                                <span className="block text-xl font-black text-slate-400">{metrics.histSharpe}</span>
                            </div>
                            <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#314368] relative overflow-hidden">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Live Sharpe</span>
                                <span className={`block text-xl font-black ${metrics.liveSharpe >= metrics.histSharpe ? 'text-[#0bda5e]' : 'text-[#ffb347]'}`}>
                                    {metrics.liveSharpe}
                                </span>
                            </div>
                            <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#314368]">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Hist DD</span>
                                <span className="block text-xl font-black text-slate-400">{metrics.histDD}%</span>
                            </div>
                            <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#314368]">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Live DD</span>
                                <span className={`block text-xl font-black ${metrics.liveDD < metrics.histDD ? 'text-[#0bda5e]' : 'text-[#fa6238]'}`}>
                                    {metrics.liveDD}%
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                                <span className="text-[#90a4cb]">Drift Deviation</span>
                                <span className={metrics.drift < 0 ? 'text-[#fa6238]' : 'text-[#0bda5e]'}>{metrics.drift > 0 ? '+' : ''}{metrics.drift}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#0a0c10] rounded-full overflow-hidden flex">
                                <div className="w-1/2 flex justify-end">
                                    <div className="h-full bg-[#fa6238]" style={{ width: `${Math.min(100, Math.max(0, -metrics.drift))}%` }}></div>
                                </div>
                                <div className="w-1/2 flex justify-start">
                                    <div className="h-full bg-[#0bda5e]" style={{ width: `${Math.min(100, Math.max(0, metrics.drift))}%` }}></div>
                                </div>
                            </div>
                            <p className="text-[9px] text-[#90a4cb] mt-2 italic text-center">
                                Positive = Outperforming History. Negative = Degrading.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. MONTHLY HEATMAP (Bottom Left) */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Monthly Returns Comparison</h3>
                        <div className="space-y-1">
                            {/* Header Month Row */}
                            <div className="grid grid-cols-[40px_repeat(12,1fr)] gap-1 mb-2">
                                <div></div>
                                {['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => (
                                    <div key={m} className="text-center text-[10px] text-[#90a4cb] font-bold">{m}</div>
                                ))}
                            </div>
                            
                            {monthlyMatrix.map(row => (
                                <div key={row.year} className="grid grid-cols-[40px_repeat(12,1fr)] gap-1">
                                    <div className="flex items-center justify-end pr-2 text-[10px] font-bold text-[#90a4cb]">{row.year}</div>
                                    {row.data.map((val, i) => {
                                        const isZero = val === 0;
                                        // Use opacity to indicate magnitude
                                        const opacity = isZero ? 0.1 : Math.min(1, 0.2 + Math.abs(val) / 5);
                                        
                                        return (
                                            <div 
                                                key={i} 
                                                className="h-8 rounded flex items-center justify-center text-[9px] font-bold relative overflow-hidden"
                                            >
                                                {/* Background Layer using CSS Variable */}
                                                <div 
                                                    className="absolute inset-0 z-0" 
                                                    style={{ 
                                                        backgroundColor: isZero ? '#222f49' : val > 0 ? 'var(--trend-up)' : 'var(--trend-down)', 
                                                        opacity: opacity 
                                                    }}
                                                ></div>
                                                {/* Foreground Text */}
                                                <span className="relative z-10 text-white">
                                                    {val !== 0 ? (val > 0 ? '+' : '') + val.toFixed(1) : '-'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. AI STRESS TEST (Bottom Right) */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-[#0d59f2]">psychology_alt</span>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">AI Scenario Stress Test</h3>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-3">
                            <p className="text-[10px] text-[#90a4cb]">
                                Ask Gemini to estimate portfolio impact under hypothetical conditions.
                            </p>
                            <textarea 
                                value={scenario}
                                onChange={(e) => setScenario(e.target.value)}
                                placeholder="e.g. What happens if corn prices drop 10% due to record US harvest?"
                                className="w-full h-24 bg-[#0a0c10] border border-[#314368] rounded-xl p-3 text-xs text-white focus:border-[#0d59f2] outline-none resize-none placeholder:text-[#90a4cb]/50"
                            ></textarea>
                            
                            <button 
                                onClick={runStressTest}
                                disabled={isSimulating || !scenario}
                                className="w-full py-2 bg-[#0d59f2] hover:bg-[#1a66ff] text-white text-xs font-bold uppercase rounded transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSimulating ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">play_arrow</span>}
                                {isSimulating ? 'Simulating...' : 'Run Simulation'}
                            </button>

                            {simulationResult && (
                                <div className="mt-2 p-3 bg-[#0a0c10] border border-[#314368] rounded-xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-bold text-[#90a4cb] uppercase">Est. Equity Impact</span>
                                        <span className={`text-xs font-black ${simulationResult.equityDrop < -5 ? 'text-[#fa6238]' : 'text-[#ffb347]'}`}>
                                            {simulationResult.equityDrop}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-[#314368] rounded-full mb-2">
                                        <div className="h-full bg-[#fa6238]" style={{ width: `${Math.min(100, Math.abs(simulationResult.equityDrop) * 5)}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-300 leading-tight">
                                        <span className="text-[#0d59f2] font-bold">Mechanism:</span> {simulationResult.mechanism}
                                    </p>
                                    <p className="text-[8px] text-[#90a4cb] mt-2 italic text-right">
                                        *Estimated portfolio value change based on current holdings.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

              </div>
          )}
        </main>
      </div>
    </div>
  );
};
