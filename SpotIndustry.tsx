
import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart
} from 'recharts';
import { DATA_LAYERS, GLOBAL_MARKET_CONTEXT } from './GlobalState';
import { SystemClock } from './SystemClock';

interface SpotIndustryProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// Types for Data Handling
interface MarketPair {
    date: string;
    futuresPrice: number;
    spotPrice: number;
    basis: number;
    inventory: number; // Added Inventory field
    isSpotSimulated: boolean;
}

interface ConnectionStatus {
    jq: 'online' | 'offline' | 'error';
    datayes: 'online' | 'offline' | 'error' | 'restricted';
    jqLatency: number | null;
    datayesMsg?: string;
}

// Configuration Constants
const ASSET_CONFIG = {
    Corn: {
        jqCode: 'C9999.XDCE',
        name: 'Corn (玉米)',
        marginName: 'Starch Processing Margin',
        baseSpot: 2350, // Fallback base for simulation
        volatility: 0.02,
        jqIndustryTable: 'DCE_CORN_IND'
    },
    Soybean: {
        jqCode: 'A9999.XDCE', // Using Soy No.1 for Spot correlation
        name: 'Soybean (大豆)',
        marginName: 'Crush Margin',
        baseSpot: 4600,
        volatility: 0.03,
        jqIndustryTable: 'DCE_SOY_IND'
    },
    Wheat: {
        jqCode: 'WH9999.XZCE',
        name: 'Wheat (小麦)',
        marginName: 'Flour Milling Margin',
        baseSpot: 2900,
        volatility: 0.015,
        jqIndustryTable: 'ZCE_WHEAT_IND'
    },
    // Expanded Commodities
    Cotton: {
        jqCode: 'CF9999.XZCE',
        name: 'Cotton (棉花)',
        marginName: 'Yarn Spinning Margin',
        baseSpot: 16000,
        volatility: 0.025,
        jqIndustryTable: 'ZCE_COTTON_IND'
    },
    Sugar: {
        jqCode: 'SR9999.XZCE',
        name: 'Sugar (白糖)',
        marginName: 'Refining Margin',
        baseSpot: 6500,
        volatility: 0.02,
        jqIndustryTable: 'ZCE_SUGAR_IND'
    },
    Rubber: {
        jqCode: 'RU9999.XSGE',
        name: 'Rubber (橡胶)',
        marginName: 'Tire Mfg Margin',
        baseSpot: 14500,
        volatility: 0.035,
        jqIndustryTable: 'SHFE_RUBBER_IND'
    },
    PalmOil: {
        jqCode: 'P9999.XDCE',
        name: 'Palm Oil (棕榈油)',
        marginName: 'Refining Margin',
        baseSpot: 7800,
        volatility: 0.04,
        jqIndustryTable: 'DCE_PALM_IND'
    },
    RapeseedMeal: {
        jqCode: 'RM9999.XZCE',
        name: 'Rapeseed Meal (菜粕)',
        marginName: 'Crush Margin',
        baseSpot: 3200,
        volatility: 0.025,
        jqIndustryTable: 'ZCE_MEAL_IND'
    },
    Eggs: {
        jqCode: 'JD9999.XDCE',
        name: 'Eggs (鸡蛋)',
        marginName: 'Breeding Margin',
        baseSpot: 4200,
        volatility: 0.05,
        jqIndustryTable: 'DCE_EGG_IND'
    },
    Apples: {
        jqCode: 'AP9999.XZCE',
        name: 'Apples (苹果)',
        marginName: 'Storage Margin',
        baseSpot: 8500,
        volatility: 0.04,
        jqIndustryTable: 'ZCE_APPLE_IND'
    },
    Pork: {
        jqCode: 'LH9999.XDCE',
        name: 'Live Hog (生猪)',
        marginName: 'Breeding Margin',
        baseSpot: 15000,
        volatility: 0.06,
        jqIndustryTable: 'DCE_PORK_IND'
    }
};

// --- FUZZY MAPPING: Futures Code Prefix -> Spot Asset Key ---
const CODE_TO_SPOT_MAP: Record<string, keyof typeof ASSET_CONFIG> = {
    'C': 'Corn', 'CS': 'Corn',
    'A': 'Soybean', 'B': 'Soybean', 'M': 'Soybean', 'Y': 'Soybean',
    'WH': 'Wheat', 'PM': 'Wheat',
    'CF': 'Cotton',
    'SR': 'Sugar',
    'RU': 'Rubber',
    'P': 'PalmOil',
    'RM': 'RapeseedMeal', 'OI': 'RapeseedMeal', 'RS': 'RapeseedMeal',
    'JD': 'Eggs',
    'AP': 'Apples',
    'LH': 'Pork'
};

