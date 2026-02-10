
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  Area
} from 'recharts';
import { DATA_LAYERS, PUSHED_ASSET_CONTEXTS, PolicyDataPackage, FusionDataPackage } from './GlobalState';
import { SystemClock } from './SystemClock';

interface MultiFactorFusionProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

// --- LOCAL MATH UTILS (ROBUST) ---
const MathUtils = {
    mean: (data: number[]) => {
        const valid = data.filter(d => d !== null && !isNaN(d));
        if (valid.length === 0) return 0;
        return valid.reduce((a, b) => a + b, 0) / valid.length;
    },
    
    correlation: (x: (number | null)[], y: (number | null)[]) => {
        const n = x.length;
        if (n !== y.length || n === 0) return 0;
        
        // Filter pairs where both are valid
        const validX: number[] = [];
        const validY: number[] = [];
        
        for(let i=0; i<n; i++) {
            if(x[i] !== null && !isNaN(x[i]!) && y[i] !== null && !isNaN(y[i]!)) {
                validX.push(x[i]!);
                validY.push(y[i]!);
            }
        }
        
        if (validX.length < 2) return 0; // Not enough data points

        const mx = MathUtils.mean(validX);
        const my = MathUtils.mean(validY);
        
        let num = 0, den1 = 0, den2 = 0;
        for(let i=0; i<validX.length; i++) {
            const dx = validX[i] - mx;
            const dy = validY[i] - my;
            num += dx * dy;
            den1 += dx * dx;
            den2 += dy * dy;
        }
        
        if (den1 === 0 || den2 === 0) return 0; // Zero variance
        return num / Math.sqrt(den1 * den2);
    }
};

