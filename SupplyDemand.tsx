
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
  Brush 
} from 'recharts';
import { DATA_LAYERS, GLOBAL_MARKET_CONTEXT, getTrendColor, GEMINI_API_KEY } from './GlobalState';
import { SystemClock } from './SystemClock';

interface SupplyDemandProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// Data Interface
interface TECommodity {
    Symbol: string;
    Name: string;
    item?: string;
    Last: number;
    Date?: string;
    DailyChange: number;
    DailyPercentualChange: number;
    Unit?: string;
}

interface USDAData {
    value: string;
    unit: string;
    year: string;
    period: string;
    commodity: string;
    metric: string; // e.g. "INVENTORY", "YIELD"
}

interface DriverFactor {
    name: string;
    impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 0-100
}

interface AIAnalysisResult {
    loading: boolean;
    supplyScore: number; // 0 (Shortage) - 100 (Glut)
    demandScore: number; // 0 (Weak) - 100 (Strong)
    balanceTrend: 'TIGHTENING' | 'LOOSENING' | 'NEUTRAL';
    keyDriver: string;
    narrative: string;
    estimatedStocks: string; 
    estimatedProduction: string;
    aiPrice: string; 
    aiVolatility: string;
    marketDrivers: DriverFactor[];
    // New Metrics for the right panel
    confidence: number; 
    forecastHorizon: string;
    primaryRisk: string;
}

interface SimpleConnection {
    id: string;
    name: string;
    provider: string;
    status: string;
}

// --- Extended Chinese Futures Mapping ---
const JQ_MAPPING: Record<string, string> = {
    // Core
    'Corn': 'C9999.XDCE',      
    'Soybeans': 'A9999.XDCE',  
    'Wheat': 'WH9999.XZCE',
    // Extended
    'Cotton': 'CF9999.XZCE',   // Zhengzhou Cotton
    'Sugar': 'SR9999.XZCE',    // Zhengzhou Sugar
    'Rubber': 'RU9999.XSGE',   // Shanghai Rubber
    'Palm Oil': 'P9999.XDCE',  // Dalian Palm Oil
    'Rapeseed Meal': 'RM9999.XZCE', // Zhengzhou Rapeseed Meal
    'Eggs': 'JD9999.XDCE',     // Dalian Eggs
    'Apples': 'AP9999.XZCE',   // Zhengzhou Apple
    'Pork': 'LH9999.XDCE'      // Dalian Live Hog
};

const EXTRA_COMMODITIES = [
    { label: 'Cotton (棉花)', value: 'Cotton' },
    { label: 'Sugar (白糖)', value: 'Sugar' },
    { label: 'Rubber (橡胶)', value: 'Rubber' },
    { label: 'Palm Oil (棕榈油)', value: 'Palm Oil' },
    { label: 'Rapeseed Meal (菜粕)', value: 'Rapeseed Meal' },
    { label: 'Eggs (鸡蛋)', value: 'Eggs' },
    { label: 'Apples (苹果)', value: 'Apples' },
    { label: 'Live Hog (生猪)', value: 'Pork' },
];

// --- FUZZY MAPPING: Global Futures Code -> Macro Category ---
const GLOBAL_TO_MACRO_MAP: Record<string, string> = {
    'C': 'Corn', 'CS': 'Corn', // Corn Complex
    'A': 'Soybeans', 'B': 'Soybeans', 'M': 'Soybeans', 'Y': 'Soybeans', // Soy Complex
    'WH': 'Wheat', 'PM': 'Wheat', // Wheat
    'CF': 'Cotton',
    'SR': 'Sugar',
    'RU': 'Rubber',
    'P': 'Palm Oil',
    'OI': 'Rapeseed Meal', 'RM': 'Rapeseed Meal', 'RS': 'Rapeseed Meal', // Rapeseed Complex
    'JD': 'Eggs',
    'AP': 'Apples',
    'LH': 'Pork'
};

// --- MODULE LEVEL CACHE ---
const PAGE_CACHE = {
    data: {
        activeCommodity: 'Corn' as string, // Changed to string to support more types
        dateRange: { start: '2024-10-27', end: '2025-11-03' },
        marketStats: null as { price: number, change: number, pct: number, source: string } | null, 
        teData: null as TECommodity | null,
        usdaData: [] as USDAData[],
        aiAnalysis: {
            loading: false,
            supplyScore: 50,
            demandScore: 50,
            balanceTrend: 'NEUTRAL' as const,
            keyDriver: 'Initializing Fusion Engine...',
            narrative: 'Waiting for data streams to aggregate...',
            estimatedStocks: '---',
            estimatedProduction: '---',
            aiPrice: '---',
            aiVolatility: '---',
            marketDrivers: [] as DriverFactor[],
            confidence: 0,
            forecastHorizon: 'N/A',
            primaryRisk: 'None'
        } as AIAnalysisResult,
        chartData: [] as any[], 
        teStatus: 'INIT' as string,
        usdaStatus: 'INIT' as string,
        jqStatus: 'INIT' as string,
        jqError: null as string | null, 
        activeConnections: [] as SimpleConnection[],
        // Caching Timestamps
        lastAiUpdate: 0,
        lastAiCommodity: '',
        lastSyncedSignature: '' // For Global Sync Check
    }
};