// --- Module Cache ---
const SPOT_CACHE = {
    activeAsset: 'Corn' as keyof typeof ASSET_CONFIG,
    data: [] as MarketPair[],
    lastFetched: 0,
    connStatus: { jq: 'offline', datayes: 'offline', jqLatency: null } as ConnectionStatus,
    spotSource: 'JQData' as 'Datayes' | 'JQData', // Default preference to JQData
    lastSyncedSignature: ''
};

export const SpotIndustry: React.FC<SpotIndustryProps> = ({ onNavigate }) => {
  const [activeAsset, setActiveAsset] = useState<keyof typeof ASSET_CONFIG>(SPOT_CACHE.activeAsset);
  const [activeRegion, setActiveRegion] = useState('North China (Ports)');
  const [spotSource, setSpotSource] = useState<'Datayes' | 'JQData'>(SPOT_CACHE.spotSource); // Source Toggle
  
  const [chartData, setChartData] = useState<MarketPair[]>(SPOT_CACHE.data);
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(SPOT_CACHE.connStatus);

  // Push State
  const [isPushed, setIsPushed] = useState(false);

  // Toast
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

  // Defines the main visible assets
  const mainAssets: (keyof typeof ASSET_CONFIG)[] = ['Corn', 'Soybean', 'Wheat'];
  const moreAssets = Object.keys(ASSET_CONFIG).filter(k => !mainAssets.includes(k as any)) as (keyof typeof ASSET_CONFIG)[];

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry', active: true },
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
          
          if (currentSig !== SPOT_CACHE.lastSyncedSignature) {
              const code = GLOBAL_MARKET_CONTEXT.asset.code; 
              const match = code.match(/^([A-Z]+)/);
              if (match) {
                  const varietyPrefix = match[1];
                  const mappedSpot = CODE_TO_SPOT_MAP[varietyPrefix];
                  
                  if (mappedSpot) {
                      console.log(`[Spot] Global Sync: ${code} -> ${mappedSpot}`);
                      setActiveAsset(mappedSpot);
                      // Invalidate previous data to force refetch with new dates/asset
                      setChartData([]);
                      setIsPushed(false);
                  } else {
                      setToast({
                          show: true,
                          msg: `Global Asset '${GLOBAL_MARKET_CONTEXT.asset.name}' has no direct spot model.`
                      });
                  }
              }
              SPOT_CACHE.lastSyncedSignature = currentSig;
          }
      }
  }, []);

  // 1. Check Connections from LocalStorage (Simulating API Console Monitor)
  const checkConnections = useCallback(() => {
      const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
      
      const jqNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)');
      const datayesNode = savedConns.find((c: any) => c.provider === 'Datayes (通联数据)');

      setConnStatus({
          jq: jqNode?.status === 'online' ? 'online' : 'offline',
          datayes: datayesNode?.status === 'online' ? 'online' : (datayesNode?.status === 'restricted' ? 'restricted' : 'offline'),
          jqLatency: jqNode?.latency || null,
          datayesMsg: datayesNode?.status === 'restricted' ? 'No Access' : undefined
      });
  }, []);

  useEffect(() => {
      checkConnections();
      const interval = setInterval(checkConnections, 5000);
      return () => clearInterval(interval);
  }, [checkConnections]);

  // --- Reset Push State when asset changes ---
  useEffect(() => {
      setIsPushed(false);
      SPOT_CACHE.activeAsset = activeAsset;
  }, [activeAsset]);

  // 2. Fetch Data (Futures Real + Spot Sim/Real based on Source)
  const fetchData = useCallback(async () => {
      setLoading(true);
      const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
      const jqNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)');
      
      // Default Logic: If no JQ, use pure simulation. If JQ, use Real Futures + Sim Spot
      let rawFutures: any[] = [];
      let usingRealFutures = false;

      // Use Global Context Dates if set, else default to 60 days
      const end = GLOBAL_MARKET_CONTEXT.isContextSet ? GLOBAL_MARKET_CONTEXT.endDate : new Date().toISOString().split('T')[0];
      const start = GLOBAL_MARKET_CONTEXT.isContextSet ? GLOBAL_MARKET_CONTEXT.startDate : new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split('T')[0];

      // A. Try Fetch JQ Futures (Always needed for Basis)
      if (jqNode && jqNode.status === 'online') {
          try {
              const bridgeUrl = jqNode.url.trim().replace(/\/$/, '');
              
              const res = await fetch(`${bridgeUrl}/api/jqdata/price`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      username: jqNode.username,
                      password: jqNode.password,
                      symbol: ASSET_CONFIG[activeAsset].jqCode,
                      frequency: 'daily',
                      start_date: start,
                      end_date: end
                  })
              });
              
              const json = await res.json();
              if (json.success && json.data) {
                  rawFutures = json.data;
                  usingRealFutures = true;
              }
          } catch (e) {
              console.error("JQ Fetch Fail", e);
          }
      }

      // C. Construct Combined Dataset
      const processedData: MarketPair[] = [];
      const config = ASSET_CONFIG[activeAsset];
      
      // Logic Rule: 
      // If spotSource == 'Datayes', we expect data from Datayes. Since it's missing, we flag it or use empty/sim.
      // If spotSource == 'JQData', we use JQData Industry Library logic (Simulated here as we don't have the explicit table endpoint yet).
      
      if (usingRealFutures) {
          rawFutures.forEach((item: any, idx: number) => {
              const futuresPrice = item.close;
              
              // Spot Logic based on Source
              let spotPrice = 0;
              let inventoryLevel = 50; // Base inventory index
              
              if (spotSource === 'JQData') {
                  // JQData Industry Logic: Often correlates closely with Futures but with seasonal basis
                  // Simulate looking up "Industry Inventory" table
                  const seasonality = Math.sin(idx / 10) * 50; // Seasonal basis swing
                  const randomBasis = (Math.random() - 0.4) * (futuresPrice * 0.03); 
                  spotPrice = futuresPrice + seasonality + randomBasis + 20; 
                  
                  // Inventory Logic: Inverse to price usually
                  inventoryLevel = 50000 - (spotPrice * 5) + (Math.random() * 2000);
              } else {
                  // Datayes Logic: Missing data, so we might return 0 or a flat line to indicate "No Data"
                  // OR simulate a "broken" feed
                  spotPrice = futuresPrice; // Fallback to parity if data missing
                  inventoryLevel = 0; // Missing data
              }

              processedData.push({
                  date: item.date,
                  futuresPrice: Math.round(futuresPrice),
                  spotPrice: Math.round(spotPrice),
                  basis: Math.round(spotPrice - futuresPrice),
                  inventory: Math.max(0, Math.round(inventoryLevel)),
                  isSpotSimulated: true 
              });
          });
      } else {
          // Fallback: Pure Simulation if JQ Futures is also offline
          // Generate data for the Global Context range or default 60 days
          const sDate = new Date(start);
          const eDate = new Date(end);
          const days = Math.floor((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
          
          let price = config.baseSpot;
          for (let i = 0; i <= days; i++) {
              const d = new Date(sDate);
              d.setDate(d.getDate() + i);
              price = price * (1 + (Math.random() - 0.5) * config.volatility);
              const fut = price * (1 - (Math.random() * 0.02));
              
              processedData.push({
                  date: d.toISOString().split('T')[0],
                  futuresPrice: Math.round(fut),
                  spotPrice: Math.round(price),
                  basis: Math.round(price - fut),
                  inventory: 45000 + (Math.random() * 5000),
                  isSpotSimulated: true
              });
          }
      }

      setChartData(processedData);
      SPOT_CACHE.data = processedData;
      SPOT_CACHE.activeAsset = activeAsset;
      SPOT_CACHE.spotSource = spotSource;
      setLoading(false);

  }, [activeAsset, spotSource]);

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  // Push Logic (Enhanced for Pre-processing)
  const handlePushSignal = () => {
      if (chartData.length === 0) return;

      // Extract interval from data
      const intervalStart = chartData[0].date;
      const intervalEnd = chartData[chartData.length - 1].date;

      DATA_LAYERS.set('spot', {
          sourceId: 'spot',
          name: `Spot Basis: ${activeAsset}`,
          metricName: 'Basis & Inventory',
          // Simple visualization data
          data: chartData.map(d => ({
              date: d.date,
              value: d.basis,
              meta: { futures: d.futuresPrice, spot: d.spotPrice }
          })),
          // High-Res Payload with full inventory and basis series
          spotPackage: {
              basisSeries: chartData, // Contains futures, spot, basis, inventory
              metadata: {
                  assetName: activeAsset,
                  spotSource: spotSource,
                  interval: { start: intervalStart, end: intervalEnd }
              }
          },
          timestamp: Date.now()
      });

      setIsPushed(true);
  };

  // Derived Stats
  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const basisTrend = latestData && chartData.length > 1 ? latestData.basis - chartData[chartData.length - 2].basis : 0;

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
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0d59f2] to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">JD</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">Trader 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Commodity Desk</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold">Spot & Industry Analytics</h2>
              <div className="flex gap-4 mt-2 items-center">
                {/* Asset Selector (UPDATED UI) */}
                <div className="flex bg-[#182234] border border-[#314368] rounded-lg p-0.5 items-center">
                    {/* Main Buttons */}
                    {mainAssets.map((asset) => (
                        <button
                            key={asset}
                            onClick={() => setActiveAsset(asset)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                activeAsset === asset ? 'bg-[#0d59f2] text-white shadow-md' : 'text-[#90a4cb] hover:text-white'
                            }`}
                        >
                            {asset}
                        </button>
                    ))}
                    
                    <div className="h-4 w-px bg-[#314368] mx-1"></div>

                    {/* More Dropdown */}
                    <div className="relative group px-2">
                        <button className={`flex items-center gap-1 text-[10px] font-bold uppercase ${!mainAssets.includes(activeAsset) ? 'text-[#0d59f2]' : 'text-[#90a4cb]'}`}>
                            {!mainAssets.includes(activeAsset) ? activeAsset : 'More'}
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={!mainAssets.includes(activeAsset) ? activeAsset : ''}
                            onChange={(e) => setActiveAsset(e.target.value as any)}
                        >
                            <option value="" disabled>Select...</option>
                            {moreAssets.map(asset => (
                                <option key={asset} value={asset}>{ASSET_CONFIG[asset].name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="h-4 w-px bg-[#314368]"></div>
                
                {/* Spot Source Toggle */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Spot Source:</span>
                    <div className="flex bg-[#182234] border border-[#314368] rounded-lg p-0.5">
                        <button 
                            onClick={() => setSpotSource('Datayes')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                spotSource === 'Datayes' ? 'bg-[#ffb347] text-[#101622]' : 'text-[#90a4cb] hover:text-white'
                            }`}
                        >
                            Datayes (Api)
                        </button>
                        <button 
                            onClick={() => setSpotSource('JQData')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                spotSource === 'JQData' ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb] hover:text-white'
                            }`}
                        >
                            JQData (Ind)
                        </button>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchData}
                className="flex items-center justify-center rounded-lg bg-[#182234] hover:bg-[#314368] p-2 border border-[#314368] transition-all"
                title="Refresh Data"
              >
                <span className={`material-symbols-outlined text-white text-lg ${loading ? 'animate-spin' : ''}`}>sync</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            
            {/* Top Row: Industry Margins & Downstream */}
            <div className="grid grid-cols-12 gap-6">
                {/* Processing Margin Card */}
                <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-white">factory</span>
                    </div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#90a4cb] text-xs font-bold uppercase tracking-widest">Industry Margin</h3>
                        <span className="text-[9px] bg-[#101622] text-[#90a4cb] px-2 py-0.5 rounded border border-[#314368]">Est. Model</span>
                    </div>
                    <h4 className="text-white text-sm font-bold mb-4">{ASSET_CONFIG[activeAsset].marginName}</h4>
                    
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-black text-white`}>
                            {latestData ? `${latestData.basis > 0 ? '+' : ''}${Math.abs(latestData.basis * 0.8).toFixed(0)}` : '---'}
                        </span>
                        <span className="text-xs font-bold text-[#90a4cb]">CNY/MT</span>
                    </div>
                    
                    <div className="w-full bg-[#101622] h-2 rounded-full overflow-hidden mb-4 border border-[#314368]">
                        <div className="h-full bg-[#0d59f2]" style={{ width: '65%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-[#90a4cb] uppercase font-bold">
                        <span>Basis Driven Profitability</span>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-[#0d59f2]">trending_up</span>
                        </span>
                    </div>
                </div>

                {/* Downstream Demand Card - DYNAMIC SOURCE */}
                <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                    <h3 className="text-[#90a4cb] text-xs font-bold uppercase tracking-widest mb-4">Inventory Pressure</h3>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full border-4 ${spotSource === 'JQData' ? 'border-[#0d59f2]' : 'border-[#fa6238]'} border-t-transparent flex items-center justify-center`}>
                            <span className={`material-symbols-outlined ${spotSource === 'JQData' ? 'text-[#0d59f2]' : 'text-[#fa6238]'}`}>inventory_2</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Port Stock Levels</p>
                            <p className={`${spotSource === 'JQData' ? 'text-[#0d59f2]' : 'text-[#fa6238]'} text-[10px]`}>
                                {spotSource === 'JQData' ? 'JQ Industry (Macro)' : 'Datayes (Missing)'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-[#90a4cb]">
                            <span>Current Level</span>
                            <span className="text-white">{latestData?.inventory?.toLocaleString() || '---'} MT</span>
                        </div>
                        <div className="w-full bg-[#101622] h-1.5 rounded-full">
                            <div className={`${spotSource === 'JQData' ? 'bg-[#0d59f2]' : 'bg-[#fa6238]'} h-full rounded-full transition-all duration-1000`} style={{ width: spotSource === 'JQData' ? '65%' : '5%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Connection Status Card */}
                <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative">
                    <h3 className="text-[#90a4cb] text-xs font-bold uppercase tracking-widest mb-4">Source Integrity</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-[#101622] border border-[#314368] rounded">
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${connStatus.jq === 'online' ? 'bg-[#0bda5e] shadow-[0_0_5px_#0bda5e]' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-bold text-white">JQData (Futures)</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#90a4cb]">{connStatus.jqLatency ? `${connStatus.jqLatency}ms` : '---'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#101622] border border-[#314368] rounded">
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${spotSource === 'Datayes' ? (connStatus.datayes === 'online' ? 'bg-[#0bda5e]' : 'bg-[#ffb347]') : 'bg-slate-600'}`}></div>
                                <span className="text-xs font-bold text-white">Datayes (Spot)</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#ffb347]">{connStatus.datayes === 'restricted' ? 'No Token' : connStatus.datayes}</span>
                        </div>
                        {spotSource === 'JQData' && (
                            <div className="flex items-center justify-between p-2 bg-[#0d59f2]/10 border border-[#0d59f2]/30 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-[#0d59f2] shadow-[0_0_5px_#0d59f2]"></div>
                                    <span className="text-xs font-bold text-white">JQ Industry DB</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#0d59f2]">Active</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Section: Basis Chart (Dynamic) */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 flex flex-col h-[400px]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white text-lg font-bold">Basis Analysis: {activeAsset}</h3>
                    <p className="text-[#90a4cb] text-xs">Spread between Spot ({spotSource}) and Futures ({ASSET_CONFIG[activeAsset].jqCode})</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1"><span className="w-3 h-1 bg-[#0d59f2]"></span> Futures</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-1 bg-[#fa6238]"></span> Spot</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#0bda5e] opacity-30"></span> Basis</div>
                  </div>
                </div>
                
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="basisColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0bda5e" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0bda5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                            <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                            <YAxis yAxisId="price" domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="basis" orientation="right" domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                                labelFormatter={(label) => `${label} ${spotSource === 'JQData' ? '(JQ Industry)' : '(Datayes Sim)'}`}
                            />
                            {/* Basis Area on Secondary Axis */}
                            <Area yAxisId="basis" type="monotone" dataKey="basis" name="Basis Spread" fill="url(#basisColor)" stroke="#0bda5e" strokeOpacity={0.5} />
                            {/* Price Lines on Primary Axis */}
                            <Line yAxisId="price" type="monotone" dataKey="futuresPrice" name="Futures (JQ)" stroke="#0d59f2" strokeWidth={2} dot={false} />
                            <Line yAxisId="price" type="monotone" dataKey="spotPrice" name={`Spot (${spotSource})`} stroke="#fa6238" strokeWidth={2} dot={false} strokeDasharray={spotSource === 'JQData' ? "" : "4 4"} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* Basis Distribution / Histogram */}
              <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 flex flex-col h-[400px]">
                <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-4">Basis Probability Distribution</h3>
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Simplified Bell Curve for Basis */}
                    <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                        <path d="M0,90 Q50,90 80,20 Q100,0 120,20 Q150,90 200,90" fill="none" stroke="#0bda5e" strokeWidth="2" />
                        <line x1="100" y1="0" x2="100" y2="100" stroke="#314368" strokeDasharray="2 2" />
                        <circle cx="120" cy="20" r="4" fill="#fa6238" className="animate-pulse" />
                        <text x="125" y="20" fontSize="8" fill="#fa6238" fontWeight="bold">Current</text>
                    </svg>
                </div>
                <div className="mt-4 pt-4 border-t border-[#314368]">
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-[#90a4cb]">Current Basis</span>
                      <span className={`font-bold ${basisTrend >= 0 ? 'text-[#0bda5e]' : 'text-[#fa6238]'}`}>
                          {latestData ? latestData.basis : 0} 
                          ({basisTrend >= 0 ? '+' : ''}{basisTrend})
                      </span>
                  </div>
                  <p className="text-[10px] text-[#90a4cb] mt-2 italic">
                    Basis derived from {spotSource} is deviating +1.2σ from the mean.
                  </p>
                </div>
              </div>
            </section>

            {/* Regional Spot Price Matrix */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white text-lg font-bold">Regional Spot Matrix (CNY/MT)</h3>
                        <div className="flex gap-2">
                            <span className={`text-[10px] bg-[#101622] text-[#90a4cb] px-2 py-1 rounded border border-[#314368] flex items-center gap-1 ${spotSource === 'JQData' ? 'border-[#0d59f2] text-[#0d59f2]' : ''}`}>
                                {connStatus.datayes !== 'online' && spotSource === 'Datayes' && <span className="material-symbols-outlined text-[10px] text-[#ffb347]">warning</span>}
                                Source: {spotSource === 'JQData' ? 'JQ Industry (Est.)' : 'Datayes (Offline)'}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-[#90a4cb] uppercase text-[10px] tracking-widest bg-[#182234]/40 border-b border-[#314368]">
                                    <th className="px-6 py-4">Region / Hub</th>
                                    <th className="px-6 py-4">Spot Price</th>
                                    <th className="px-6 py-4">Basis (vs Futures)</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#314368]">
                                {[
                                    { hub: 'Harbin (Heilongjiang)', offset: -150, status: 'Production' },
                                    { hub: 'Jinzhou Port (Liaoning)', offset: +20, status: 'Transit' },
                                    { hub: 'Rizhao Port (Shandong)', offset: +120, status: 'Processing' },
                                    { hub: 'Shekou Port (Guangdong)', offset: +240, status: 'Consumption' },
                                ].map((row, i) => {
                                    const basePrice = latestData ? latestData.spotPrice : ASSET_CONFIG[activeAsset].baseSpot;
                                    const regionalPrice = basePrice + row.offset;
                                    const regionalBasis = latestData ? (regionalPrice - latestData.futuresPrice) : 0;
                                    
                                    return (
                                        <tr key={i} className="hover:bg-[#0d59f2]/5 transition-colors cursor-default">
                                            <td className="px-6 py-4 font-bold text-white">{row.hub}</td>
                                            <td className="px-6 py-4 font-mono text-white">{Math.round(regionalPrice)}</td>
                                            <td className={`px-6 py-4 font-mono text-xs ${regionalBasis > 0 ? 'text-[#0d59f2]' : 'text-[#fa6238]'}`}>
                                                {regionalBasis > 0 ? '+' : ''}{Math.round(regionalBasis)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] px-2 py-0.5 rounded border border-[#314368] text-[#90a4cb] bg-[#101622] uppercase">
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>

          {/* Action Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${spotSource === 'JQData' ? 'text-emerald-500' : (connStatus.datayes === 'online' ? 'text-emerald-500' : 'text-[#ffb347]')}`}>hub</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Aggregation Status</p>
                  <p className="text-[10px] text-[#90a4cb]">
                    Mode: <span className="text-white font-bold">{spotSource}</span> | 
                    JQ: {connStatus.jq === 'online' ? 'LIVE' : 'OFF'}
                  </p>
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
                    <><span className="material-symbols-outlined text-lg">cloud_upload</span> PUSH SPOT SIGNAL</>
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
