
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area
} from 'recharts';
import { DATA_LAYERS, GLOBAL_MARKET_CONTEXT, GEMINI_API_KEY } from './GlobalState';
import { SystemClock } from './SystemClock';

interface DataSourceConfigProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// --- CONSTANTS ---

const SATELLITE_TARGETS: Record<string, any> = {
    // DCE
    'Corn (DCE)': { 
        region: 'China Northeast (Heilongjiang)', 
        center: 'Suihua', 
        coords: { lat: 46.63, lon: 126.98 }, 
        cropCal: { start: '04-20', end: '10-15' }, 
        keyStage: 'Pollination (Jul)',
        color: '#facc15'
    },
    'Soybean No.1 (DCE)': { 
        region: 'China Heihe (Non-GMO)', 
        center: 'Heihe', 
        coords: { lat: 50.24, lon: 127.52 }, 
        cropCal: { start: '05-10', end: '10-01' },
        keyStage: 'Pod Setting (Aug)',
        color: '#a3e635'
    },
    'Soybean Meal (DCE)': { 
        region: 'China Coastal (Crushing)', 
        center: 'Rizhao', 
        coords: { lat: 35.42, lon: 119.52 }, 
        cropCal: { start: '01-01', end: '12-31' },
        keyStage: 'Industrial',
        color: '#84cc16'
    },
    'Palm Oil (DCE)': { 
        region: 'Malaysia (Sabah)', 
        center: 'Lahad Datu', 
        coords: { lat: 5.03, lon: 118.33 }, 
        cropCal: { start: '01-01', end: '12-31' }, 
        keyStage: 'Monsoon Season',
        color: '#ea580c'
    },
    // ZCE
    'Cotton (ZCE)': { 
        region: 'China Xinjiang (Aksu)', 
        center: 'Aksu', 
        coords: { lat: 41.16, lon: 80.26 }, 
        cropCal: { start: '04-15', end: '10-20' },
        keyStage: 'Boll Opening (Sep)',
        color: '#ffffff'
    },
    'Sugar (ZCE)': { 
        region: 'China Guangxi (Chongzuo)', 
        center: 'Chongzuo', 
        coords: { lat: 22.40, lon: 107.35 }, 
        cropCal: { start: '03-01', end: '12-01' },
        keyStage: 'Grand Growth',
        color: '#f472b6'
    },
    'Rapeseed Oil (ZCE)': { 
        region: 'China Sichuan (Winter)', 
        center: 'Mianyang', 
        coords: { lat: 31.46, lon: 104.67 }, 
        cropCal: { start: '10-15', end: '05-20' },
        keyStage: 'Flowering (Mar)',
        color: '#fbbf24'
    },
    'Apple (ZCE)': { 
        region: 'China Shaanxi (Loess)', 
        center: 'Luochuan', 
        coords: { lat: 35.76, lon: 109.43 }, 
        cropCal: { start: '04-01', end: '10-15' },
        keyStage: 'Fruit Swelling',
        color: '#ef4444'
    },
    // SHFE
    'Rubber (SHFE)': { 
        region: 'China Yunnan', 
        center: 'Jinghong', 
        coords: { lat: 22.00, lon: 100.79 }, 
        cropCal: { start: '04-01', end: '11-30' },
        keyStage: 'Tapping Season',
        color: '#94a3b8'
    },
    // Global
    'Corn (CBOT)': { 
        region: 'USA Corn Belt (Iowa)', 
        center: 'Des Moines', 
        coords: { lat: 41.58, lon: -93.62 }, 
        cropCal: { start: '04-20', end: '10-15' },
        keyStage: 'Silking (Jul)',
        color: '#facc15'
    },
    'Soybeans (CBOT)': { 
        region: 'USA Soy Belt (Illinois)', 
        center: 'Decatur', 
        coords: { lat: 39.84, lon: -88.95 }, 
        cropCal: { start: '05-01', end: '10-20' },
        keyStage: 'Pod Fill (Aug)',
        color: '#a3e635'
    },
    'Soybeans (Brazil)': { 
        region: 'Brazil Mato Grosso', 
        center: 'Sorriso', 
        coords: { lat: -12.55, lon: -55.72 }, 
        cropCal: { start: '09-15', end: '02-20' },
        keyStage: 'Pod Fill (Dec-Jan)',
        color: '#a3e635'
    },
    'Sugar No.11 (ICE)': {
        region: 'Brazil Sao Paulo',
        center: 'Ribeirão Preto',
        coords: { lat: -21.17, lon: -47.81 },
        cropCal: { start: '04-01', end: '11-30' },
        keyStage: 'Harvest',
        color: '#f472b6'
    }
};