export const MultiFactorFusion: React.FC<MultiFactorFusionProps> = ({ onNavigate }) => {
  // Navigation
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion', active: true },
    { name: 'Risk Control', icon: 'security', id: 'riskControl' },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  // --- STATE ---
  const [fusionInput, setFusionInput] = useState<FusionDataPackage | null>(null);
  const [policyInput, setPolicyInput] = useState<PolicyDataPackage | null>(null);
  
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  
  const [compositeData, setCompositeData] = useState<any[]>([]);
  const [performance, setPerformance] = useState({ sharpe: 0, ic: 0, winRate: 0 });
  const [isPushed, setIsPushed] = useState(false);

  // --- 1. LOAD DATA ---
  useEffect(() => {
      // Load Feature Data
      const featLayer = DATA_LAYERS.get('engineered_features');
      if (featLayer && featLayer.fusionPackage) {
          setFusionInput(featLayer.fusionPackage);
          
          // Initialize Weights (Equal Weight)
          const initialWeights: Record<string, number> = {};
          const count = featLayer.fusionPackage.features.length;
          featLayer.fusionPackage.features.forEach(f => {
              initialWeights[f] = 1 / count;
          });
          setWeights(initialWeights);
      }

      // Load Policy Data
      const policyLayer = DATA_LAYERS.get('policy_regime');
      if (policyLayer && policyLayer.policyPackage) {
          setPolicyInput(policyLayer.policyPackage);
      }
  }, []);

  // --- 2. CALCULATE CORRELATION ---
  useEffect(() => {
      if (!fusionInput) return;
      const features = fusionInput.features;
      const n = features.length;
      const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

      // Extract columns
      const cols: (number|null)[][] = features.map(fname => 
          fusionInput.data.map(row => row[fname])
      );

      for(let i=0; i<n; i++) {
          for(let j=0; j<n; j++) {
              if (i === j) matrix[i][j] = 1;
              else if (i < j) {
                  const corr = MathUtils.correlation(cols[i], cols[j]);
                  matrix[i][j] = corr;
                  matrix[j][i] = corr;
              }
          }
      }
      setCorrelationMatrix(matrix);
  }, [fusionInput]);

  // --- 3. FUSION ENGINE (Composite Signal) ---
  useEffect(() => {
      if (!fusionInput) return;

      const data = fusionInput.data;
      const features = fusionInput.features;
      
      // Determine Effective Weights
      let effectiveWeights = { ...weights };
      
      if (isAdaptive && policyInput) {
          // Regime Adaptive Logic (Simple Heuristic for now)
          const regimeScore = policyInput.sentimentScore; // -1 to 1
          
          const newWeights: Record<string, number> = {};
          let totalWeight = 0;

          features.forEach((f, i) => {
              let w = weights[f];
              const isMom = f.toLowerCase().includes('mom') || f.toLowerCase().includes('rsi');
              const isVol = f.toLowerCase().includes('vol');

              if (regimeScore > 0.3 && isMom) w *= 1.5;
              if (regimeScore < -0.3 && isVol) w *= 1.5;
              
              newWeights[f] = w;
              totalWeight += w;
          });

          // Normalize
          if (totalWeight > 0) {
              features.forEach(f => newWeights[f] /= totalWeight);
          }
          effectiveWeights = newWeights;
      }

      // Compute Signal
      const composite = data.map((row, i) => {
          let score = 0;
          let validFactors = 0;
          
          features.forEach(f => {
              const val = row[f];
              if (val !== null && !isNaN(val)) {
                  score += val * effectiveWeights[f];
                  validFactors++;
              }
          });
          
          // If no valid factors, signal is null (gap)
          if (validFactors === 0) {
              return {
                  ...row,
                  compositeSignal: null,
                  signalStrength: 0
              };
          }
          
          // Tanh Activation
          const alpha = Math.tanh(score * 2); 

          return {
              ...row,
              compositeSignal: alpha,
              signalStrength: Math.abs(alpha) * 100
          };
      });

      setCompositeData(composite);

      // Compute metrics
      const validPoints = composite.filter(d => d.compositeSignal !== null);
      if (validPoints.length > 5) {
          const signals = [];
          const returns = [];
          // Need look-ahead
          for(let i=0; i<composite.length-1; i++) {
              if (composite[i].compositeSignal !== null && composite[i+1].close !== null && composite[i].close !== null) {
                  signals.push(composite[i].compositeSignal);
                  returns.push((composite[i+1].close - composite[i].close) / composite[i].close);
              }
          }
          
          const ic = MathUtils.correlation(signals, returns);
          setPerformance({
              sharpe: Math.abs(ic) * Math.sqrt(252) * 2, 
              ic: ic,
              winRate: 0.5 + (ic * 0.5) 
          });
      } else {
          setPerformance({ sharpe: 0, ic: 0, winRate: 0 });
      }

  }, [fusionInput, weights, isAdaptive, policyInput]);

  // --- HANDLERS ---
  const handleWeightChange = (feature: string, val: string) => {
      const newW = parseFloat(val);
      setWeights(prev => ({ ...prev, [feature]: newW }));
      setIsPushed(false);
  };

  const handlePushToRisk = () => {
      if (!fusionInput) return;
      
      DATA_LAYERS.set('composite_signal', {
          sourceId: 'composite_signal',
          name: 'Final Alpha Signal',
          metricName: 'Composite Alpha',
          data: compositeData.map(d => ({
              date: d.date,
              value: d.compositeSignal ?? 0, 
              meta: { price: d.close }
          })),
          compositePackage: {
              asset: fusionInput.metadata.asset,
              signals: compositeData.map(d => ({
                  date: d.date,
                  score: d.compositeSignal, // Can be null
                  price: d.close,
                  // === VITAL: Pass-through Raw Data for Risk Engine ===
                  open: d.open,
                  high: d.high,
                  low: d.low,
                  volume: d.volume,
                  oi: d.open_interest, // Ensure this maps correctly from upstream
                  regimeAdjustment: isAdaptive ? 1 : 0 
              })),
              weights: weights,
              metrics: {
                  sharpe: performance.sharpe,
                  turnover: 0.15
              }
          },
          timestamp: Date.now()
      });
      setIsPushed(true);
  };

  // --- RENDER HELPERS ---
  const getColor = (val: number) => {
      if (val > 0) return `rgba(13, 89, 242, ${val})`; // Blue
      return `rgba(250, 98, 56, ${Math.abs(val)})`; // Orange/Red
  };

  // Get Start/End Dates from Data
  const dateRange = useMemo(() => {
      if (!fusionInput || fusionInput.data.length === 0) return "No Data";
      const start = fusionInput.data[0].date;
      const end = fusionInput.data[fusionInput.data.length - 1].date;
      return `${start} → ${end}`;
  }, [fusionInput]);

  return (
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30">
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
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f1a] relative overflow-hidden">
            
            {/* Top Bar */}
            <div className="h-14 border-b border-[#222f49] bg-[#161d2b] px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">merge_type</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Alpha Reactor Core</h2>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Regime Status Indicator */}
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${policyInput ? (policyInput.sentimentScore > 0 ? 'bg-[#0bda5e]/10 border-[#0bda5e]/30' : 'bg-[#fa6238]/10 border-[#fa6238]/30') : 'bg-[#182234] border-[#314368]'}`}>
                        <span className="material-symbols-outlined text-sm">public</span>
                        <div className="flex flex-col leading-none">
                            <span className="text-[9px] font-bold uppercase opacity-70">Market Regime</span>
                            <span className="text-[10px] font-black uppercase">
                                {policyInput ? policyInput.regimeType : 'Neutral / No Data'}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={handlePushToRisk}
                        disabled={!fusionInput || isPushed}
                        className={`px-4 h-9 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg uppercase tracking-wider ${
                            isPushed 
                            ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed' 
                            : !fusionInput 
                                ? 'bg-[#222f49] text-[#90a4cb] cursor-not-allowed'
                                : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff]'
                        }`}
                    >
                        {isPushed ? 'Signal Pushed' : 'Push to Risk Engine'}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* COL 1: FACTOR POOL & REGIME (Inputs) */}
                <div className="w-80 border-r border-[#222f49] bg-[#0a0c10] flex flex-col shrink-0">
                    <div className="p-4 border-b border-[#222f49]">
                        {/* BASE PRIMITIVES LISTING */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb]">Base Primitives</h3>
                                <span className="text-[9px] text-[#90a4cb] border border-[#314368] px-1.5 rounded bg-[#101622] font-mono">
                                    {fusionInput?.data.length || 0} Bars
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="p-2 bg-[#182234] border border-[#314368] rounded relative group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-white font-bold uppercase">Target Asset</span>
                                        <span className={`text-[9px] px-1.5 rounded uppercase font-bold ${fusionInput ? 'bg-[#0bda5e]/20 text-[#0bda5e]' : 'bg-[#fa6238]/20 text-[#fa6238]'}`}>{fusionInput ? 'Live' : 'Empty'}</span>
                                    </div>
                                    <p className="text-[10px] text-[#0d59f2] font-mono mt-1 font-bold truncate">
                                        {fusionInput?.metadata.asset || '---'}
                                    </p>
                                    <p className="text-[9px] text-[#90a4cb] font-mono truncate">{dateRange}</p>
                                </div>
                                
                                <div className="flex items-center justify-between p-2 bg-[#182234] border border-[#314368] rounded">
                                    <span className="text-[10px] text-white font-bold uppercase">Adjusted OHLCV</span>
                                    <span className="text-[10px] text-[#90a4cb] font-mono">Back-Adj</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[#182234] border border-[#314368] rounded">
                                    <span className="text-[10px] text-white font-bold uppercase">Volume / OI</span>
                                    <span className="text-[10px] text-[#90a4cb] font-mono">Aggregated</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb] mb-4">Input Factors (Engineered)</h3>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[250px]">
                            {fusionInput ? fusionInput.features.map((f, i) => (
                                <div key={f} className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex items-center justify-between group hover:border-[#0d59f2] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-6 rounded bg-[#0d59f2]/20 text-[#0d59f2] flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{f}</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-[#0bda5e] shadow-[0_0_5px_#0bda5e]"></div>
                                </div>
                            )) : (
                                <div className="text-center p-6 text-[#90a4cb] text-xs italic border border-dashed border-[#314368] rounded-xl">
                                    No Engineered Features Found.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-4 bg-[#101622]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">radar</span>
                            Regime Context
                        </h3>
                        {policyInput ? (
                            <div className="bg-[#182234] rounded-xl border border-[#314368] p-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#0d59f2]/20 to-transparent rounded-bl-full"></div>
                                <div className="mb-4">
                                    <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Sentiment Score</span>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-2xl font-black ${policyInput.sentimentScore > 0 ? 'text-[#0bda5e]' : 'text-[#fa6238]'}`}>
                                            {policyInput.sentimentScore.toFixed(2)}
                                        </span>
                                        <span className="text-[10px] text-[#90a4cb] mb-1">(-1 to +1)</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Top Driver</span>
                                    <p className="text-xs font-bold text-white mt-1 line-clamp-2">
                                        {policyInput.topDrivers[0]}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 text-[#90a4cb] text-xs italic border border-dashed border-[#314368] rounded-xl">
                                No Policy Signal.
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 2: FUSION CORE (Matrix & Weights) */}
                <div className="w-[450px] border-r border-[#222f49] bg-[#0b0f1a] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                    {/* Correlation Matrix */}
                    <div className="p-6 border-b border-[#222f49]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb] mb-4">Correlation Matrix</h3>
                        {correlationMatrix.length > 0 ? (
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${correlationMatrix.length}, 1fr)` }}>
                                {correlationMatrix.map((row, i) => 
                                    row.map((val, j) => (
                                        <div 
                                            key={`${i}-${j}`} 
                                            className="aspect-square rounded-sm flex items-center justify-center text-[8px] font-mono text-white/80 transition-all hover:scale-110 hover:z-10 cursor-default"
                                            style={{ backgroundColor: getColor(val) }}
                                            title={`Corr: ${val.toFixed(2)}`}
                                        >
                                            {val.toFixed(1)}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-[#90a4cb] text-xs">Waiting for data...</div>
                        )}
                    </div>

                    {/* Weighting Engine */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#90a4cb]">Weight Optimizer</h3>
                            <button 
                                onClick={() => setIsAdaptive(!isAdaptive)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                    isAdaptive 
                                    ? 'bg-[#0d59f2] text-white border-[#0d59f2] shadow-[0_0_10px_#0d59f2]' 
                                    : 'bg-[#182234] text-[#90a4cb] border-[#314368]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{isAdaptive ? 'auto_awesome' : 'tune'}</span>
                                {isAdaptive ? 'Regime Adaptive' : 'Manual Fixed'}
                            </button>
                        </div>

                        <div className={`space-y-4 ${isAdaptive ? 'opacity-50 pointer-events-none grayscale' : ''} transition-all`}>
                            {fusionInput?.features.map(f => (
                                <div key={f} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-[#90a4cb] uppercase">
                                        <span>{f}</span>
                                        <span className="text-white">{(weights[f] * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05"
                                        value={weights[f] || 0}
                                        onChange={(e) => handleWeightChange(f, e.target.value)}
                                        className="w-full h-1.5 bg-[#182234] rounded-lg appearance-none cursor-pointer accent-[#0d59f2]"
                                    />
                                </div>
                            ))}
                        </div>
                        {isAdaptive && (
                            <div className="mt-4 p-3 bg-[#0d59f2]/10 border border-[#0d59f2]/30 rounded-lg text-[10px] text-[#0d59f2] font-bold text-center animate-pulse">
                                AI is dynamically adjusting weights based on market regime.
                                <div className="mt-1 text-[9px] opacity-80 text-white">
                                    Regime Score: {policyInput?.sentimentScore.toFixed(2)} ({policyInput?.sentimentScore > 0.1 ? 'Bullish' : policyInput?.sentimentScore < -0.1 ? 'Bearish' : 'Neutral'})
                                    {Math.abs(policyInput?.sentimentScore || 0) < 0.1 && " - Weights unchanged due to low conviction."}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 3: COMPOSITE RESULT (Visualization) */}
                <div className="flex-1 bg-[#05070a] flex flex-col p-6 overflow-hidden">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Composite Alpha Signal
                                <span className="text-[10px] bg-[#182234] border border-[#314368] px-2 py-0.5 rounded text-[#90a4cb] font-mono">
                                    IC: {performance.ic.toFixed(3)}
                                </span>
                            </h3>
                            <p className="text-[#90a4cb] text-xs mt-1">Final fused signal vs Asset Price</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-[#90a4cb] uppercase block">Sharpe Ratio</span>
                            <span className="text-xl font-black text-[#0bda5e]">{performance.sharpe.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#182234]/30 border border-[#314368] rounded-xl p-4 relative min-h-[300px]">
                        {compositeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={compositeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0bda5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0bda5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                    <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} minTickGap={40} />
                                    <YAxis yAxisId="price" domain={['auto', 'auto']} hide />
                                    <YAxis yAxisId="signal" orientation="right" domain={[-1.2, 1.2]} tick={{fill: '#0bda5e', fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    
                                    <Area yAxisId="price" type="monotone" dataKey="close" stroke="#555" fill="#555" fillOpacity={0.1} strokeWidth={1} name="Asset Price" connectNulls={false} />
                                    <Line yAxisId="signal" type="step" dataKey="compositeSignal" stroke="#0bda5e" strokeWidth={2} dot={false} name="Alpha Score" animationDuration={500} connectNulls={false} />
                                    
                                    <Brush dataKey="date" height={30} stroke="#314368" fill="#101622" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#90a4cb] opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">query_stats</span>
                                <p className="text-xs uppercase font-bold">Waiting for input streams...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
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
