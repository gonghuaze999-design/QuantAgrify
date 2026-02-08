import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Cell,
  Area
} from 'recharts';
import { DATA_LAYERS, RiskAnalysisPackage } from './GlobalState';
import { SystemClock } from './SystemClock';

interface ModelIterationProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

// --- QUANT MATH UTILS ---
const QuantMath = {
    mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
    std: (arr: number[]) => {
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (arr.length - 1));
    },
    cagr: (startVal: number, endVal: number, days: number) => {
        if (startVal <= 0 || days <= 0 || endVal <= 0) return 0;
        return Math.pow((endVal / startVal), (365 / days)) - 1;
    },
    maxDrawdown: (curve: number[]) => {
        let maxDD = 0;
        let peak = -Infinity;
        for (const val of curve) {
            if (val > peak) peak = val;
            const dd = (val - peak) / peak;
            if (dd < maxDD) maxDD = dd;
        }
        return maxDD;
    }
};

// Internal Types for Local State Management
interface ModelVersion {
    id: string;
    timestamp: number;
    name: string;
    package: RiskAnalysisPackage;
    metrics: {
        sharpe: number;
        cagr: number;
        maxDD: number;
        oosDrift: number; // Deviation of OOS from IS performance
    };
    isBaseline: boolean;
}

// Global variable to persist versions across re-renders (but reset on refresh)
// In a real app, this would be in GlobalState or backend.
let SESSION_VERSIONS: ModelVersion[] = [];

