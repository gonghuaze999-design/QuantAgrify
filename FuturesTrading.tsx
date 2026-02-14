
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Brush,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { EXCHANGE_MAPPING, PUSHED_ASSETS, PUSHED_ASSET_CONTEXTS, GLOBAL_MARKET_CONTEXT, DATA_LAYERS, getTrendColor } from './GlobalState';
import { SystemClock } from './SystemClock';

interface FuturesTradingProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

interface MarketDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// --- MODULE LEVEL CACHE (Persists when component unmounts) ---
// Initialize dynamic dates
const today = new Date();
const lastYear = new Date();
lastYear.setFullYear(today.getFullYear() - 1);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

const FUTURES_CACHE = {
    hasData: false,
    marketData: [] as MarketDataPoint[],
    aiSentiment: {
        loading: false,
        score: 50,
        bias: 'NEUTRAL',
        summary: 'Waiting for specific variety analysis...',
        longRatio: 50,
        shortRatio: 50,
        radarData: [
            { subject: 'Technical', A: 50, fullMark: 100 },
            { subject: 'Fundamental', A: 50, fullMark: 100 },
            { subject: 'Macro', A: 50, fullMark: 100 },
            { subject: 'Inventory', A: 50, fullMark: 100 },
            { subject: 'Policy', A: 50, fullMark: 100 },
        ]
    },
    // Selection State Persistence
    activeExchange: '.XDCE',
    activeVariety: 'C',
    activeSymbol: 'Scanning...',
    startDate: formatDate(lastYear),
    endDate: formatDate(today),
    frequency: 'daily' as 'daily' | '1m', // New
    isManualMode: false,
    manualSymbolInput: '',
    dataSourceName: 'Searching Sources...',
    // Key to detect if parameters changed since last fetch
    lastFetchKey: '',
    // Sentiment Caching
    lastSentimentUpdate: 0,
    lastSentimentKey: '',
    // Sync Signature
    lastSyncedSignature: ''
};

// 1. Precise Context Mapping for AI
const VARIETY_CONTEXT: Record<string, { region: string, factors: string }> = {
    'C': { region: "Northeast China (Heilongjiang/Jilin) & US Midwest", factors: "new crop planting, Sinograin purchase, imported corn auctions" },
    'CS': { region: "North China Plain", factors: "corn starch processing margins, deep processing demand" },
    'A': { region: "Heilongjiang (Non-GMO)", factors: "food soy demand, state reserves, domestic weather" },
    'M': { region: "Coastal China (Crushing Plants)", factors: "imported soybean arrival volume, feed farming demand, pig cycle" },
    'Y': { region: "Global Edible Oil Market", factors: "palm oil subtitution, crude oil correlation, inventory levels" },
    'RB': { region: "Tangshan/Hebei (Steel Mills)", factors: "infrastructure construction rate, blast furnace operating rates" },
    'I': { region: "Australia/Brazil (Supply) & China Ports", factors: "shipments from Rio Tinto/Vale, port inventory accumulation" },
    'SR': { region: "Guangxi/Yunnan", factors: "sugarcane crushing progress, import parity estimates" },
    'CF': { region: "Xinjiang", factors: "US cotton ban, textile export orders, warehouse receipts" },
    // Default fallback
    'DEFAULT': { region: "Global Commodity Market", factors: "supply chain disruptions, macro USD trends" }
};

