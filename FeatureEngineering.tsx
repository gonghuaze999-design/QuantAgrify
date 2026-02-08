
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Cell,
  ReferenceLine,
  Legend
} from 'recharts';
import { PROCESSED_DATASET, DATA_LAYERS, FEATURE_VIEW_CACHE } from './GlobalState';
import { SystemClock } from './SystemClock';

interface FeatureEngineeringProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

// --- QUANT ENGINE (Strict Deterministic Math) ---
const QuantMath = {
    mean: (arr: number[]) => {
        const valid = arr.filter(n => n !== null && !isNaN(n));
        if (valid.length === 0) return 0;
        return valid.reduce((a, b) => a + b, 0) / valid.length;
    },
    
    std: (arr: number[]) => {
        const valid = arr.filter(n => n !== null && !isNaN(n));
        if (valid.length < 2) return 0;
        const m = QuantMath.mean(valid);
        return Math.sqrt(valid.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (valid.length - 1));
    },

    rolling: (arr: number[], window: number, fn: (slice: number[]) => number) => {
        const result: (number | null)[] = [];
        for (let i = 0; i < arr.length; i++) {
            if (i < window - 1) {
                result.push(null);
            } else {
                const slice = arr.slice(i - window + 1, i + 1);
                // Only calculate if slice has enough valid data
                if (slice.every(v => v !== null && !isNaN(v))) {
                    result.push(fn(slice as number[]));
                } else {
                    result.push(null);
                }
            }
        }
        return result;
    },

    // 1. Momentum: Rate of Change
    momentum: (prices: number[], window: number) => {
        const res: (number | null)[] = [];
        for(let i=0; i<prices.length; i++) {
            if(i < window) res.push(null);
            else {
                const prev = prices[i-window];
                if (prev === 0 || prev === null) res.push(null);
                else res.push((prices[i] - prev) / prev);
            }
        }
        return res;
    },

    // 2. Volatility: Rolling Standard Deviation of Returns
    volatility: (prices: number[], window: number) => {
        const returns = prices.map((p, i) => (i === 0 || prices[i-1] === 0) ? 0 : Math.log(p / prices[i-1]));
        return QuantMath.rolling(returns, window, (slice) => QuantMath.std(slice) * Math.sqrt(252));
    },

    // 3. RSI: Relative Strength Index
    rsi: (prices: number[], window: number = 14) => {
        const gains: number[] = [];
        const losses: number[] = [];
        for (let i = 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i-1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }
        // RSI requires specialized rolling average (Wilder's Smoothing usually, keeping simple SMA for robustness here)
        const avgGain = QuantMath.rolling(gains, window, QuantMath.mean);
        const avgLoss = QuantMath.rolling(losses, window, QuantMath.mean);
        
        return prices.map((_, i) => {
            if (i < window) return null;
            const ag = avgGain[i-1];
            const al = avgLoss[i-1];
            
            if (ag === null || al === null) return null;
            if (al === 0) return 100;
            
            const rs = ag / al;
            return 100 - (100 / (1 + rs));
        });
    },

    // 4. Term Structure Proxy (Liquidity Pressure)
    termStructureProxy: (vol: number[], oi: number[]) => {
        return vol.map((v, i) => {
            if (oi[i] === 0 || oi[i] === null || isNaN(oi[i])) return null; // Return null if data missing
            return (v / oi[i]) * 100;
        });
    },

    // 5. External Data Pass-through (GEO Factors)
    // Simply normalizes the fused layer data (e.g. GDD or Precip)
    externalSignal: (layerValues: (number | undefined)[]) => {
        return layerValues.map(v => (v === undefined || v === null || isNaN(v)) ? null : v);
    },

    // Evaluation Metrics
    calculateIC: (factor: (number|null)[], returns: (number|null)[]) => {
        const x: number[] = [];
        const y: number[] = [];
        for(let i=0; i<factor.length; i++) {
            if (factor[i] !== null && returns[i] !== null && !isNaN(factor[i]!) && !isNaN(returns[i]!)) {
                x.push(factor[i]!);
                y.push(returns[i]!);
            }
        }
        if (x.length < 10) return 0;
        
        const xMean = QuantMath.mean(x);
        const yMean = QuantMath.mean(y);
        let num = 0, den1 = 0, den2 = 0;
        for(let i=0; i<x.length; i++) {
            num += (x[i] - xMean) * (y[i] - yMean);
            den1 += Math.pow(x[i] - xMean, 2);
            den2 += Math.pow(y[i] - yMean, 2);
        }
        if (den1 === 0 || den2 === 0) return 0;
        return num / Math.sqrt(den1 * den2);
    },

    calculateQuantileReturns: (factor: (number|null)[], fwdReturns: (number|null)[], buckets: number = 5) => {
        const pairs: {f: number, r: number}[] = [];
        for(let i=0; i<factor.length; i++) {
            if (factor[i] !== null && fwdReturns[i] !== null && !isNaN(factor[i]!) && !isNaN(fwdReturns[i]!)) {
                pairs.push({ f: factor[i]!, r: fwdReturns[i]! });
            }
        }
        if (pairs.length < buckets) return [];

        pairs.sort((a, b) => a.f - b.f);
        
        const chunkSize = Math.floor(pairs.length / buckets);
        const results = [];
        
        for(let i=0; i<buckets; i++) {
            const slice = pairs.slice(i * chunkSize, (i+1) * chunkSize);
            if (slice.length === 0) {
                results.push({ group: `Q${i+1}`, ret: 0 });
                continue;
            }
            const avgRet = slice.reduce((sum, p) => sum + p.r, 0) / slice.length;
            results.push({ group: `Q${i+1}`, ret: avgRet * 100 }); 
        }
        return results;
    }
};

