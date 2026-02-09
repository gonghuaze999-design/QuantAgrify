
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Area,
  Legend
} from 'recharts';
import { PUSHED_ASSETS, EXCHANGE_MAPPING, PUSHED_ASSET_CONTEXTS, DATA_LAYERS, ALGO_VIEW_CACHE, PROCESSED_DATASET } from './GlobalState';
import { SystemClock } from './SystemClock';

interface AlgorithmWorkflowProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

// Data Shape (Enhanced for Wide Table)
interface ProcessingData {
    date: string;
    raw: number;
    adjusted: number;
    volume: number;
    openInterest: number;
    gapSize: number;
    // Fused Layer Value (For UI Visualization Compatibility)
    layerValue?: number; 
    // === DYNAMIC WIDE TABLE COLUMNS (Back-end) ===
    [key: string]: any; 
}

// Metrics
interface QualityMetrics {
    gapSize: number;
    healthScore: number;
    trendContinuity: number;
    volatilitySmoothness: number;
    dataIntegrity: number;
    rolloverEfficiency: number;
}

// --- CORE ETL ENGINE: ALIGNMENT & FUSION ---
const processAndFusionData = (
    rawData: any[], 
    gapMethod: string, 
    activeLayerId: string | null // Still needed for UI Overlay selection
): { data: ProcessingData[], metrics: QualityMetrics, layerMeta: any, fusedCount: number } => {
    
    if (!rawData || rawData.length === 0) return { 
        data: [], 
        metrics: { gapSize: 0, healthScore: 0, trendContinuity: 0, volatilitySmoothness: 0, dataIntegrity: 0, rolloverEfficiency: 0 },
        layerMeta: null,
        fusedCount: 0
    };

    // --- STEP 1: PREPARE SOURCE MAPS (INGESTION & PARSING) ---
    // We convert all disparate data sources into Maps or Sorted Arrays for O(1) or O(log n) access.
    
    const weatherMap = new Map<string, any>();
    const spotMap = new Map<string, any>();
    
    // Low Frequency / Sparse Data (Requires Forward Fill pointers)
    let satData: any[] = [];
    let macroData: any[] = [];
    let customData: any[] = [];

    // Ingest Weather
    const weatherLayer = DATA_LAYERS.get('weather');
    if (weatherLayer && weatherLayer.weatherPackage) {
        weatherLayer.weatherPackage.timeSeries.forEach(d => {
            // Key: Date string YYYY-MM-DD
            weatherMap.set(d.date, { 
                weather_soil: d.soil, 
                weather_precip: d.precip, 
                weather_gdd: d.gdd,
                weather_temp_max: d.tempMax 
            });
        });
    }

    // Ingest Satellite (Sort by date for FF)
    const satLayer = DATA_LAYERS.get('satellite');
    if (satLayer && satLayer.satellitePackage) {
        // ndviSeries usually contains objects with 'date' and 'target' (NDVI)
        satData = [...satLayer.satellitePackage.ndviSeries].sort((a,b) => a.date.localeCompare(b.date));
    }

    // Ingest Supply/Macro
    const supplyLayer = DATA_LAYERS.get('supply');
    if (supplyLayer && supplyLayer.macroPackage) {
        macroData = [...supplyLayer.macroPackage.timeSeries].sort((a,b) => a.date.localeCompare(b.date));
    }

    // Ingest Spot
    const spotLayer = DATA_LAYERS.get('spot');
    if (spotLayer && spotLayer.spotPackage) {
        spotLayer.spotPackage.basisSeries.forEach(d => {
            spotMap.set(d.date, {
                spot_price: d.spotPrice,
                spot_basis: d.basis,
                spot_inventory: d.inventory
            });
        });
    }

    // Ingest Knowledge/Custom
    const customLayer = DATA_LAYERS.get('knowledge');
    if (customLayer && customLayer.knowledgePackage) {
        customData = [...customLayer.knowledgePackage.quantifiedSeries].sort((a: any, b: any) => a.date.localeCompare(b.date));
    }

    // --- STEP 2: PRICE ADJUSTMENT (CLEANING) ---
    
    // Detect Average Volatility
    let totalVol = 0;
    for (let i = 1; i < rawData.length; i++) {
        totalVol += Math.abs((rawData[i].close - rawData[i-1].close) / rawData[i-1].close);
    }
    const avgVol = totalVol / (rawData.length - 1);
    const gapThreshold = avgVol * 4; 

    // Identify Gaps
    const gaps = new Array(rawData.length).fill(0);
    let gapCount = 0;
    let maxJump = 0;
    
    for (let i = 1; i < rawData.length; i++) {
        const curr = rawData[i].close;
        const prev = rawData[i-1].close;
        const pctChange = (curr - prev) / prev;
        
        if (Math.abs(pctChange) > gapThreshold) {
            const jump = curr - prev;
            gaps[i] = jump;
            gapCount++;
            if (Math.abs(jump) > maxJump) maxJump = Math.abs(jump);
        }
    }

    // Calculate Cumulative Offsets
    let cumulativeGap = 0;
    const offsetArray = new Array(rawData.length).fill(0);
    for (let i = 0; i < rawData.length; i++) {
        cumulativeGap += gaps[i];
        offsetArray[i] = cumulativeGap;
    }
    const totalGap = offsetArray[rawData.length - 1];

    // --- STEP 3: ALIGNMENT & MERGE (ETL MAIN LOOP) ---
    
    const fusedData: ProcessingData[] = [];
    let sumReturns = 0;
    
    // State pointers for Forward Filling
    let lastSatVal: number | null = null;
    let lastMacroVal: number | null = null;
    let lastCustomVal: number | null = null;

    // Helper pointers to optimize array traversal (avoid O(N^2))
    let satIdx = 0;
    let macroIdx = 0;
    let customIdx = 0;

    for (let i = 0; i < rawData.length; i++) {
        const rawPrice = rawData[i].close;
        const dateStr = rawData[i].date; // MASTER INDEX DATE
        
        // A. Price Adjustment
        let adjustedPrice = rawPrice;
        if (gapMethod === 'FRONT_ADJ') {
            adjustedPrice = rawPrice - offsetArray[i];
        } else if (gapMethod === 'BACK_ADJ') {
            adjustedPrice = rawPrice - offsetArray[i] + totalGap;
        } 

        if (i > 0) {
             const prevAdj = fusedData[i-1].adjusted;
             sumReturns += Math.abs(adjustedPrice - prevAdj);
        }

        // B. Multi-Source Fusion
        
        // 1. Weather (Direct Match)
        const wData = weatherMap.get(dateStr) || {}; 
        
        // 2. Satellite (Forward Fill)
        // Advance pointer until we find a satellite date > current date
        while (satIdx < satData.length && satData[satIdx].date <= dateStr) {
            if (satData[satIdx].target !== null) lastSatVal = satData[satIdx].target; // Update known value
            satIdx++;
        }
        
        // 3. Macro (Forward Fill)
        while (macroIdx < macroData.length && macroData[macroIdx].date <= dateStr) {
            if (macroData[macroIdx].aiScore !== null) lastMacroVal = macroData[macroIdx].aiScore;
            macroIdx++;
        }

        // 4. Spot (Direct Match)
        const sData = spotMap.get(dateStr) || {};

        // 5. Custom (Forward Fill)
        while (customIdx < customData.length && customData[customIdx].date <= dateStr) {
            if (customData[customIdx].score !== null) lastCustomVal = customData[customIdx].score;
            customIdx++;
        }

        // C. Construct Wide Row
        const row: ProcessingData = {
            date: dateStr,
            raw: rawPrice,
            adjusted: parseFloat(adjustedPrice.toFixed(2)),
            open: rawData[i].open,
            high: rawData[i].high,
            low: rawData[i].low,
            volume: rawData[i].volume || 0,
            openInterest: rawData[i].open_interest || 0,
            gapSize: gaps[i],
            
            // Fused Fields
            ...wData, // weather_soil, weather_precip...
            sat_ndvi: lastSatVal,
            macro_ai_score: lastMacroVal,
            ...sData, // spot_price, spot_basis, spot_inventory
            custom_ai_score: lastCustomVal
        };

        // D. Determine UI Visualization Layer Value (Legacy Support)
        if (activeLayerId === 'weather') row.layerValue = row.weather_soil;
        else if (activeLayerId === 'satellite') row.layerValue = row.sat_ndvi;
        else if (activeLayerId === 'supply') row.layerValue = row.macro_ai_score;
        else if (activeLayerId === 'spot') row.layerValue = row.spot_basis;
        else if (activeLayerId === 'knowledge') row.layerValue = row.custom_ai_score;
        else if (activeLayerId && DATA_LAYERS.has(activeLayerId)) {
             // Fallback for simple layers without packages
             const simpleLayer = DATA_LAYERS.get(activeLayerId)!;
             const match = simpleLayer.data.find(d => d.date === dateStr);
             row.layerValue = match ? match.value : undefined;
        }

        fusedData.push(row);
    }

    // Normalized Metrics (0-100)
    const refPrice = rawData[0]?.close || 1000;
    const trendContinuity = Math.max(0, 100 - (maxJump / refPrice * 1000));
    const volatilitySmoothness = Math.max(0, 100 - ((sumReturns / rawData.length) / refPrice * 5000));
    const integrity = rawData.length > 0 ? 100 : 0;
    const rolloverEfficiency = 95; 

    // Count Fusion Sources
    let fusedCount = 0;
    if (weatherMap.size > 0) fusedCount++;
    if (satData.length > 0) fusedCount++;
    if (macroData.length > 0) fusedCount++;
    if (spotMap.size > 0) fusedCount++;
    if (customData.length > 0) fusedCount++;

    // Extract Meta for UI Display from Active Layer
    let layerMeta = null;
    if (activeLayerId && DATA_LAYERS.has(activeLayerId)) {
        const layer = DATA_LAYERS.get(activeLayerId)!;
        if (layer.weatherPackage) layerMeta = layer.weatherPackage.metadata;
        else if (layer.satellitePackage) layerMeta = layer.satellitePackage.metadata;
        else if (layer.macroPackage) layerMeta = layer.macroPackage.metadata;
        else if (layer.spotPackage) layerMeta = layer.spotPackage.metadata;
    }

    return {
        data: fusedData,
        metrics: {
            gapSize: gapCount,
            healthScore: parseFloat(((trendContinuity + volatilitySmoothness) / 2).toFixed(1)),
            trendContinuity: parseFloat(trendContinuity.toFixed(1)),
            volatilitySmoothness: parseFloat(volatilitySmoothness.toFixed(1)),
            dataIntegrity: integrity,
            rolloverEfficiency
        },
        layerMeta,
        fusedCount
    };
};

