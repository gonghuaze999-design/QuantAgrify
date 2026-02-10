
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { DATA_LAYERS, GLOBAL_MARKET_CONTEXT, getTrendColor } from './GlobalState';
import { SystemClock } from './SystemClock';

interface PolicySentimentProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// Data Model
type SourceType = 'JQData (Official)' | 'USDA/Google (Web)';

interface IntelligenceItem {
  id: string;
  sourceType: SourceType;
  sourceName: string;
  timestamp: string;
  title: string;
  // Left Panel Data
  brief: string; 
  sentiment: number; // -1 to 1
  // Right Panel Deep Data
  analysis: string; // The "Reasoning"
  tradeBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  affectedAssets: string[]; // e.g., ["ZC", "ZS"]
  url?: string;
  impactMetrics?: {
    priceShock: number;
    duration: number;
    attention: number;
    liquidity: number;
    volatility: number;
  };
}

// --- Module-Level Cache (Persists across menu navigation) ---
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minutes
interface CacheEntry {
    timestamp: number;
    data: IntelligenceItem[];
    lastUpdatedStr: string;
}
const GLOBAL_CACHE: Record<string, CacheEntry> = {};

// Keep track of the last selected theme ID to persist selection across navigation
let LAST_ACTIVE_THEME_ID = 'corn'; 

const COMMODITY_THEMES = [
  { id: 'corn', label: 'Corn (玉米)', keywords: 'Corn futures price news, USDA WASDE corn, China corn import policy, Brazil safrinha corn harvest' },
  { id: 'soy', label: 'Soybeans (大豆)', keywords: 'Soybean futures market news, CBOT soybeans, Brazil soybean export data, China soybean crush margin' },
  { id: 'wheat', label: 'Wheat (小麦)', keywords: 'Wheat futures news, Black Sea grain deal, winter wheat crop condition, global wheat tender' },
  { id: 'sugar', label: 'Sugar (白糖)', keywords: 'Sugar futures price, Brazil sugarcane crush, India sugar export ban' },
  { id: 'macro', label: 'Macro/Policy', keywords: 'Federal Reserve interest rate agriculture, China central bank liquidity, USD index impact on commodities' },
];

// Expanded list for the dropdown
const MORE_COMMODITIES = [
    { id: 'cotton', label: 'Cotton (棉花)', keywords: 'Cotton futures price ICE, Xinjiang cotton supply, USDA cotton report, global textile demand' },
    { id: 'coffee', label: 'Coffee (咖啡)', keywords: 'Coffee C futures, Brazil Robusta harvest weather, Vietnam coffee exports, ICE coffee stocks' },
    { id: 'cocoa', label: 'Cocoa (可可)', keywords: 'Cocoa futures price, Ivory Coast cocoa supply, West Africa weather disease, grind data' },
    { id: 'palm', label: 'Palm Oil (棕榈油)', keywords: 'Palm Oil futures FCPO, Indonesia export levy, Malaysia production data, MPOB report' },
    { id: 'rapeseed', label: 'Rapeseed (菜籽)', keywords: 'Rapeseed futures MATIF, Canola price Canada, European biodiesel demand, China rapeseed imports' },
    { id: 'rice', label: 'Rice (大米)', keywords: 'Rough Rice futures, Thailand rice export prices, India rice export ban, global rice inventory' },
    { id: 'hogs', label: 'Lean Hogs (生猪)', keywords: 'Lean Hogs futures CME, China pork prices, Dalian live hog futures, swine fever outbreak' },
    { id: 'cattle', label: 'Live Cattle (活牛)', keywords: 'Live Cattle futures, US beef demand, Brazil beef exports, cattle on feed report' },
    { id: 'rubber', label: 'Rubber (橡胶)', keywords: 'Natural Rubber futures SHFE, Thailand rubber export, tire manufacturing demand China' },
];

