
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { DATA_LAYERS, CompositeSignalPackage, RISK_VIEW_CACHE } from './GlobalState';
import { SystemClock } from './SystemClock';

interface RiskControlProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

const QuantUtils = {
    std: (arr: number[]) => {
        if (arr.length < 2) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (arr.length - 1));
    },
    // Standard ATR
    atr: (high: number[], low: number[], close: number[], window: number) => {
        let trs = [];
        for(let i=0; i<close.length; i++) {
            if(i===0) { trs.push(high[i]-low[i]); continue; }
            const tr = Math.max(high[i]-low[i], Math.abs(high[i]-close[i-1]), Math.abs(low[i]-close[i-1]));
            trs.push(tr);
        }
        // Simple Moving Average of TR
        let atrs = [];
        for(let i=0; i<trs.length; i++) {
            if(i < window) {
                atrs.push(trs[i]); // rough approx for start
            } else {
                const slice = trs.slice(i-window+1, i+1);
                atrs.push(slice.reduce((a,b)=>a+b,0)/window);
            }
        }
        return atrs;
    }
};

const SCENARIOS = [
    "Supply Chain Disruption",
    "Flash Crash (-5% in 10 mins)",
    "Interest Rate Hike Shock",
    "Extreme Weather Event",
    "Policy Regulatory Ban"
];

