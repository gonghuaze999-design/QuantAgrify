
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Area,
  ReferenceLine,
  Cell
} from 'recharts';
import { DATA_LAYERS, GLOBAL_MARKET_CONTEXT, CompositeSignalPackage, RISK_VIEW_CACHE } from './GlobalState';
import { SystemClock } from './SystemClock';

interface RiskControlProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

// --- RISK ENGINE UTILS ---
const RiskMath = {
    // True Range
    tr: (high: number, low: number, prevClose: number) => {
        return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    },
    
    // Average True Range (Simple Moving Average of TR)
    atr: (ohlcv: any[], window: number = 14) => {
        if (ohlcv.length < window + 1) return Array(ohlcv.length).fill(0);
        
        const trs = [0]; // First day TR is 0 or High-Low
        for(let i=1; i<ohlcv.length; i++) {
            const prev = ohlcv[i-1].price; // Using 'price' which maps to close from fusion
            const h = ohlcv[i].high || ohlcv[i].price;
            const l = ohlcv[i].low || ohlcv[i].price;
            trs.push(RiskMath.tr(h, l, prev));
        }
        
        // Calculate SMA of TR
        const atrs = [];
        let sum = 0;
        for(let i=0; i<trs.length; i++) {
            sum += trs[i];
            if(i >= window) {
                sum -= trs[i-window];
                atrs.push(sum / window);
            } else {
                atrs.push(sum / (i + 1)); // Partial average for start
            }
        }
        return atrs;
    },

    // Rolling Max Drawdown
    drawdown: (equityCurve: number[]) => {
        let peak = -Infinity;
        return equityCurve.map(val => {
            if (val > peak) peak = val;
            // Guard against division by zero if equity is 0 (bankruptcy)
            if (peak <= 0) return 0;
            const dd = (val - peak) / peak;
            // Handle precision noise
            return Math.abs(dd) < 0.0001 ? 0 : dd;
        });
    }
};