export const ModelIteration: React.FC<ModelIterationProps> = ({ onNavigate }) => {
  // Navigation Config
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl' },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration', active: true }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  // --- STATE ---
  const [versions, setVersions] = useState<ModelVersion[]>(SESSION_VERSIONS);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  
  // AI Optimizer State
  const [aiAnalysis, setAiAnalysis] = useState<{ loading: boolean, text: string, suggestions: string[] }>({ 
      loading: false, 
      text: "Ready to analyze current model stability.", 
      suggestions: [] 
  });

  const activeModel = useMemo(() => versions.find(v => v.id === activeVersionId), [versions, activeVersionId]);

  // --- 1. DATA INGESTION ---
  useEffect(() => {
      const riskLayer = DATA_LAYERS.get('risk_strategy');
      if (riskLayer && riskLayer.riskPackage) {
          const pkg = riskLayer.riskPackage;
          
          // Check if this package is already in our session list (by timestamp)
          const exists = SESSION_VERSIONS.some(v => v.timestamp === pkg.timestamp);
          
          if (!exists) {
              // Calculate Metrics
              const equityCurve = pkg.timeSeries.map(d => d.equity);
              // Safely calculate returns handling potential undefined previous values
              const returns = pkg.timeSeries.map((d, i) => {
                  if (i === 0) return 0;
                  const prev = pkg.timeSeries[i - 1];
                  const prevEquity = prev ? prev.equity : 1;
                  return (d.equity - prevEquity) / prevEquity;
              });
              
              // Split IS/OOS (70/30)
              const splitIdx = Math.floor(returns.length * 0.7);
              const isReturns = returns.slice(0, splitIdx);
              const oosReturns = returns.slice(splitIdx);
              
              const calcSharpe = (rets: number[]) => {
                  const mean = QuantMath.mean(rets);
                  const std = QuantMath.std(rets);
                  return std > 0 ? (mean / std) * Math.sqrt(252) : 0;
              };

              const isSharpe = calcSharpe(isReturns);
              const oosSharpe = calcSharpe(oosReturns);
              const oosDrift = Math.abs(oosSharpe - isSharpe); // Lower is better

              const cagr = QuantMath.cagr(equityCurve[0], equityCurve[equityCurve.length - 1], equityCurve.length);
              const maxDD = QuantMath.maxDrawdown(equityCurve);

              const newVersion: ModelVersion = {
                  id: `v${SESSION_VERSIONS.length + 1}.0`,
                  timestamp: pkg.timestamp,
                  name: SESSION_VERSIONS.length === 0 ? 'Initial Baseline' : `Iteration ${SESSION_VERSIONS.length}`,
                  package: pkg,
                  metrics: {
                      sharpe: parseFloat(oosSharpe.toFixed(2)),
                      cagr: parseFloat((cagr * 100).toFixed(1)),
                      maxDD: parseFloat((maxDD * 100).toFixed(1)),
                      oosDrift: parseFloat(oosDrift.toFixed(2))
                  },
                  isBaseline: SESSION_VERSIONS.length === 0
              };

              SESSION_VERSIONS = [...SESSION_VERSIONS, newVersion];
              setVersions(SESSION_VERSIONS);
              setActiveVersionId(newVersion.id);
          } else if (!activeVersionId && SESSION_VERSIONS.length > 0) {
              // Set initial selection if re-mounting
              setActiveVersionId(SESSION_VERSIONS[SESSION_VERSIONS.length - 1].id);
          }
      }
  }, []);

  // --- CHART DATA PREP ---
  const chartData = useMemo(() => {
      if (!activeModel) return [];
      
      const timeSeries = activeModel.package.timeSeries;
      const len = timeSeries.length;
      
      // Correcting the benchmark calculation to be cumulative
      let benchEquity = 1000;

      const data = timeSeries.map((d, i) => {
          const dailyRet = d.benchmarkReturn || 0;
          if (i > 0) benchEquity = benchEquity * (1 + dailyRet);

          return {
            date: d.date,
            equity: d.equity,
            benchmark: benchEquity,
            // OOS Shading Logic
            isOOS: i > len * 0.7
          };
      });
      return data;
  }, [activeModel]);

  const attributionData = useMemo(() => {
      if (!activeModel || !activeModel.package.attribution) return [];
      const weights = activeModel.package.attribution.weights;
      return Object.entries(weights).map(([name, weight]) => ({
          name, 
          weight: parseFloat((weight * 100).toFixed(1))
      })).sort((a, b) => b.weight - a.weight);
  }, [activeModel]);

  const rollingSharpeData = useMemo(() => {
      if (!activeModel) return [];
      // Calculate 30-day Rolling Sharpe
      // FIX: Use explicit safe access to previous element to avoid TS arithmetic errors
      const ts = activeModel.package.timeSeries;
      const returns = ts.map((d, i) => {
          if (i === 0) return 0;
          const prev = ts[i-1];
          const prevEquity = prev ? prev.equity : d.equity;
          return (d.equity - prevEquity) / prevEquity;
      });
      
      const window = 22; // ~1 Month
      const heatPoints = [];
      for(let i = window; i < returns.length; i += 5) { // Sample every 5 days for grid
          const slice = returns.slice(i - window, i);
          const mean = QuantMath.mean(slice);
          const std = QuantMath.std(slice);
          const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
          heatPoints.push(sharpe);
      }
      return heatPoints;
  }, [activeModel]);

  // --- AI OPTIMIZER ---
  const runAiOptimization = async () => {
      if (!activeModel || !process.env.API_KEY) return;
      setAiAnalysis(prev => ({ ...prev, loading: true, text: "Running diagnostic scan..." }));

      const prompt = `
        Role: Quant Fund Portfolio Manager.
        Task: Analyze the performance of Model Version ${activeModel.id}.
        
        Metrics (Out-of-Sample):
        - Sharpe Ratio: ${activeModel.metrics.sharpe}
        - CAGR: ${activeModel.metrics.cagr}%
        - Max Drawdown: ${activeModel.metrics.maxDD}%
        - IS/OOS Drift (Overfitting Risk): ${activeModel.metrics.oosDrift} (Lower is better)
        
        Factor Weights:
        ${attributionData.map(d => `${d.name}: ${d.weight}%`).join(', ')}
        
        Provide:
        1. A strict diagnostic assessment (Pass/Fail/Warn).
        2. Specifically identify if the model is overfitting based on the Drift score.
        3. Suggest 3 concrete parameter changes for the next iteration (e.g., "Increase Stop Loss multiplier to 2.5x").
        
        Return JSON:
        {
            "diagnostic": "...",
            "suggestions": ["...", "...", "..."]
        }
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          
          const text = response.text;
          if (text) {
              const cleaned = text.replace(/```json|```/g, '').trim();
              const json = JSON.parse(cleaned);
              setAiAnalysis({
                  loading: false,
                  text: json.diagnostic,
                  suggestions: json.suggestions || []
              });
          }
      } catch (e) {
          setAiAnalysis(prev => ({ ...prev, loading: false, text: "Optimization service offline." }));
      }
  };

  const deployToCockpit = () => {
      if (!activeModel) return;
      // In a real app, this would persist the strategy config to the trading engine.
      alert(`Model ${activeModel.id} deployed to Live Cockpit environment.`);
      onNavigate('cockpit');
  };

  return (
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Precision Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-xl font-bold tracking-tight text-white">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#90a4cb] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-10 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => item.view !== 'algorithm' && onNavigate(item.view)}
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
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-[#222f49] bg-[#101622] flex flex-col shrink-0">
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] mb-4">Pipeline Layers</p>
            <nav className="flex flex-col gap-2">
              {pipelineLayers.map((layer) => (
                <div 
                  key={layer.name}
                  onClick={() => layer.id && onNavigate(layer.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer border ${
                    layer.active 
                    ? 'bg-[#0d59f2]/10 text-[#0d59f2] border-[#0d59f2]/20 shadow-sm' 
                    : 'text-[#90a4cb] border-transparent hover:bg-[#222f49] hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined ${layer.active ? 'fill-1' : ''}`}>{layer.icon}</span>
                  <p className="text-sm font-semibold">{layer.name}</p>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-[#222f49]">
            <h3 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-4">Model Genealogy</h3>
            <div className="space-y-2">
                {versions.map(v => (
                    <div 
                        key={v.id} 
                        onClick={() => setActiveVersionId(v.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            activeVersionId === v.id 
                            ? 'bg-[#0d59f2]/20 border-[#0d59f2] shadow-md' 
                            : 'bg-[#182234] border-[#314368] hover:border-[#90a4cb]'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${v.isBaseline ? 'bg-[#0d59f2] text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {v.id}
                            </span>
                            <span className="text-[9px] text-[#90a4cb]">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-bold text-white mb-2">{v.name}</p>
                        <div className="flex justify-between text-[9px]">
                            <div className="text-center">
                                <span className="block text-[#90a4cb]">Sharpe</span>
                                <span className="block font-bold text-[#0bda5e]">{v.metrics.sharpe}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[#90a4cb]">Drift</span>
                                <span className={`block font-bold ${v.metrics.oosDrift > 0.5 ? 'text-[#fa6238]' : 'text-[#0bda5e]'}`}>{v.metrics.oosDrift}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {versions.length === 0 && (
                    <div className="text-center p-4 text-[#90a4cb] text-xs italic border border-dashed border-[#314368] rounded-lg">
                        Waiting for Push from Risk Control...
                    </div>
                )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f1a] relative overflow-hidden">
            
            {/* Top Bar */}
            <div className="h-14 border-b border-[#222f49] bg-[#161d2b] px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">all_inclusive</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Evolutionary Lab</h2>
                    {activeModel && (
                        <span className="ml-4 px-3 py-1 bg-[#182234] border border-[#314368] rounded text-[10px] text-[#90a4cb]">
                            Active Asset: <span className="text-white font-bold">{activeModel.package.sourceAsset}</span>
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="px-3 py-1.5 rounded bg-[#182234] border border-[#314368] text-[10px] font-bold uppercase hover:text-white text-[#90a4cb] transition-colors">
                        Compare Baseline
                    </button>
                    <button 
                        onClick={deployToCockpit}
                        disabled={!activeModel}
                        className={`px-4 py-1.5 rounded bg-[#0d59f2] text-white text-[10px] font-bold uppercase hover:bg-[#1a66ff] transition-all flex items-center gap-2 ${!activeModel ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        Deploy to Cockpit
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-[3] flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-6 gap-6">
                    
                    {/* CHART 1: Equity Curve with OOS Split */}
                    <div className="bg-[#182234]/30 border border-[#314368] rounded-xl p-4 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#0d59f2]">show_chart</span>
                                Cumulative Alpha (OOS Verification)
                            </h3>
                            <div className="flex gap-4 text-[10px] uppercase font-bold text-[#90a4cb]">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#fa6238]"></span> Strategy</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#555]"></span> Benchmark</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#182234] border border-[#314368] rounded-sm"></span> OOS Region</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 relative">
                            {chartData.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-[#90a4cb] text-xs">Waiting for Strategy Push...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fa6238" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#fa6238" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                        <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                                        <YAxis domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} width={40} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                                        />
                                        
                                        {/* OOS Shading */}
                                        <ReferenceLine x={chartData[Math.floor(chartData.length * 0.7)]?.date} stroke="#314368" strokeDasharray="3 3" label={{ value: "OOS START", fill: "#90a4cb", fontSize: 10, position: 'insideTopRight' }} />
                                        
                                        <Line type="monotone" dataKey="benchmark" stroke="#555" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                                        <Area type="monotone" dataKey="equity" stroke="#fa6238" strokeWidth={2} fill="url(#eqGradient)" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6 min-h-[250px]">
                        {/* CHART 2: Attribution */}
                        <div className="flex-1 bg-[#182234]/30 border border-[#314368] rounded-xl p-4 flex flex-col">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Factor Weight Attribution</h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attributionData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222f49" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} width={80} />
                                        <Tooltip cursor={{fill: '#222f49'}} contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', fontSize: '10px' }} />
                                        <Bar dataKey="weight" fill="#0d59f2" radius={[0, 4, 4, 0]} barSize={12}>
                                            {attributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.weight > 0 ? '#0d59f2' : '#fa6238'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART 3: Rolling Heatmap */}
                        <div className="flex-1 bg-[#182234]/30 border border-[#314368] rounded-xl p-4 flex flex-col">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Rolling Sharpe Heatmap (12M)</h3>
                            <div className="flex-1 flex flex-wrap content-start gap-1 p-2 bg-[#0a0c10] rounded border border-[#222f49] overflow-y-auto custom-scrollbar">
                                {rollingSharpeData.map((val, i) => {
                                    // Map sharpe to color
                                    let color = '#222f49'; // Neutral
                                    if (val > 3) color = '#0bda5e';
                                    else if (val > 1.5) color = '#10b981'; // Green-500
                                    else if (val > 0) color = '#34d399'; // Green-400
                                    else if (val > -1) color = '#fbbf24'; // Amber
                                    else color = '#fa6238'; // Red

                                    return (
                                        <div 
                                            key={i} 
                                            className="w-6 h-8 rounded-sm transition-all hover:scale-110"
                                            style={{ backgroundColor: color, opacity: 0.8 }}
                                            title={`Sharpe: ${val.toFixed(2)}`}
                                        ></div>
                                    );
                                })}
                                <div className="w-full flex justify-between mt-auto pt-2 text-[9px] text-[#90a4cb] font-bold uppercase">
                                    <span>Jan</span>
                                    <span>Dec</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Diagnostics */}
                <div className="w-80 bg-[#0a0c10] border-l border-[#222f49] flex flex-col shrink-0 p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-bold text-[#90a4cb] uppercase tracking-widest mb-6">Health Diagnostics</h3>
                    
                    {/* Optimizer Card */}
                    <div className="bg-[#182234] border border-[#0d59f2]/30 rounded-xl p-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-[#0d59f2]">auto_awesome</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0d59f2] mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">construction</span>
                            AI Optimizer
                        </h4>
                        
                        <div className="min-h-[100px] mb-4 text-[11px] leading-relaxed text-slate-300">
                            {aiAnalysis.loading ? (
                                <div className="flex items-center gap-2 text-[#90a4cb]">
                                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                    analyzing equity surface...
                                </div>
                            ) : (
                                aiAnalysis.text
                            )}
                        </div>

                        {aiAnalysis.suggestions.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {aiAnalysis.suggestions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[10px] text-[#0bda5e] bg-[#0bda5e]/10 p-2 rounded border border-[#0bda5e]/20">
                                        <span className="material-symbols-outlined text-xs">check</span>
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={runAiOptimization}
                            disabled={aiAnalysis.loading || !activeModel}
                            className="w-full py-2 bg-[#0d59f2] hover:bg-[#1a66ff] text-white text-xs font-bold uppercase rounded transition-all disabled:opacity-50"
                        >
                            Auto-Tune Parameters
                        </button>
                    </div>

                    {/* Stability Metrics */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[#182234] border border-[#222f49] rounded-lg">
                            <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Stability Index</span>
                            <span className="text-sm font-black text-white">88/100</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#182234] border border-[#222f49] rounded-lg">
                            <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Parameter Sensitivity</span>
                            <span className="text-sm font-black text-[#fa6238]">High</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#182234] border border-[#222f49] rounded-lg">
                            <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Sample Efficiency</span>
                            <span className="text-sm font-black text-[#0bda5e]">Good</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};