export const FuturesTrading: React.FC<FuturesTradingProps> = ({ onNavigate }) => {
  // Initialize state from Cache
  const [marketData, setMarketData] = useState<MarketDataPoint[]>(FUTURES_CACHE.marketData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection State (Restored from Cache)
  const [activeExchange, setActiveExchange] = useState(FUTURES_CACHE.activeExchange); 
  const [activeVariety, setActiveVariety] = useState(FUTURES_CACHE.activeVariety); 
  const [activeSymbol, setActiveSymbol] = useState(FUTURES_CACHE.activeSymbol);
  
  // Manual Override State
  const [isManualMode, setIsManualMode] = useState(FUTURES_CACHE.isManualMode);
  const [manualSymbolInput, setManualSymbolInput] = useState(FUTURES_CACHE.manualSymbolInput);

  // AI Sentiment State (Restored from Cache)
  const [aiSentiment, setAiSentiment] = useState(FUTURES_CACHE.aiSentiment);

  // Push State
  const [isPushed, setIsPushed] = useState(false);

  // Date State
  const [startDate, setStartDate] = useState(FUTURES_CACHE.startDate);
  const [endDate, setEndDate] = useState(FUTURES_CACHE.endDate);
  
  // NEW: Frequency State
  const [frequency, setFrequency] = useState<'daily' | '1m'>(FUTURES_CACHE.frequency);

  // Zoom State - Safe defaults (No need to persist zoom strictly, but could be added)
  const [leftIndex, setLeftIndex] = useState<number>(0);
  const [rightIndex, setRightIndex] = useState<number>(0);

  const [dataSourceName, setDataSourceName] = useState(FUTURES_CACHE.dataSourceName);
  
  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading', active: true },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: true },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: false },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: false },
    { label: 'API Console', icon: 'terminal', view: 'api' as const, active: false }
  ];

  // --- Logic 1: Sync State to Cache on Change ---
  useEffect(() => {
      FUTURES_CACHE.activeExchange = activeExchange;
      FUTURES_CACHE.activeVariety = activeVariety;
      FUTURES_CACHE.activeSymbol = activeSymbol;
      FUTURES_CACHE.startDate = startDate;
      FUTURES_CACHE.endDate = endDate;
      FUTURES_CACHE.frequency = frequency;
      FUTURES_CACHE.isManualMode = isManualMode;
      FUTURES_CACHE.manualSymbolInput = manualSymbolInput;
      FUTURES_CACHE.marketData = marketData;
      FUTURES_CACHE.aiSentiment = aiSentiment;
      FUTURES_CACHE.dataSourceName = dataSourceName;
      if (marketData.length > 0) FUTURES_CACHE.hasData = true;
  }, [activeExchange, activeVariety, activeSymbol, startDate, endDate, frequency, isManualMode, manualSymbolInput, marketData, aiSentiment, dataSourceName]);

  // --- Logic 2: Global Context Synchronization (Strategy 2) ---
  useEffect(() => {
      if (GLOBAL_MARKET_CONTEXT.isContextSet) {
          const sig = `${GLOBAL_MARKET_CONTEXT.asset.code}|${GLOBAL_MARKET_CONTEXT.startDate}|${GLOBAL_MARKET_CONTEXT.endDate}`;
          if (sig !== FUTURES_CACHE.lastSyncedSignature) {
              const code = GLOBAL_MARKET_CONTEXT.asset.code; 
              const parts = code.split('.');
              
              if (parts.length === 2) {
                  const suffix = '.' + parts[1];
                  const variety = parts[0].replace(/[0-9]+|1!/g, ''); 

                  if (EXCHANGE_MAPPING[suffix]) {
                      console.log(`[FuturesTrading] Global Sync: ${code} -> ${variety} on ${suffix}`);
                      setActiveExchange(suffix);
                      setActiveVariety(variety);
                      setIsManualMode(false);
                  } else {
                      console.log(`[FuturesTrading] Global Sync (Manual Fallback): ${code}`);
                      setIsManualMode(true);
                      setManualSymbolInput(code);
                  }
                  
                  setStartDate(GLOBAL_MARKET_CONTEXT.startDate);
                  setEndDate(GLOBAL_MARKET_CONTEXT.endDate);
                  
                  FUTURES_CACHE.lastSyncedSignature = sig;
              }
          }
      }
  }, []);

  // Check pushed state
  useEffect(() => {
      const id = `${activeVariety}${activeExchange}`;
      setIsPushed(PUSHED_ASSETS.has(id));
  }, [activeVariety, activeExchange]);

  const handlePushToModel = () => {
      const id = `${activeVariety}${activeExchange}`;
      
      PUSHED_ASSETS.add(id);
      PUSHED_ASSET_CONTEXTS.set(id, {
          symbol: activeSymbol, 
          variety: activeVariety,
          exchange: activeExchange,
          startDate: startDate, 
          endDate: endDate,
          dataSourceName: dataSourceName
      });

      DATA_LAYERS.set('futures_market', {
          sourceId: 'futures_market',
          name: `Futures Market: ${activeVariety}`,
          metricName: 'Price & Sentiment',
          data: marketData.map(d => ({
              date: d.date,
              value: d.close,
              meta: { vol: d.volume, open: d.open, high: d.high, low: d.low }
          })),
          futuresPackage: {
              marketData: marketData,
              sentiment: aiSentiment,
              metadata: {
                  symbol: activeSymbol,
                  variety: activeVariety,
                  exchange: activeExchange,
                  interval: `${startDate} to ${endDate}`
              }
          },
          timestamp: Date.now()
      });

      setIsPushed(true);
  };

  const handleExchangeChange = (newExchange: string) => {
      setActiveExchange(newExchange);
      const firstVariety = EXCHANGE_MAPPING[newExchange]?.varieties[0]?.code || '';
      setActiveVariety(firstVariety);
  };

  const fetchSpecificSentiment = async (varietyCode: string, exchangeName: string) => {
      if (!process.env.API_KEY) return;

      const sentimentKey = `${varietyCode}-${exchangeName}`;
      const now = Date.now();
      const CACHE_DURATION = 10 * 60 * 1000; 

      if (sentimentKey === FUTURES_CACHE.lastSentimentKey && (now - FUTURES_CACHE.lastSentimentUpdate < CACHE_DURATION)) {
          console.log("[FuturesTrading] Using Cached Sentiment");
          return; 
      }

      setAiSentiment(prev => ({ ...prev, loading: true, summary: "Analyzing specific regional supply chain data..." }));

      const context = VARIETY_CONTEXT[varietyCode] || VARIETY_CONTEXT['DEFAULT'];
      const varietyName = EXCHANGE_MAPPING[activeExchange]?.varieties.find(v => v.code === varietyCode)?.name || varietyCode;

      const prompt = `
        Act as a Commodity Futures Analyst specializing in the Chinese and Global markets.
        Analyze the **real-time** market sentiment for:
        - Product: ${varietyName} (${varietyCode})
        - Exchange: ${exchangeName}
        - **Critical Focus Region**: ${context.region}
        - Key Factors to Check: ${context.factors}

        Use Google Search to find the latest (last 72 hours) news on spot prices, inventory levels in ${context.region}, and relevant government policies.

        Return a JSON object:
        {
            "sentiment_score": number (0-100, where 0 is super bearish, 100 super bullish),
            "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
            "summary": "Max 25 words summary explaining the primary driver (e.g. 'Heavy rain in Heilongjiang delaying harvest').",
            "long_ratio": number (estimated percentage of market sentiment leaning long),
            "short_ratio": number (estimated percentage of market sentiment leaning short),
            "radar": {
                "technical": number (0-100),
                "fundamental": number (0-100),
                "macro": number (0-100),
                "inventory": number (0-100),
                "policy": number (0-100)
            }
        }
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: { tools: [{ googleSearch: {} }] }
          });

          const text = response.text;
          if (text) {
              const cleanedText = text.replace(/```json|```/g, '').trim();
              const jsonStart = cleanedText.indexOf('{');
              const jsonEnd = cleanedText.lastIndexOf('}');
              if (jsonStart !== -1 && jsonEnd !== -1) {
                  const data = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
                  const newSentiment = {
                      loading: false,
                      score: data.sentiment_score || 50,
                      bias: data.bias || 'NEUTRAL',
                      summary: data.summary || 'Analysis complete.',
                      longRatio: data.long_ratio || 50,
                      shortRatio: data.short_ratio || 50,
                      radarData: [
                          { subject: 'Technical', A: data.radar?.technical || 50, fullMark: 100 },
                          { subject: 'Fundament', A: data.radar?.fundamental || 50, fullMark: 100 },
                          { subject: 'Macro', A: data.radar?.macro || 50, fullMark: 100 },
                          { subject: 'Inventory', A: data.radar?.inventory || 50, fullMark: 100 },
                          { subject: 'Policy', A: data.radar?.policy || 50, fullMark: 100 },
                      ]
                  };
                  setAiSentiment(newSentiment);
                  FUTURES_CACHE.aiSentiment = newSentiment;
                  FUTURES_CACHE.lastSentimentUpdate = Date.now();
                  FUTURES_CACHE.lastSentimentKey = sentimentKey;
              }
          }
      } catch (e) {
          console.error("AI Sentiment Error", e);
          setAiSentiment(prev => ({ ...prev, loading: false, summary: "AI Analysis unavailable." }));
      }
  };

  const fetchData = async () => {
    const currentKey = `${activeVariety}-${activeExchange}-${startDate}-${endDate}-${frequency}-${isManualMode ? manualSymbolInput : ''}`;
    
    if (FUTURES_CACHE.hasData && FUTURES_CACHE.lastFetchKey === currentKey) {
        if (marketData.length > 0) {
             const len = marketData.length;
             setLeftIndex(len > 50 ? len - 50 : 0);
             setRightIndex(len - 1);
        }
        fetchSpecificSentiment(activeVariety, EXCHANGE_MAPPING[activeExchange]?.name || activeExchange);
        return;
    }

    setLoading(true);
    setError(null);
    setDataSourceName("Initiating Hybrid Cloud...");

    fetchSpecificSentiment(activeVariety, EXCHANGE_MAPPING[activeExchange]?.name || activeExchange);

    const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
    const jqNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)' && c.status === 'online') || 
                   savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)');

    if (!jqNode || !jqNode.username) {
        setLoading(false);
        setError("JQData Credentials not found in API Console.");
        setDataSourceName("No Connection");
        setActiveSymbol("---");
        return;
    }

    const bridgeUrl = jqNode.url.trim().replace(/\/$/, '');

    try {
        let targetSymbol = "";

        if (isManualMode) {
            targetSymbol = manualSymbolInput;
        } else {
            targetSymbol = `${activeVariety}9999${activeExchange}`;
            // Try to find dominant contract first
            try {
                const domRes = await fetch(`${bridgeUrl}/api/jqdata/dominant`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: jqNode.username,
                        password: jqNode.password,
                        variety: activeVariety 
                    })
                });
                
                if (domRes.ok) {
                    const domData = await domRes.json();
                    if (domData.success && domData.dominant) {
                        targetSymbol = domData.dominant;
                        if(!targetSymbol.includes('.')) targetSymbol += activeExchange;
                    }
                }
            } catch (e) {
                console.warn("Dominant fetch failed, using index:", targetSymbol);
            }
        }

        setActiveSymbol(targetSymbol);

        // --- UPDATED: Call Hybrid Pricing Endpoint ---
        // This endpoint handles BigQuery aggregation for Daily vs Raw for Minute
        const priceRes = await fetch(`${bridgeUrl}/api/market/hybrid-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: jqNode.username,
                password: jqNode.password,
                symbol: targetSymbol,
                frequency: frequency, // Passed from UI
                count: 20000, // Limit for 1min requests
                start_date: startDate,
                end_date: endDate
            })
        });
        
        if (!priceRes.ok) {
             throw new Error(`API Error ${priceRes.status}`);
        }

        const priceData = await priceRes.json();

        if (priceData.success && priceData.data && priceData.data.length > 0) {
            setMarketData(priceData.data);
            
            // Set precise source label from backend response
            if (priceData.source) {
                setDataSourceName(priceData.source); 
            } else {
                setDataSourceName('Hybrid DB (BQ/JQ)');
            }
            
            FUTURES_CACHE.lastFetchKey = currentKey;
            
            const len = priceData.data.length;
            setLeftIndex(len > 50 ? len - 50 : 0);
            setRightIndex(len - 1);
        } else {
            setMarketData([]);
            setDataSourceName('No Data Found');
            if(priceData.error) throw new Error(priceData.error);
            else throw new Error("No data returned for this range/symbol.");
        }

    } catch (err: any) {
        setError(err.message || "Connection failed");
        setDataSourceName('Connection Failed');
        setMarketData([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeVariety, activeExchange, startDate, endDate, frequency, isManualMode, manualSymbolInput]); 

  const handleWheel = (e: any) => {
      if (!marketData.length) return;
      
      const len = marketData.length;
      let currentLeft = leftIndex;
      let currentRight = rightIndex;
      
      if (currentRight >= len) currentRight = len - 1;
      if (currentLeft < 0) currentLeft = 0;

      const range = currentRight - currentLeft;
      const zoomSpeed = Math.max(Math.round(range * 0.05), 1); 

      let newLeft = currentLeft;
      let newRight = currentRight;

      if (e.deltaY < 0) {
          if (range > 10) { 
              newLeft = Math.min(currentLeft + zoomSpeed, currentRight - 10);
              newRight = Math.max(currentRight - zoomSpeed, currentLeft + 10);
          }
      } else {
          newLeft = Math.max(0, currentLeft - zoomSpeed);
          newRight = Math.min(len - 1, currentRight + zoomSpeed);
      }

      setLeftIndex(newLeft);
      setRightIndex(newRight);
  };

  const getLastPrice = () => {
      if (!marketData.length) return { price: '---', change: '---', pct: '---', color: 'text-white', vol: '---' };
      const last = marketData[marketData.length - 1];
      const prev = marketData[marketData.length - 2] || last;
      const change = last.close - prev.close;
      const pct = (change / prev.close) * 100;
      
      const isUp = change >= 0;
      return {
          price: last.close.toFixed(1),
          change: (isUp ? '+' : '') + change.toFixed(1),
          pct: (isUp ? '+' : '') + pct.toFixed(2) + '%',
          color: getTrendColor(change, 'text'),
          bg: `bg-[${getTrendColor(change, 'stroke')}]/10 border-[${getTrendColor(change, 'stroke')}]/20`,
          vol: last.volume.toLocaleString()
      };
  };

  const lastStats = getLastPrice();

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30 relative">
      {/* Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
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
              onClick={() => item.view !== 'dataSource' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <SystemClock />
          <div className="h-8 w-px bg-[#314368] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d59f2] transition-colors">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-72 bg-[#101622] border-r border-[#314368] flex flex-col shrink-0">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-[#90a4cb]/50 uppercase tracking-widest mb-4">Data Categories</p>
            {categories.map((cat) => (
              <div 
                key={cat.name}
                onClick={() => cat.id && onNavigate(cat.id as any)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 transition-all group cursor-pointer ${
                  cat.active 
                  ? 'bg-[#0d59f2]/10 border-[#0d59f2] text-white' 
                  : 'border-transparent text-[#90a4cb] hover:bg-[#182234] hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined ${cat.active ? 'text-[#0d59f2]' : 'group-hover:text-[#0d59f2]'}`}>{cat.icon}</span>
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-[#314368]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#182234]/50 border border-[#314368]/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0d59f2] to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">AI</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">Sentiment AI</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Specific: {activeVariety}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold">Futures Trading Analysis</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] ${error ? 'text-rose-500' : 'text-[#00f2ff]'} font-bold uppercase tracking-wider animate-pulse`}>● {loading ? 'SYNCING DATA...' : 'LIVE STREAM'}</span>
                <span className="text-[#90a4cb] text-xs">/</span>
                <span className="text-[#90a4cb] text-xs">Interactive Financial Charting</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center bg-[#182234] border border-[#314368] rounded-lg px-3 py-1 gap-2">
                <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-tighter">Connection:</span>
                <span className={`text-xs font-mono font-bold truncate max-w-[150px] ${dataSourceName.includes('BigQuery') ? 'text-[#0d59f2]' : 'text-emerald-400'}`}>{dataSourceName}</span>
              </div>
              <button 
                onClick={() => { FUTURES_CACHE.lastFetchKey = ''; fetchData(); }} 
                className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all group"
                title="Force Refresh Data"
              >
                <span className={`material-symbols-outlined text-white text-lg ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>sync</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            {/* Chart Config */}
            <section className="bg-[#182234]/30 p-4 rounded-xl border border-[#314368] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => setIsManualMode(false)}
                        className={`text-xs font-bold uppercase px-3 py-1.5 rounded transition-all ${!isManualMode ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb] hover:text-white'}`}
                      >
                        Auto (Variety)
                      </button>
                      <button 
                        onClick={() => setIsManualMode(true)}
                        className={`text-xs font-bold uppercase px-3 py-1.5 rounded transition-all ${isManualMode ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb] hover:text-white'}`}
                      >
                        Manual (Code)
                      </button>
                  </div>
                  
                  <div className="flex gap-2 text-[10px] font-mono text-[#90a4cb]">
                      <span>Active Symbol: <span className="text-white font-bold">{activeSymbol}</span></span>
                  </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-end">
                {!isManualMode ? (
                    <>
                        <label className="flex flex-col col-span-2">
                            <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">account_balance</span> 1. Exchange
                            </span>
                            <select 
                                value={activeExchange}
                                onChange={(e) => handleExchangeChange(e.target.value)}
                                className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] cursor-pointer hover:border-[#0d59f2]"
                            >
                                {Object.entries(EXCHANGE_MAPPING).map(([suffix, data]) => (
                                    <option key={suffix} value={suffix}>{data.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col col-span-3">
                            <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">category</span> 2. Variety
                            </span>
                            <select 
                                value={activeVariety}
                                onChange={(e) => setActiveVariety(e.target.value)}
                                className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] cursor-pointer hover:border-[#0d59f2]"
                            >
                                {EXCHANGE_MAPPING[activeExchange]?.varieties.map((v) => (
                                    <option key={v.code} value={v.code}>{v.name} ({v.code})</option>
                                ))}
                            </select>
                        </label>
                    </>
                ) : (
                    <label className="flex flex-col col-span-5">
                        <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">code</span> Contract Code
                        </span>
                        <input 
                            type="text"
                            value={manualSymbolInput}
                            onChange={(e) => setManualSymbolInput(e.target.value.toUpperCase())}
                            placeholder="e.g. C2405.XDCE or SR405.XZCE"
                            className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] font-mono uppercase placeholder:normal-case placeholder:text-slate-600"
                        />
                    </label>
                )}
                
                {/* NEW FREQUENCY SELECTOR */}
                <label className="flex flex-col col-span-2">
                    <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">timelapse</span> Frequency
                    </span>
                    <select 
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as 'daily' | '1m')}
                        className="bg-[#101622] border border-[#314368] text-white text-sm rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] cursor-pointer hover:border-[#0d59f2]"
                    >
                        <option value="daily">Daily (1d) [Agg]</option>
                        <option value="1m">Minute (1m) [Raw]</option>
                    </select>
                </label>

                <label className="flex flex-col col-span-2">
                    <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">date_range</span> Start Date
                    </span>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-[#101622] border border-[#314368] text-white text-xs rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] uppercase font-mono cursor-pointer"
                    />
                </label>
                <label className="flex flex-col col-span-2">
                    <span className="text-[#90a4cb] text-[10px] font-bold uppercase mb-2 tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">event</span> End Date
                    </span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-[#101622] border border-[#314368] text-white text-xs rounded-lg h-10 px-3 outline-none focus:border-[#0d59f2] uppercase font-mono cursor-pointer"
                    />
                </label>
              </div>
            </section>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <span className="material-symbols-outlined text-rose-500">error</span>
                    <div>
                        <p className="text-sm text-white font-bold">Data Fetch Error</p>
                        <p className="text-xs text-rose-300 font-mono">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
              {/* K-Line Chart Area */}
              <div className="col-span-12 lg:col-span-9 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative min-h-[500px] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-white text-lg font-bold flex items-center gap-2">
                        {activeSymbol} 
                        <span className="px-2 py-0.5 rounded bg-[#101622] border border-[#314368] text-[10px] text-[#90a4cb] font-normal uppercase">
                            {isManualMode ? 'Manual' : 'Auto-Dominant'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${frequency === '1m' ? 'bg-[#0d59f2]/20 border-[#0d59f2] text-[#0d59f2]' : 'bg-[#101622] border-[#314368] text-[#90a4cb]'}`}>
                            {frequency === '1m' ? '1-Min Resolution' : 'Daily Resolution'}
                        </span>
                      </h3>
                      <div className="flex gap-4 mt-1 items-center">
                        <span className="text-xs text-[#90a4cb]">Latest Close: <span className="text-white font-mono text-sm font-bold">{lastStats.price}</span></span>
                        <span className="text-xs text-[#90a4cb]">Vol: <span className="text-white font-mono">{lastStats.vol}</span></span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 ${lastStats.bg} border rounded flex flex-col items-center min-w-[100px]`}>
                      <span className={`${lastStats.color} text-sm font-bold font-mono`}>{lastStats.change}</span>
                      <span className={`${lastStats.color} text-[10px] font-bold`}>{lastStats.pct}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-[#90a4cb] font-bold uppercase border border-[#314368] px-2 py-1 rounded bg-[#101622]">
                        <span className="material-symbols-outlined text-xs align-middle mr-1">mouse</span>
                        Scroll to Zoom
                    </span>
                  </div>
                </div>
                
                <div 
                    className="flex-1 w-full min-h-[400px] relative" 
                    onWheel={handleWheel}
                >
                  {loading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#101622]/50 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-4">
                              <div className="size-8 border-2 border-[#0d59f2] border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs font-bold text-[#0d59f2] uppercase tracking-widest">Loading Market Data...</span>
                          </div>
                      </div>
                  )}
                  
                  {!loading && marketData.length === 0 && !error && (
                      <div className="absolute inset-0 flex items-center justify-center text-[#90a4cb] text-xs">
                          No Data Available for this range. Try adjusting dates or manual code.
                      </div>
                  )}

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={marketData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{fill: '#90a4cb', fontSize: 10, fontFamily: 'monospace'}} 
                        axisLine={{stroke: '#314368'}}
                        tickLine={false}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{fill: '#90a4cb', fontSize: 10, fontFamily: 'monospace'}} 
                        axisLine={false}
                        tickLine={false}
                        orientation="right"
                        tickCount={8}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                        labelStyle={{ color: '#90a4cb', fontSize: '10px', marginBottom: '4px' }}
                        cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#0d59f2" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        activeDot={{ r: 4, fill: '#fff', stroke: '#0d59f2' }}
                        animationDuration={300}
                      />
                      <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke="#314368" 
                        fill="#101622" 
                        tickFormatter={() => ''}
                        startIndex={leftIndex}
                        endIndex={rightIndex}
                        onChange={(e) => {
                            if (e.startIndex !== undefined && e.endIndex !== undefined) {
                                setLeftIndex(e.startIndex);
                                setRightIndex(e.endIndex);
                            }
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MARKET SENTIMENT PANEL - AI POWERED */}
              <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5 flex flex-col items-center h-full relative overflow-hidden">
                  {aiSentiment.loading && (
                      <div className="absolute inset-0 bg-[#101622]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                          <span className="material-symbols-outlined text-[#0d59f2] text-3xl animate-spin mb-2">psychology</span>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">Scanning {activeVariety} Supply Chain...</p>
                      </div>
                  )}
                  
                  <div className="w-full flex items-center justify-between border-b border-[#314368] pb-2 mb-4">
                      <h3 className="text-white text-[11px] font-bold uppercase tracking-widest">Live Sentiment</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border border-transparent ${
                          aiSentiment.bias === 'BULLISH' ? getTrendColor(100, 'bg') + '/20 ' + getTrendColor(100, 'text') : 
                          aiSentiment.bias === 'BEARISH' ? getTrendColor(-100, 'bg') + '/20 ' + getTrendColor(-100, 'text') : 
                          'bg-slate-700 text-slate-300'
                      }`}>{aiSentiment.bias}</span>
                  </div>

                  {/* Dynamic Radar */}
                  <div className="relative w-full h-48 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={aiSentiment.radarData}>
                            <PolarGrid stroke="#314368" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#90a4cb', fontSize: 9, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar 
                                name="Sentiment" 
                                dataKey="A" 
                                stroke={getTrendColor(aiSentiment.bias, 'stroke')}
                                strokeWidth={2} 
                                fill={getTrendColor(aiSentiment.bias, 'fill')} 
                                fillOpacity={0.3} 
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', fontSize: '10px' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full space-y-4">
                    {/* Dynamic Ratio Bar */}
                    <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-[#90a4cb] mb-1">
                          <span>Long Sentiment</span>
                          <span className={getTrendColor(100)}>{aiSentiment.longRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#314368] rounded-full overflow-hidden flex">
                          <div className={`${getTrendColor(100, 'bg')} h-full`} style={{ width: `${aiSentiment.longRatio}%` }}></div>
                          <div className={`${getTrendColor(-100, 'bg')} h-full`} style={{ width: `${aiSentiment.shortRatio}%` }}></div>
                        </div>
                        <div className="flex justify-end text-[10px] uppercase font-bold text-[#90a4cb] mt-1">
                          <span className={getTrendColor(-100)}>{aiSentiment.shortRatio}% Short</span>
                        </div>
                    </div>

                    {/* AI Summary Text */}
                    <div className="bg-[#101622] p-3 rounded-lg border border-[#314368] min-h-[80px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[12px] text-[#0d59f2]">smart_toy</span>
                            <span className="text-[9px] font-bold text-[#0d59f2] uppercase">Gemini Insight</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                            {aiSentiment.summary}
                        </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[#00f2ff]">location_on</span>
                    <h3 className="text-white text-xs font-bold uppercase tracking-tight">Active Region Focus</h3>
                  </div>
                  <p className="text-[#90a4cb] text-xs leading-relaxed">
                    Analyzing data specifically for: <span className="text-white font-bold">{VARIETY_CONTEXT[activeVariety]?.region || VARIETY_CONTEXT['DEFAULT'].region}</span>.
                  </p>
                </div>
              </div>

              {/* Execution Flow Table - NOW LINKED TO REAL DATA */}
              <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#314368] flex justify-between items-center bg-[#182234]/10">
                  <h3 className="text-white text-md font-bold">Historical Market Data (OHLC) - {activeSymbol}</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-[#314368]/50 rounded text-[10px] text-[#90a4cb] font-mono uppercase tracking-tighter">{activeExchange.replace('.', '')}: CONNECTED</span>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-[#182234]">
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold">Contract</th>
                        <th className="px-6 py-4 font-bold">Open</th>
                        <th className="px-6 py-4 font-bold">High</th>
                        <th className="px-6 py-4 font-bold">Low</th>
                        <th className="px-6 py-4 font-bold">Close</th>
                        <th className="px-6 py-4 font-bold">Change %</th>
                        <th className="px-6 py-4 font-bold">Amplitude %</th>
                        <th className="px-6 py-4 font-bold">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#314368]">
                      {marketData.length === 0 ? (
                          <tr><td colSpan={9} className="px-6 py-8 text-center text-[#90a4cb] text-xs italic">No data loaded yet...</td></tr>
                      ) : (
                          // Reverse to show newest first
                          [...marketData].reverse().map((row, i) => {
                              const change = ((row.close - row.open) / row.open) * 100;
                              const amplitude = ((row.high - row.low) / row.open) * 100;
                              
                              return (
                                <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors cursor-default group">
                                  <td className="px-6 py-3 font-mono text-[#90a4cb]">{row.date}</td>
                                  <td className="px-6 py-3 font-medium text-white">{activeSymbol}</td>
                                  <td className="px-6 py-3 text-[#90a4cb] font-mono">{row.open.toFixed(2)}</td>
                                  <td className="px-6 py-3 text-[#90a4cb] font-mono">{row.high.toFixed(2)}</td>
                                  <td className="px-6 py-3 text-[#90a4cb] font-mono">{row.low.toFixed(2)}</td>
                                  <td className={`px-6 py-3 font-bold font-mono ${getTrendColor(change)}`}>{row.close.toFixed(2)}</td>
                                  <td className={`px-6 py-3 font-mono text-xs ${getTrendColor(change)}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                  </td>
                                  <td className="px-6 py-3 text-[#90a4cb] font-mono text-xs">{amplitude.toFixed(2)}%</td>
                                  <td className="px-6 py-3 text-white font-mono">{Math.round(row.volume).toLocaleString()}</td>
                                </tr>
                              );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* FLOATING PUSH BUTTON - BOTTOM RIGHT */}
          <div className="absolute bottom-8 right-8 z-50">
                <button 
                    onClick={handlePushToModel} 
                    disabled={isPushed || marketData.length === 0}
                    className={`px-8 py-2.5 rounded-lg text-white transition-all text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-widest ${
                        isPushed 
                        ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                        : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20'
                    }`}
                >
                    {isPushed ? (
                        <><span className="material-symbols-outlined text-lg">check_circle</span> LAYER ADDED</>
                    ) : (
                        <><span className="material-symbols-outlined text-lg">cloud_upload</span> PUSH FUTURE SIGNAL</>
                    )}
                </button>
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