export const SupplyDemand: React.FC<SupplyDemandProps> = ({ onNavigate }) => {
  
  const [activeCommodity, setActiveCommodity] = useState<string>(PAGE_CACHE.data.activeCommodity);
  const [dateRange, setDateRange] = useState(PAGE_CACHE.data.dateRange);
  
  // Data Source States
  const [marketStats, setMarketStats] = useState(PAGE_CACHE.data.marketStats);
  const [teData, setTeData] = useState<TECommodity | null>(PAGE_CACHE.data.teData);
  const [usdaData, setUsdaData] = useState<USDAData[]>(PAGE_CACHE.data.usdaData);
  
  // Connection Statuses
  const [teStatus, setTeStatus] = useState<string>(PAGE_CACHE.data.teStatus);
  const [usdaStatus, setUsdaStatus] = useState<string>(PAGE_CACHE.data.usdaStatus);
  const [jqStatus, setJqStatus] = useState<string>(PAGE_CACHE.data.jqStatus);
  const [jqError, setJqError] = useState<string | null>(PAGE_CACHE.data.jqError);
  
  const [chartData, setChartData] = useState<any[]>(PAGE_CACHE.data.chartData);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult>(PAGE_CACHE.data.aiAnalysis);

  // Active Connections List (Scanned)
  const [activeConnections, setActiveConnections] = useState<SimpleConnection[]>(PAGE_CACHE.data.activeConnections);

  // Push State
  const [isPushed, setIsPushed] = useState(false);

  // Toast
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand', active: true },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: true },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  // --- Toast Timeout Logic ---
  useEffect(() => {
      if (toast?.show) {
          const timer = setTimeout(() => setToast(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  // --- 0. Global Context Sync Logic (Fuzzy Matching) ---
  useEffect(() => {
      if (GLOBAL_MARKET_CONTEXT.isContextSet) {
          const currentSig = `${GLOBAL_MARKET_CONTEXT.asset.code}|${GLOBAL_MARKET_CONTEXT.startDate}|${GLOBAL_MARKET_CONTEXT.endDate}`;
          
          if (currentSig !== PAGE_CACHE.data.lastSyncedSignature) {
              const code = GLOBAL_MARKET_CONTEXT.asset.code; // e.g. "M9999.XDCE"
              const match = code.match(/^([A-Z]+)/);
              if (match) {
                  const varietyPrefix = match[1];
                  const mappedMacro = GLOBAL_TO_MACRO_MAP[varietyPrefix];
                  
                  if (mappedMacro) {
                      console.log(`[SupplyDemand] Global Sync: ${code} -> ${mappedMacro}`);
                      setActiveCommodity(mappedMacro);
                      setDateRange({
                          start: GLOBAL_MARKET_CONTEXT.startDate,
                          end: GLOBAL_MARKET_CONTEXT.endDate
                      });
                      
                      // Invalidate data triggers
                      setTeData(null);
                      setMarketStats(null);
                      setUsdaData([]);
                      setChartData([]);
                      setAiAnalysis(prev => ({...prev, loading: true}));
                  } else {
                      setToast({
                          show: true,
                          msg: `Global Asset '${GLOBAL_MARKET_CONTEXT.asset.name}' has no direct macro supply model. Keeping current view.`
                      });
                  }
              }
              PAGE_CACHE.data.lastSyncedSignature = currentSig;
          }
      }
  }, []);

  // --- Sync State to Cache ---
  useEffect(() => {
      PAGE_CACHE.data = {
          ...PAGE_CACHE.data,
          activeCommodity,
          dateRange,
          marketStats,
          teData,
          usdaData,
          aiAnalysis,
          chartData,
          teStatus,
          usdaStatus,
          jqStatus,
          jqError,
          activeConnections
      };
  }, [activeCommodity, dateRange, marketStats, teData, usdaData, aiAnalysis, chartData, teStatus, usdaStatus, jqStatus, jqError, activeConnections]);

  // --- Reset Push State when asset changes ---
  useEffect(() => {
      setIsPushed(false);
  }, [activeCommodity]);

  // --- Date Range Helper ---
  const applyQuickRange = (type: 'test' | '60d' | 'ytd') => {
      const end = new Date().toISOString().split('T')[0];
      let start = '';

      if (type === 'test') {
          setDateRange({ start: '2024-10-27', end: '2025-11-03' });
          return;
      }

      const d = new Date();
      if (type === '60d') {
          d.setDate(d.getDate() - 60);
          start = d.toISOString().split('T')[0];
      } else if (type === 'ytd') {
          start = `${d.getFullYear()}-01-01`;
      }
      setDateRange({ start, end });
  };

  // --- 1. Fetch JQData (Priority 1) ---
  const fetchJqData = async (): Promise<boolean> => {
      setJqStatus('CONNECTING');
      setJqError(null);
      
      try {
          const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
          const jqNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)');

          if (!jqNode || !jqNode.username) {
              setJqStatus('NOT_CONFIGURED');
              setJqError('Missing JQ Creds');
              return false;
          }

          const bridgeUrl = jqNode.url.trim().replace(/\/$/, '');
          const symbol = JQ_MAPPING[activeCommodity] || 'C9999.XDCE';

          const res = await fetch(`${bridgeUrl}/api/jqdata/price`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  username: jqNode.username,
                  password: jqNode.password,
                  symbol: symbol,
                  frequency: 'daily',
                  start_date: dateRange.start, 
                  end_date: dateRange.end
              })
          });

          if (!res.ok) {
              setJqStatus('ERROR');
              setJqError(`HTTP ${res.status}`);
              return false;
          }

          const json = await res.json();

          if (json.success && json.data && json.data.length > 0) {
              const histData = json.data;
              const latest = histData[histData.length - 1];
              const prev = histData.length > 1 ? histData[histData.length - 2] : latest;
              const change = latest.close - prev.close;
              
              setMarketStats({
                  price: latest.close,
                  change: parseFloat(change.toFixed(1)),
                  pct: parseFloat(((latest.close - prev.close) / prev.close * 100).toFixed(2)),
                  source: 'JQData (China)'
              });

              // Construct Chart Data with simulated AI score
              let smoothedScore = 50;
              const chartD = histData.map((d: any, i: number) => {
                  const priceChange = i > 0 ? (d.close - histData[i-1].close) : 0;
                  smoothedScore = smoothedScore + (priceChange * 0.05) + (Math.random() - 0.5) * 2;
                  smoothedScore = Math.max(0, Math.min(100, smoothedScore));
                  
                  return {
                      date: d.date,
                      price: d.close,
                      aiScore: parseFloat(smoothedScore.toFixed(1))
                  };
              });

              setChartData(chartD);
              setJqStatus('LIVE');
              return true;
          } else {
              setJqStatus('NO_DATA');
              setJqError(json.error || `Empty (${dateRange.start}-${dateRange.end})`);
              return false;
          }

      } catch (e: any) {
          console.error("JQData Fetch Error", e);
          setJqStatus('ERROR');
          setJqError(e.message || 'Net Error');
          return false;
      }
  };

  // --- 2. Fetch Trading Economics Data ---
  const fetchTradingEconomicsData = async () => {
      if (!['Corn', 'Soybeans', 'Wheat', 'Cotton', 'Sugar', 'Palm Oil'].includes(activeCommodity)) {
          setTeStatus('SKIPPED');
          return;
      }
      setTeStatus('CONNECTING');
      try {
          const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
          const teNode = savedConns.find((c: any) => c.provider === 'Trading Economics');
          
          if (!teNode) {
              setTeStatus('OFFLINE');
              return;
          }

          const bridgeUrl = teNode.url.replace(/\/$/, '');
          const apiKey = teNode.key; 

          const res = await fetch(`${bridgeUrl}/api/te/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: apiKey, endpoint: 'markets/commodities' })
          });

          const json = await res.json();

          if (json.success && Array.isArray(json.data)) {
              const searchKey = activeCommodity === 'Soybeans' ? 'Soybean' : activeCommodity;
              const match = json.data.find((item: any) => 
                  item.Name?.toLowerCase() === searchKey.toLowerCase() || 
                  item.Symbol?.includes(searchKey.toUpperCase())
              );

              if (match) {
                  setTeData(match);
                  setMarketStats({
                      price: match.Last,
                      change: match.DailyChange,
                      pct: match.DailyPercentualChange,
                      source: 'Trading Economics'
                  });
                  setTeStatus('LIVE');
              } else {
                  setTeData(null);
                  setTeStatus('RESTRICTED');
              }
          } else {
              setTeStatus('OFFLINE');
          }
      } catch (e) {
          console.error("TE Error", e);
          setTeStatus('OFFLINE');
      }
  };

  // --- 3. Fetch USDA Data ---
  const fetchUsdaData = async () => {
      if (!['Corn', 'Soybeans', 'Wheat', 'Cotton'].includes(activeCommodity)) {
          setUsdaStatus('SKIPPED');
          setUsdaData([]);
          return;
      }

      setUsdaStatus('CONNECTING');
      setUsdaData([]); 
      try {
          const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
          const usdaNode = savedConns.find((c: any) => c.provider === 'USDA QuickStats');
          
          if (!usdaNode) {
              setUsdaStatus('OFFLINE');
              return;
          }

          const bridgeUrl = usdaNode.url.replace(/\/$/, '');
          const apiKey = usdaNode.key; 
          const commName = activeCommodity.toUpperCase(); 
          
          const queryParams = new URLSearchParams({
              key: apiKey,
              commodity_desc: commName,
              statisticcat_desc: 'YIELD', 
              year__GE: '2023',
              format: 'JSON'
          });

          const res = await fetch(`${bridgeUrl}/api/usda/quickstats?${queryParams.toString()}`, { method: 'GET' });
          const json = await res.json();

          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
              const latest = json.data[0];
              setUsdaData([{
                  value: latest.Value,
                  unit: latest.unit_desc,
                  year: latest.year,
                  period: latest.period,
                  commodity: commName,
                  metric: 'YIELD'
              }]);
              setUsdaStatus('LIVE');
          } else {
              setUsdaStatus('NO_DATA');
          }
      } catch (e) {
          console.error("USDA Error", e);
          setUsdaStatus('OFFLINE');
      }
  };

  // --- 4. Refresh Logic ---
  const refreshAllData = useCallback(async () => {
      const allConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
      const relevantProviders = ['Trading Economics', 'USDA QuickStats', 'USDA PSD (FAS)', 'JQData (JoinQuant)'];
      const validConns = allConns.filter((c: any) => relevantProviders.includes(c.provider)).map((c: any) => ({
          id: c.id, name: c.name, provider: c.provider, status: c.status
      }));
      setActiveConnections(validConns);

      const hasJQ = validConns.some((c: SimpleConnection) => c.provider === 'JQData (JoinQuant)');
      let jqSuccess = false;
      if (hasJQ) jqSuccess = await fetchJqData();
      else setJqStatus('OFFLINE');

      const hasTE = validConns.some((c: SimpleConnection) => c.provider === 'Trading Economics');
      if (hasTE && !jqSuccess) await fetchTradingEconomicsData();
      else if (!hasTE) setTeStatus('OFFLINE');

      const hasUSDA = validConns.some((c: SimpleConnection) => c.provider.includes('USDA'));
      if (hasUSDA) await fetchUsdaData();
      else { setUsdaStatus('OFFLINE'); setUsdaData([]); }

  }, [activeCommodity, dateRange]);

  useEffect(() => {
      refreshAllData();
      const intervalId = setInterval(refreshAllData, 600000); 
      return () => clearInterval(intervalId);
  }, [refreshAllData]); 

  // --- 6. AI Synthesis Logic (with 10-minute Caching) ---
  const runAiSynthesis = useCallback(async (force = false) => {
      if (!GEMINI_API_KEY) {
          setAiAnalysis(prev => ({ ...prev, loading: false, keyDriver: 'API Key Missing', narrative: 'Please configure Google Gemini API Key.' }));
          return;
      }

      const CACHE_TIMEOUT = 10 * 60 * 1000; 
      const now = Date.now();
      const isSameCommodity = PAGE_CACHE.data.lastAiCommodity === activeCommodity;
      const isFresh = (now - PAGE_CACHE.data.lastAiUpdate) < CACHE_TIMEOUT;

      if (!force && isSameCommodity && isFresh && PAGE_CACHE.data.aiAnalysis.marketDrivers.length > 0) {
          setAiAnalysis(PAGE_CACHE.data.aiAnalysis);
          return;
      }
      
      setAiAnalysis(prev => ({ 
          ...prev, 
          loading: true, 
          keyDriver: `Fusing ${activeConnections.length > 0 ? activeConnections.length : '0'} Streams...`,
          narrative: 'Aggregating structured API data with unstructured news signals...',
          marketDrivers: [] 
      }));

      try {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          
          let contextPrompt = `Analyze ${activeCommodity} Supply/Demand for a Professional Trading Dashboard. \n\n`;
          if (marketStats) contextPrompt += `[PRICE] Source: ${marketStats.source}, Price: ${marketStats.price}, Change: ${marketStats.pct}%\n`;
          if (usdaStatus === 'LIVE' && usdaData.length > 0) contextPrompt += `[FUNDAMENTALS] USDA Yield: ${usdaData[0].value} ${usdaData[0].unit} (${usdaData[0].year})\n`;

          const prompt = `
            You are "QuantAgrify", an advanced agricultural AI fusion engine for the **Chinese Futures Market (DCE/ZCE/SHFE)** and Global markets.
            
            ${contextPrompt}
            
            **Mission:**
            1. TRUST structured data if available.
            2. Use Google Search to find the *very latest* (last 48h) news. 
            3. **PRIORITY**: Focus on factors affecting China (e.g. imports, Sinograin policy, port stocks) alongside global drivers.
            
            **Output JSON (Strict):**
            {
                "supply_pressure_score": number (0-100, 100=Massive Glut, 0=Severe Shortage),
                "demand_strength_score": number (0-100, 100=Booming, 0=Collapsing),
                "balance_trend": "TIGHTENING" | "LOOSENING" | "NEUTRAL",
                "key_driver_headline": "Max 6 words headline",
                "narrative": "3 sentences synthesizing data. Mention specific numbers. Focus on China impact.",
                "est_global_stocks": "e.g. '305.2 Mt'",
                "est_production": "e.g. '1.2 Bt'",
                "current_price_fallback": "String",
                "volatility_fallback": "String",
                "confidence_score": number (0-100),
                "forecast_horizon": "e.g. '1-3 Months'",
                "primary_risk": "e.g. 'La Niña Drought'",
                "market_drivers": [
                    { "name": "string", "impact": "BULLISH" | "BEARISH" | "NEUTRAL", "strength": number (0-100) },
                    { "name": "string", "impact": "BULLISH" | "BEARISH" | "NEUTRAL", "strength": number (0-100) }
                ]
            }
          `;

          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
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
                  const newResult = {
                      loading: false,
                      supplyScore: data.supply_pressure_score || 50,
                      demandScore: data.demand_strength_score || 50,
                      balanceTrend: data.balance_trend || 'NEUTRAL',
                      keyDriver: data.key_driver_headline || 'Analysis Complete',
                      narrative: data.narrative || 'Data successfully integrated.',
                      estimatedStocks: data.est_global_stocks || '---',
                      estimatedProduction: data.est_production || '---',
                      aiPrice: data.current_price_fallback !== 'null' ? data.current_price_fallback : '---',
                      aiVolatility: data.volatility_fallback || '---',
                      marketDrivers: data.market_drivers || [],
                      confidence: data.confidence_score || 75,
                      forecastHorizon: data.forecast_horizon || 'Short Term',
                      primaryRisk: data.primary_risk || 'Volatility'
                  };
                  setAiAnalysis(newResult);
                  PAGE_CACHE.data.aiAnalysis = newResult;
                  PAGE_CACHE.data.lastAiUpdate = Date.now();
                  PAGE_CACHE.data.lastAiCommodity = activeCommodity;
              }
          }
      } catch (e) {
          console.error("AI Error", e);
          setAiAnalysis(prev => ({ 
              ...prev, 
              loading: false, 
              keyDriver: 'Fusion Error', 
              narrative: 'AI could not synthesize data sources. Check connection.' 
          }));
      }
  }, [activeCommodity, marketStats, teData, teStatus, usdaData, usdaStatus, activeConnections]);

  useEffect(() => {
      if (teStatus !== 'CONNECTING' && usdaStatus !== 'CONNECTING' && jqStatus !== 'CONNECTING') {
          runAiSynthesis();
      }
  }, [teStatus, usdaStatus, jqStatus, runAiSynthesis]);

  const handleCommoditySwitch = (crop: string) => {
      setActiveCommodity(crop);
      setTeData(null);
      setMarketStats(null);
      setUsdaData([]);
      setChartData([]);
  };

  const handlePushSignal = () => {
      if (chartData.length === 0) return;

      DATA_LAYERS.set('supply', {
          sourceId: 'supply',
          name: `Macro Supply: ${activeCommodity}`,
          metricName: 'Fundamental AI Score',
          data: chartData.map(d => ({
              date: d.date,
              value: d.aiScore,
              meta: { price: d.price }
          })),
          macroPackage: {
              timeSeries: chartData,
              metadata: {
                  assetName: activeCommodity,
                  drivers: aiAnalysis.marketDrivers,
                  interval: { start: dateRange.start, end: dateRange.end }
              },
              metrics: {
                  supplyScore: aiAnalysis.supplyScore,
                  demandScore: aiAnalysis.demandScore,
                  balanceTrend: aiAnalysis.balanceTrend,
                  confidence: aiAnalysis.confidence
              }
          },
          timestamp: Date.now()
      });

      setIsPushed(true);
  };

  const TensorGauge = ({ supply, demand }: { supply: number, demand: number }) => {
      const balance = demand - supply; 
      const rotation = (balance / 100) * 45; 
      return (
          <div className="relative w-full h-32 flex items-center justify-center">
              <div className="absolute bottom-0 w-64 h-32 bg-gradient-to-t from-[#182234] to-transparent rounded-t-full border-t border-x border-[#314368] overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-full opacity-90 blur-sm" 
                       style={{ background: 'conic-gradient(from 270deg at 50% 100%, #ff3333 0deg 60deg, #3385ff 60deg 120deg, #00ff80 120deg 180deg)' }}>
                  </div>
              </div>
              <span className="absolute bottom-2 left-6 text-[9px] font-black uppercase text-[#ff3333]">Oversupply</span>
              <span className="absolute bottom-2 right-6 text-[9px] font-black uppercase text-[#00ff80]">Deficit</span>
              <span className="absolute top-4 text-[9px] font-black uppercase text-[#3385ff]">Balanced</span>
              <div 
                className="absolute bottom-0 left-1/2 w-1 h-28 bg-white origin-bottom rounded-full shadow-[0_0_10px_white] transition-transform duration-1000 ease-out"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
              ></div>
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full"></div>
          </div>
      );
  };

  const displayPrice = marketStats ? `${marketStats.price} ${marketStats.source === 'JQData (China)' ? 'CNY' : ''}` : (aiAnalysis.aiPrice !== '---' ? aiAnalysis.aiPrice : '---');
  const displayChange = marketStats ? `${marketStats.pct}%` : '---';
  const displaySource = marketStats ? marketStats.source : (aiAnalysis.aiPrice !== '---' ? 'AI Estimate' : 'Offline');
  const displayProduction = usdaStatus === 'LIVE' && usdaData.length > 0 && usdaData[0].metric === 'YIELD'
        ? `${usdaData[0].value} ${usdaData[0].unit} (USDA)`
        : aiAnalysis.estimatedProduction;

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30 relative">
      
      {/* Toast Notification */}
      {toast && (
          <div className="fixed bottom-24 right-6 z-[100] animate-in fade-in slide-in-from-right-4">
              <div className="bg-[#182234] border border-[#fa6238] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
                  <span className="material-symbols-outlined text-[#fa6238]">info</span>
                  <div>
                      <h4 className="text-xs font-bold text-[#fa6238] uppercase">Sync Limit</h4>
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
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Specific: {activeCommodity}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold">Supply & Demand Fusion</h2>
              <div className="flex gap-4 mt-2 items-center">
                <div className="flex bg-[#182234] border border-[#314368] rounded-lg p-0.5 items-center">
                    {(['Corn', 'Soybeans', 'Wheat'] as const).map(crop => (
                        <button 
                            key={crop}
                            onClick={() => handleCommoditySwitch(crop)}
                            className={`px-4 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                activeCommodity === crop 
                                ? 'bg-[#0d59f2] text-white shadow-lg' 
                                : 'text-[#90a4cb] hover:text-white'
                            }`}
                        >
                            {crop}
                        </button>
                    ))}
                    <div className="h-4 w-px bg-[#314368] mx-1"></div>
                    <div className="relative group px-2">
                        <button className={`flex items-center gap-1 text-[10px] font-bold uppercase ${!['Corn', 'Soybeans', 'Wheat'].includes(activeCommodity) ? 'text-[#0d59f2]' : 'text-[#90a4cb]'}`}>
                            {!['Corn', 'Soybeans', 'Wheat'].includes(activeCommodity) ? activeCommodity : 'More'} 
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                        <select 
                            onChange={(e) => handleCommoditySwitch(e.target.value)}
                            value={!['Corn', 'Soybeans', 'Wheat'].includes(activeCommodity) ? activeCommodity : ''}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            <option value="" disabled>Select...</option>
                            {EXTRA_COMMODITIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="h-4 w-px bg-[#314368]"></div>
                
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[8px] text-[#90a4cb] uppercase font-bold">Start Date</label>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-[#182234] border border-[#314368] text-white text-[10px] rounded px-2 py-0.5 outline-none focus:border-[#0d59f2] font-mono h-6 min-w-[130px]"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[8px] text-[#90a4cb] uppercase font-bold">End Date</label>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-[#182234] border border-[#314368] text-white text-[10px] rounded px-2 py-0.5 outline-none focus:border-[#0d59f2] font-mono h-6 min-w-[130px]"
                        />
                    </div>
                    <div className="flex items-end h-full gap-1 ml-1">
                        <button onClick={() => applyQuickRange('test')} className="px-3 py-1 bg-[#0d59f2]/20 hover:bg-[#0d59f2]/40 text-[#0d59f2] border border-[#0d59f2]/50 text-[9px] font-bold uppercase rounded h-8 transition-all flex items-center gap-1" title="Reset to Valid Test Data Range">
                            <span className="material-symbols-outlined text-[10px]">science</span> Test Range
                        </button>
                        <button onClick={() => applyQuickRange('60d')} className="px-3 py-1 bg-[#182234] hover:bg-[#222f49] text-[#90a4cb] border border-[#314368] text-[9px] font-bold uppercase rounded h-8 transition-all">
                            60d
                        </button>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => refreshAllData()}
                className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all group"
                title="Refresh All Streams"
              >
                <span className={`material-symbols-outlined text-white text-lg ${jqStatus === 'CONNECTING' ? 'animate-spin' : ''}`}>sync</span>
              </button>
              <button 
                onClick={() => runAiSynthesis(true)}
                className="flex items-center gap-2 rounded-lg bg-[#0d59f2] hover:bg-[#1a66ff] px-4 py-2 text-white shadow-lg shadow-[#0d59f2]/20 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <span className={`material-symbols-outlined text-sm ${aiAnalysis.loading ? 'animate-spin' : ''}`}>psychology</span> 
                {aiAnalysis.loading ? 'Fusing Data...' : 'Re-Run Fusion'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-gradient-to-br from-[#182234] to-[#101622] border border-[#314368] rounded-xl relative overflow-hidden flex flex-col h-full shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d59f2]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                        
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="flex-1 p-6 relative z-10 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-[#0d59f2] text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                                        AI Fusion Engine (Data + Text)
                                    </h3>
                                    <h2 className={`text-2xl font-bold leading-tight mb-4 ${aiAnalysis.loading ? 'text-[#90a4cb] animate-pulse' : 'text-white'}`}>
                                        {aiAnalysis.loading ? 'Analyzing Structure & News...' : aiAnalysis.keyDriver}
                                    </h2>
                                    <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-[#0d59f2] pl-4">
                                        {aiAnalysis.narrative}
                                    </p>
                                </div>
                                <div className="mt-6 flex gap-4 text-[10px] font-bold uppercase text-[#90a4cb]">
                                    <div className="flex items-center gap-2 bg-[#0a0c10]/40 px-2 py-1 rounded border border-[#314368]">
                                        <span className={`size-2 rounded-full ${jqStatus === 'LIVE' ? 'bg-[#0bda5e]' : 'bg-[#fa6238]'}`}></span>
                                        Price: {marketStats?.source || 'Fallback'}
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#0a0c10]/40 px-2 py-1 rounded border border-[#314368]">
                                        <span className={`size-2 rounded-full ${usdaStatus === 'LIVE' ? 'bg-[#0bda5e]' : usdaStatus === 'NO_DATA' ? 'bg-[#ffb347]' : 'bg-[#fa6238]'}`}></span>
                                        Fund: {usdaStatus === 'LIVE' ? 'USDA' : usdaStatus === 'NO_DATA' ? 'Active (Empty)' : 'Offline'}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-64 bg-[#0a0c10]/30 border-t lg:border-t-0 lg:border-l border-[#314368] p-5 flex flex-col justify-center gap-4 relative z-10 backdrop-blur-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest">Balance Trend</span>
                                    <div className={`text-xs font-black px-3 py-2 rounded border text-center uppercase ${
                                        aiAnalysis.balanceTrend === 'TIGHTENING' ? getTrendColor('BULLISH', 'bg') + '/10 ' + getTrendColor('BULLISH', 'text') + ' ' + getTrendColor('BULLISH', 'text').replace('text', 'border') + '/20' :
                                        aiAnalysis.balanceTrend === 'LOOSENING' ? getTrendColor('BEARISH', 'bg') + '/10 ' + getTrendColor('BEARISH', 'text') + ' ' + getTrendColor('BEARISH', 'text').replace('text', 'border') + '/20' :
                                        'text-white bg-slate-700 border-slate-600'
                                    }`}>
                                        {aiAnalysis.balanceTrend}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-[#90a4cb] uppercase">
                                        <span>AI Confidence</span>
                                        <span className="text-white">{aiAnalysis.confidence}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#222f49] rounded-full overflow-hidden">
                                        <div className="bg-[#0d59f2] h-full transition-all duration-1000" style={{ width: `${aiAnalysis.confidence}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#182234] border border-[#314368] p-2 rounded text-center h-full flex flex-col justify-center">
                                        <span className="block text-[8px] text-[#90a4cb] font-bold uppercase mb-1">Horizon</span>
                                        <span className="text-[10px] text-white font-bold break-words leading-tight">{aiAnalysis.forecastHorizon}</span>
                                    </div>
                                    <div className="bg-[#182234] border border-[#314368] p-2 rounded text-center h-full flex flex-col justify-center">
                                        <span className="block text-[8px] text-[#90a4cb] font-bold uppercase mb-1">Pri. Risk</span>
                                        <span className="text-[10px] text-[#ffb347] font-bold break-words leading-tight" title={aiAnalysis.primaryRisk}>{aiAnalysis.primaryRisk}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-[#182234]/50 border border-[#314368] rounded-xl p-6 h-full flex flex-col items-center justify-center relative">
                        <h3 className="absolute top-4 left-4 text-xs font-bold text-[#90a4cb] uppercase tracking-widest">Supply/Demand Tensor</h3>
                        <TensorGauge supply={aiAnalysis.supplyScore} demand={aiAnalysis.demandScore} />
                        <div className="w-full flex justify-between px-2 mt-2">
                            <div className="text-center">
                                <span className="block text-[9px] text-[#90a4cb] uppercase font-bold">Supply Pressure</span>
                                <span className="text-lg font-black text-white">{aiAnalysis.supplyScore}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[9px] text-[#90a4cb] uppercase font-bold">Demand Pull</span>
                                <span className="text-lg font-black text-white">{aiAnalysis.demandScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { 
                    label: 'Market Price (Live)', 
                    val: displayPrice, 
                    trend: displayChange, 
                    icon: 'payments',
                    source: displaySource
                },
                { 
                    label: 'End Stocks / Yield', 
                    val: displayProduction, 
                    trend: usdaStatus === 'LIVE' ? 'Actual' : 'Forecast', 
                    icon: 'inventory',
                    source: usdaStatus === 'LIVE' ? 'USDA NASS' : 'AI Estimate'
                },
                { label: 'Global Production', val: aiAnalysis.estimatedProduction, trend: 'Annual', icon: 'agriculture', source: 'Search/WASDE' },
                { 
                    label: 'Volatility (VIX)', 
                    val: teData ? Math.abs(teData.DailyChange).toFixed(2) : aiAnalysis.aiVolatility, 
                    trend: 'Daily Range', 
                    icon: 'candlestick_chart',
                    source: teStatus === 'LIVE' ? 'Trading Econ' : 'AI Estimate'
                }
              ].map((stat, i) => (
                <div key={stat.label} className="bg-[#182234]/30 border border-[#314368] p-5 rounded-xl flex flex-col justify-between group hover:border-[#0d59f2]/50 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                      <p className="text-[#90a4cb] text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                      <span className={`material-symbols-outlined ${i === 0 ? 'text-[#0d59f2] animate-pulse' : 'text-[#90a4cb]'}`}>{stat.icon}</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white tracking-tight break-words" title={String(stat.val)}>{stat.val}</h3>
                    <div className="flex justify-between items-end mt-1">
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${
                            String(stat.trend).includes('-') ? getTrendColor(-1) : 
                            String(stat.trend).includes('%') && !String(stat.trend).includes('-') ? getTrendColor(1) : 
                            'text-[#0d59f2]'
                        }`}>
                            {String(stat.trend).includes('%') && Number(String(stat.trend).replace('%','')) > 0 ? '+' : ''}{stat.trend}
                        </p>
                        <span className="text-[8px] font-mono text-[#90a4cb] border border-[#314368] px-1 rounded bg-[#101622]">{stat.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-lg font-bold">Price Action vs AI Fundamental Bias</h3>
                    <p className="text-[#90a4cb] text-xs">Real-time market price data mapped against AI sentiment score</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase">
                    <span className="flex items-center gap-1.5"><i className="w-3 h-3 bg-[#0d59f2] rounded-sm"></i> Price Trend</span>
                    <span className="flex items-center gap-1.5"><i className="w-3 h-1 bg-[#0bda5e]"></i> AI Bias Score</span>
                  </div>
                </div>
                
                <div className="h-80 w-full relative flex items-center justify-center">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                                <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{fill: '#0bda5e', fontSize: 10}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                                />
                                <Brush dataKey="date" height={30} stroke="#314368" fill="#101622" />
                                <Area yAxisId="left" type="monotone" dataKey="price" stroke="#0d59f2" fill="url(#priceGradient)" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="aiScore" stroke="#0bda5e" strokeWidth={3} dot={false} strokeDasharray="4 4" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center p-8 border-2 border-dashed border-[#314368] rounded-xl bg-[#101622]/50">
                            {jqStatus === 'ERROR' || jqStatus === 'NO_DATA' || jqStatus === 'NOT_CONFIGURED' ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-[#fa6238] mb-2">signal_cellular_off</span>
                                    <p className="text-sm font-bold text-white uppercase tracking-widest">Data Stream Error</p>
                                    <p className="text-xs text-[#90a4cb] mt-1">
                                        {jqStatus === 'NOT_CONFIGURED' ? 'Please add JQData creds in API Console.' : `JQ Error: ${jqError || 'Unknown'}`}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-[#90a4cb] mb-2">pending</span>
                                    <p className="text-sm font-bold text-white uppercase tracking-widest">Connecting to Exchange...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 flex flex-col">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">workspaces</span>
                    Market Drivers
                </h3>
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar max-h-[320px]">
                    {aiAnalysis.marketDrivers && aiAnalysis.marketDrivers.length > 0 ? (
                        aiAnalysis.marketDrivers.map((driver, idx) => (
                            <div key={idx} className="p-3 bg-[#101622] rounded border border-[#314368] hover:border-[#0d59f2] transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-white uppercase">{driver.name}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                        driver.impact === 'BULLISH' ? getTrendColor(100, 'bg') + '/10 ' + getTrendColor(100, 'text') + ' ' + getTrendColor(100, 'text').replace('text', 'border') + '/30' :
                                        driver.impact === 'BEARISH' ? getTrendColor(-100, 'bg') + '/10 ' + getTrendColor(-100, 'text') + ' ' + getTrendColor(-100, 'text').replace('text', 'border') + '/30' :
                                        'text-slate-400 bg-slate-800 border-slate-700'
                                    }`}>
                                        {driver.impact}
                                    </span>
                                </div>
                                <div className="w-full bg-[#182234] h-1.5 rounded-full overflow-hidden flex">
                                    <div 
                                        className={`h-full ${
                                            driver.impact === 'BULLISH' ? getTrendColor(100, 'bg') : 
                                            driver.impact === 'BEARISH' ? getTrendColor(-100, 'bg') : 'bg-slate-500'
                                        }`} 
                                        style={{ width: `${driver.strength}%` }}
                                    ></div>
                                </div>
                                <div className="text-right mt-1">
                                    <span className="text-[9px] text-[#90a4cb] font-mono">Intensity: {driver.strength}%</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                            <span className="material-symbols-outlined text-3xl mb-2">smart_toy</span>
                            <p className="text-xs">Waiting for AI Factor Analysis...</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-[#314368]">
                    <p className="text-[10px] text-[#90a4cb] leading-relaxed">
                        <span className="text-[#0d59f2] font-bold">Primary Insight:</span> {activeCommodity} markets are reacting to {aiAnalysis.keyDriver}.
                    </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Aggregation Status</p>
                  <p className="text-[10px] text-[#90a4cb]">JQ: {jqStatus} | USDA: {usdaStatus} | Search: ON</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={handlePushSignal}
                    disabled={isPushed || chartData.length === 0}
                    className={`px-8 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-widest ${
                        isPushed 
                        ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                        : 'bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white shadow-[#0d59f2]/20'
                    }`}
                >
                    {isPushed ? (
                        <><span className="material-symbols-outlined text-lg">check_circle</span> LAYER ADDED</>
                    ) : (
                        <><span className="material-symbols-outlined text-lg">cloud_upload</span> Push Macro Signal</>
                    )}
                </button>
            </div>
          </footer>
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