// --- FUZZY MAPPING: Futures Code Prefix -> Theme ID ---
const CODE_TO_THEME_ID: Record<string, string> = {
    'C': 'corn', 'CS': 'corn',
    'A': 'soy', 'B': 'soy', 'M': 'soy', 'Y': 'soy', 'ZS': 'soy', 'ZM': 'soy', 'ZL': 'soy',
    'WH': 'wheat', 'PM': 'wheat', 'ZW': 'wheat',
    'SR': 'sugar', 'SB': 'sugar',
    'CF': 'cotton',
    'P': 'palm',
    'OI': 'rapeseed', 'RM': 'rapeseed', 'RS': 'rapeseed',
    'LH': 'hogs', 'JD': 'hogs', 
    'RU': 'rubber',
    'AP': 'macro', // Apples -> Macro (Fallback)
    'PK': 'macro', // Peanuts -> Macro (Fallback)
};

export const PolicySentiment: React.FC<PolicySentimentProps> = ({ onNavigate }) => {
  // Initialize based on cached ID, fallback to Corn if not found
  const [activeTheme, setActiveTheme] = useState(() => {
      const allThemes = [...COMMODITY_THEMES, ...MORE_COMMODITIES];
      const cached = allThemes.find(t => t.id === LAST_ACTIVE_THEME_ID);
      return cached || COMMODITY_THEMES[0];
  });

  const [feed, setFeed] = useState<IntelligenceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--');
  const [isCachedData, setIsCachedData] = useState(false);
  const [isPushed, setIsPushed] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

  // --- Toast Timeout ---
  useEffect(() => {
      if (toast?.show) {
          const timer = setTimeout(() => setToast(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: true },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment', active: true },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload' }
  ];

  // --- 0. Global Context Sync (Smart Mapping) ---
  useEffect(() => {
      // Logic: If Global Context is set, try to switch the active theme.
      // Do NOT sync dates (Policy is always "Latest/Real-time").
      if (GLOBAL_MARKET_CONTEXT.isContextSet) {
          const code = GLOBAL_MARKET_CONTEXT.asset.code; 
          // Match prefix (e.g. "C" from "C9999.XDCE" or "ZS" from "ZS1!")
          const match = code.match(/^([A-Z]+)/);
          
          if (match) {
              const prefix = match[1];
              const mappedId = CODE_TO_THEME_ID[prefix];
              
              if (mappedId) {
                  // Find the theme object
                  const allThemes = [...COMMODITY_THEMES, ...MORE_COMMODITIES];
                  const targetTheme = allThemes.find(t => t.id === mappedId);
                  
                  if (targetTheme && targetTheme.id !== activeTheme.id) {
                      console.log(`[Policy] Global Sync: ${code} -> ${targetTheme.label}`);
                      setActiveTheme(targetTheme);
                      // Reset push state because the asset changed
                      setIsPushed(false);
                  }
              }
          }
      }
  }, []);

  // Update the global cache ID whenever activeTheme changes
  useEffect(() => {
      LAST_ACTIVE_THEME_ID = activeTheme.id;
      // If we switched themes, we likely haven't pushed this specific signal yet
      setIsPushed(false);
  }, [activeTheme]);

  // --- Real Data Fetching Logic ---
  const fetchIntelligence = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setIsCachedData(false);
    setIsPushed(false);

    // 1. Check Cache first
    const themeId = activeTheme.id;
    const now = Date.now();
    const cacheEntry = GLOBAL_CACHE[themeId];

    if (!forceRefresh && cacheEntry && (now - cacheEntry.timestamp < CACHE_DURATION)) {
        console.log(`[Cache Hit] Using cached data for ${themeId}`);
        setFeed(cacheEntry.data);
        if (cacheEntry.data.length > 0) setSelectedItem(cacheEntry.data[0]);
        setLastUpdated(cacheEntry.lastUpdatedStr);
        setIsCachedData(true);
        setLoading(false);
        return;
    }

    // 2. Clear previous view if fetching new
    setFeed([]);
    setSelectedItem(null);

    if (!process.env.API_KEY) {
        setError("Missing Google Gemini API Key.");
        setLoading(false);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Advanced Prompt for "Trader Perspective"
        const prompt = `
            You are a senior commodities quantitative trader.
            Perform a Google Search for the **LATEST (last 48 hours)** meaningful news, reports, or policy updates regarding: "${activeTheme.keywords}".
            
            Filter Rules:
            1. Exclude general encyclopedic definitions.
            2. Prioritize market-moving news (supply shocks, policy changes, extreme weather).
            3. **CRITICAL**: You MUST extract the REAL source URL from the search result. If you cannot find a link, discard the item.

            Return a strict JSON object with a property "items" containing an array of 5-7 items.
            Each item object must have:
            - title: (String) concise headline.
            - source_name: (String) e.g., "Reuters", "USDA", "CCTV".
            - url: (String) The actual HTTP link to the source.
            - timestamp: (String) e.g., "2 hours ago", "2024-03-22".
            - brief: (String) A very short (max 15 words) factual summary for a list view.
            - trade_bias: (String) One of "BULLISH", "BEARISH", "NEUTRAL".
            - analysis: (String) A deep-dive paragraph (30-50 words) explaining the logic. Why should I trade this? What is the second-order effect?
            - affected_assets: (Array of Strings) e.g. ["ZC", "CORN", "ETH"].
            - impact_metrics: (Object) { 
                price_shock: 0-100 (Immediate volatility), 
                duration: 0-100 (Is this structural?), 
                attention: 0-100 (Mainstream buzz),
                liquidity: 0-100 (Volume impact),
                volatility: 0-100 (Vix impact)
              }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        if (!text) {
            setError("No data returned from AI stream.");
            return;
        }

        // Clean and Parse JSON
        const cleanedText = text.replace(/```json|```/g, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch (e) {
            // Fallback parsing for partial JSON
            const firstBracket = cleanedText.indexOf('{');
            const lastBracket = cleanedText.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1) {
                 parsed = JSON.parse(cleanedText.substring(firstBracket, lastBracket + 1));
            } else {
                throw new Error("Invalid JSON format from AI");
            }
        }

        const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        
        // Transform to internal model
        const validItems: IntelligenceItem[] = items.map((item: any, idx: number) => ({
            id: `intel-${Date.now()}-${idx}`,
            sourceType: 'USDA/Google (Web)',
            sourceName: item.source_name || 'Web Source',
            timestamp: item.timestamp || 'Recent',
            title: item.title,
            brief: item.brief,
            url: item.url, // Real URL from search
            tradeBias: item.trade_bias || 'NEUTRAL',
            analysis: item.analysis || item.brief,
            sentiment: item.trade_bias === 'BULLISH' ? 0.8 : item.trade_bias === 'BEARISH' ? -0.8 : 0,
            affectedAssets: item.affected_assets || [],
            impactMetrics: {
                priceShock: item.impact_metrics?.price_shock || 50,
                duration: item.impact_metrics?.duration || 50,
                attention: item.impact_metrics?.attention || 50,
                liquidity: item.impact_metrics?.liquidity || 50,
                volatility: item.impact_metrics?.volatility || 50,
            }
        })).filter((i: IntelligenceItem) => i.url && i.url.startsWith('http')); // Filter out broken links

        // Update State
        setFeed(validItems);
        if (validItems.length > 0) setSelectedItem(validItems[0]);
        const newTime = new Date().toLocaleTimeString();
        setLastUpdated(newTime);

        // Update Cache
        GLOBAL_CACHE[themeId] = {
            timestamp: Date.now(),
            data: validItems,
            lastUpdatedStr: newTime
        };

    } catch (err: any) {
        console.error("Intelligence Fetch Error:", err);
        setError(err.message || "Failed to aggregate intelligence.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load checks cache automatically
    fetchIntelligence(false);
  }, [activeTheme]);

  // --- Push Logic ---
  const handlePushSignal = () => {
      if (feed.length === 0) return;

      // 1. Aggregate Score
      let totalWeightedScore = 0;
      let totalWeight = 0;

      feed.forEach(item => {
          // Weight by price shock and attention
          const weight = (item.impactMetrics?.priceShock || 50) * (item.impactMetrics?.attention || 50);
          totalWeightedScore += item.sentiment * weight;
          totalWeight += weight;
      });

      const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      
      // 2. Determine Regime
      let regime = 'Neutral';
      if (finalScore > 0.4) regime = 'Risk On / Bullish';
      else if (finalScore < -0.4) regime = 'Risk Off / Bearish';
      else if (Math.abs(finalScore) < 0.2 && feed.length > 5) regime = 'Stagnation';

      // 3. Push to Data Layer
      DATA_LAYERS.set('policy_regime', {
          sourceId: 'policy_regime',
          name: `Macro Regime: ${activeTheme.label}`,
          metricName: 'Sentiment Aggregator',
          data: [], // No time series needed for this snapshot, Fusion uses package
          policyPackage: {
              sentimentScore: finalScore,
              regimeType: regime,
              topDrivers: feed.slice(0, 3).map(i => i.title),
              timestamp: Date.now()
          },
          timestamp: Date.now()
      });

      setIsPushed(true);
  };

  // --- Visual Helpers ---
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      const found = MORE_COMMODITIES.find(c => c.id === selectedId);
      if (found) {
          setActiveTheme(found);
      }
  };

  const isMainTheme = COMMODITY_THEMES.some(t => t.id === activeTheme.id);

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30 relative">
      
      {/* Toast Notification */}
      {toast && (
          <div className="fixed bottom-24 right-6 z-[100] animate-in fade-in slide-in-from-right-4">
              <div className="bg-[#182234] border border-[var(--trend-down)] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
                  <span className="material-symbols-outlined text-[var(--trend-down)]">info</span>
                  <div>
                      <h4 className="text-xs font-bold text-[var(--trend-down)] uppercase">Sync Limit</h4>
                      <p className="text-[10px] text-slate-300 leading-tight">{toast.msg}</p>
                  </div>
                  <button onClick={() => setToast(null)} className="ml-auto text-slate-500 hover:text-white">
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              </div>
          </div>
      )}

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
              // Fixed: Corrected comparison to check against 'dataSource' module ID to avoid type overlap error
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
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Gemini 3.0: Active</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          {/* 1. Theme Header */}
          <header className="z-10 bg-[#101622]/90 backdrop-blur-md border-b border-[#314368] px-6 py-5">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-white text-xl font-bold flex items-center gap-3">
                        Policy & Intelligence
                        <span className="text-[10px] font-mono text-[#90a4cb] bg-[#182234] px-2 py-1 rounded border border-[#314368] uppercase flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Grounding
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#90a4cb]">
                            <span>Updated: {lastUpdated}</span>
                            {isCachedData && <span className="text-[#0d59f2] bg-[#0d59f2]/10 px-1.5 rounded font-bold">(Cached)</span>}
                        </div>
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fetchIntelligence(true)} // Force refresh
                            className="size-8 flex items-center justify-center rounded-full bg-[#182234] border border-[#314368] text-white hover:bg-[#0d59f2] transition-colors"
                            title="Force Refresh Data"
                        >
                            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
                        </button>
                    </div>
                </div>
                
                {/* Commodity Themes */}
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar items-center">
                    <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest self-center mr-2 shrink-0">Active Monitor:</span>
                    {COMMODITY_THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => setActiveTheme(theme)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-all ${
                                activeTheme.id === theme.id 
                                ? 'bg-[#0d59f2] text-white border-[#0d59f2] shadow-[0_0_15px_rgba(13,89,242,0.4)]' 
                                : 'bg-[#182234] text-[#90a4cb] border-[#314368] hover:border-[#90a4cb] hover:text-white'
                            }`}
                        >
                            {theme.label}
                        </button>
                    ))}
                    
                    {/* Dynamic More Dropdown */}
                    <div className="relative group ml-2">
                        <button className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-all flex items-center gap-1 ${
                            !isMainTheme
                            ? 'bg-[#0d59f2] text-white border-[#0d59f2] shadow-[0_0_15px_rgba(13,89,242,0.4)]'
                            : 'bg-[#182234] text-[#90a4cb] border-[#314368] hover:border-[#90a4cb] hover:text-white'
                        }`}>
                            {!isMainTheme ? activeTheme.label : 'More Global Assets'}
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                        <select 
                            onChange={handleDropdownChange}
                            value={!isMainTheme ? activeTheme.id : ''}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            <option value="" disabled>Select Asset...</option>
                            {MORE_COMMODITIES.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-row">
            {/* 2. Left Column: Signal Feed (Minimalist, Quick Scan) */}
            <div className="flex-[3] border-r border-[#314368] flex flex-col min-w-0 bg-[#0a0c10]/50">
                <div className="p-4 border-b border-[#314368] flex justify-between items-center bg-[#101622]">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0d59f2] text-sm">rss_feed</span> 
                        Signal Feed (Last 48h)
                    </h3>
                    <span className="text-[10px] text-[#90a4cb] font-mono">{feed.length} Hits</span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="size-8 border-2 border-[#0d59f2] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-[#90a4cb] animate-pulse">Scanning Global Sources...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 border border-rose-500/50 bg-rose-500/10 rounded-xl text-center">
                            <span className="material-symbols-outlined text-rose-500 text-3xl mb-2">error</span>
                            <p className="text-sm font-bold text-white mb-1">Stream Interrupted</p>
                            <p className="text-xs text-rose-300">{error}</p>
                        </div>
                    ) : feed.length === 0 ? (
                        <div className="p-8 text-center opacity-50">
                            <p className="text-xs font-bold uppercase text-[#90a4cb]">No critical news found.</p>
                        </div>
                    ) : feed.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className={`group p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
                                selectedItem?.id === item.id 
                                ? 'bg-[#182234] border-[#0d59f2]' 
                                : 'bg-transparent border-transparent hover:bg-[#182234] hover:border-[#314368]'
                            }`}
                        >
                            {/* Progress Bar Background */}
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-[#90a4cb] font-bold uppercase">{item.sourceName} • {item.timestamp}</span>
                                <div className={`size-2 rounded-full ${
                                    item.tradeBias === 'BULLISH' ? getTrendColor('BULLISH', 'bg') : 
                                    item.tradeBias === 'BEARISH' ? getTrendColor('BEARISH', 'bg') : 'bg-slate-500'
                                }`}></div>
                            </div>
                            
                            <h4 className="text-xs font-bold text-white leading-snug group-hover:text-[#0d59f2] transition-colors">{item.title}</h4>
                            <p className="text-[10px] text-[#90a4cb] line-clamp-1 mt-1 opacity-70">{item.brief}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Right Column: Deep Analysis (The Trader's Desk) */}
            <div className="flex-[4] bg-[#0a0c10] flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {selectedItem ? (
                    <div className="flex-1 flex flex-col">
                        {/* Header: Bias & Impact */}
                        <div className="p-6 border-b border-[#314368] bg-[#101622]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest mb-2 ${
                                        selectedItem.tradeBias === 'NEUTRAL' 
                                        ? 'text-slate-400 bg-slate-800/50 border-slate-700' 
                                        : `${getTrendColor(selectedItem.tradeBias, 'text')} bg-[${getTrendColor(selectedItem.tradeBias, 'stroke')}]/10 border-[${getTrendColor(selectedItem.tradeBias, 'stroke')}]/20`
                                    }`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {selectedItem.tradeBias === 'BULLISH' ? 'trending_up' : selectedItem.tradeBias === 'BEARISH' ? 'trending_down' : 'remove'}
                                        </span>
                                        {selectedItem.tradeBias} SIGNAL
                                    </div>
                                    <h2 className="text-lg font-bold text-white leading-tight">{selectedItem.title}</h2>
                                </div>
                                {/* Verification Badge */}
                                {selectedItem.url ? (
                                    <a 
                                        href={selectedItem.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[#0d59f2] hover:bg-[#1a66ff] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-lg shadow-[#0d59f2]/20"
                                    >
                                        Verify Source <span className="material-symbols-outlined text-xs">open_in_new</span>
                                    </a>
                                ) : (
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-[10px] font-bold uppercase cursor-not-allowed">
                                        Source Unavailable
                                    </span>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2 flex-wrap">
                                {selectedItem.affectedAssets.map(asset => (
                                    <span key={asset} className="text-[10px] font-mono bg-slate-800 text-[#90a4cb] px-2 py-0.5 rounded border border-slate-700">
                                        ${asset}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* The Narrative (Reasoning) */}
                            <div className="bg-[#182234]/50 border border-[#314368] rounded-xl p-5">
                                <h3 className="text-xs font-black text-[#90a4cb] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-[#0d59f2]">psychology</span>
                                    AI Strategic Reasoning
                                </h3>
                                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                    {selectedItem.analysis}
                                </p>
                            </div>

                            {/* Impact Radar */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[#182234]/50 border border-[#314368] rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Impact Vector</h4>
                                        <div className="group relative cursor-help">
                                            <span className="material-symbols-outlined text-[14px] text-slate-500">info</span>
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-black border border-slate-700 p-2 rounded text-[9px] text-slate-300 hidden group-hover:block z-10 shadow-xl">
                                                AI-calculated score (0-100) based on NLP sentiment analysis of the source text. Measures volatility potential vs structural change.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-40 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                { subject: 'Shock', A: selectedItem.impactMetrics?.priceShock || 0, fullMark: 100 },
                                                { subject: 'Duration', A: selectedItem.impactMetrics?.duration || 0, fullMark: 100 },
                                                { subject: 'Attn', A: selectedItem.impactMetrics?.attention || 0, fullMark: 100 },
                                                { subject: 'Liq', A: selectedItem.impactMetrics?.liquidity || 0, fullMark: 100 },
                                                { subject: 'Vol', A: selectedItem.impactMetrics?.volatility || 0, fullMark: 100 },
                                            ]}>
                                                <PolarGrid stroke="#314368" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#90a4cb', fontSize: 9, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Impact" dataKey="A" stroke="#0d59f2" strokeWidth={2} fill="#0d59f2" fillOpacity={0.3} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', fontSize: '10px' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Key Metrics List */}
                                <div className="space-y-3">
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Price Shock</span>
                                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500" style={{ width: `${selectedItem.impactMetrics?.priceShock}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Structural Duration</span>
                                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#0d59f2]" style={{ width: `${selectedItem.impactMetrics?.duration}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-[#182234] border border-[#222f49] p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Market Attention</span>
                                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${selectedItem.impactMetrics?.attention}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Button - Push Regime Signal */}
                        <div className="p-6 mt-auto border-t border-[#314368]">
                            <button 
                                onClick={handlePushSignal}
                                disabled={isPushed || feed.length === 0}
                                className={`w-full py-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-2 group ${
                                    isPushed 
                                    ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                                    : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20'
                                }`}
                            >
                                {isPushed ? (
                                    <><span className="material-symbols-outlined text-lg">check_circle</span> REGIME SIGNAL PUSHED</>
                                ) : (
                                    <><span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">cloud_upload</span> PUSH REGIME SIGNAL</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#90a4cb] opacity-50 p-10 text-center">
                        <span className="material-symbols-outlined text-6xl mb-6 text-slate-700">query_stats</span>
                        <p className="text-sm font-bold uppercase tracking-widest">Select an intelligence item</p>
                        <p className="text-xs mt-2">AI Analysis will appear here</p>
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};