// Map Futures Code Prefix (e.g., 'C' from 'C9999') to Satellite Target Key
const GLOBAL_CONTEXT_MAP: Record<string, string> = {
    'C': 'Corn (DCE)',
    'CS': 'Corn (DCE)', // Starch -> Corn region
    'A': 'Soybean No.1 (DCE)',
    'B': 'Soybean No.1 (DCE)',
    'M': 'Soybean Meal (DCE)',
    'Y': 'Soybean Meal (DCE)', // Oil -> Meal region
    'P': 'Palm Oil (DCE)',
    'CF': 'Cotton (ZCE)',
    'SR': 'Sugar (ZCE)',
    'OI': 'Rapeseed Oil (ZCE)',
    'RM': 'Rapeseed Oil (ZCE)',
    'AP': 'Apple (ZCE)',
    'RU': 'Rubber (SHFE)',
    'ZC': 'Corn (CBOT)',
    'ZS': 'Soybeans (CBOT)',
    'ZM': 'Soybeans (CBOT)', 
    'ZL': 'Soybeans (CBOT)',
    'SB': 'Sugar No.11 (ICE)'
};

const PHENOLOGY_STAGES = [
    { id: 'sowing', label: 'Sowing / Emergence', offsetStart: 0, offsetEnd: 1 }, 
    { id: 'vegetative', label: 'Vegetative Growth', offsetStart: 1, offsetEnd: 2.5 },
    { id: 'reproductive', label: 'Reproductive (Critical)', offsetStart: 2.5, offsetEnd: 4 }, 
    { id: 'harvest', label: 'Maturation / Harvest', offsetStart: 4, offsetEnd: 6 }
];

const ASSET_GROUPS = [
    { label: 'DCE (Dalian)', prefix: '(DCE)' },
    { label: 'ZCE (Zhengzhou)', prefix: '(ZCE)' },
    { label: 'SHFE (Shanghai)', prefix: '(SHFE)' },
    { label: 'Global (CBOT/ICE/Brazil)', prefix: ['(CBOT)', '(Brazil)', '(ICE)'] } 
];

// DYNAMIC YEAR GENERATION - SIMULATING 2026 SYSTEM TIME
const currentYear = 2026; 
const AVAILABLE_YEARS = Array.from({length: 6}, (_, i) => currentYear - i);

// --- PROGRESS STEPS ---
const TASK_STEPS = [
    { id: 1, label: 'Initializing Session', detail: 'Authenticating with GEE...' },
    { id: 2, label: 'ROI & Cloud Masking', detail: '50km Radius, Cloud < 15%...' },
    { id: 3, label: 'Cropland Filtering', detail: 'Applying ESA WorldCover Mask...' },
    { id: 4, label: 'Generating RGB', detail: 'Creating True Color Composites...' },
    { id: 5, label: 'Calculating NDVI', detail: 'Reducing Region Time Series...' }
];