export const RiskControl: React.FC<RiskControlProps> = ({ onNavigate }) => {
  // Navigation
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl', active: true },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  // --- STATE (INITIALIZED FROM CACHE) ---
  const [signalInput, setSignalInput] = useState<CompositeSignalPackage | null>(null);
  
  const [riskData, setRiskData] = useState<any[]>(RISK_VIEW_CACHE.riskData);
  const [currentMetrics, setCurrentMetrics] = useState(RISK_VIEW_CACHE.currentMetrics);
  
  // Risk Config (Interactive "Valves")
  const [targetVol, setTargetVol] = useState(RISK_VIEW_CACHE.targetVol);
  const [stopLossMult, setStopLossMult] = useState(RISK_VIEW_CACHE.stopLossMult);
  const [liquidityFilter, setLiquidityFilter] = useState(RISK_VIEW_CACHE.liquidityFilter);
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState(RISK_VIEW_CACHE.maxDrawdownLimit);

  // AI Sentinel
  const [aiAnalysis, setAiAnalysis] = useState(RISK_VIEW_CACHE.aiAnalysis);
  const [stressScenario, setStressScenario] = useState(RISK_VIEW_CACHE.stressScenario);
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState(RISK_VIEW_CACHE.customScenarioPrompt);

  // Push State
  const [isPushed, setIsPushed] = useState(false);

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
      RISK_VIEW_CACHE.riskData = riskData;
      RISK_VIEW_CACHE.currentMetrics = currentMetrics;
      RISK_VIEW_CACHE.targetVol = targetVol;
      RISK_VIEW_CACHE.stopLossMult = stopLossMult;
      RISK_VIEW_CACHE.liquidityFilter = liquidityFilter;
      RISK_VIEW_CACHE.maxDrawdownLimit = maxDrawdownLimit;
      RISK_VIEW_CACHE.aiAnalysis = aiAnalysis;
      RISK_VIEW_CACHE.stressScenario = stressScenario;
      RISK_VIEW_CACHE.customScenarioPrompt = customScenarioPrompt;
  }, [riskData, currentMetrics, targetVol, stopLossMult, liquidityFilter, maxDrawdownLimit, aiAnalysis, stressScenario, customScenarioPrompt]);

  // --- 1. DATA INGESTION & PROCESSING ---
  useEffect(() => {
      const layer = DATA_LAYERS.get('composite_signal');
      if (layer && layer.compositePackage) {
          const pkg = layer.compositePackage;
          setSignalInput(pkg);
          
          // Check if we need to re-calculate (New Data vs Cached Data)
          // If layer timestamp > cache timestamp OR cache is empty, run engine
          if (layer.timestamp > RISK_VIEW_CACHE.timestamp || RISK_VIEW_CACHE.riskData.length === 0) {
              console.log("[Risk] New Signal Detected or Cache Empty. Calculating...");
              processRiskEngine(pkg);
              RISK_VIEW_CACHE.timestamp = layer.timestamp;
          } else {
              console.log("[Risk] Using Cached View State.");
              // If we just loaded from cache, ensure signalInput is set but we don't need to re-run calc 
              // unless params change (which is handled by dependency array below)
          }
      }
  }, []);

  // Recalculate when Parameters Change
  useEffect(() => {
      if (signalInput) {
          processRiskEngine(signalInput);
      }
  }, [targetVol, stopLossMult, liquidityFilter, maxDrawdownLimit]); // Triggered by UI changes

  const processRiskEngine = (pkg: CompositeSignalPackage) => {
      const signals = pkg.signals;
      if (signals.length === 0) return;

      const atrs = RiskMath.atr(signals, 14);
      
      let equity = 1000;
      const equityCurve = [equity];
      const processed = [];
      
      // Moving Average of Volume for Liquidity Baseline
      const avgVol = signals.reduce((sum, s) => sum + (s.volume || 0), 0) / signals.length;

      for(let i=0; i<signals.length; i++) {
          const s = signals[i];
          const atr = atrs[i];
          
          // 1. Liquidity Check (The "Valve")
          let liquidityPenalty = 1.0;
          if (liquidityFilter && s.volume && avgVol > 0) {
              const volRatio = s.volume / avgVol;
              if (volRatio < 0.5) liquidityPenalty = 0.5; // Thin market
              if (volRatio < 0.2) liquidityPenalty = 0.0; // Black hole
          }

          // 2. Volatility Scaling (Target Vol / Realized Vol)
          // Using ATR as proxy for realized vol here for simplicity in viz
          const price = s.price;
          const annualizedVol = price > 0 ? (atr / price) * Math.sqrt(252) : 0;
          const volScalar = annualizedVol > 0 ? Math.min(2.0, targetVol / annualizedVol) : 1.0;

          // 3. Raw Signal to Target Position
          const rawSignal = s.score || 0; // -1 to 1 (Handle nulls)
          let targetPos = rawSignal * volScalar * liquidityPenalty;

          // 4. Dynamic Stop Loss Band
          const stopUpper = price + (atr * stopLossMult);
          const stopLower = price - (atr * stopLossMult);

          // 5. PnL Simulation (Simple)
          let benchmarkRet = 0;
          if (i > 0) {
              const ret = (price - signals[i-1].price) / signals[i-1].price;
              const prevPos = processed[i-1].finalPosition;
              equity = equity * (1 + prevPos * ret);
              equityCurve.push(equity);
              benchmarkRet = ret;
          }

          processed.push({
              date: s.date,
              price: price,
              rawSignal: rawSignal,
              finalPosition: parseFloat(targetPos.toFixed(2)),
              stopUpper: parseFloat(stopUpper.toFixed(2)),
              stopLower: parseFloat(stopLower.toFixed(2)),
              atr: parseFloat(atr.toFixed(2)),
              liquidityFlag: liquidityPenalty < 1.0,
              volScalar: parseFloat(volScalar.toFixed(2)),
              benchmarkReturn: benchmarkRet
          });
      }

      // Drawdown Calc
      const drawdowns = RiskMath.drawdown(equityCurve);
      
      // Merge Drawdown back
      const finalData = processed.map((p, i) => ({
          ...p,
          drawdown: drawdowns[i],
          equity: equityCurve[i]
      }));

      setRiskData(finalData);
      
      // Current Stats
      const last = finalData[finalData.length - 1];
      if (last) {
          setCurrentMetrics({
              volatility: last.price > 0 ? (last.atr / last.price) * Math.sqrt(252) : 0,
              liquidityScore: last.liquidityFlag ? 40 : 95,
              currentDrawdown: last.drawdown,
              exposure: last.finalPosition
          });
      }
      setIsPushed(false); // Reset push state if data re-calcs
  };

  // --- 2. AI STRESS TEST (Upgraded) ---
  const runStressTest = async () => {
      if (!process.env.API_KEY || !signalInput) return;
      setAiAnalysis(prev => ({ ...prev, status: "THINKING" }));

      const lastPrice = signalInput.signals[signalInput.signals.length-1].price;
      
      const scenarioText = stressScenario === "Custom Scenario" ? customScenarioPrompt : stressScenario;

      const prompt = `
        Role: Chief Risk Officer (CRO) for a Commodity Fund.
        Context: 
        - Asset: ${signalInput.asset}
        - Current Price: ${lastPrice}
        - Current Portfolio Exposure: ${(currentMetrics.exposure * 100).toFixed(1)}% (Long/Short)
        - Current Volatility: ${(currentMetrics.volatility * 100).toFixed(1)}%
        
        Task: Simulate a "${scenarioText}" scenario.
        
        Output JSON:
        {
            "impact_analysis": "1 sentence describing market reaction.",
            "estimated_drawdown": "-XX%",
            "advice": "Actionable advice (e.g., 'Cut leverage to 0.5x')."
        }
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          const text = response.text;
          const cleaned = text.replace(/```json|```/g, '').trim();
          const json = JSON.parse(cleaned);
          setAiAnalysis({
              text: `${json.impact_analysis} Est. Drawdown: ${json.estimated_drawdown}. Action: ${json.advice}`,
              status: "COMPLETE"
          });
      } catch (e) {
          setAiAnalysis({ text: "Stress Test Failed. Check connection.", status: "ERROR" });
      }
  };

  // --- 3. PUSH TO MODEL ITERATION ---
  const handlePushToModelIteration = () => {
      if (!riskData.length || !signalInput) return;

      const lastPoint = riskData[riskData.length - 1];
      
      DATA_LAYERS.set('risk_strategy', {
          sourceId: 'risk_strategy',
          name: `Risk-Adj Strategy: ${signalInput.asset}`,
          metricName: 'Managed Equity Curve',
          data: riskData.map(d => ({
              date: d.date,
              value: d.equity,
              meta: { exposure: d.finalPosition, drawdown: d.drawdown }
          })),
          riskPackage: {
              sourceAsset: signalInput.asset,
              timeSeries: riskData.map(d => ({
                  date: d.date,
                  price: d.price,
                  rawSignal: d.rawSignal,
                  position: d.finalPosition,
                  equity: d.equity,
                  drawdown: d.drawdown,
                  benchmarkReturn: d.benchmarkReturn || 0
              })),
              config: {
                  targetVol: targetVol,
                  stopLossMult: stopLossMult,
                  liquidityFilter: liquidityFilter
              },
              stats: {
                  finalEquity: lastPoint.equity,
                  maxDrawdown: currentMetrics.currentDrawdown,
                  realizedVol: currentMetrics.volatility,
                  sharpeRatio: 0 // Placeholder, ModelIteration will calculate
              },
              // NEW: Pass Attribution Data
              attribution: {
                  weights: signalInput.weights,
                  features: Object.keys(signalInput.weights)
              },
              timestamp: Date.now()
          },
          timestamp: Date.now()
      });

      setIsPushed(true);
      setTimeout(() => onNavigate('modelIteration'), 600);
  };

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
            
            {/* Tactical Top Bar: Signal Monitor & Push Button */}
            <div className="h-24 border-b border-[#222f49] bg-[#161d2b] px-6 flex items-center gap-6 shrink-0">
                <div className="flex flex-col items-start w-48">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest mb-1">Target Asset</span>
                    <h2 className="text-lg font-black text-white uppercase truncate">{signalInput?.asset || 'No Signal'}</h2>
                    <span className="text-[9px] text-[#0d59f2] font-mono">OHLCV Source: Active</span>
                </div>

                <div className="h-12 w-px bg-[#314368]"></div>

                {/* The "Valves" (Filters) */}
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Vol Target</span>
                        <div className="flex bg-[#0a0c10] border border-[#314368] rounded p-1">
                            {[0.10, 0.15, 0.20].map(v => (
                                <button 
                                    key={v}
                                    onClick={() => setTargetVol(v)} 
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${targetVol === v ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb]'}`}
                                >
                                    {(v*100).toFixed(0)}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Stop ATR Mult</span>
                        <input 
                            type="range" min="1" max="4" step="0.5" 
                            value={stopLossMult} 
                            onChange={(e) => setStopLossMult(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-[#fa6238]"
                        />
                        <span className="text-[9px] text-[#fa6238] font-bold mt-1">{stopLossMult}x</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Liq Gate</span>
                        <button 
                            onClick={() => setLiquidityFilter(!liquidityFilter)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${liquidityFilter ? 'bg-[#0bda5e]' : 'bg-[#314368]'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${liquidityFilter ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>

                <div className="h-12 w-px bg-[#314368]"></div>

                {/* Final Action Output */}
                <div className="w-36 bg-[#0a0c10] border border-[#222f49] rounded-xl p-2 flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Exposure</span>
                        <span className={`text-lg font-black ${currentMetrics.exposure > 0 ? 'text-[#0bda5e]' : currentMetrics.exposure < 0 ? 'text-[#fa6238]' : 'text-slate-500'}`}>
                            {(currentMetrics.exposure * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className={`size-6 rounded-full flex items-center justify-center border-2 font-bold text-[10px] ${currentMetrics.exposure !== 0 ? 'bg-[#0d59f2]/20 border-[#0d59f2] text-[#0d59f2] animate-pulse' : 'border-slate-700 text-slate-700'}`}>
                        {currentMetrics.exposure > 0 ? 'L' : currentMetrics.exposure < 0 ? 'S' : '-'}
                    </div>
                </div>

                {/* PUSH BUTTON (Top Right) */}
                <div className="ml-auto">
                    <button 
                        onClick={handlePushToModelIteration}
                        disabled={!signalInput || isPushed || riskData.length === 0}
                        className={`px-4 h-9 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg uppercase tracking-wider ${
                            isPushed 
                            ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                            : !signalInput || riskData.length === 0
                                ? 'bg-[#222f49] text-[#90a4cb] cursor-not-allowed'
                                : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff] shadow-[#0d59f2]/20 hover:scale-105'
                        }`}
                    >
                        {isPushed ? 'Strategy Pushed' : 'Push to Model Iteration'}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Main Charts */}
                <div className="flex-[3] flex flex-col min-w-0 border-r border-[#222f49] overflow-y-auto custom-scrollbar p-6 gap-6">
                    
                    {/* CHART 1: Price + Stops + Position */}
                    <div className="bg-[#182234]/30 border border-[#314368] rounded-xl p-4 min-h-[350px] flex flex-col relative">
                        {!signalInput && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0f1a]/80 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-4xl text-[#fa6238] mb-2">signal_disconnected</span>
                                <p className="text-xs uppercase font-bold text-[#90a4cb]">No Signal Pipeline</p>
                                <button onClick={() => onNavigate('multiFactorFusion')} className="mt-4 px-4 py-2 bg-[#0d59f2] text-white rounded text-xs font-bold uppercase">Go to Fusion</button>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#0d59f2]">candlestick_chart</span>
                                Adaptive Stop-Loss Channels
                            </h3>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={riskData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="posColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                    <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                                    <YAxis yAxisId="price" domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} width={40} />
                                    <YAxis yAxisId="pos" orientation="right" domain={[-1.5, 1.5]} hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                                    />
                                    {/* Stop Bands */}
                                    <Area yAxisId="price" type="monotone" dataKey="stopUpper" stroke="none" fill="#fa6238" fillOpacity={0.1} />
                                    <Area yAxisId="price" type="monotone" dataKey="stopLower" stroke="none" fill="#fa6238" fillOpacity={0.1} />
                                    
                                    <Line yAxisId="price" type="monotone" dataKey="price" stroke="#fff" strokeWidth={1} dot={false} />
                                    <Area yAxisId="pos" type="step" dataKey="finalPosition" fill="url(#posColor)" stroke="#0d59f2" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART 2: Drawdown Tunnel */}
                    <div className="bg-[#182234]/30 border border-[#314368] rounded-xl p-4 min-h-[200px] flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#fa6238]">water_loss</span>
                                Drawdown Tunnel
                            </h3>
                            <span className="text-[10px] text-[#fa6238] font-bold">Limit: {(maxDrawdownLimit*100).toFixed(0)}%</span>
                        </div>
                        <div className="flex-1 relative">
                            {/* Empty State / Flat Zero Feedback */}
                            {riskData.length > 0 && currentMetrics.currentDrawdown === 0 && (
                                <div className="absolute top-2 right-2 text-[10px] text-[#0bda5e] font-bold border border-[#0bda5e]/30 bg-[#0bda5e]/10 px-2 py-1 rounded pointer-events-none z-10">
                                    PERFECT RUN (0% DD)
                                </div>
                            )}
                            
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={riskData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    {/* Ensure YAxis always has negative range to show '0' at top */}
                                    <YAxis domain={[-maxDrawdownLimit*1.2, 0]} tick={{fill: '#fa6238', fontSize: 10}} axisLine={false} tickLine={false} width={40} tickFormatter={(val) => `${(val*100).toFixed(0)}%`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368' }} itemStyle={{ fontSize: '11px' }} formatter={(val: number) => (val*100).toFixed(2) + '%'} />
                                    <ReferenceLine y={-maxDrawdownLimit} stroke="#fa6238" strokeDasharray="3 3" label="Hard Stop" />
                                    <Area type="monotone" dataKey="drawdown" stroke="#fa6238" fill="#fa6238" fillOpacity={0.3} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right: Metrics & AI */}
                <div className="flex-[2] bg-[#0a0c10] flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Metrics Matrix */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#90a4cb] uppercase tracking-widest">Risk Telemetry</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold block mb-1">Realized Vol</span>
                                <span className="text-xl font-black text-white">{(currentMetrics.volatility * 100).toFixed(1)}%</span>
                            </div>
                            <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold block mb-1">Max DD</span>
                                <span className={`text-xl font-black ${currentMetrics.currentDrawdown === 0 ? 'text-[#0bda5e]' : 'text-[#fa6238]'}`}>
                                    {(currentMetrics.currentDrawdown * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg col-span-2 flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] text-[#90a4cb] uppercase font-bold block mb-1">Liquidity Health</span>
                                    <span className={`text-sm font-bold ${currentMetrics.liquidityScore < 50 ? 'text-[#fa6238]' : 'text-[#0bda5e]'}`}>
                                        {currentMetrics.liquidityScore < 50 ? 'Restricted' : 'Healthy'}
                                    </span>
                                </div>
                                <div className="w-16 h-16 relative shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="26" stroke="#101622" strokeWidth="4" fill="none" />
                                        <circle cx="32" cy="32" r="26" stroke={currentMetrics.liquidityScore < 50 ? '#fa6238' : '#0bda5e'} strokeWidth="4" fill="none" strokeDasharray={`${currentMetrics.liquidityScore * 1.63} 200`} />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Sentinel */}
                    <div className="flex-1 bg-[#182234]/50 border border-[#314368] rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#314368] bg-[#101622] flex justify-between items-center">
                            <h3 className="text-xs font-bold text-[#0d59f2] uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">smart_toy</span>
                                AI Stress Test
                            </h3>
                            <span className={`size-2 rounded-full ${aiAnalysis.status === 'THINKING' ? 'bg-[#ffb347] animate-pulse' : 'bg-[#0bda5e]'}`}></span>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            <p className="text-[11px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                                {aiAnalysis.text}
                            </p>
                        </div>

                        <div className="p-4 border-t border-[#314368] bg-[#101622] space-y-3">
                            <div className="flex flex-col gap-2">
                                <select 
                                    value={stressScenario}
                                    onChange={(e) => setStressScenario(e.target.value)}
                                    className="w-full bg-[#182234] border border-[#314368] text-white text-xs rounded px-2 py-1.5 outline-none"
                                >
                                    <option value="Supply Chain Disruption">Supply Chain Disruption</option>
                                    <option value="Currency Flash Crash">Currency Flash Crash</option>
                                    <option value="Regulatory Crackdown">Regulatory Crackdown</option>
                                    <option value="Extreme Weather Event">Extreme Weather Event</option>
                                    <option value="Custom Scenario">Custom Scenario (DIY)</option>
                                </select>
                                
                                {stressScenario === "Custom Scenario" && (
                                    <textarea
                                        value={customScenarioPrompt}
                                        onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                                        placeholder="Describe a hypothetical black swan event (e.g. 'Suez Canal blocked for 3 weeks')..."
                                        className="w-full bg-[#0a0c10] border border-[#314368] rounded-lg p-2 text-[10px] text-white outline-none resize-none h-16 focus:border-[#0d59f2]"
                                    />
                                )}
                            </div>

                            <button 
                                onClick={runStressTest}
                                disabled={aiAnalysis.status === 'THINKING'}
                                className="w-full py-2 bg-[#0d59f2] hover:bg-[#1a66ff] text-white text-xs font-bold uppercase rounded transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span className={`material-symbols-outlined text-sm ${aiAnalysis.status === 'THINKING' ? 'animate-spin' : ''}`}>play_arrow</span>
                                Run Simulation
                            </button>
                        </div>
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