interface FactorDefinition {
  id: string;
  name: string;
  category: 'MARKET' | 'GEO' | 'FUNDAMENTAL' | 'SENTIMENT';
  description: string;
  code_snippet: string; 
  params: any;
  status: 'Active' | 'Draft';
  source: 'TEMPLATE' | 'AI_GEN';
}

const FACTOR_TEMPLATES = [
  { id: 'mom_10', name: 'Momentum (10d)', category: 'MARKET', desc: '10-day price rate of change. Tracks trend persistence.', code: 'df["close"].pct_change(10)', params: { window: 10 } },
  { id: 'vol_20', name: 'Volatility (20d)', category: 'MARKET', desc: '20-day annualized vol. Measures market fear/uncertainty.', code: 'df["close"].pct_change().rolling(20).std() * sqrt(252)', params: { window: 20 } },
  { id: 'rsi_14', name: 'RSI (14)', category: 'MARKET', desc: 'Relative Strength Index. Detects overbought/oversold conditions.', code: 'ta.RSI(df["close"], timeperiod=14)', params: { window: 14 } },
  { id: 'liq_pressure', name: 'Liquidity Pressure', category: 'MARKET', desc: 'Vol/OI Ratio. Indicates speculative heat vs hedging.', code: 'df["volume"] / df["open_interest"]', params: {} },
  { id: 'basis_mom', name: 'Basis Momentum', category: 'FUNDAMENTAL', desc: 'Change rate of (Spot - Future). Signals supply tightness.', code: '(df["spot"] - df["close"]).diff(5)', params: { window: 5 } },
  // Restored GEO Factors
  { id: 'geo_gdd', name: 'GDD Accumulation', category: 'GEO', desc: 'Cumulative Growing Degree Days. Requires fused Weather Layer.', code: 'df["layer_value"].cumsum()', params: {} },
  { id: 'geo_raw', name: 'Raw External Signal', category: 'GEO', desc: 'Direct mapping of fused external layer (e.g. NDVI/Soil).', code: 'df["layer_value"]', params: {} },
];

interface CalculationCacheItem {
    factorValues: (number | null)[];
    chartData: any[];
    metrics: { ic: number; ir: number; autocorr: number; turnover: number };
    quantileData: any[];
}