// AI Data Structure
interface AiInsight {
    headline: string;
    analysis: string;
    keyDriver: string;
    riskFactor: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

// --- MODULE LEVEL CACHE (Persistence) ---
const SATELLITE_CACHE = {
    // Inputs
    activeAsset: 'Corn (DCE)',
    lastSyncedSignature: '', // Combination of Code + Start + End to detect changes
    targetYear: currentYear,
    compareYear: currentYear - 1,
    selectedStage: 'reproductive',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
    // Visual State
    zoomLevel: 1,
    pan: { x: 0, y: 0 },
    sliderPosition: 50,
    // Results
    results: {
        currentImageUrl: null as string | null,
        compareImageUrl: null as string | null,
        ndviData: [] as any[],
        yieldAlpha: 0,
        aiInsight: null as AiInsight | null // New AI Cache
    },
    hasData: false
};

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ onNavigate }) => {
  // State
  const [activeAsset, setActiveAsset] = useState<string>(SATELLITE_CACHE.activeAsset);
  const [targetYear, setTargetYear] = useState<number>(SATELLITE_CACHE.targetYear);
  const [compareYear, setCompareYear] = useState<number>(SATELLITE_CACHE.compareYear);
  const [selectedStage, setSelectedStage] = useState<string>(SATELLITE_CACHE.selectedStage);
  
  const [backendUrl, setBackendUrl] = useState(SATELLITE_CACHE.backendUrl);
  const [showConfig, setShowConfig] = useState(false);
  
  // Viewport State (Zoom & Pan)
  const [zoomLevel, setZoomLevel] = useState(SATELLITE_CACHE.zoomLevel);
  const [pan, setPan] = useState(SATELLITE_CACHE.pan);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 
  const [processError, setProcessError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  
  // Split Screen State
  const [sliderPosition, setSliderPosition] = useState(SATELLITE_CACHE.sliderPosition);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  // Data State - Results
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(SATELLITE_CACHE.results.currentImageUrl);
  const [compareImageUrl, setCompareImageUrl] = useState<string | null>(SATELLITE_CACHE.results.compareImageUrl);
  const [ndviData, setNdviData] = useState<any[]>(SATELLITE_CACHE.results.ndviData);
  const [yieldAlpha, setYieldAlpha] = useState<typeof SATELLITE_CACHE['results']['yieldAlpha']>(SATELLITE_CACHE.results.yieldAlpha);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(SATELLITE_CACHE.results.aiInsight);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Push State
  const [isPushed, setIsPushed] = useState(false);

  // Toast State (Strategy 2)
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource', active: true },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
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

  // --- 1. Smart Initialization Logic (Auto-Sync) with Strategy 2 Feedback ---
  useEffect(() => {
      if (GLOBAL_MARKET_CONTEXT.isContextSet && GLOBAL_MARKET_CONTEXT.asset.code) {
          // Construct a signature of the Global Context state
          const currentSig = `${GLOBAL_MARKET_CONTEXT.asset.code}|${GLOBAL_MARKET_CONTEXT.startDate}|${GLOBAL_MARKET_CONTEXT.endDate}`;
          
          if (currentSig !== SATELLITE_CACHE.lastSyncedSignature) {
              // Context has changed (or first run), attempt sync
              const code = GLOBAL_MARKET_CONTEXT.asset.code; // e.g. "C9999.XDCE"
              const match = code.match(/^([A-Z]+)/);
              if (match) {
                  const varietyPrefix = match[1];
                  const mappedTarget = GLOBAL_CONTEXT_MAP[varietyPrefix];
                  if (mappedTarget && SATELLITE_TARGETS[mappedTarget]) {
                      console.log(`[Satellite] Global Context Changed. Syncing: ${code} -> ${mappedTarget}`);
                      setActiveAsset(mappedTarget);
                      SATELLITE_CACHE.activeAsset = mappedTarget;
                  } else {
                      // Strategy 2: Toast Feedback for Mismatch
                      setToast({
                          show: true,
                          msg: `Satellite imagery not available for '${GLOBAL_MARKET_CONTEXT.asset.name}' (Non-Crop Asset). View unchanged.`
                      });
                  }
              }
              // Update signature so we don't sync again until context changes
              SATELLITE_CACHE.lastSyncedSignature = currentSig;
          } else {
              // Context hasn't changed, respect local cache (User may have changed asset manually)
              setActiveAsset(SATELLITE_CACHE.activeAsset);
          }
      } else {
          // No global context, just use cached asset
          setActiveAsset(SATELLITE_CACHE.activeAsset);
      }
  }, []);

  // Update Cache when user manually changes asset
  useEffect(() => {
      SATELLITE_CACHE.activeAsset = activeAsset;
  }, [activeAsset]);

  // 1. Initial Connection Setup (Keep LocalStorage sync)
  useEffect(() => {
      if (!SATELLITE_CACHE.hasData) {
          const savedConns = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
          let targetNode = savedConns.find((c: any) => c.provider === 'Google Earth Engine' && c.url.startsWith('http'));
          if (!targetNode) targetNode = savedConns.find((c: any) => c.provider === 'JQData (JoinQuant)' && c.url.startsWith('http'));
          
          if (targetNode && targetNode.url) {
              const cleanUrl = targetNode.url.trim().replace(/\/$/, '');
              setBackendUrl(cleanUrl);
          }
      }
  }, []);

  // 2. Cache Persistence
  useEffect(() => {
      SATELLITE_CACHE.activeAsset = activeAsset;
      SATELLITE_CACHE.targetYear = targetYear;
      SATELLITE_CACHE.compareYear = compareYear;
      SATELLITE_CACHE.selectedStage = selectedStage;
      SATELLITE_CACHE.backendUrl = backendUrl;
      SATELLITE_CACHE.zoomLevel = zoomLevel;
      SATELLITE_CACHE.pan = pan;
      SATELLITE_CACHE.sliderPosition = sliderPosition;
      SATELLITE_CACHE.results = { currentImageUrl, compareImageUrl, ndviData, yieldAlpha, aiInsight };
      if (ndviData.length > 0) SATELLITE_CACHE.hasData = true;
  }, [activeAsset, targetYear, compareYear, selectedStage, backendUrl, zoomLevel, pan, sliderPosition, currentImageUrl, compareImageUrl, ndviData, yieldAlpha, aiInsight]);

  useEffect(() => {
      let interval: any;
      if (isProcessing) {
          setExecutionTime(0);
          interval = setInterval(() => setExecutionTime(prev => prev + 0.1), 100);
      }
      return () => clearInterval(interval);
  }, [isProcessing]);

  // 3. Stage Logic
  const availableStages = useMemo(() => {
      // In a real app, you might disable future stages based on `targetYear` vs `currentDate`.
      // For this demo/simulation, we leave them enabled.
      return PHENOLOGY_STAGES.map(stage => ({ ...stage, disabled: false }));
  }, [activeAsset, targetYear]);

  // Reset stage if invalid when asset changes
  useEffect(() => {
      const currentStageObj = availableStages.find(s => s.id === selectedStage);
      if (currentStageObj?.disabled) {
          const firstValid = availableStages.find(s => !s.disabled);
          if (firstValid) setSelectedStage(firstValid.id);
      }
  }, [availableStages, selectedStage]);

  // Reset push state when key inputs change
  useEffect(() => { setIsPushed(false); }, [activeAsset, targetYear]);

  const generateAgronomicInsight = async (alpha: number, trendData: any[]) => {
      if (!GEMINI_API_KEY || trendData.length === 0) return;
      setIsAiAnalyzing(true);
      const target = SATELLITE_TARGETS[activeAsset];
      const stageInfo = PHENOLOGY_STAGES.find(s => s.id === selectedStage)?.label;
      const startNDVI = trendData[0]?.target?.toFixed(2) || "N/A";
      const endNDVI = trendData[trendData.length-1]?.target?.toFixed(2) || "N/A";
      const peakNDVI = Math.max(...trendData.map(d => d.target || 0)).toFixed(2);
      
      const prompt = `
        Role: Expert Agronomist & Commodities Trader.
        Task: Analyze satellite biomass data for **${activeAsset}** in region **${target.region}**.
        Data Context: Target Year: ${targetYear} vs Compare Year: ${compareYear}, Stage: ${stageInfo}, Yield Alpha: ${alpha}%, NDVI Trend: Start ${startNDVI}, Peak ${peakNDVI}, End ${endNDVI}.
        Generate JSON: { "headline": "...", "analysis": "...", "keyDriver": "...", "riskFactor": "...", "bias": "BULLISH"|"BEARISH"|"NEUTRAL" }
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
          const text = response.text;
          if (text) {
              const cleaned = text.replace(/```json|```/g, '').trim();
              const json = JSON.parse(cleaned);
              setAiInsight({
                  headline: json.headline, analysis: json.analysis, keyDriver: json.keyDriver, riskFactor: json.riskFactor, bias: json.bias
              });
          }
      } catch (e) { console.error("AI Gen Failed", e); } finally { setIsAiAnalyzing(false); }
  };

  const handleCompute = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      setProcessError(null);
      setNdviData([]); 
      setCurrentImageUrl(null);
      setCompareImageUrl(null);
      setAiInsight(null); 
      setCurrentStep(1);
      setZoomLevel(1);
      setPan({x:0, y:0});

      try {
          const target = SATELLITE_TARGETS[activeAsset];
          // Simple date construction for payload
          const [startM, startD] = target.cropCal.start.split('-').map(Number);
          const [endM, endD] = target.cropCal.end.split('-').map(Number);
          let seasonEndYear = targetYear;
          if (endM < startM) seasonEndYear++; 
          
          const fullSeasonStart = `${targetYear}-${String(startM).padStart(2,'0')}-${String(startD).padStart(2,'0')}`;
          const fullSeasonEnd = `${seasonEndYear}-${String(endM).padStart(2,'0')}-${String(endD).padStart(2,'0')}`;
          
          const stageConfig = PHENOLOGY_STAGES.find(s => s.id === selectedStage);
          if (!stageConfig) throw new Error("Invalid Stage");
          
          const seasonStartDt = new Date(targetYear, startM - 1, startD);
          const stageStartDt = new Date(seasonStartDt);
          stageStartDt.setDate(seasonStartDt.getDate() + (stageConfig.offsetStart * 30));
          const stageEndDt = new Date(seasonStartDt);
          stageEndDt.setDate(seasonStartDt.getDate() + (stageConfig.offsetEnd * 30));
          
          const mapStageStart = stageStartDt.toISOString().split('T')[0];
          const mapStageEnd = stageEndDt.toISOString().split('T')[0];

          await new Promise(r => setTimeout(r, 600)); 
          setCurrentStep(2);

          const payload = {
              lat: target.coords.lat, lon: target.coords.lon, asset_name: activeAsset, buffer_radius: 50000, 
              full_season_start: fullSeasonStart, full_season_end: fullSeasonEnd,
              stage_start: mapStageStart, stage_end: mapStageEnd,
              target_year: targetYear, compare_year: compareYear, cloud_threshold: 15
          };

          await new Promise(r => setTimeout(r, 400));
          setCurrentStep(3);

          const response = await fetch(`${backendUrl}/api/gee/analyze`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });

          setCurrentStep(4);
          if (!response.ok) throw new Error(`Backend Error ${response.status}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'GEE Computation Failed');

          setCurrentStep(5);
          await new Promise(r => setTimeout(r, 500)); 

          setCurrentImageUrl(result.images.target_year_url);
          setCompareImageUrl(result.images.compare_year_url);

          const targetSeries = result.chart_data.target_year;
          const compareSeries = result.chart_data.compare_year;
          const mergedData: any[] = [];
          const dateMap = new Map();

          targetSeries.forEach((d: any) => {
              const dateObj = new Date(d.date);
              const monthDay = `${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
              const val = d.ndvi !== null ? parseFloat(d.ndvi.toFixed(2)) : null;
              dateMap.set(monthDay, { displayDate: `${monthDay}`, targetVal: val });
          });

          compareSeries.forEach((d: any) => {
              const dateObj = new Date(d.date);
              const monthDay = `${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
              const val = d.ndvi !== null ? parseFloat(d.ndvi.toFixed(2)) : null;
              if (dateMap.has(monthDay)) { dateMap.get(monthDay).compareVal = val; } 
              else { dateMap.set(monthDay, { displayDate: `${monthDay}`, compareVal: val }); }
          });

          const sortedKeys = Array.from(dateMap.keys()).sort();
          let accumDiff = 0;
          sortedKeys.forEach(key => {
              const entry = dateMap.get(key);
              mergedData.push({ date: entry.displayDate, target: entry.targetVal || null, compare: entry.compareVal || null });
              if (entry.targetVal && entry.compareVal) { accumDiff += (entry.targetVal - entry.compareVal); }
          });

          setNdviData(mergedData);
          const calculatedAlpha = parseFloat((accumDiff * 10).toFixed(2));
          setYieldAlpha(calculatedAlpha);
          generateAgronomicInsight(calculatedAlpha, mergedData);

      } catch (e: any) {
          console.error("GEE Job Failed", e);
          setProcessError(e.message || "Unknown Execution Error");
      } finally { setIsProcessing(false); }
  };

  const handleSliderMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider || !mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
  };
  const handleSliderMouseUp = () => setIsDraggingSlider(false);

  useEffect(() => {
      if (isDraggingSlider) {
          window.addEventListener('mousemove', handleSliderMouseMove);
          window.addEventListener('mouseup', handleSliderMouseUp);
      } else {
          window.removeEventListener('mousemove', handleSliderMouseMove);
          window.removeEventListener('mouseup', handleSliderMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleSliderMouseMove);
          window.removeEventListener('mouseup', handleSliderMouseUp);
      };
  }, [isDraggingSlider]);

  const handleMapMouseDown = (e: React.MouseEvent) => {
      if (isDraggingSlider) return;
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
      if (isPanning) {
          e.preventDefault();
          setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      }
  };

  const handleMapMouseUp = () => { setIsPanning(false); };

  const handleExportCSV = () => {
      if (!ndviData || ndviData.length === 0) return;
      const header = ["Date (MM-DD)", "Product", "Region", `Target Year (${targetYear}) NDVI`, `Compare Year (${compareYear}) NDVI`, "Difference", "Yield Alpha Score"].join(",");
      const rows = ndviData.map(row => {
          const tVal = row.target !== null ? row.target.toFixed(2) : '';
          const cVal = row.compare !== null ? row.compare.toFixed(2) : '';
          const diff = (row.target !== null && row.compare !== null) ? (row.target - row.compare).toFixed(2) : '';
          return [row.date, `"${activeAsset}"`, `"${SATELLITE_TARGETS[activeAsset].region}"`, tVal, cVal, diff, yieldAlpha].join(",");
      });
      const csvContent = [header, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `QuantAgrify_Satellite.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handlePushSignal = () => {
      if (ndviData.length === 0) return;
      const target = SATELLITE_TARGETS[activeAsset];
      DATA_LAYERS.set('satellite', {
          sourceId: 'satellite',
          name: `Satellite: ${activeAsset}`,
          metricName: 'NDVI Yield Alpha',
          data: ndviData.map(d => ({ date: d.date, value: d.target || 0, meta: { compare: d.compare, diff: (d.target || 0) - (d.compare || 0) } })),
          satellitePackage: { ndviSeries: ndviData, metadata: { assetName: activeAsset, region: target.region, targetYear, compareYear } },
          timestamp: Date.now()
      });
      setIsPushed(true);
  };

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30">
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
          {/* UPDATED: System Clock Integration */}
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
                <p className="text-sm font-bold truncate text-white">Analyst 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Quant Ops Team</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          {/* Controls Header */}
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex flex-col justify-between px-6 py-4 gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-white text-xl font-bold flex items-center gap-2">
                        Satellite Biomass Intelligence
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wide">GEE Powered</span>
                    </h2>
                    <p className="text-[#90a4cb] text-xs mt-1">Sentinel-2 (10m) True Color (Raw) • <span className="text-[#0d59f2] font-bold">Analytics Masked (Mode Stat)</span> • 50km Radius</p>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={() => setShowConfig(!showConfig)} className="text-[10px] font-mono text-[#90a4cb] hover:text-white bg-[#182234] border border-[#314368] px-2 py-1 rounded flex items-center gap-1 transition-all">
                        <span className="material-symbols-outlined text-[10px]">settings</span> Config Host
                    </button>
                    <div className="text-right">
                        <span className="text-[9px] text-[#90a4cb] uppercase font-bold tracking-widest">Revisit</span>
                        <p className="text-sm font-bold text-white">5 Days</p>
                    </div>
                    <div className="w-px bg-[#314368] h-6"></div>
                    <div className="text-right">
                        <span className="text-[9px] text-[#90a4cb] uppercase font-bold tracking-widest">Cloud Tol.</span>
                        <p className="text-sm font-bold text-white">15%</p>
                    </div>
                </div>
            </div>
            {/* Backend Config Dropdown */}
            {showConfig && (
                <div className="absolute top-20 right-6 z-50 bg-[#182234] border border-[#314368] p-4 rounded-xl shadow-2xl w-80 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase block mb-2">Python Backend URL</label>
                    <div className="flex gap-2">
                        <input value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} className="flex-1 bg-[#101622] border border-[#314368] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#0d59f2] outline-none" />
                        <button onClick={() => setShowConfig(false)} className="bg-[#0d59f2] text-white px-2 rounded hover:bg-[#1a66ff]">OK</button>
                    </div>
                    <p className="text-[9px] text-[#90a4cb] mt-2 italic">Ensure 'earthengine authenticate' is run on this host.</p>
                </div>
            )}
            {/* Toolbar */}
            <div className="flex flex-wrap items-end justify-between gap-6 bg-[#182234]/50 p-3 rounded-xl border border-[#314368]">
                <div className="flex items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">token</span> Futures Product</span>
                        <select value={activeAsset} onChange={(e) => setActiveAsset(e.target.value as any)} className="bg-[#101622] border border-[#314368] text-white text-xs font-bold rounded-lg h-9 px-3 outline-none focus:border-[#0d59f2] min-w-[200px] cursor-pointer hover:border-[#90a4cb]">
                            {ASSET_GROUPS.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {Object.keys(SATELLITE_TARGETS).filter(key => Array.isArray(group.prefix) ? group.prefix.some(p => key.includes(p)) : key.includes(group.prefix as string)).map(key => (<option key={key} value={key}>{key}</option>))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="w-px h-8 bg-[#314368] mx-2"></div>
                    <div className="flex items-end gap-2">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest">Target Year</span>
                            <select value={targetYear} onChange={(e) => setTargetYear(parseInt(e.target.value))} className="bg-[#101622] border border-[#314368] text-[#0d59f2] text-xs font-black rounded-lg h-9 px-3 outline-none focus:border-[#0d59f2] cursor-pointer hover:border-[#90a4cb]">{AVAILABLE_YEARS.map(y => (<option key={y} value={y}>{y}</option>))}</select>
                        </div>
                        <span className="text-[#90a4cb] font-bold pb-2">vs</span>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest">Compare Year</span>
                            <select value={compareYear} onChange={(e) => setCompareYear(parseInt(e.target.value))} className="bg-[#101622] border border-[#314368] text-[#fa6238] text-xs font-black rounded-lg h-9 px-3 outline-none focus:border-[#fa6238] cursor-pointer hover:border-[#90a4cb]">{AVAILABLE_YEARS.filter(y => y !== targetYear).map(y => (<option key={y} value={y}>{y}</option>))}</select>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-[#314368] mx-2"></div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">eco</span> Comparison Stage</span>
                        <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="bg-[#101622] border border-[#314368] text-white text-xs font-bold rounded-lg h-9 px-3 outline-none focus:border-[#0d59f2] min-w-[150px] cursor-pointer hover:border-[#90a4cb]">{availableStages.map(s => (<option key={s.id} value={s.id} disabled={s.disabled} className={s.disabled ? 'text-slate-600' : ''}>{s.label} {s.disabled ? '(Future)' : ''}</option>))}</select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-[#90a4cb] font-bold uppercase tracking-widest">Anchored MPA</span>
                        <div className="h-9 px-3 flex items-center gap-2 bg-[#182234] border border-[#314368] rounded-lg text-xs text-white cursor-default"><span className="font-bold">{SATELLITE_TARGETS[activeAsset].region}</span></div>
                    </div>
                </div>
                <div>
                    <button onClick={handleCompute} disabled={isProcessing} className={`h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${isProcessing ? 'bg-[#314368] text-[#90a4cb] cursor-not-allowed' : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff] shadow-[#0d59f2]/25'}`}>
                        {isProcessing ? (<><div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>) : (<><span className="material-symbols-outlined text-sm">play_arrow</span> Run Analysis</>)}
                    </button>
                </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            <div className="grid grid-cols-12 gap-6 h-[500px]">
                {/* Left: Map */}
                <div ref={mapContainerRef} className={`col-span-12 lg:col-span-5 bg-[#101622] border border-[#314368] rounded-xl relative overflow-hidden flex flex-col select-none group ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={handleMapMouseDown} onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp}>
                    {(isProcessing || processError) && (
                        <div className="absolute inset-0 z-50 bg-[#05070a]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                            {processError ? (
                                <><span className="material-symbols-outlined text-rose-500 text-5xl mb-4">error_outline</span><h3 className="text-white font-bold text-lg mb-2">Computation Failed</h3><p className="text-rose-300 font-mono text-xs max-w-md bg-rose-900/20 p-4 rounded border border-rose-500/30 break-all">{processError}</p><button onClick={() => setProcessError(null)} className="mt-6 px-6 py-2 bg-[#314368] hover:bg-[#475569] text-white rounded text-xs font-bold uppercase transition-colors">Dismiss</button></>
                            ) : (
                                <><div className="size-16 relative mb-6"><div className="absolute inset-0 border-4 border-[#314368] rounded-full"></div><div className="absolute inset-0 border-4 border-t-[#0d59f2] rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#0d59f2] font-bold">{executionTime.toFixed(1)}s</div></div><h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Processing Satellite Task</h3><div className="w-full max-w-xs space-y-3">{TASK_STEPS.map(step => (<div key={step.id} className={`flex items-center gap-3 transition-all ${currentStep >= step.id ? 'opacity-100' : 'opacity-30'}`}><div className={`size-2 rounded-full ${currentStep > step.id ? 'bg-[#0bda5e]' : currentStep === step.id ? 'bg-[#0d59f2] animate-pulse' : 'bg-[#314368]'}`}></div><div className="text-left"><p className={`text-[10px] font-bold uppercase ${currentStep === step.id ? 'text-[#0d59f2]' : 'text-white'}`}>{step.label}</p><p className="text-[9px] text-[#90a4cb]">{step.detail}</p></div></div>))}</div></>
                            )}
                        </div>
                    )}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                        <div className="bg-[#0a0e17]/90 backdrop-blur border border-[#314368] p-2 rounded-lg shadow-xl pointer-events-auto">
                            <span className="text-[10px] text-[#90a4cb] uppercase font-bold block mb-1">Visual Comparison (True Color)</span>
                            <div className="flex items-center gap-2 text-xs font-bold text-white"><span className="text-[#0d59f2]">{targetYear}</span><span className="text-[#90a4cb]">vs</span><span className="text-[#fa6238]">{compareYear}</span></div>
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 pointer-events-auto shadow-xl">
                        <button onClick={(e) => { e.stopPropagation(); setZoomLevel(1); setPan({x:0, y:0}); }} className="size-8 bg-[#182234] border border-[#314368] rounded flex items-center justify-center hover:bg-[#0d59f2] hover:text-white transition-colors text-[#90a4cb] mb-2" title="Reset View"><span className="material-symbols-outlined text-sm">restart_alt</span></button>
                        <button onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.min(z + 0.5, 5)); }} className="size-8 bg-[#182234] border border-[#314368] rounded flex items-center justify-center hover:bg-[#0d59f2] hover:text-white transition-colors text-[#90a4cb]"><span className="material-symbols-outlined text-sm">add</span></button>
                        <button onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.max(z - 0.5, 1)); }} className="size-8 bg-[#182234] border border-[#314368] rounded flex items-center justify-center hover:bg-[#0d59f2] hover:text-white transition-colors text-[#90a4cb]"><span className="material-symbols-outlined text-sm">remove</span></button>
                    </div>
                    <div className="absolute inset-0 overflow-hidden bg-[#05070a] pointer-events-none">
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out will-change-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` }}>
                            {compareImageUrl ? (<img src={compareImageUrl} alt="Compare Year Satellite" className="w-full h-full object-cover pointer-events-none select-none"/>) : (<div className="w-full h-full flex flex-col items-center justify-center bg-[#101622] text-[#90a4cb] gap-2"><span className="material-symbols-outlined text-4xl opacity-20">satellite_alt</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Data Loaded</span></div>)}
                        </div>
                        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0px ${100 - sliderPosition}% 0px 0px)` }}>
                            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out will-change-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` }}>
                                {currentImageUrl ? (<img src={currentImageUrl} alt="Current Satellite" className="w-full h-full object-cover pointer-events-none select-none"/>) : (<div className="w-full h-full flex items-center justify-center bg-[#101622]"></div>)}
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 flex items-center justify-center shadow-[0_0_15px_black] pointer-events-auto hover:bg-[#0d59f2] transition-colors" style={{ left: `${sliderPosition}%` }} onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSlider(true); }}>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-[#101622]"><span className="material-symbols-outlined text-[#101622] text-sm">code</span></div>
                    </div>
                </div>
                {/* Right: Chart */}
                <div className="col-span-12 lg:col-span-7 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div><h3 className="text-white text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-[#0d59f2]">show_chart</span> Biological Growth Profile (NDVI)</h3><p className="text-[#90a4cb] text-xs">Full Season Trend (Start to End) • Cropland Masked Only</p></div>
                        <div className="flex flex-col items-end"><div className="flex gap-4 text-[10px] font-bold uppercase mb-1"><span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#0d59f2]"></span> {targetYear}</span><span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#fa6238]"></span> {compareYear}</span></div><span className="text-[9px] text-[#90a4cb] bg-[#101622] px-2 py-0.5 rounded border border-[#314368]">Algo: <span className="text-white font-bold">Histogram Mode (De-noised)</span></span></div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative">
                        {ndviData.length === 0 && !isProcessing && (<div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-[#314368] rounded-lg bg-[#101622]/30 text-[#90a4cb] text-xs font-mono">Awaiting Computation... Click 'Run Analysis'</div>)}
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={ndviData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                                <XAxis dataKey="date" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} interval={Math.floor(ndviData.length / 6)} />
                                <YAxis domain={[0, 1]} tick={{fill: '#90a4cb', fontSize: 10}} tickFormatter={(val) => val.toFixed(2)} axisLine={false} tickLine={false} label={{ value: 'NDVI', angle: -90, position: 'insideLeft', fill: '#90a4cb', fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ padding: 0 }} />
                                <ReferenceLine y={0.2} stroke="#713f12" strokeDasharray="3 3" label={{ value: "Soil Line", fill: "#713f12", fontSize: 9 }} />
                                <Line type="monotone" dataKey="compare" stroke="#fa6238" strokeWidth={2} dot={false} strokeOpacity={0.7} connectNulls={false} name={`${compareYear}`} />
                                <Line type="monotone" dataKey="target" stroke="#0d59f2" strokeWidth={3} dot={{ r: 2, fill: '#0d59f2' }} connectNulls={false} name={`${targetYear}`} animationDuration={1500} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {/* Bottom Row */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-[#90a4cb] text-xs font-bold uppercase tracking-widest mb-4">Yield Alpha (Biomass Integral)</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-baseline gap-2"><span className={`text-4xl font-black ${yieldAlpha >= 0 ? 'text-[#0bda5e]' : 'text-[#fa6238]'}`}>{yieldAlpha > 0 ? '+' : ''}{yieldAlpha}%</span><span className="text-xs font-bold text-[#90a4cb]">vs {compareYear}</span></div>
                            <p className="text-[10px] text-[#90a4cb] mt-2 leading-relaxed max-w-[200px]">Cumulative NDVI integral deviation suggests <span className={yieldAlpha > 0 ? 'text-[#0bda5e] font-bold' : 'text-[#fa6238] font-bold'}> {yieldAlpha > 0 ? 'higher' : 'lower'} </span> biomass accumulation than historical baseline. Strong correlation to final yield.</p>
                        </div>
                        <div className="h-24 w-24 relative">
                            <svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="40" stroke="#101622" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="40" stroke={yieldAlpha >= 0 ? '#0bda5e' : '#fa6238'} strokeWidth="8" fill="none" strokeDasharray={`${Math.abs(yieldAlpha) * 3} 251`} /></svg>
                            <div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-[#90a4cb]">eco</span></div>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-8 bg-[#182234]/20 border border-[#314368] rounded-xl p-0 relative overflow-hidden flex flex-col md:flex-row">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d59f2]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    {isAiAnalyzing ? (<div className="absolute inset-0 z-20 bg-[#182234]/80 backdrop-blur-sm flex flex-col items-center justify-center"><span className="material-symbols-outlined text-[#0d59f2] text-3xl animate-spin mb-2">psychology</span><span className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Generating Agronomic Insight...</span></div>) : !aiInsight ? (<div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-50"><span className="material-symbols-outlined text-4xl mb-2 text-slate-600">smart_toy</span><span className="text-xs text-[#90a4cb] uppercase tracking-widest">Waiting for Data...</span></div>) : null}
                    <div className="flex-1 p-6 z-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3"><span className="bg-[#0d59f2]/10 text-[#0d59f2] px-2 py-0.5 rounded border border-[#0d59f2]/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">smart_toy</span> Gemini 2.5 Flash</span><span className="text-[9px] text-[#90a4cb] uppercase font-bold">Agronomic Brief</span></div>
                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{aiInsight?.headline || "Ready to Analyze"}</h3>
                            <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-[#0d59f2] pl-3">{aiInsight?.analysis || "Run the analysis to generate AI-driven insights on crop health, phenology risks, and yield potential based on the NDVI curve."}</p>
                        </div>
                        <div className="mt-4 flex gap-2"><button onClick={() => ndviData.length > 0 && generateAgronomicInsight(yieldAlpha, ndviData)} className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#90a4cb] hover:text-white transition-colors bg-[#101622] px-3 py-1.5 rounded border border-[#314368]"><span className="material-symbols-outlined text-xs">refresh</span> Regenerate Insight</button></div>
                    </div>
                    <div className="w-full md:w-64 bg-[#0a0c10]/30 border-t md:border-t-0 md:border-l border-[#314368] p-5 flex flex-col justify-center gap-3 z-10 backdrop-blur-sm">
                        <div className="bg-[#182234] border border-[#314368] p-3 rounded-lg"><span className="text-[9px] text-[#90a4cb] font-bold uppercase block mb-1">Key Driver</span><span className="text-xs font-bold text-white block leading-tight">{aiInsight?.keyDriver || "---"}</span></div>
                        <div className="bg-[#182234] border border-[#314368] p-3 rounded-lg"><span className="text-[9px] text-[#90a4cb] font-bold uppercase block mb-1">Primary Risk</span><span className="text-xs font-bold text-[#fa6238] block leading-tight">{aiInsight?.riskFactor || "---"}</span></div>
                        <div className="bg-[#182234] border border-[#314368] p-3 rounded-lg flex justify-between items-center"><span className="text-[9px] text-[#90a4cb] font-bold uppercase">Bias</span><span className={`text-xs font-black px-2 py-0.5 rounded border uppercase ${aiInsight?.bias === 'BULLISH' ? 'text-[#0bda5e] bg-[#0bda5e]/10 border-[#0bda5e]/20' : aiInsight?.bias === 'BEARISH' ? 'text-[#fa6238] bg-[#fa6238]/10 border-[#fa6238]/20' : 'text-white bg-slate-700 border-slate-600'}`}>{aiInsight?.bias || "---"}</span></div>
                    </div>
                </div>
            </div>
          </div>
          {/* Footer Action */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-emerald-500">satellite_alt</span><div><p className="text-xs font-bold text-white uppercase tracking-wider">GEE Pipeline</p><p className="text-[10px] text-[#90a4cb]">Status: Active | Collection: COPERNICUS/S2_SR | Mask: WorldCover | Cloud: &lt;15%</p></div></div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleExportCSV} className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-sm">download</span> Export CSV</button>
              <button onClick={handlePushSignal} disabled={isPushed || ndviData.length === 0} className={`px-8 py-2.5 rounded-lg text-white transition-all text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-widest ${isPushed ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/25' : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20'}`}>{isPushed ? (<><span className="material-symbols-outlined text-lg">check_circle</span> LAYER ADDED</>) : (<><span className="material-symbols-outlined text-lg">cloud_upload</span> PUSH SATELLITE SIGNAL</>)}</button>
            </div>
          </footer>
        </main>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        @keyframes progress { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        .animate-progress { animation: progress 2s ease-out; }
      `}</style>
    </div>
  );
};