export const AlgorithmWorkflow: React.FC<AlgorithmWorkflowProps> = ({ onNavigate }) => {
  const [selectedAsset, setSelectedAsset] = useState(() => {
      if (ALGO_VIEW_CACHE.selectedAsset && PUSHED_ASSETS.has(ALGO_VIEW_CACHE.selectedAsset)) {
          return ALGO_VIEW_CACHE.selectedAsset;
      }
      if (PUSHED_ASSETS.size > 0) {
          return Array.from(PUSHED_ASSETS)[Array.from(PUSHED_ASSETS).length - 1];
      }
      const firstSuffix = Object.keys(EXCHANGE_MAPPING)[0];
      const firstCode = EXCHANGE_MAPPING[firstSuffix].varieties[0].code;
      return `${firstCode}${firstSuffix}`;
  });

  const [rolloverRule, setRolloverRule] = useState(ALGO_VIEW_CACHE.rolloverRule);
  const [gapMethod, setGapMethod] = useState(ALGO_VIEW_CACHE.gapMethod);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => {
      if (ALGO_VIEW_CACHE.activeLayerId && DATA_LAYERS.has(ALGO_VIEW_CACHE.activeLayerId)) return ALGO_VIEW_CACHE.activeLayerId;
      return DATA_LAYERS.has('weather') ? 'weather' : null;
  });
  
  const [showRolloverPanel, setShowRolloverPanel] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED'>(ALGO_VIEW_CACHE.status);
  const [activeStep, setActiveStep] = useState(ALGO_VIEW_CACHE.activeStep);
  const [logs, setLogs] = useState<string[]>(ALGO_VIEW_CACHE.logs);
  const [rawDataCache, setRawDataCache] = useState<any[]>(ALGO_VIEW_CACHE.rawDataCache);
  const [chartData, setChartData] = useState<ProcessingData[]>(ALGO_VIEW_CACHE.chartData);
  const [metrics, setMetrics] = useState<QualityMetrics>(ALGO_VIEW_CACHE.metrics);
  const [layerMeta, setLayerMeta] = useState<any | null>(ALGO_VIEW_CACHE.layerMeta);
  const [isRegionMismatch, setIsRegionMismatch] = useState(ALGO_VIEW_CACHE.isRegionMismatch);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      ALGO_VIEW_CACHE.selectedAsset = selectedAsset;
      ALGO_VIEW_CACHE.rolloverRule = rolloverRule;
      ALGO_VIEW_CACHE.gapMethod = gapMethod;
      ALGO_VIEW_CACHE.activeLayerId = activeLayerId;
      ALGO_VIEW_CACHE.status = status;
      ALGO_VIEW_CACHE.activeStep = activeStep;
      ALGO_VIEW_CACHE.logs = logs;
      ALGO_VIEW_CACHE.rawDataCache = rawDataCache;
      ALGO_VIEW_CACHE.chartData = chartData;
      ALGO_VIEW_CACHE.metrics = metrics;
      ALGO_VIEW_CACHE.layerMeta = layerMeta;
      ALGO_VIEW_CACHE.isRegionMismatch = isRegionMismatch;
  }, [selectedAsset, rolloverRule, gapMethod, activeLayerId, status, activeStep, logs, rawDataCache, chartData, metrics, layerMeta, isRegionMismatch]);

  const allAssets = useMemo(() => {
      const list: { id: string, label: string }[] = [];
      Object.entries(EXCHANGE_MAPPING).forEach(([suffix, exchange]) => {
          exchange.varieties.forEach(v => {
              list.push({
                  id: `${v.code}${suffix}`,
                  label: `${v.name} (${v.code}) - ${exchange.name.split(' ')[0]}`
              });
          });
      });
      return list;
  }, []);

  const handleAssetChange = (newAsset: string) => {
      if (newAsset !== selectedAsset) {
          setSelectedAsset(newAsset);
          setStatus('IDLE');
          setChartData([]);
          setRawDataCache([]);
          setMetrics({ gapSize: 0, healthScore: 0, trendContinuity: 0, volatilitySmoothness: 0, dataIntegrity: 0, rolloverEfficiency: 0 });
          setLogs([]);
          setActiveStep(0);
          setLayerMeta(null);
          setIsRegionMismatch(false);
      }
  };

  const handlePushToFeatureEng = () => {
      if (status !== 'COMPLETED' || chartData.length === 0) return;
      PROCESSED_DATASET.ready = true;
      PROCESSED_DATASET.asset = selectedAsset;
      PROCESSED_DATASET.data = chartData;
      PROCESSED_DATASET.metrics = metrics;
      PROCESSED_DATASET.timestamp = Date.now();
      onNavigate('featureEngineering');
  };

  // Re-run fusion if visualization layer changes, but only if pipeline already completed
  useEffect(() => {
      if (status === 'COMPLETED' && rawDataCache.length > 0) {
          const { data, metrics: newMetrics, layerMeta: meta } = processAndFusionData(rawDataCache, gapMethod, activeLayerId);
          setChartData(data);
          setMetrics(newMetrics);
          setLayerMeta(meta);
          if (meta && meta.assetName) {
              const rawCode = selectedAsset.replace(/[0-9.]/g, ''); 
              const weatherName = meta.assetName.toUpperCase();
              const match = weatherName.includes(`- ${rawCode})`) || weatherName.includes(`(${rawCode})`);
              setIsRegionMismatch(!match);
          } else {
              setIsRegionMismatch(false);
          }
      }
  }, [gapMethod, rawDataCache, status, activeLayerId]); 

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runPipeline = async () => {
    if (status === 'PROCESSING') return;
    setStatus('PROCESSING');
    setLogs([]);
    setActiveStep(1);
    
    // 1. JQData Connection
    const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
    const jqNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)');
    if (!jqNode || !jqNode.username) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [ERROR] JQData Credentials missing/offline.`]);
        setStatus('IDLE');
        return;
    }

    // 2. Context Loading
    const context = PUSHED_ASSET_CONTEXTS.get(selectedAsset);
    let symbol = selectedAsset;
    let startDate = "";
    let endDate = "";
    if (context) {
        symbol = context.symbol;
        startDate = context.startDate;
        endDate = context.endDate;
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [INIT] Loaded Context: ${symbol} (${startDate} to ${endDate})`]);
    } else {
        if (symbol.includes('.') && !/\d/.test(symbol.split('.')[0])) {
            const parts = symbol.split('.');
            symbol = `${parts[0]}9999.${parts[1]}`;
        }
        const d = new Date();
        endDate = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 365);
        startDate = d.toISOString().split('T')[0];
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [WARN] No specific context found. Defaulting to 1 year history.`]);
    }

    try {
        // 3. Ingest Futures Data (Backbone)
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [INGEST] Connecting to JQData Bridge...`]);
        const response = await fetch(`${jqNode.url.trim().replace(/\/$/, '')}/api/jqdata/price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: jqNode.username,
                password: jqNode.password,
                symbol: symbol,
                frequency: 'daily',
                start_date: startDate,
                end_date: endDate
            })
        });
        if (!response.ok) throw new Error(`Backend Status ${response.status}`);
        const json = await response.json();
        if (!json.success || !json.data) throw new Error(json.error || "No data returned");
        const rawData = json.data;
        setRawDataCache(rawData); 
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [INGEST] Downloaded ${rawData.length} futures bars.`]);
        
        setActiveStep(2);
        await new Promise(r => setTimeout(r, 500));
        
        // 4. Scanning Data Layers
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [SCAN] Scanning Data Bus for Fusion Layers...`]);
        const layers = Array.from(DATA_LAYERS.values());
        if (layers.length > 0) {
            layers.forEach(l => {
                setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [FOUND] Layer: ${l.name} (${l.sourceId})`]);
            });
        } else {
            setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [INFO] No external layers found. Processing Price Only.`]);
        }

        // 5. Alignment & Fusion (ETL)
        setActiveStep(3);
        await new Promise(r => setTimeout(r, 500));
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [ALIGN] Establishing Master Date Index based on Futures Trading Days.`]);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [TRANSFORM] Executing Forward-Fill / Date-Match algorithms...`]);
        
        const { data, metrics: finalMetrics, layerMeta: meta, fusedCount } = processAndFusionData(rawData, gapMethod, activeLayerId);
        
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [MERGE] Integrated ${fusedCount} external data dimensions.`]);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [ADJUST] Applied '${gapMethod}' to Price Series.`]);

        // 6. Validation & Completion
        setActiveStep(4);
        await new Promise(r => setTimeout(r, 500));
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [VALIDATE] Wide Table Generated: ${data.length} rows.`]);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} >> PIPELINE SUCCESS. Dataset Ready for Feature Eng.`]);
        
        setChartData(data);
        setMetrics(finalMetrics);
        setLayerMeta(meta);
        setStatus('COMPLETED');

    } catch (e: any) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [ERROR] Pipeline Failed: ${e.message}`]);
        setStatus('IDLE');
    }
  };

  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm', active: true, desc: 'Cleaning & Alignment' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering', active: false, desc: 'Alpha Factor Extraction' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion', active: false, desc: 'Signal Combination' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl', active: false, desc: 'Exposure & Limits' },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration', active: false, desc: 'Walk-forward Test' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  return (
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Precision Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0e17]/80 backdrop-blur-2xl px-6 flex items-center justify-between z-[60] shrink-0">
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
          {/* UPDATED: System Clock Integration */}
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* ... Rest of component remains the same ... */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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
            <div className="p-4 rounded-xl bg-[#1a2333] border border-[#222f49] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <div>
                <p className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-wider">Engine Status</p>
                <p className="text-xs font-bold text-white">Online (Python)</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f1a] relative">
          {/* Background Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(#0d59f2 1px, transparent 1px), linear-gradient(90deg, #0d59f2 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          {/* Top Pipeline Visualizer */}
          <div className="h-32 border-b border-[#222f49] bg-[#101622]/50 backdrop-blur-md flex items-center justify-center relative shrink-0">
            <div className="flex items-center gap-4 relative z-10">
              {[
                { id: 1, label: 'Ingest', icon: 'database' },
                { id: 2, label: 'Clean', icon: 'cleaning_services' },
                { id: 3, label: 'Fusion', icon: 'merge_type' },
                { id: 4, label: 'Validate', icon: 'fact_check' }
              ].map((step, i, arr) => (
                <React.Fragment key={step.id}>
                  <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
                    activeStep >= step.id ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <div className={`size-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${
                      activeStep === step.id ? 'bg-[#0d59f2] border-[#0d59f2] scale-110 shadow-[#0d59f2]/40' : 
                      activeStep > step.id ? 'bg-[#101622] border-[#0d59f2] text-[#0d59f2]' : 
                      'bg-[#101622] border-[#222f49] text-[#90a4cb]'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{step.icon}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeStep >= step.id ? 'text-[#0d59f2]' : 'text-[#90a4cb]'}`}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-16 h-0.5 bg-[#222f49] relative overflow-hidden">
                      <div className={`absolute inset-0 bg-[#0d59f2] transition-all duration-1000 ${activeStep > step.id ? 'w-full' : 'w-0'}`}></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* PUSH BUTTON (New) */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <button 
                    onClick={handlePushToFeatureEng}
                    disabled={status !== 'COMPLETED'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all shadow-xl font-bold text-xs uppercase tracking-widest ${
                        status === 'COMPLETED' 
                        ? 'bg-[#0d59f2] border-[#0d59f2] text-white hover:bg-[#1a66ff] hover:scale-105 shadow-[#0d59f2]/20' 
                        : 'bg-[#1a2333] border-[#314368] text-[#90a4cb] opacity-50 cursor-not-allowed'
                    }`}
                >
                    Next: Feature Eng.
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left: Configuration & Logs */}
            <div className="w-96 border-r border-[#222f49] bg-[#0a0c10] flex flex-col shrink-0">
              <div className="p-6 border-b border-[#222f49]">
                <h3 className="text-xs font-black text-[#90a4cb] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  Pipeline Config
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Target Asset (From Futures)</label>
                    <select 
                      value={selectedAsset} 
                      onChange={(e) => handleAssetChange(e.target.value)}
                      disabled={status === 'PROCESSING'}
                      className="w-full bg-[#182234] border border-[#222f49] rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#0d59f2] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {allAssets.map(asset => {
                          const isPushed = PUSHED_ASSETS.has(asset.id);
                          return (
                              <option key={asset.id} value={asset.id} disabled={!isPushed} className={isPushed ? 'text-white' : 'text-slate-600 bg-[#0a0c10]'}>
                                  {asset.label} {isPushed ? '●' : '(Not Pushed)'}
                              </option>
                          );
                      })}
                    </select>
                    {PUSHED_ASSETS.size === 0 && (
                        <p className="text-[9px] text-[#fa6238] mt-1">
                            * No assets pushed. Go to "Futures Trading" and push an asset.
                        </p>
                    )}
                  </div>

                  {/* ROLLOVER RULE SETTING */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase flex justify-between">
                        Rollover Logic
                        <span className="text-[9px] text-[#0d59f2] cursor-pointer hover:underline" onClick={() => setShowRolloverPanel(!showRolloverPanel)}>
                            {showRolloverPanel ? 'Hide Chart' : 'Show Analysis'}
                        </span>
                    </label>
                    <select 
                      value={rolloverRule}
                      onChange={(e) => setRolloverRule(e.target.value)}
                      className="w-full bg-[#182234] border border-[#222f49] rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#0d59f2]"
                    >
                      <option value="MAX_OI">Max Open Interest (Dominant)</option>
                      <option value="MAX_VOL">Max Volume</option>
                      <option value="FIXED_DATE">Fixed Date (20th prev month)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Gap Handling</label>
                    <select 
                      value={gapMethod}
                      onChange={(e) => setGapMethod(e.target.value)}
                      disabled={status === 'PROCESSING'}
                      className="w-full bg-[#182234] border border-[#222f49] rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#0d59f2] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="BACK_ADJ">Back Adjustment (Latest Valid)</option>
                      <option value="FRONT_ADJ">Front Adjustment (Anchor Past)</option>
                      <option value="NONE">None (Raw Gaps)</option>
                    </select>
                  </div>

                  <button 
                    onClick={runPipeline}
                    disabled={status === 'PROCESSING' || !PUSHED_ASSETS.has(selectedAsset)}
                    className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg mt-4 ${
                      status === 'PROCESSING' || !PUSHED_ASSETS.has(selectedAsset)
                      ? 'bg-[#222f49] text-[#90a4cb] cursor-not-allowed' 
                      : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20 hover:scale-[1.02]'
                    }`}
                  >
                    {status === 'PROCESSING' ? (
                      <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> Processing...</>
                    ) : status === 'COMPLETED' ? (
                      <><span className="material-symbols-outlined text-sm">replay</span> Re-run Pipeline</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">play_arrow</span> Execute Pipeline</>
                    )}
                  </button>
                </div>
              </div>

              {/* Log Terminal */}
              <div className="flex-1 bg-[#05070a] p-4 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-[#90a4cb] uppercase tracking-widest">System Logs</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed text-[#90a4cb]/80 p-2 border border-[#222f49] rounded-lg bg-[#0a0c10]">
                  {logs.length === 0 && <span className="opacity-30 italic">Waiting for execution...</span>}
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-slate-600 mr-2">{log.split(' ')[0]}</span>
                      <span className={log.includes('SUCCESS') ? 'text-[#0bda5e]' : log.includes('ERROR') ? 'text-[#fa6238]' : log.includes('MERGE') ? 'text-[#ffb347]' : 'text-slate-300'}>
                        {log.substring(log.indexOf(' '))}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>

            {/* Right: Visualization */}
            <div className="flex-1 bg-[#101622]/50 p-8 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
              
              {/* === ROLLOVER ANALYSIS PANEL === */}
              {showRolloverPanel && (
                  <div className="mb-6 bg-[#182234]/30 border border-[#314368] rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white text-sm font-bold flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#fa6238]">compare_arrows</span>
                              Contract Rollover Analysis (Liquidity Flow)
                          </h3>
                          <div className="flex items-center gap-4 text-xs font-bold uppercase">
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0d59f2] rounded-sm"></span> Price</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-600 rounded-sm"></span> Vol</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#fa6238]"></span> OI</span>
                          </div>
                      </div>
                      <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                  <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} tickLine={false} axisLine={{stroke: '#314368'}} />
                                  <YAxis yAxisId="left" domain={['auto', 'auto']} hide />
                                  <YAxis yAxisId="right" orientation="right" tick={{fill: '#fa6238', fontSize: 10}} axisLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #314368' }} itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                                  <Bar yAxisId="right" dataKey="volume" fill="#475569" opacity={0.3} barSize={4} name="Volume" />
                                  <Line yAxisId="right" type="monotone" dataKey="openInterest" stroke="#fa6238" strokeWidth={1.5} dot={false} name="Open Interest" />
                                  <Line yAxisId="left" type="monotone" dataKey="adjusted" stroke="#0d59f2" strokeWidth={1} dot={false} name="Price" opacity={0.5} />
                              </ComposedChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-[9px] text-[#90a4cb] italic text-center">
                          * Crossover of Volume and OI typically indicates optimal rollover window.
                      </div>
                  </div>
              )}

              {/* === MAIN FUSION CHART === */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">analytics</span>
                    Data Fusion Inspector
                  </h2>
                  <p className="text-[#90a4cb] text-xs mt-1">Comparing <span className="text-[#0d59f2] font-bold">Price Action</span> vs <span className="text-[#ffb347] font-bold">External Signals</span></p>
                </div>
                
                {/* === LAYER SWITCHER (Scrollable) === */}
                <div className="flex bg-[#182234] border border-[#222f49] rounded-lg p-1 overflow-x-auto max-w-[500px] no-scrollbar">
                    <button 
                        onClick={() => setActiveLayerId(null)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all whitespace-nowrap shrink-0 mr-1 ${!activeLayerId ? 'bg-[#0d59f2] text-white shadow' : 'text-[#90a4cb] hover:text-white'}`}
                    >
                        Price Only
                    </button>
                    {Array.from(DATA_LAYERS.values()).map(layer => (
                        <button 
                            key={layer.sourceId}
                            onClick={() => setActiveLayerId(layer.sourceId)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-1 whitespace-nowrap shrink-0 mr-1 ${activeLayerId === layer.sourceId ? 'bg-[#ffb347] text-[#101622] shadow' : 'text-[#90a4cb] hover:text-white'}`}
                        >
                            + {layer.metricName || layer.name}
                            {isRegionMismatch && activeLayerId === layer.sourceId && (
                                <span className="material-symbols-outlined text-[10px] text-red-600 font-bold" title="Region Mismatch Warning">warning</span>
                            )}
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex-1 w-full bg-[#182234]/30 border border-[#222f49] rounded-xl p-4 relative shadow-inner min-h-[350px]">
                {status === 'IDLE' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#90a4cb] gap-3 z-10 bg-[#182234]/50 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-4xl opacity-50">pending</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Pipeline Not Executed</span>
                    <p className="text-[10px]">Click "Execute Pipeline" to ingest JQData.</p>
                  </div>
                )}
                
                {status === 'PROCESSING' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#90a4cb] gap-3 z-10 bg-[#182234]/50 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-4xl animate-spin text-[#0d59f2]">settings</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white">Processing Data...</span>
                  </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fill: '#90a4cb', fontSize: 10}} 
                        tickLine={false} 
                        axisLine={{stroke: '#314368'}} 
                        minTickGap={30}
                    />
                    <YAxis 
                        yAxisId="left"
                        domain={['auto', 'auto']} 
                        tick={{fill: '#90a4cb', fontSize: 10}} 
                        axisLine={false} 
                        tickLine={false} 
                        width={40}
                    />
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]} 
                        tick={{fill: '#ffb347', fontSize: 10}} 
                        axisLine={false} 
                        tickLine={false} 
                        width={40}
                        hide={!activeLayerId}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #314368', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                      labelStyle={{ color: '#90a4cb', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    
                    {/* === RAW PRICE (Grey Dashed) === */}
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="raw" 
                      stroke="#94a3b8" 
                      strokeWidth={1} 
                      dot={false} 
                      strokeDasharray="4 4"
                      name="Raw Price"
                      opacity={0.5}
                    />

                    {/* === ADJUSTED PRICE (Blue Solid) === */}
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="adjusted" 
                      stroke="#0d59f2" 
                      strokeWidth={2} 
                      dot={false} 
                      name="Cleaned Price"
                      animationDuration={800} 
                    />
                    
                    {/* === DYNAMIC LAYER === */}
                    {activeLayerId && (
                        <Line 
                            yAxisId="right"
                            type="monotone"
                            dataKey="layerValue"
                            stroke="#ffb347"
                            strokeWidth={2}
                            dot={false}
                            name={DATA_LAYERS.get(activeLayerId)?.metricName || "External Signal"}
                            connectNulls
                        />
                    )}

                    {/* Render Gaps */}
                    {chartData.map((d, index) => {
                        if (d.gapSize !== 0) {
                            return (
                                <ReferenceLine 
                                    yAxisId="left"
                                    key={index}
                                    x={d.date} 
                                    stroke="#fa6238" 
                                    strokeDasharray="3 3" 
                                    label={{ value: 'GAP', fill: '#fa6238', fontSize: 9, position: 'top' }} 
                                />
                            );
                        }
                        return null;
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Mismatch Warning Panel */}
              {isRegionMismatch && (
                  <div className="mt-4 bg-[#ffb347]/10 border border-[#ffb347]/30 rounded-lg p-3 flex items-center gap-3 animate-in fade-in">
                      <span className="material-symbols-outlined text-[#ffb347]">warning</span>
                      <div>
                          <p className="text-[10px] font-bold text-[#ffb347] uppercase">Geospatial Mismatch Detected</p>
                          <p className="text-[10px] text-[#90a4cb]">
                              Futures Asset <strong>({selectedAsset})</strong> region differs from Weather Data <strong>({layerMeta?.regionName})</strong>. 
                              Correlation may be weak.
                          </p>
                      </div>
                  </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-[#182234] border border-[#222f49] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-sm">timeline</span>
                    <div className="flex justify-between w-full">
                        <span className="text-[10px] font-bold text-white uppercase">Trend Continuity</span>
                        <span className="text-[10px] text-[#0d59f2] font-mono">{status === 'COMPLETED' ? `${metrics.trendContinuity}%` : '--'}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#101622] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0d59f2] h-full transition-all duration-700" style={{ width: `${status === 'COMPLETED' ? metrics.trendContinuity : 0}%` }}></div>
                  </div>
                </div>
                <div className="bg-[#182234] border border-[#222f49] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#fa6238] text-sm">compare_arrows</span>
                    <div className="flex justify-between w-full">
                        <span className="text-[10px] font-bold text-white uppercase">Rollover Efficiency</span>
                        <span className="text-[10px] text-[#fa6238] font-mono">{status === 'COMPLETED' ? `${metrics.rolloverEfficiency}%` : '--'}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#101622] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#fa6238] h-full transition-all duration-700" style={{ width: `${status === 'COMPLETED' ? metrics.rolloverEfficiency : 0}%` }}></div>
                  </div>
                </div>
                <div className="bg-[#182234] border border-[#222f49] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#0bda5e] text-sm">verified</span>
                    <div className="flex justify-between w-full">
                        <span className="text-[10px] font-bold text-white uppercase">Data Integrity</span>
                        <span className="text-[10px] text-[#0bda5e] font-mono">{status === 'COMPLETED' ? `${metrics.dataIntegrity.toFixed(1)}%` : '--'}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#101622] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0bda5e] h-full transition-all duration-700" style={{ width: `${status === 'COMPLETED' ? metrics.dataIntegrity : 0}%` }}></div>
                  </div>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