export const FeatureEngineering: React.FC<FeatureEngineeringProps> = ({ onNavigate }) => {
  // Navigation
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering', active: true },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl' },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  // State
  const [activeDataset, setActiveDataset] = useState<any | null>(null);
  const [activeFactors, setActiveFactors] = useState<FactorDefinition[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiAudit, setAiAudit] = useState<{ analysis: string; score: number; verdict: 'PASS' | 'FAIL' | 'NEUTRAL' } | null>(null);

  // Global Tooltip State (Fixed Position)
  const [globalTooltip, setGlobalTooltip] = useState<{x: number, y: number, text: string} | null>(null);

  // Computed Metrics State
  const [metrics, setMetrics] = useState({ ic: 0, ir: 0, autocorr: 0, turnover: 0 });
  const [quantileData, setQuantileData] = useState<any[]>([]);

  // Calculation Cache (Persists calculations across selection changes within component lifecycle)
  const calculationCache = useRef<Record<string, CalculationCacheItem>>({});

  // --- 1. Load Data & Persistence Logic ---
  useEffect(() => {
      const hasNewData = PROCESSED_DATASET.ready && PROCESSED_DATASET.timestamp > FEATURE_VIEW_CACHE.timestamp;
      
      if (hasNewData) {
          setActiveDataset(PROCESSED_DATASET);
          const initialData = PROCESSED_DATASET.data.map(d => ({ ...d, factor: null }));
          setChartData(initialData);
          
          setActiveFactors([]);
          setSelectedFactorId(null);
          setMetrics({ ic: 0, ir: 0, autocorr: 0, turnover: 0 });
          setQuantileData([]);
          setAiAudit(null);
          
          FEATURE_VIEW_CACHE.timestamp = PROCESSED_DATASET.timestamp;
      } else if (FEATURE_VIEW_CACHE.activeFactors.length > 0) {
          setActiveDataset(PROCESSED_DATASET); 
          setActiveFactors(FEATURE_VIEW_CACHE.activeFactors);
          setSelectedFactorId(FEATURE_VIEW_CACHE.selectedFactorId);
          setChartData(FEATURE_VIEW_CACHE.chartData);
          setMetrics(FEATURE_VIEW_CACHE.metrics);
          setQuantileData(FEATURE_VIEW_CACHE.quantileData);
          setAiAudit(FEATURE_VIEW_CACHE.aiAudit);
      } else if (PROCESSED_DATASET.ready) {
          setActiveDataset(PROCESSED_DATASET);
          setChartData(PROCESSED_DATASET.data.map(d => ({ ...d, factor: null })));
          FEATURE_VIEW_CACHE.timestamp = PROCESSED_DATASET.timestamp;
      }
  }, []);

  useEffect(() => {
      if (activeDataset) {
          FEATURE_VIEW_CACHE.activeFactors = activeFactors;
          FEATURE_VIEW_CACHE.selectedFactorId = selectedFactorId;
          FEATURE_VIEW_CACHE.chartData = chartData;
          FEATURE_VIEW_CACHE.metrics = metrics;
          FEATURE_VIEW_CACHE.quantileData = quantileData;
          FEATURE_VIEW_CACHE.aiAudit = aiAudit;
      }
  }, [activeFactors, selectedFactorId, chartData, metrics, quantileData, aiAudit]);

  // --- 2. Deterministic Calculation Engine ---
  const computeFactorValues = (prices: number[], volumes: number[], oi: number[], layerValues: (number|undefined)[], tmplId: string) => {
      if (tmplId === 'mom_10') return QuantMath.momentum(prices, 10);
      else if (tmplId === 'vol_20') return QuantMath.volatility(prices, 20);
      else if (tmplId === 'rsi_14') return QuantMath.rsi(prices, 14);
      else if (tmplId === 'liq_pressure') return QuantMath.termStructureProxy(volumes, oi);
      else if (tmplId === 'basis_mom') return QuantMath.momentum(prices, 5).map(v => v ? -v : null); 
      // GEO Handling
      else if (tmplId === 'geo_raw') return QuantMath.externalSignal(layerValues);
      else if (tmplId === 'geo_gdd') {
          // Accumulate the layer values (assuming layerValues are daily GDD)
          let sum = 0;
          return layerValues.map(v => {
              if (v === undefined || v === null || isNaN(v)) return null;
              sum += v;
              return sum;
          });
      }
      // STRICT: Return NULL for unknown or uncalculable factors. No Simulation.
      else return prices.map(() => null); 
  };

  const calculateFactor = (factorId: string, templateId?: string) => {
      if (!activeDataset) return;

      setAiAudit(null);

      if (calculationCache.current[factorId]) {
          const cached = calculationCache.current[factorId];
          setChartData(cached.chartData);
          setMetrics(cached.metrics);
          setQuantileData(cached.quantileData);
          return;
      }
      
      const prices = activeDataset.data.map((d: any) => d.adjusted);
      const volumes = activeDataset.data.map((d: any) => d.volume);
      const oi = activeDataset.data.map((d: any) => d.openInterest);
      // Extract fused layer data (if present)
      const layerValues = activeDataset.data.map((d: any) => d.layerValue);
      
      let tId = templateId;
      if (!tId) {
          const f = activeFactors.find(f => f.id === factorId);
          if (f && f.source === 'TEMPLATE') {
              tId = f.id.split('_')[0] + '_' + f.id.split('_')[1];
          }
      }

      const factorValues = computeFactorValues(prices, volumes, oi, layerValues, tId || 'UNKNOWN');

      const newData = activeDataset.data.map((d: any, i: number) => ({
          ...d,
          factor: factorValues[i]
      }));
      setChartData(newData);

      const fwdReturns = [];
      for(let i=0; i<prices.length-1; i++) {
          fwdReturns.push((prices[i+1] - prices[i]) / prices[i]);
      }
      fwdReturns.push(null); 

      const ic = QuantMath.calculateIC(factorValues, fwdReturns);
      const qRets = QuantMath.calculateQuantileReturns(factorValues, fwdReturns);
      
      let autocorr = 0;
      // Calculate autocorrelation only on valid non-null sequences
      const validFactors = factorValues.filter(v => v !== null) as number[];
      if (validFactors.length > 2) {
          const f0 = validFactors.slice(0, -1);
          const f1 = validFactors.slice(1);
          autocorr = QuantMath.calculateIC(f0, f1); 
      }

      const calculatedMetrics = {
          ic: ic,
          ir: Math.abs(ic) * Math.sqrt(252), 
          autocorr: autocorr,
          turnover: 1 - autocorr 
      };

      setMetrics(calculatedMetrics);
      setQuantileData(qRets);

      calculationCache.current[factorId] = {
          factorValues,
          chartData: newData,
          metrics: calculatedMetrics,
          quantileData: qRets
      };
  };

  const handleAddFactor = (template: any) => {
      const existing = activeFactors.find(f => f.name === template.name);
      if (existing) {
          setSelectedFactorId(existing.id);
          calculateFactor(existing.id, template.id);
          return;
      }

      const newId = `f_${template.id}_${Date.now()}`;
      const newFactor: FactorDefinition = {
          id: newId,
          name: template.name,
          category: template.category as any,
          description: template.desc,
          code_snippet: template.code,
          params: template.params,
          status: 'Active',
          source: 'TEMPLATE'
      };
      setActiveFactors(prev => [...prev, newFactor]);
      setSelectedFactorId(newId);
      calculateFactor(newId, template.id); 
  };

  const handleAiGenerate = async () => {
      if (!aiPrompt || !process.env.API_KEY) return;
      setIsThinking(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            You are a Quant Developer. Convert this request into a Factor Definition JSON.
            Request: "${aiPrompt}"
            Target: Agri-Commodity Futures (Pandas DataFrame 'df').
            Columns: open, high, low, close, volume, open_interest.
            
            Return JSON:
            {
                "name": "Short Name",
                "category": "MARKET" | "GEO" | "FUNDAMENTAL",
                "description": "Explanation",
                "code_snippet": "Python pandas code expression",
                "params": {}
            }
          `;
          
          const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          
          const text = result.text;
          if (text) {
              const cleaned = text.replace(/```json|```/g, '').trim();
              const json = JSON.parse(cleaned);
              
              const newId = `ai_${Date.now()}`;
              const newFactor: FactorDefinition = {
                  id: newId,
                  name: json.name,
                  category: json.category,
                  description: json.description,
                  code_snippet: json.code_snippet,
                  params: json.params,
                  status: 'Active',
                  source: 'AI_GEN'
              };
              setActiveFactors(prev => [...prev, newFactor]);
              setSelectedFactorId(newId);
              calculateFactor(newId, 'AI_GEN_FALLBACK'); 
              setAiPrompt('');
          }
      } catch (e) {
          console.error("AI Gen Failed", e);
          alert("AI Generation failed. Check API Key.");
      } finally {
          setIsThinking(false);
      }
  };

  const handleRunAudit = async () => {
      if (!process.env.API_KEY || !selectedFactorId) return;
      const activeFactor = activeFactors.find(f => f.id === selectedFactorId);
      if (!activeFactor) return;

      setIsAuditing(true);
      
      const prompt = `
        Role: Senior Quantitative Researcher.
        Task: Audit the validity of this Alpha Factor.
        
        Factor Info:
        - Name: ${activeFactor.name}
        - Description: ${activeFactor.description}
        - Logic Code: ${activeFactor.code_snippet}
        
        Performance Metrics (Backtest):
        - IC (Predictive Power): ${metrics.ic.toFixed(4)}
        - IR (Stability): ${metrics.ir.toFixed(2)}
        - Auto-Correlation: ${metrics.autocorr.toFixed(2)}
        - Quantile Monotonicity: ${JSON.stringify(quantileData.map(q => q.ret.toFixed(2) + '%'))}
        
        Analyze if the logic matches the user intent and if the metrics support the hypothesis.
        Return JSON:
        {
            "analysis": "2 sentence expert commentary on validity and logic-fit.",
            "score": number (0-100),
            "verdict": "PASS" | "FAIL" | "NEUTRAL"
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
              setAiAudit(json);
          }
      } catch (e) {
          console.error("Audit Failed", e);
      } finally {
          setIsAuditing(false);
      }
  };

  const handlePushToFusion = () => {
      if (!activeDataset || activeFactors.length === 0) return;

      // Ensure data includes OPEN INTEREST and FULL OHLCV for Risk Module
      const fusionData = activeDataset.data.map((d: any) => ({
          date: d.date,
          open: d.raw, // Original price (close usually), map robustly
          high: d.high || d.raw, // Fallback if missing
          low: d.low || d.raw,
          close: d.adjusted,
          volume: d.volume,
          open_interest: d.openInterest // CRITICAL FIX: Include OI
      }));

      const prices = activeDataset.data.map((d: any) => d.adjusted);
      const volumes = activeDataset.data.map((d: any) => d.volume);
      const oi = activeDataset.data.map((d: any) => d.openInterest);
      const layerValues = activeDataset.data.map((d: any) => d.layerValue);

      const featureNames: string[] = [];
      
      activeFactors.forEach(factor => {
          let tId = undefined;
          if (factor.source === 'TEMPLATE') {
              tId = factor.id.split('_')[0] + '_' + factor.id.split('_')[1];
          }
          
          const values = computeFactorValues(prices, volumes, oi, layerValues, tId || 'UNKNOWN');
          
          fusionData.forEach((row: any, i: number) => {
              row[factor.name] = values[i];
          });
          featureNames.push(factor.name);
      });

      DATA_LAYERS.set('engineered_features', {
          sourceId: 'engineered_features',
          name: 'Engineered Alpha Set',
          metricName: `${activeFactors.length} Factors`,
          data: [], 
          fusionPackage: {
              data: fusionData,
              features: featureNames,
              metadata: {
                  asset: activeDataset.asset,
                  generatedAt: Date.now()
              }
          },
          timestamp: Date.now()
      });

      onNavigate('multiFactorFusion');
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'MARKET': return 'text-[#0d59f2] border-[#0d59f2] bg-[#0d59f2]/10';
      case 'GEO': return 'text-[#0bda5e] border-[#0bda5e] bg-[#0bda5e]/10';
      case 'FUNDAMENTAL': return 'text-[#ffb347] border-[#ffb347] bg-[#ffb347]/10';
      case 'SENTIMENT': return 'text-[#fa6238] border-[#fa6238] bg-[#fa6238]/10';
      default: return 'text-slate-400 border-slate-600 bg-slate-800';
    }
  };

  const handleTooltip = (e: React.MouseEvent, text: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setGlobalTooltip({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
          text
      });
  };

  const activeFactorDef = activeFactors.find(f => f.id === selectedFactorId);

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
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden flex flex-col">
            {/* Top Control Bar */}
            <div className="h-14 border-b border-[#222f49] bg-[#161d2b] px-6 flex items-center justify-end z-40 shrink-0 gap-3">
                <div className="mr-auto flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">science</span>
                    <span className="font-bold text-white text-sm uppercase tracking-wider">Agri-Alpha Mining Workbench</span>
                </div>

                <div className="flex items-center gap-2 bg-[#0a0c10] px-3 py-1.5 rounded-lg border border-[#222f49]">
                    <span className="text-[10px] text-[#90a4cb] font-bold uppercase tracking-wider">Active Dataset:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{activeDataset ? activeDataset.asset : 'No Data'}</span>
                    <span className="text-[10px] text-slate-500">({chartData.length} bars)</span>
                </div>
                <button 
                    onClick={handlePushToFusion}
                    disabled={activeFactors.length === 0}
                    className={`px-4 h-9 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg uppercase tracking-wider ${activeFactors.length === 0 ? 'bg-[#222f49] text-[#90a4cb] cursor-not-allowed' : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff]'}`}
                >
                    Push to Fusion
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>

            {/* 3-Column Workbench */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* COL 1: FACTOR LIBRARY */}
                <div className="w-72 border-r border-[#222f49] flex flex-col bg-[#0a0c10] shrink-0">
                    <div className="p-4 border-b border-[#222f49] bg-[#101622]">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#0d59f2]">library_books</span>
                            Factor Templates
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                        {['MARKET', 'GEO', 'FUNDAMENTAL'].map(cat => (
                            <div key={cat}>
                                <p className="text-[9px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2 px-1">{cat} Factors</p>
                                <div className="space-y-2">
                                    {FACTOR_TEMPLATES.filter(f => f.category === cat).map(f => (
                                        <div key={f.id} onClick={() => handleAddFactor(f)} className="p-3 rounded-lg border border-[#222f49] bg-[#182234] hover:border-[#0d59f2] cursor-pointer transition-all group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-white group-hover:text-[#0d59f2]">{f.name}</span>
                                                <span className="text-[10px] text-[#0d59f2] opacity-0 group-hover:opacity-100">+ADD</span>
                                            </div>
                                            <p className="text-[9px] text-[#90a4cb] leading-tight">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 2: GENERATION & VISUALIZATION (Center) */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0b0f1a] relative border-r border-[#222f49]">
                    {!activeDataset && (
                        <div className="absolute inset-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-[#fa6238] mb-4">dataset</span>
                            <h3 className="text-white font-bold uppercase tracking-wider">No Input Pipeline</h3>
                            <p className="text-[#90a4cb] text-xs mt-2 mb-6">Please process raw futures data in the 'Algorithm' tab first.</p>
                            <button onClick={() => onNavigate('algorithm')} className="px-6 py-2 bg-[#0d59f2] text-white rounded font-bold uppercase text-xs">Go to Pre-processing</button>
                        </div>
                    )}

                    {/* AI Input */}
                    <div className="p-4 border-b border-[#222f49] bg-[#101622]/50">
                        <div className="bg-[#182234] border border-[#222f49] rounded-xl p-3 shadow-xl flex gap-3">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-[#0d59f2] uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">psychology</span> GenAI Factor Synthesizer
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                    placeholder='e.g., "Rolling 10-day Z-Score of Volume weighted by Open Interest"'
                                    className="w-full bg-[#0a0c10] border border-[#314368] rounded-lg px-3 py-2 text-xs text-white focus:border-[#0d59f2] outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={isThinking || !aiPrompt}
                                className={`px-4 rounded-lg font-bold uppercase text-xs flex flex-col items-center justify-center gap-1 transition-all w-20 ${isThinking ? 'bg-[#222f49] text-[#90a4cb]' : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff]'}`}
                            >
                                <span className={`material-symbols-outlined text-lg ${isThinking ? 'animate-spin' : ''}`}>auto_awesome</span>
                                {isThinking ? '...' : 'GEN'}
                            </button>
                        </div>
                    </div>

                    {/* Visualization Area */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {selectedFactorId && activeFactorDef ? (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            {activeFactorDef.name}
                                            <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${getCategoryColor(activeFactorDef.category)}`}>{activeFactorDef.category}</span>
                                        </h2>
                                        <p className="text-[10px] text-[#90a4cb] font-mono mt-1 bg-[#1a2333] px-2 py-1 rounded inline-block border border-[#314368]">
                                            {activeFactorDef.code_snippet}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-1 overflow-x-auto max-w-[400px] no-scrollbar pb-1">
                                        {activeFactors.map(f => (
                                            <button 
                                                key={f.id}
                                                onClick={() => { 
                                                    setSelectedFactorId(f.id); 
                                                    const tmplId = f.source === 'TEMPLATE' ? f.id.split('_')[0] + '_' + f.id.split('_')[1] : undefined;
                                                    calculateFactor(f.id, tmplId); 
                                                }} 
                                                className={`h-8 px-3 rounded border flex items-center justify-center text-[10px] font-bold transition-all whitespace-nowrap shrink-0 ${selectedFactorId === f.id ? 'bg-[#0d59f2] border-[#0d59f2] text-white' : 'bg-[#182234] border-[#314368] text-[#90a4cb]'}`}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 bg-[#182234] border border-[#314368] rounded-xl p-4 min-h-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorFactor" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                            <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} minTickGap={40} />
                                            <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
                                            <YAxis yAxisId="right" orientation="right" tick={{fill: '#0d59f2', fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                                itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                                                labelStyle={{ color: '#90a4cb', marginBottom: '4px' }}
                                            />
                                            <Legend verticalAlign="top" height={36}/>
                                            <Area yAxisId="left" type="monotone" dataKey="adjusted" stroke="#555" fill="#555" fillOpacity={0.1} strokeWidth={1} name="Asset Price" connectNulls={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="factor" stroke="#0d59f2" strokeWidth={2} dot={false} name="Factor Score" connectNulls={false} />
                                            <ReferenceLine yAxisId="right" y={0} stroke="#314368" strokeDasharray="3 3" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                <span className="material-symbols-outlined text-6xl text-[#90a4cb]">functions</span>
                                <p className="text-sm font-bold text-[#90a4cb] uppercase tracking-widest mt-4">Select or Generate a Factor</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 3: QC METRICS (Right) */}
                <div className="w-72 bg-[#0a0c10] flex flex-col shrink-0">
                    <div className="p-4 border-b border-[#222f49] bg-[#101622]">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#0bda5e]">verified</span>
                            Alpha Quality Control
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* 1. Statistics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#182234] border border-[#222f49] p-3 rounded-xl text-center group relative">
                                <span 
                                    className="text-[9px] text-[#90a4cb] font-bold uppercase block mb-1 flex items-center justify-center gap-1 cursor-help"
                                    onMouseEnter={(e) => handleTooltip(e, 'Correlation between current factor value and future return. >0.05 is good.')}
                                    onMouseLeave={() => setGlobalTooltip(null)}
                                >
                                    IC (Info Coeff)
                                    <span className="material-symbols-outlined text-[10px]">info</span>
                                </span>
                                <span className={`text-xl font-black ${Math.abs(metrics.ic) > 0.05 ? 'text-[#0bda5e]' : 'text-slate-400'}`}>
                                    {metrics.ic.toFixed(3)}
                                </span>
                            </div>
                            <div className="bg-[#182234] border border-[#222f49] p-3 rounded-xl text-center group relative">
                                <span 
                                    className="text-[9px] text-[#90a4cb] font-bold uppercase block mb-1 flex items-center justify-center gap-1 cursor-help"
                                    onMouseEnter={(e) => handleTooltip(e, 'Information Ratio. Measures risk-adjusted return. Stability of the Alpha. >1.0 is excellent.')}
                                    onMouseLeave={() => setGlobalTooltip(null)}
                                >
                                    IR (Annual)
                                    <span className="material-symbols-outlined text-[10px]">info</span>
                                </span>
                                <span className="text-xl font-black text-white">{metrics.ir.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 2. Quantile Returns */}
                        <div className="bg-[#182234] border border-[#222f49] rounded-xl p-4">
                            <h4 className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest mb-3">Grouped Returns (Monotonicity)</h4>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={quantileData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                        <XAxis dataKey="group" tick={{fill: '#90a4cb', fontSize: 9}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #314368', fontSize: '10px' }} />
                                        <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
                                            {quantileData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.ret > 0 ? '#0bda5e' : '#fa6238'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Turnover/Autocorr */}
                        <div className="bg-[#182234] border border-[#222f49] rounded-xl p-4 space-y-3 group relative">
                            <div>
                                <div className="flex justify-between text-[10px] uppercase font-bold text-[#90a4cb] mb-1 cursor-help">
                                    <span 
                                        className="flex items-center gap-1"
                                        onMouseEnter={(e) => handleTooltip(e, 'Persistence of the signal. High (>0.9) means low turnover (good for costs). Low means high churn.')}
                                        onMouseLeave={() => setGlobalTooltip(null)}
                                    >
                                        Autocorrelation (1D)
                                        <span className="material-symbols-outlined text-[10px]">info</span>
                                    </span>
                                    <span className="text-white">{metrics.autocorr.toFixed(2)}</span>
                                </div>
                                <div className="w-full h-1 bg-[#101622] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#ffb347]" style={{ width: `${Math.abs(metrics.autocorr) * 100}%` }}></div>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 italic">
                                {metrics.autocorr > 0.9 ? 'High persistence (Low turnover)' : metrics.autocorr < 0.5 ? 'High churn (High transaction costs)' : 'Balanced signal'}
                            </p>
                        </div>

                        {/* 4. AI Factor Audit */}
                        <div className="border-t border-[#314368] pt-4 mt-2">
                            <h3 className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#0d59f2]">smart_toy</span>
                                AI Factor Audit
                            </h3>
                            {aiAudit ? (
                                <div className={`p-3 rounded-lg border text-left animate-in fade-in ${aiAudit.verdict === 'PASS' ? 'bg-[#0bda5e]/10 border-[#0bda5e]/30' : aiAudit.verdict === 'FAIL' ? 'bg-[#fa6238]/10 border-[#fa6238]/30' : 'bg-[#182234] border-[#314368]'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${aiAudit.verdict === 'PASS' ? 'bg-[#0bda5e] text-black' : aiAudit.verdict === 'FAIL' ? 'bg-[#fa6238] text-white' : 'bg-slate-600 text-white'}`}>
                                            {aiAudit.verdict}
                                        </span>
                                        <span className="text-[9px] font-bold text-white">Score: {aiAudit.score}/100</span>
                                    </div>
                                    <p className="text-[10px] leading-relaxed text-slate-200">
                                        {aiAudit.analysis}
                                    </p>
                                    <button onClick={handleRunAudit} disabled={isAuditing} className="mt-2 w-full text-[9px] uppercase font-bold text-[#90a4cb] hover:text-white flex items-center justify-center gap-1 py-1 bg-black/20 rounded">
                                        <span className={`material-symbols-outlined text-[10px] ${isAuditing ? 'animate-spin' : ''}`}>refresh</span> Re-Audit
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-[#182234] rounded-xl border border-[#314368] border-dashed">
                                    <span className="material-symbols-outlined text-[#90a4cb] text-2xl mb-2">fact_check</span>
                                    <p className="text-[10px] text-[#90a4cb] mb-3">Evaluate factor logic vs performance.</p>
                                    <button 
                                        onClick={handleRunAudit}
                                        disabled={isAuditing || !selectedFactorId}
                                        className="px-3 py-1.5 bg-[#0d59f2] text-white rounded text-[10px] font-bold uppercase hover:bg-[#1a66ff] disabled:opacity-50"
                                    >
                                        {isAuditing ? 'Auditing...' : 'Run Audit'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>

      {globalTooltip && (
        <div 
            className="fixed z-[9999] bg-[#0a0e17] border border-[#314368] p-3 rounded-lg text-[10px] text-slate-200 pointer-events-none max-w-[200px] shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            style={{ left: globalTooltip.x, top: globalTooltip.y, transform: 'translateX(-50%)' }}
        >
            {globalTooltip.text}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