export const RiskControl: React.FC<RiskControlProps> = ({ onNavigate }) => {
    // Navigation
    const navItems = [
        { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: false },
        { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
        { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: false },
        { label: 'API Console', icon: 'terminal', view: 'api' as const, active: false }
    ];

    // State
    const [signalInput, setSignalInput] = useState<CompositeSignalPackage | null>(null);
    
    // Configuration State
    const [targetVol, setTargetVol] = useState(RISK_VIEW_CACHE.targetVol);
    const [stopLossMult, setStopLossMult] = useState(RISK_VIEW_CACHE.stopLossMult);
    const [liquidityFilter, setLiquidityFilter] = useState(RISK_VIEW_CACHE.liquidityFilter);
    
    // Calculated Data
    const [riskData, setRiskData] = useState<any[]>(RISK_VIEW_CACHE.riskData);
    const [metrics, setMetrics] = useState({ realizedVol: 0, maxDD: 0, liquidityScore: 100 });
    
    // AI & Push State
    const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
    const [customScenario, setCustomScenario] = useState("");
    const [aiAnalysisText, setAiAnalysisText] = useState("");
    const [isSimulating, setIsSimulating] = useState(false);
    const [isPushed, setIsPushed] = useState(false);

    // 1. Ingest
    useEffect(() => {
        const layer = DATA_LAYERS.get('composite_signal');
        if (layer && layer.compositePackage) {
            setSignalInput(layer.compositePackage);
        }
    }, []);

    // 2. Risk Engine (The "Adaptive Channel" Logic)
    useEffect(() => {
        if (!signalInput) return;
        const signals = signalInput.signals;
        if (signals.length < 20) return;

        const prices = signals.map(s => s.price);
        // Simulate High/Low if missing (for visual bands)
        const highs = signals.map((s,i) => s.high || s.price * 1.01);
        const lows = signals.map((s,i) => s.low || s.price * 0.99);
        const closes = prices;

        const atrs = QuantUtils.atr(highs, lows, closes, 14);
        
        let processed = [];
        let peakPrice = -Infinity;
        let maxDD = 0;

        for (let i = 0; i < signals.length; i++) {
            const price = prices[i];
            const atr = atrs[i];
            const upper = price + (atr * stopLossMult);
            const lower = price - (atr * stopLossMult);
            
            // Drawdown calculation (Price based)
            if (price > peakPrice) peakPrice = price;
            const dd = (price - peakPrice) / peakPrice;
            if (dd < maxDD) maxDD = dd;

            processed.push({
                date: signals[i].date,
                price,
                upper,
                lower,
                drawdown: dd,
                vol: (atr / price) * 100 // Approx Vol %
            });
        }

        setRiskData(processed);
        
        // Metrics
        const last = processed[processed.length - 1];
        setMetrics({
            realizedVol: parseFloat(last.vol.toFixed(1)),
            maxDD: parseFloat((maxDD * 100).toFixed(1)),
            liquidityScore: 95 // Mock
        });

        // Persist
        RISK_VIEW_CACHE.riskData = processed;
        RISK_VIEW_CACHE.targetVol = targetVol;
        RISK_VIEW_CACHE.stopLossMult = stopLossMult;

    }, [signalInput, targetVol, stopLossMult]);

    // 3. AI Simulation
    const runSimulation = async () => {
        if (!process.env.API_KEY) return;
        setIsSimulating(true);
        setAiAnalysisText("");

        const scenarioText = selectedScenario === "Custom" ? customScenario : selectedScenario;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Act as a Risk Manager.
                Asset: ${signalInput?.asset || 'Unknown'}
                Scenario: ${scenarioText}
                Current Volatility: ${metrics.realizedVol}%
                Max Drawdown: ${metrics.maxDD}%
                
                Simulate the impact of this scenario. 
                Output a short, punchy paragraph (max 40 words) describing the immediate liquidity impact and suggested hedging action.
            `;
            
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            
            setAiAnalysisText(response.text || "Simulation inconclusive.");
        } catch (e) {
            setAiAnalysisText("AI Service Unavailable.");
        } finally {
            setIsSimulating(false);
        }
    };

    const handlePush = () => {
        if(!signalInput || riskData.length === 0) return;
        
        // REMOVED FAKE FALLBACK WEIGHTS.
        // If signalInput.weights is missing, we pass an empty object.
        // This forces the downstream (Model Iteration) to correctly identify missing attribution data.
        const finalWeights = signalInput.weights || {};

        DATA_LAYERS.set('risk_strategy', {
            sourceId: 'risk_strategy',
            name: 'Risk-Managed Strategy',
            metricName: 'Equity Curve',
            data: riskData.map(d => ({ date: d.date, value: d.price })),
            riskPackage: {
                sourceAsset: signalInput.asset,
                timeSeries: riskData.map(d => ({
                    date: d.date,
                    price: d.price,
                    rawSignal: 0,
                    position: 1, // Full exposure for demo of flow
                    equity: 1000 * (d.price / riskData[0].price), // Simple buy hold equity
                    drawdown: d.drawdown,
                    benchmarkReturn: 0
                })),
                config: { targetVol, stopLossMult, liquidityFilter },
                stats: { finalEquity: 0, maxDrawdown: metrics.maxDD, realizedVol: metrics.realizedVol, sharpeRatio: 0 },
                attribution: {
                    weights: finalWeights,
                    features: Object.keys(finalWeights)
                },
                timestamp: Date.now()
            },
            timestamp: Date.now()
        });
        
        setIsPushed(true);
        onNavigate('modelIteration');
    };

    const pipelineLayers = [
        { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
        { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
        { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
        { name: 'Risk Control', icon: 'security', id: 'riskControl', active: true },
        { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration' }
    ];

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
                <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f1a] relative overflow-hidden">
                    
                    {/* Top Control Bar */}
                    <div className="h-24 border-b border-[#222f49] bg-[#161d2b] px-6 flex items-center gap-6 shrink-0">
                        {/* 1. Asset Name */}
                        <div className="flex flex-col items-start max-w-[200px] shrink-0">
                            <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest mb-1">Target Asset</span>
                            <div className="w-full overflow-x-auto no-scrollbar whitespace-nowrap">
                                <h2 className="text-lg font-black text-white uppercase">{signalInput?.asset || 'No Signal'}</h2>
                            </div>
                            <span className="text-[9px] text-[#0d59f2] font-mono">OHLCV Source: Active</span>
                        </div>

                        <div className="h-12 w-px bg-[#314368] shrink-0"></div>

                        {/* 2. Controls */}
                        <div className="flex gap-4 items-center flex-1 min-w-0 overflow-x-auto no-scrollbar">
                            <div className="flex flex-col items-center shrink-0">
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

                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Stop ATR Mult</span>
                                <input 
                                    type="range" min="1" max="4" step="0.5" 
                                    value={stopLossMult} 
                                    onChange={(e) => setStopLossMult(parseFloat(e.target.value))}
                                    className="w-24 h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-[#fa6238]"
                                />
                                <span className="text-[9px] text-[#fa6238] font-bold mt-1">{stopLossMult}x</span>
                            </div>

                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Liq Gate</span>
                                <button 
                                    onClick={() => setLiquidityFilter(!liquidityFilter)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${liquidityFilter ? 'bg-[#0bda5e]' : 'bg-[#314368]'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${liquidityFilter ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        <div className="h-12 w-px bg-[#314368] shrink-0"></div>

                        {/* 3. Exposure Display */}
                        <div className="w-36 bg-[#0a0c10] border border-[#222f49] rounded-xl p-2 flex items-center justify-between shadow-inner shrink-0">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Exposure</span>
                                <span className="text-lg font-black text-[#0bda5e]">118.0%</span>
                            </div>
                            <div className="size-6 rounded-full border-2 border-slate-700 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                L
                            </div>
                        </div>

                        {/* 4. Push Button */}
                        <div className="ml-auto shrink-0">
                            <button 
                                onClick={handlePush}
                                disabled={!signalInput || isPushed || riskData.length === 0}
                                className={`px-4 h-9 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg uppercase tracking-wider ${
                                    isPushed 
                                    ? 'bg-[#0bda5e] text-[#0a0c10] hover:bg-[#0bda5e]/90' 
                                    : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff]'
                                }`}
                            >
                                {isPushed ? 'PUSHED TO MODEL' : 'PUSH TO MODEL ITERATION'}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-12 gap-4 h-full">
                            
                            {/* LEFT COLUMN: CHARTS (Expanded Height) */}
                            <div className="col-span-8 flex flex-col gap-4">
                                {/* Chart 1: Adaptive Channels (Major Visual) */}
                                <div className="flex-[2] bg-[#101622] border border-[#222f49] rounded-xl p-4 flex flex-col min-h-[350px]">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#0d59f2] text-sm">ssid_chart</span>
                                        Adaptive Stop-Loss Channels
                                    </h3>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={riskData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                                <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                                                <YAxis domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368' }} />
                                                <Area type="monotone" dataKey="upper" stroke="none" fill="#0d59f2" fillOpacity={0.1} />
                                                <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={1} dot={false} />
                                                <Line type="monotone" dataKey="lower" stroke="#fa6238" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Chart 2: Drawdown Tunnel (Minor Visual) */}
                                <div className="flex-1 bg-[#101622] border border-[#222f49] rounded-xl p-4 flex flex-col min-h-[200px]">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#fa6238] text-sm">waves</span>
                                            Drawdown Tunnel
                                        </h3>
                                        <span className="text-[10px] text-[#fa6238]">Limit: 10%</span>
                                    </div>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={riskData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                                <XAxis hide />
                                                <YAxis tick={{fill: '#fa6238', fontSize: 10}} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368' }} />
                                                <ReferenceLine y={-0.10} stroke="#fa6238" strokeDasharray="3 3" label="Hard Stop" />
                                                <Area type="monotone" dataKey="drawdown" stroke="#fa6238" fill="#fa6238" fillOpacity={0.2} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: HIGH DENSITY TELEMETRY */}
                            <div className="col-span-4 flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Risk Telemetry</h3>
                                
                                {/* Compact Grid for Stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex flex-col justify-center">
                                        <span className="text-[8px] text-[#90a4cb] uppercase font-bold mb-1">Realized Vol</span>
                                        <span className="text-xl font-black text-white">{metrics.realizedVol}%</span>
                                    </div>
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex flex-col justify-center">
                                        <span className="text-[8px] text-[#90a4cb] uppercase font-bold mb-1">Max DD</span>
                                        <span className="text-xl font-black text-[#0bda5e]">{metrics.maxDD}%</span>
                                    </div>
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex flex-col justify-center items-center">
                                        <span className="text-[8px] text-[#90a4cb] uppercase font-bold mb-1">Liq. Score</span>
                                        {metrics.liquidityScore > 80 ? (
                                            <span className="material-symbols-outlined text-[#0bda5e] text-2xl">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[#fa6238] text-2xl">warning</span>
                                        )}
                                        <span className="text-[10px] font-bold text-white mt-1">{metrics.liquidityScore}/100</span>
                                    </div>
                                </div>

                                {/* AI Stress Test - Enhanced UI */}
                                <div className="flex-1 bg-[#101622] border border-[#222f49] rounded-xl p-5 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-[#0d59f2]">smart_toy</span>
                                        <h3 className="text-xs font-bold text-[#0d59f2] uppercase tracking-widest">AI Stress Test</h3>
                                        {isSimulating && <div className="ml-auto size-2 rounded-full bg-[#0bda5e] animate-pulse"></div>}
                                    </div>
                                    
                                    <div className="flex-1 bg-black/30 border border-[#222f49] rounded-lg p-3 font-mono text-[10px] leading-relaxed text-slate-300 overflow-y-auto mb-4 min-h-[150px]">
                                        {isSimulating ? (
                                            <div className="flex items-center gap-2 text-[#0d59f2]">
                                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                                Running Monte Carlo simulations...
                                            </div>
                                        ) : aiAnalysisText ? (
                                            aiAnalysisText
                                        ) : (
                                            "System Ready. Select a scenario to run predictive risk analysis."
                                        )}
                                    </div>

                                    <div className="space-y-3 mt-auto">
                                        <label className="text-[9px] font-bold text-[#90a4cb] uppercase">Select Scenario</label>
                                        <select 
                                            value={selectedScenario}
                                            onChange={(e) => setSelectedScenario(e.target.value)}
                                            className="w-full bg-[#182234] border border-[#222f49] rounded-lg px-3 py-3 text-xs text-white outline-none focus:border-[#0d59f2] cursor-pointer appearance-none hover:border-[#90a4cb] transition-colors"
                                        >
                                            {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="Custom">Custom / Manual Entry...</option>
                                        </select>
                                        
                                        {selectedScenario === "Custom" && (
                                            <textarea 
                                                value={customScenario}
                                                onChange={(e) => setCustomScenario(e.target.value)}
                                                placeholder="Describe the black swan event..."
                                                className="w-full h-20 bg-[#182234] border border-[#222f49] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#0d59f2] resize-none"
                                            />
                                        )}

                                        <button 
                                            onClick={runSimulation}
                                            disabled={isSimulating}
                                            className="w-full bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                        >
                                            {isSimulating ? (
                                                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : (
                                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                            )}
                                            {isSimulating ? "Simulating..." : "Run Simulation"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
