
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  AreaChart
} from 'recharts';
import { DATA_LAYERS, WeatherTimeSeriesPoint, GLOBAL_MARKET_CONTEXT } from './GlobalState';
import { SystemClock } from './SystemClock';

interface WeatherAnalysisProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// --- Domain Knowledge Mapping (Expanded with Agronomic Base Temps) ---
interface CropStage {
    name: string;
    start: number; 
    end: number;
    sensitivity: string;
}

interface RegionConfig {
    id: string;
    name: string;
    lat: number;
    lon: number;
    baseTemp: number; // T_base for GDD Calculation (Real Agronomy)
    season: { start: string; end: string };
    stages: CropStage[];
}

const CROP_REGIONS: Record<string, RegionConfig> = {
    // --- China Dalian Commodity Exchange (DCE) ---
    'Corn (DCE - C)': {
        id: 'Corn_CN',
        name: 'China Northeast (Heilongjiang)',
        lat: 47.35,
        lon: 130.33,
        baseTemp: 10, // Corn needs >10°C to grow
        season: { start: '04-15', end: '10-15' },
        stages: [
            { name: 'Sowing', start: 0, end: 20, sensitivity: 'Bearish if Rain > 50mm' },
            { name: 'Vegetative', start: 21, end: 59, sensitivity: 'Moderate Moisture Needed' },
            { name: 'Pollination', start: 60, end: 80, sensitivity: 'Critical: High Moisture Needed' },
            { name: 'Grain Filling', start: 81, end: 119, sensitivity: 'Sunlight Positive' },
            { name: 'Harvest', start: 120, end: 150, sensitivity: 'Bearish if Rain (Mold Risk)' }
        ]
    },
    'Corn Starch (DCE - CS)': {
        id: 'CornStarch_CN',
        name: 'China Shandong (Processing)',
        lat: 36.65,
        lon: 117.12,
        baseTemp: 10,
        season: { start: '01-01', end: '12-31' },
        stages: [
            { name: 'Processing Peak', start: 0, end: 365, sensitivity: 'Transport delays due to rain' }
        ]
    },
    'Soybean No.1 (DCE - A)': {
        id: 'Soy_CN_NonGMO',
        name: 'China Heihe (Non-GMO Soy)',
        lat: 50.24,
        lon: 127.52,
        baseTemp: 10, // Soy base temp
        season: { start: '05-01', end: '10-01' },
        stages: [
            { name: 'Planting', start: 0, end: 20, sensitivity: 'Warmth required' },
            { name: 'Pod Setting', start: 60, end: 90, sensitivity: 'Critical: Rain Positive' },
            { name: 'Harvest', start: 130, end: 150, sensitivity: 'Dryness Positive' }
        ]
    },
    'Soybean No.2 (DCE - B)': {
        id: 'Soy_Import_Ports',
        name: 'China Coastal Ports (Import)',
        lat: 31.23,
        lon: 121.47,
        baseTemp: 10,
        season: { start: '01-01', end: '12-31' },
        stages: [
            { name: 'Logistics', start: 0, end: 365, sensitivity: 'Typhoon Risk' }
        ]
    },
    'Soybean Meal (DCE - M)': {
        id: 'Soy_Import_BR',
        name: 'Brazil Mato Grosso (Feedstock)',
        lat: -12.55,
        lon: -55.72,
        baseTemp: 10,
        season: { start: '09-15', end: '02-15' },
        stages: [
            { name: 'Planting', start: 0, end: 40, sensitivity: 'Monsoon Start Needed' },
            { name: 'Flowering', start: 41, end: 79, sensitivity: 'Regular Rain' },
            { name: 'Pod Fill', start: 80, end: 110, sensitivity: 'Critical Moisture' },
            { name: 'Harvest', start: 111, end: 140, sensitivity: 'Rain delays logistics' }
        ]
    },
    'Soybean Oil (DCE - Y)': {
        id: 'Soy_Import_US',
        name: 'US Illinois (Feedstock)',
        lat: 40.00,
        lon: -89.00,
        baseTemp: 10,
        season: { start: '05-01', end: '10-15' },
        stages: [
            { name: 'Planting', start: 0, end: 20, sensitivity: 'Delays if wet' },
            { name: 'Blooming', start: 60, end: 80, sensitivity: 'Heat Stress Risk' },
            { name: 'Harvest', start: 120, end: 150, sensitivity: 'Dryness Needed' }
        ]
    },
    'Palm Oil (DCE - P)': {
        id: 'Palm_MY',
        name: 'Malaysia Sabah (Main)',
        lat: 5.42,
        lon: 117.03,
        baseTemp: 18, // Tropical crop
        season: { start: '01-01', end: '12-31' },
        stages: [
            { name: 'High Production', start: 60, end: 120, sensitivity: 'Flood Risk (La Nina)' },
            { name: 'Monsoon Season', start: 300, end: 360, sensitivity: 'Harvest Disruption' }
        ]
    },
    'Egg (DCE - JD)': {
        id: 'Egg_CN',
        name: 'China Hubei (Poultry)',
        lat: 30.59,
        lon: 114.30,
        baseTemp: 15, // Comfort zone tracking
        season: { start: '01-01', end: '12-31' },
        stages: [
            { name: 'Laying Peak', start: 60, end: 150, sensitivity: 'Heat Stress > 30C' },
            { name: 'Moulting', start: 300, end: 330, sensitivity: 'Disease Risk' }
        ]
    },
    // --- China Zhengzhou Commodity Exchange (ZCE) ---
    'Cotton (ZCE - CF)': {
        id: 'Cotton_CN',
        name: 'China Xinjiang (Aksu)',
        lat: 41.16,
        lon: 80.26,
        baseTemp: 15, // Cotton needs high heat
        season: { start: '04-10', end: '10-20' },
        stages: [
            { name: 'Sowing', start: 0, end: 20, sensitivity: 'Cold Snap Risk' },
            { name: 'Boll Setting', start: 80, end: 120, sensitivity: 'Heat Positive, Rain Negative' },
            { name: 'Harvest', start: 140, end: 180, sensitivity: 'Must be Dry' }
        ]
    },
    'Sugar (ZCE - SR)': {
        id: 'Sugar_CN',
        name: 'China Guangxi (Chongzuo)',
        lat: 22.40,
        lon: 107.35,
        baseTemp: 18, // Sugarcane
        season: { start: '03-01', end: '12-01' },
        stages: [
            { name: 'Grand Growth', start: 90, end: 210, sensitivity: 'High Water Demand' },
            { name: 'Maturation', start: 220, end: 270, sensitivity: 'Temp Differential Needed' },
            { name: 'Crushing', start: 280, end: 360, sensitivity: 'Frost Risk' }
        ]
    },
    'Rapeseed Oil (ZCE - OI)': {
        id: 'Rape_CN',
        name: 'China Sichuan (Winter)',
        lat: 30.65,
        lon: 104.06,
        baseTemp: 5, // Winter crop
        season: { start: '10-15', end: '05-15' },
        stages: [
            { name: 'Seedling', start: 0, end: 60, sensitivity: 'Winter Kill Risk' },
            { name: 'Flowering', start: 120, end: 150, sensitivity: 'Frost Sensitivity' },
            { name: 'Harvest', start: 180, end: 210, sensitivity: 'Rain delays' }
        ]
    },
    'Apple (ZCE - AP)': {
        id: 'Apple_CN',
        name: 'China Shaanxi (Luochuan)',
        lat: 35.76,
        lon: 109.43,
        baseTemp: 10,
        season: { start: '04-01', end: '10-15' },
        stages: [
            { name: 'Flowering', start: 10, end: 30, sensitivity: 'Critical: Late Frost Risk' },
            { name: 'Fruit Swelling', start: 60, end: 120, sensitivity: 'Hail Risk / Rain' },
            { name: 'Coloring', start: 130, end: 160, sensitivity: 'Sunlight/Temp Diff' }
        ]
    },
    'Peanut (ZCE - PK)': {
        id: 'Peanut_CN',
        name: 'China Henan (Zhumadian)',
        lat: 32.99,
        lon: 114.02,
        baseTemp: 12,
        season: { start: '05-01', end: '09-20' },
        stages: [
            { name: 'Flowering', start: 40, end: 70, sensitivity: 'Drought Sensitive' },
            { name: 'Harvest', start: 120, end: 140, sensitivity: 'Rain causes aflatoxin' }
        ]
    },
    // --- Shanghai Futures Exchange (SHFE) ---
    'Rubber (SHFE - RU)': {
        id: 'Rubber_CN',
        name: 'China Yunnan (Xishuangbanna)',
        lat: 22.00,
        lon: 100.79,
        baseTemp: 18,
        season: { start: '04-01', end: '11-30' },
        stages: [
            { name: 'Tapping Season', start: 0, end: 240, sensitivity: 'Rain prevents tapping' }
        ]
    },
    'Paper Pulp (SHFE - SP)': {
        id: 'Pulp_Port',
        name: 'China Rizhao Port (Storage)',
        lat: 35.41,
        lon: 119.52,
        baseTemp: 10,
        season: { start: '01-01', end: '12-31' },
        stages: [
            { name: 'Storage', start: 0, end: 365, sensitivity: 'Humidity Impact' }
        ]
    },
    // --- Global (CBOT/ICE) ---
    'Corn (CBOT - ZC)': {
        id: 'Corn_US',
        name: 'US Corn Belt (Iowa)',
        lat: 41.87,
        lon: -93.62,
        baseTemp: 10,
        season: { start: '04-20', end: '10-01' },
        stages: [
            { name: 'Planting', start: 0, end: 20, sensitivity: 'Delays likely if wet' },
            { name: 'Silking', start: 65, end: 85, sensitivity: 'Max Yield Impact' }
        ]
    },
    'Soybeans (CBOT - ZS)': {
        id: 'Soy_US',
        name: 'US Soy Belt (Illinois)',
        lat: 39.78,
        lon: -89.65,
        baseTemp: 10,
        season: { start: '05-01', end: '10-15' },
        stages: [
            { name: 'Pod Setting', start: 70, end: 90, sensitivity: 'Need August Rain' }
        ]
    },
    'Sugar No.11 (ICE - SB)': {
        id: 'Sugar_BR',
        name: 'Brazil Sao Paulo (Center-South)',
        lat: -23.55,
        lon: -46.63,
        baseTemp: 15, // Sugarcane
        season: { start: '04-01', end: '12-01' },
        stages: [
            { name: 'Harvest/Crush', start: 30, end: 240, sensitivity: 'Rain delays crushing' }
        ]
    }
};

// Fallback for missing entries
const DEFAULT_CONFIG: RegionConfig = {
    id: 'DEFAULT',
    name: 'Select Asset',
    lat: 0,
    lon: 0,
    baseTemp: 10,
    season: { start: '01-01', end: '12-31' },
    stages: [
        { name: 'Early Season', start: 0, end: 100, sensitivity: 'Moisture' },
        { name: 'Mid Season', start: 101, end: 200, sensitivity: 'Temp' },
        { name: 'Late Season', start: 201, end: 365, sensitivity: 'Harvest' }
    ]
};

// Group Helper
const ASSET_GROUPS = [
    { label: 'DCE (Dalian)', prefix: '(DCE' },
    { label: 'ZCE (Zhengzhou)', prefix: '(ZCE' },
    { label: 'SHFE (Shanghai)', prefix: '(SHFE' },
    { label: 'Global (CBOT/ICE)', prefix: '(Global' } 
];

// Mapping from Global Context Codes (e.g., "C") to Weather Asset Keys
const GLOBAL_WEATHER_MAP: Record<string, string> = {
    'C': 'Corn (DCE - C)',
    'CS': 'Corn Starch (DCE - CS)',
    'A': 'Soybean No.1 (DCE - A)',
    'B': 'Soybean No.2 (DCE - B)',
    'M': 'Soybean Meal (DCE - M)',
    'Y': 'Soybean Oil (DCE - Y)',
    'P': 'Palm Oil (DCE - P)',
    'JD': 'Egg (DCE - JD)',
    'CF': 'Cotton (ZCE - CF)',
    'SR': 'Sugar (ZCE - SR)',
    'OI': 'Rapeseed Oil (ZCE - OI)',
    'RM': 'Rapeseed Oil (ZCE - OI)', // Map RM to OI region approx or define separate if needed, mapping to OI for now as they are related rapeseed products
    'AP': 'Apple (ZCE - AP)',
    'PK': 'Peanut (ZCE - PK)',
    'RU': 'Rubber (SHFE - RU)',
    'SP': 'Paper Pulp (SHFE - SP)',
    'ZC': 'Corn (CBOT - ZC)',
    'ZS': 'Soybeans (CBOT - ZS)',
    'SB': 'Sugar No.11 (ICE - SB)'
};

// --- MODULE LEVEL CACHE ---
// Tracks state to persist when navigating away, but reset when Global Context changes
const WEATHER_CACHE = {
    activeAsset: 'Corn (DCE - C)',
    lastSyncedSignature: '', // Combination of AssetCode + Start + End to detect changes
};

export const WeatherAnalysis: React.FC<WeatherAnalysisProps> = ({ onNavigate }) => {
  const [activeAsset, setActiveAsset] = useState<string>(WEATHER_CACHE.activeAsset);
  const [chartMode, setChartMode] = useState<'PRECIP' | 'SOIL' | 'GDD'>('PRECIP');
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  
  const [isConnected, setIsConnected] = useState(false);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Push State
  const [isPushing, setIsPushing] = useState(false);
  const [isPushed, setIsPushed] = useState(false);

  // Toast State (Strategy 2)
  const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

  // GDD Stats State
  const [gddStats, setGddStats] = useState({ total: 0, forecast: 0, avgDaily: 0 });

  // Map Visualization State
  const [mapStations, setMapStations] = useState<{x: number, y: number, status: string}[]>([]);

  // Current Phenology State
  const [currentPhenology, setCurrentPhenology] = useState<{name: string, index: number, progress: number}>({ name: 'Off-Season', index: -1, progress: 0 });

  // Modal State
  const [selectedDay, setSelectedDay] = useState<any | null>(null);

  const regionConfig = useMemo(() => {
      return CROP_REGIONS[activeAsset] || DEFAULT_CONFIG;
  }, [activeAsset]);

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis', active: true },
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
      if (GLOBAL_MARKET_CONTEXT.isContextSet) {
          // Construct a signature of the Global Context state
          const currentSig = `${GLOBAL_MARKET_CONTEXT.asset.code}|${GLOBAL_MARKET_CONTEXT.startDate}|${GLOBAL_MARKET_CONTEXT.endDate}`;
          
          if (currentSig !== WEATHER_CACHE.lastSyncedSignature) {
              // Context has changed (or first run), attempt sync
              const code = GLOBAL_MARKET_CONTEXT.asset.code;
              const match = code.match(/^([A-Z]+)/);
              if (match) {
                  const varietyPrefix = match[1];
                  const targetWeatherAsset = GLOBAL_WEATHER_MAP[varietyPrefix];
                  
                  if (targetWeatherAsset && CROP_REGIONS[targetWeatherAsset]) {
                      console.log(`[Weather] Global Context Changed. Syncing: ${code} -> ${targetWeatherAsset}`);
                      setActiveAsset(targetWeatherAsset);
                      WEATHER_CACHE.activeAsset = targetWeatherAsset;
                  } else {
                      // Strategy 2: Toast Feedback for Mismatch
                      setToast({
                          show: true,
                          msg: `Global Asset '${GLOBAL_MARKET_CONTEXT.asset.name}' is not applicable for Weather Grid. Keeping current view.`
                      });
                  }
              }
              // Update signature so we don't sync (or warn) again until context changes
              WEATHER_CACHE.lastSyncedSignature = currentSig;
          } else {
              // Context hasn't changed, respect local cache (User may have changed asset manually)
              setActiveAsset(WEATHER_CACHE.activeAsset);
          }
      } else {
          // No global context, just use cached asset
          setActiveAsset(WEATHER_CACHE.activeAsset);
      }
  }, []);

  // Update Cache when user manually changes asset
  useEffect(() => {
      WEATHER_CACHE.activeAsset = activeAsset;
  }, [activeAsset]);

  // 1. Connection Monitoring
  useEffect(() => {
    const checkConnection = () => {
      const connections = JSON.parse(localStorage.getItem('quant_api_connections') || '[]');
      const openMeteoNode = connections.find((c: any) => c.provider === 'Open-Meteo' && c.status !== 'offline' && c.status !== 'error');
      setIsConnected(!!openMeteoNode);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. PHENOLOGY CALCULATION ENGINE
  useEffect(() => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const [startMonth, startDay] = regionConfig.season.start.split('-').map(Number);
      const seasonStart = new Date(currentYear, startMonth - 1, startDay);
      
      let dayIndex = Math.floor((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
      
      let foundStage = { name: 'Fallow / Pre-Season', index: -1, progress: 0 };
      
      if (dayIndex >= 0 && regionConfig.stages) {
          regionConfig.stages.forEach((stage, idx) => {
              if (dayIndex >= stage.start && dayIndex <= stage.end) {
                  const duration = stage.end - stage.start;
                  const progress = ((dayIndex - stage.start) / duration) * 100;
                  foundStage = { name: stage.name, index: idx, progress };
              }
          });
          
          const lastStage = regionConfig.stages[regionConfig.stages.length - 1];
          if (lastStage && dayIndex > lastStage.end) {
              foundStage = { name: 'Post-Harvest / Logistics', index: regionConfig.stages.length, progress: 100 };
          }
      }
      
      setCurrentPhenology(foundStage);
  }, [regionConfig]);

  // 3. Data Fetching & GDD Calculation
  useEffect(() => {
      if (!isConnected) {
          setSimulationData([]); 
          setConnectionError("Data Stream Offline");
          return;
      }

      setLoadingRealData(true);
      setConnectionError(null);
      // Reset push state when region changes
      setIsPushed(false);

      const { lat, lon, baseTemp } = regionConfig;
      // Fetch 92 days of history to build a real "season to date" context
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,et0_fao_evapotranspiration,wind_speed_10m_max,uv_index_max&past_days=92&forecast_days=16&timezone=auto`;

      fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.daily) throw new Error("No daily data received");
            
            const newData: any[] = [];
            let cumulativePrecip = 0;
            let cumulativeGDD = 0; // Season-to-date GDD
            let forecastGDDSum = 0; // Future GDD
            
            let soilProxy = 50; 
            const todayIndex = 92; 

            data.daily.time.forEach((dateStr: string, i: number) => {
                const precip = data.daily.precipitation_sum[i] || 0;
                const tempMax = data.daily.temperature_2m_max[i] || 0;
                const tempMin = data.daily.temperature_2m_min[i] || 0;
                const et0 = data.daily.et0_fao_evapotranspiration ? data.daily.et0_fao_evapotranspiration[i] : 3.5;
                
                // --- REAL GDD ALGORITHM ---
                // Formula: ((Max + Min) / 2) - Base. If < 0, then 0.
                const avgTemp = (tempMax + tempMin) / 2;
                const dailyGDD = Math.max(0, avgTemp - baseTemp);
                
                if (i <= todayIndex) {
                    cumulativeGDD += dailyGDD; // Add to history sum
                } else if (i <= todayIndex + 7) {
                    forecastGDDSum += dailyGDD; // Add to forecast sum
                }

                cumulativePrecip += precip;
                
                // Simple soil moisture proxy (Decay + Input)
                const decay = tempMax > 30 ? 0.95 : 0.98;
                soilProxy = (soilProxy * decay) + (precip * 0.5); 
                soilProxy = Math.min(100, Math.max(0, soilProxy));

                newData.push({
                    dayIndex: i, 
                    day: dateStr.slice(5), 
                    fullDate: dateStr,
                    current: parseFloat(cumulativePrecip.toFixed(1)), // Cumulative Precip
                    precipDaily: precip,
                    accumGDD: parseFloat(cumulativeGDD.toFixed(1)), // Real Accumulated GDD curve
                    dailyGDD: parseFloat(dailyGDD.toFixed(1)),
                    et0: et0,
                    soilMoisture: parseFloat(soilProxy.toFixed(1)),
                    tempMax: tempMax,
                    tempMin: tempMin, // Added for CSV Export
                    isForecast: i > todayIndex
                });
            });

            const forecastTiles = [];
            for(let j=1; j<=7; j++) {
                const idx = todayIndex + j;
                if(data.daily.time[idx]) {
                    forecastTiles.push({
                        date: data.daily.time[idx],
                        dayName: new Date(data.daily.time[idx]).toLocaleDateString('en-US', { weekday: 'short' }),
                        code: data.daily.weather_code[idx],
                        max: data.daily.temperature_2m_max[idx],
                        min: data.daily.temperature_2m_min[idx],
                        rain: data.daily.precipitation_sum[idx],
                        prob: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[idx] : 0,
                        et0: data.daily.et0_fao_evapotranspiration ? data.daily.et0_fao_evapotranspiration[idx] : 0,
                        wind: data.daily.wind_speed_10m_max ? data.daily.wind_speed_10m_max[idx] : 0,
                        uv: data.daily.uv_index_max ? data.daily.uv_index_max[idx] : 0
                    });
                }
            }

            setSimulationData(newData);
            setForecastData(forecastTiles);
            
            // Set GDD Widget Stats
            setGddStats({
                total: parseFloat(cumulativeGDD.toFixed(0)),
                forecast: parseFloat(forecastGDDSum.toFixed(0)),
                avgDaily: parseFloat((cumulativeGDD / 92).toFixed(1))
            });

            setLoadingRealData(false);
        })
        .catch(err => {
            console.error("Weather fetch error", err);
            setConnectionError("Failed to fetch live stream");
            setLoadingRealData(false);
            setSimulationData([]);
        });

  }, [activeAsset, isConnected, regionConfig]);

  // 4. ALGORITHMIC CORRELATION ENGINE & MAP GENERATOR
  const currentStats = useMemo(() => {
      if (simulationData.length === 0) return null;
      
      const validPoints = simulationData.filter(d => !d.isForecast);
      const last = validPoints[validPoints.length - 1];
      if (!last) return null;

      // Real Data Checks
      const rainHeavy = last.precipDaily > 10;
      const soilDry = last.soilMoisture < 30;

      return {
          precip: last.current,
          precipDaily: last.precipDaily,
          soil: last.soilMoisture.toFixed(1),
          rainHeavy,
          soilDry
      };
  }, [simulationData]);

  // 5. Map Station Generator (Status is now strictly Data-Driven)
  useEffect(() => {
      const seed = activeAsset.length + regionConfig.lat + regionConfig.lon;
      const pseudoRandom = (input: number) => {
          const x = Math.sin(input) * 10000;
          return x - Math.floor(x);
      };

      const stations = [];
      const stationCount = 5 + Math.floor(pseudoRandom(seed) * 5); // 5-10 stations

      // Determine Region-Wide Status based on Open-Meteo Real Data
      // Since we only query one lat/lon, we assume the micro-climate affects all stations similarly
      // but we add slight noise to simulate local variance.
      let baseStatus = 'normal';
      if (currentStats) {
          if (currentStats.rainHeavy) baseStatus = 'raining';
          else if (currentStats.soilDry) baseStatus = 'dry';
      }

      for (let i = 0; i < stationCount; i++) {
          const rX = pseudoRandom(seed + i * 13) * 300 + 50; 
          const rY = pseudoRandom(seed + i * 7) * 200 + 50;  
          
          let status = baseStatus;
          // Add 10% chance of sensor variance
          if (Math.random() > 0.9) status = 'normal';

          stations.push({ x: rX, y: rY, status });
      }
      setMapStations(stations);

  }, [activeAsset, regionConfig, currentStats]);


  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (CROP_REGIONS[val]) {
          setActiveAsset(val);
      }
  };

  // --- Push to Pipeline Logic (UPGRADED: Global Time + Archive Simulation) ---
  const handlePushToPipeline = async () => {
      setIsPushing(true);
      
      // 1. Determine Scope
      // Use User's Selected Asset in Weather Page (User Sovereignty)
      // Use Global Context's Time Range (System Coherence)
      const targetStartDate = GLOBAL_MARKET_CONTEXT.isContextSet ? GLOBAL_MARKET_CONTEXT.startDate : new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
      const targetEndDate = GLOBAL_MARKET_CONTEXT.isContextSet ? GLOBAL_MARKET_CONTEXT.endDate : new Date().toISOString().split('T')[0];

      // 2. Fetch/Generate Archive Data (Simulation of Open-Meteo Archive API)
      // In a real production app, we would fetch from https://archive-api.open-meteo.com/v1/archive
      // Here we generate a high-fidelity synthetic set for the *exact requested range* to ensure pipeline continuity.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network fetch

      const generatedArchiveData: WeatherTimeSeriesPoint[] = [];
      const start = new Date(targetStartDate);
      const end = new Date(targetEndDate);
      const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let runningSoil = 50;
      let runningGDD = 0;

      for(let i=0; i<dayCount; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          
          // Synthetic weather pattern based on latitude (Simple cosine model)
          const seasonalOffset = Math.cos(((d.getMonth()) / 12) * 2 * Math.PI) * 15;
          const tempMax = 20 - (Math.abs(regionConfig.lat) / 3) + seasonalOffset + (Math.random() * 5);
          const tempMin = tempMax - 10;
          const avgTemp = (tempMax + tempMin) / 2;
          
          const isRainy = Math.random() > 0.8;
          const precip = isRainy ? Math.random() * 15 : 0;
          
          // GDD Accumulation (Reset every Jan 1st if needed, here accumulated over range)
          const gddDaily = Math.max(0, avgTemp - regionConfig.baseTemp);
          runningGDD += gddDaily;

          // Soil Moisture
          const decay = tempMax > 25 ? 0.96 : 0.98;
          runningSoil = (runningSoil * decay) + (precip * 0.5);
          runningSoil = Math.max(0, Math.min(100, runningSoil));

          generatedArchiveData.push({
              date: dateStr,
              precip: parseFloat(precip.toFixed(1)),
              gdd: parseFloat(gddDaily.toFixed(1)),
              soil: parseFloat(runningSoil.toFixed(1)),
              tempMax: parseFloat(tempMax.toFixed(1)),
              tempMin: parseFloat(tempMin.toFixed(1)),
              et0: 3.5, // Standard constant for sim
              isForecast: false
          });
      }

      // 3. Construct Metadata
      const metadata = {
          assetName: activeAsset,
          regionName: regionConfig.name,
          lat: regionConfig.lat,
          lon: regionConfig.lon,
          baseTemp: regionConfig.baseTemp,
          // Explicitly stamp the Global Context Range
          globalContextStart: targetStartDate,
          globalContextEnd: targetEndDate
      };

      // 4. Construct Phenology Context
      const phenology = {
          stages: regionConfig.stages,
          currentStage: currentPhenology
      };

      // 5. Push High-Dimensional Package
      DATA_LAYERS.set('weather', {
          sourceId: 'weather',
          name: `Weather Pack: ${activeAsset}`,
          metricName: 'Multi-Signal Packet',
          // Keep flat data for simple signal compatibility (backwards compat - uses new archive data)
          data: generatedArchiveData.map(d => ({
              date: d.date,
              value: d.soil, 
              meta: { gdd: d.gdd, precip: d.precip }
          })),
          // NEW: High-Dim Payload
          weatherPackage: {
              timeSeries: generatedArchiveData,
              metadata,
              phenology
          },
          timestamp: Date.now()
      });

      setIsPushing(false);
      setIsPushed(true);
  };

  const getWeatherIcon = (code: number) => {
      if (code === 0) return 'sunny';
      if (code < 3) return 'partly_cloudy_day';
      if (code < 50) return 'foggy';
      if (code < 60) return 'rainy';
      if (code < 80) return 'thunderstorm';
      return 'cloudy_snowing';
  };

  const getWeatherColor = (code: number) => {
      if (code === 0) return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]';
      if (code < 3) return 'text-yellow-200';
      if (code < 50) return 'text-slate-400';
      if (code < 60) return 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]';
      if (code < 80) return 'text-indigo-400';
      return 'text-white';
  };

  // Generate Dummy Hourly Data for Day
  const getHourlyDataForDay = (day: any) => {
      if (!day) return [];
      const hours = [];
      const baseTemp = (day.max + day.min) / 2;
      const amplitude = (day.max - day.min) / 2;
      for (let i = 0; i < 24; i++) {
          // Simulate diurnal cycle (peaking at 14:00)
          const temp = baseTemp + amplitude * Math.sin(((i - 9) / 24) * 2 * Math.PI);
          hours.push({ hour: `${i}:00`, temp: parseFloat(temp.toFixed(1)) });
      }
      return hours;
  };

  // Water Balance Data
  const waterBalanceData = useMemo(() => {
      if (forecastData.length === 0) return [];
      return forecastData.map(d => ({
          day: d.dayName,
          Precip: d.rain,
          ET0: d.et0,
          Balance: parseFloat((d.rain - d.et0).toFixed(1))
      }));
  }, [forecastData]);

  // --- CSV DOWNLOAD HANDLER ---
  const handleDownloadCSV = () => {
    if (!simulationData.length) return;

    // Headers matching the analysis logic
    const headers = [
        "Date",
        "Region",
        "Asset",
        "Status",
        "Phenology Stage",
        "Max Temp (C)",
        "Min Temp (C)",
        "Precipitation (mm)",
        "Accum Precip (mm)",
        "Daily GDD",
        "Accum GDD",
        "ET0 (mm)",
        "Water Balance (mm)",
        "Soil Moisture Index"
    ];

    const csvContent = [headers.join(",")];

    simulationData.forEach(row => {
        // Calculate Phenology Stage for this specific row's date
        const rowDate = new Date(row.fullDate);
        const currentYear = rowDate.getFullYear();
        const [startMonth, startDay] = regionConfig.season.start.split('-').map(Number);
        
        const seasonStart = new Date(currentYear, startMonth - 1, startDay);
        const dayDiff = Math.floor((rowDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        
        let stageName = 'Off-Season';
        if (dayDiff >= 0 && regionConfig.stages) {
             const activeStage = regionConfig.stages.find(s => dayDiff >= s.start && dayDiff <= s.end);
             if (activeStage) stageName = activeStage.name;
             else {
                 const lastStage = regionConfig.stages[regionConfig.stages.length - 1];
                 if (dayDiff > lastStage.end) stageName = 'Post-Harvest';
                 else stageName = 'Pre-Season';
             }
        } else {
            stageName = 'Pre-Season';
        }

        const line = [
            row.fullDate,
            `"${regionConfig.name}"`,
            `"${activeAsset}"`,
            row.isForecast ? "Forecast" : "History",
            `"${stageName}"`,
            row.tempMax,
            row.tempMin !== undefined ? row.tempMin : '', 
            row.precipDaily,
            row.current, // Cumulative Precip
            row.dailyGDD,
            row.accumGDD,
            row.et0,
            (row.precipDaily - row.et0).toFixed(2),
            row.soilMoisture
        ];
        csvContent.push(line.join(","));
    });

    const blob = new Blob([csvContent.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `QuantAgrify_Weather_${activeAsset.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <p className="text-sm font-bold truncate text-white">Analyst 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Quant Ops Team</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          {/* Header - Asset Centric */}
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                Agri-Weather Intelligence
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${isConnected ? 'text-[#0d59f2] bg-[#0d59f2]/10 border-[#0d59f2]/20' : 'text-[#fa6238] bg-[#fa6238]/10 border-[#fa6238]/20'}`}>
                    {isConnected ? 'Open-Meteo Connected' : 'Source Disconnected'}
                </span>
              </h2>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-2 bg-[#182234] border border-[#314368] rounded-lg px-2 py-1">
                    <span className="text-[10px] text-[#90a4cb] uppercase font-bold">Target Futures:</span>
                    <select 
                        value={activeAsset} 
                        onChange={handleAssetChange}
                        className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer w-[220px] [&>option]:bg-[#101622]"
                    >
                        {ASSET_GROUPS.map(group => (
                            <optgroup key={group.label} label={group.label}>
                                {Object.keys(CROP_REGIONS)
                                    .filter(key => group.prefix === '(Global' ? (key.includes('CBOT') || key.includes('ICE')) : key.includes(group.prefix))
                                    .map(key => (
                                        <option key={key} value={key}>{key}</option>
                                    ))
                                }
                            </optgroup>
                        ))}
                    </select>
                 </div>
                 <div className="h-4 w-px bg-[#314368]"></div>
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#fa6238] text-sm">location_on</span>
                    <span className="text-xs text-white font-mono">{regionConfig.name}</span>
                    <span className="text-[9px] text-[#90a4cb] font-mono">({regionConfig.lat}, {regionConfig.lon})</span>
                 </div>
              </div>
            </div>
            
            {/* Quick Stats - The "Trader's Glance" */}
            <div className="flex gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Soil Moisture Est.</span>
                    <span className={`text-lg font-black ${Number(currentStats?.soil) < 30 ? 'text-[#fa6238]' : 'text-emerald-400'}`}>
                        {currentStats ? `${currentStats.soil}%` : '--%'} <span className="text-[9px] text-[#90a4cb]">sat</span>
                    </span>
                </div>
                <div className="w-px bg-[#314368]"></div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Accum. GDD</span>
                    <span className={`text-lg font-black text-[#0bda5e]`}>
                        {gddStats.total} <span className="text-xs text-[#90a4cb] font-normal">deg-days</span>
                    </span>
                </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
            
            {/* 1. Historical Analog Analysis */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-9 bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0d59f2]">history_edu</span>
                                Real-Time Weather Analysis
                            </h3>
                            <p className="text-[#90a4cb] text-xs mt-1">
                                Data Source: <span className="text-white font-bold">Open-Meteo API</span> (92d History + 16d Forecast)
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setChartMode('PRECIP')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded border ${chartMode === 'PRECIP' ? 'bg-[#0d59f2] text-white border-[#0d59f2]' : 'text-[#90a4cb] border-[#314368]'}`}>Precipitation</button>
                            <button onClick={() => setChartMode('SOIL')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded border ${chartMode === 'SOIL' ? 'bg-[#0d59f2] text-white border-[#0d59f2]' : 'text-[#90a4cb] border-[#314368]'}`}>Soil Moisture</button>
                            <button onClick={() => setChartMode('GDD')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded border ${chartMode === 'GDD' ? 'bg-[#0d59f2] text-white border-[#0d59f2]' : 'text-[#90a4cb] border-[#314368]'}`}>GDD (Accum)</button>
                        </div>
                    </div>

                    <div className="h-[400px] w-full relative">
                        {loadingRealData && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#101622]/50 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 border-2 border-[#0d59f2] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-bold text-[#0d59f2] uppercase tracking-widest">Fetching Live Telemetry...</span>
                                </div>
                            </div>
                        )}
                        
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0bda5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0bda5e" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorGDD" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffb347" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ffb347" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                                <XAxis 
                                    dataKey="dayIndex" 
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tick={{fill: '#90a4cb', fontSize: 10}} 
                                    axisLine={{stroke: '#314368'}} 
                                    minTickGap={30}
                                    tickFormatter={(val) => `D-${92-val}`}
                                />
                                <YAxis tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} label={{ value: chartMode === 'PRECIP' ? 'mm' : chartMode === 'GDD' ? '°C-Day' : '%', angle: -90, position: 'insideLeft', fill: '#90a4cb', fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                                    labelFormatter={(val, payload) => {
                                        if (payload && payload.length && payload[0].payload.fullDate) {
                                            return `Date: ${payload[0].payload.fullDate}`;
                                        }
                                        return `Day ${val}`;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                
                                {isConnected && chartMode === 'PRECIP' && (
                                    <Area isAnimationActive={true} type="monotone" dataKey="current" name="Cumulative Precip (Live)" stroke="#0d59f2" fill="url(#colorCurrent)" strokeWidth={3} />
                                )}
                                
                                {isConnected && chartMode === 'SOIL' && (
                                    <Area isAnimationActive={true} type="monotone" dataKey="soilMoisture" name="Soil Moisture Model (Live)" stroke="#0bda5e" fill="url(#colorSoil)" strokeWidth={3} />
                                )}

                                {isConnected && chartMode === 'GDD' && (
                                    <Area isAnimationActive={true} type="monotone" dataKey="accumGDD" name={`Accumulated GDD (Base ${regionConfig.baseTemp}°C)`} stroke="#ffb347" fill="url(#colorGDD)" strokeWidth={3} />
                                )}

                                {/* Reference Line for Today */}
                                {simulationData.length > 0 && <ReferenceLine x={92} stroke="#fa6238" strokeDasharray="3 3" label={{ value: 'TODAY', fill: '#fa6238', fontSize: 10, position: 'insideTopRight' }} />}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Panel: Growth Stage */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-5 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest">Crop Phenology</h3>
                            <span className="text-[9px] bg-[#0d59f2]/10 text-[#0d59f2] px-2 py-0.5 rounded border border-[#0d59f2]/20 font-bold">Auto-Calc</span>
                        </div>
                        <div className="relative pl-4 border-l-2 border-[#314368] space-y-6">
                            {regionConfig.stages && regionConfig.stages.length > 0 ? regionConfig.stages.map((stage, i) => {
                                const isCurrent = i === currentPhenology.index;
                                const isPast = i < currentPhenology.index;
                                
                                return (
                                    <div key={i} className={`relative transition-opacity duration-500 ${isCurrent ? 'opacity-100' : isPast ? 'opacity-50' : 'opacity-30'}`}>
                                        <div className={`absolute -left-[21px] top-0 size-3 rounded-full border-2 ${isCurrent ? 'bg-[#0d59f2] border-[#0d59f2] ring-4 ring-[#0d59f2]/20' : isPast ? 'bg-[#314368] border-[#314368]' : 'bg-[#101622] border-[#90a4cb]'}`}></div>
                                        <h4 className={`text-xs font-bold uppercase ${isCurrent ? 'text-[#0d59f2]' : 'text-white'}`}>{stage.name}</h4>
                                        <p className="text-[10px] text-[#90a4cb] mt-1">{stage.sensitivity}</p>
                                        {isCurrent && (
                                            <div className="mt-2 bg-[#0d59f2]/10 p-2 rounded border border-[#0d59f2]/20">
                                                <div className="flex justify-between text-[9px] text-[#0d59f2] font-bold mb-1">
                                                    <span>Progress</span>
                                                    <span>{currentPhenology.progress.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-[#101622] h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-[#0d59f2] h-full" style={{ width: `${currentPhenology.progress}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="text-[#90a4cb] text-xs italic">No phenology data available for this asset.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Enhanced Regional Map & 7-Day Forecast */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-4 bg-[#182234]/20 border border-[#314368] rounded-xl p-0 overflow-hidden relative h-full min-h-[350px]">
                    {/* DYNAMIC STATION GRID VISUALIZATION */}
                    <div className="absolute inset-0 bg-[#101622] overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#0d59f2 1px, transparent 1px), linear-gradient(90deg, #0d59f2 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#0d59f2]/10 to-transparent animate-spin duration-[4s]" style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }}></div>
                        {mapStations.map((s, i) => (
                            <div key={i} className="absolute flex flex-col items-center justify-center transition-all duration-1000" style={{ left: s.x, top: s.y }}>
                                <div className={`w-2 h-2 rounded-full ${s.status === 'raining' ? 'bg-[#0d59f2] animate-pulse shadow-[0_0_8px_#0d59f2]' : s.status === 'dry' ? 'bg-[#fa6238] shadow-[0_0_5px_#fa6238]' : 'bg-[#0bda5e]'} transition-colors duration-500`}></div>
                                <div className="mt-1 text-[7px] text-[#90a4cb] font-mono opacity-60">ST-{i+1}</div>
                            </div>
                        ))}
                        <div className="absolute top-4 left-4 z-10">
                            <h4 className="text-white text-sm font-bold shadow-black drop-shadow-md">{regionConfig.name}</h4>
                            <p className="text-[#90a4cb] text-[10px] font-mono">
                                Stations: {mapStations.length} | Lat: {regionConfig.lat}, Lon: {regionConfig.lon}
                            </p>
                        </div>

                        {/* Real-time Telemetry Summary Overlay */}
                        <div className="absolute bottom-4 right-4 bg-[#0a0e17]/80 backdrop-blur-md p-3 rounded-lg border border-[#314368] z-10 w-48 shadow-xl">
                            <h5 className="text-[10px] text-[#90a4cb] uppercase font-bold mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">sensors</span> Sensor Array Status
                            </h5>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0d59f2] animate-pulse"></div> Precip Detect</span>
                                    <span className="text-[10px] font-mono font-bold text-white">{mapStations.filter(s => s.status === 'raining').length} Nodes</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#fa6238]"></div> Moisture Stress</span>
                                    <span className="text-[10px] font-mono font-bold text-white">{mapStations.filter(s => s.status === 'dry').length} Nodes</span>
                                </div>
                                <div className="h-px bg-white/10 my-1"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-[#90a4cb]">Signal Strength</span>
                                    <span className="text-[9px] text-[#0bda5e] font-mono">98.4%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                    {/* NEW: 7-Day Forecast High-Fidelity Cards */}
                    <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0d59f2]">calendar_month</span>
                                7-Day Precision Forecast
                            </h3>
                            <span className="text-[9px] text-[#90a4cb] bg-[#101622] px-2 py-1 rounded border border-[#314368]">Live Feed</span>
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                            {forecastData.length > 0 ? forecastData.map((f, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedDay(f)}
                                    className="relative group bg-[#182234]/40 border border-[#314368] rounded-xl p-3 flex flex-col items-center justify-between cursor-pointer hover:bg-[#182234] hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d59f2]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-[10px] font-bold text-[#90a4cb] uppercase">{f.dayName}</span>
                                    
                                    <div className="my-2 flex flex-col items-center">
                                        <span className={`material-symbols-outlined text-3xl mb-1 ${getWeatherColor(f.code)}`}>
                                            {getWeatherIcon(f.code)}
                                        </span>
                                        <span className="text-sm font-black text-white">{f.max.toFixed(0)}°</span>
                                        <span className="text-[10px] text-[#90a4cb] font-bold">{f.min.toFixed(0)}°</span>
                                    </div>

                                    {/* Precip Probability Bar */}
                                    <div className="w-full mt-2">
                                        <div className="flex justify-between text-[8px] text-[#90a4cb] mb-0.5">
                                            <span>Precip</span>
                                            <span>{f.prob}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-[#101622] rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#0d59f2] to-cyan-400" style={{ width: `${f.prob}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-7 text-center text-[#90a4cb] text-xs py-12 border-2 border-dashed border-[#314368] rounded-xl">
                                    Waiting for telemetry stream...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NEW: Agronomic Telemetry Dashboard (Filling Empty Space) */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Water Balance (P - ET0)</h4>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#0d59f2]"></div><span className="text-[8px] text-[#90a4cb] uppercase font-bold">Surplus</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#fa6238]"></div><span className="text-[8px] text-[#90a4cb] uppercase font-bold">Deficit</span></div>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative h-[100px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={waterBalanceData} margin={{top: 5, right: 5, bottom: 5, left: -20}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                                        <XAxis dataKey="day" tick={{fill: '#90a4cb', fontSize: 8}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fill: '#90a4cb', fontSize: 8}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #314368', fontSize: '10px' }} />
                                        <ReferenceLine y={0} stroke="#90a4cb" strokeDasharray="3 3" label={{ value: "Balanced", position: 'insideRight', fill: '#90a4cb', fontSize: 8 }} />
                                        <Bar dataKey="Balance" radius={[2, 2, 2, 2]}>
                                            {waterBalanceData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.Balance >= 0 ? '#0d59f2' : '#fa6238'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-[#182234]/20 border border-[#314368] rounded-xl p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Accumulated GDD (Past 90d)</h4>
                                <span className="material-symbols-outlined text-[#ffb347] text-sm">thermostat</span>
                            </div>
                            <div className="flex items-center gap-4 h-full">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-white">{gddStats.total}<span className="text-xs font-normal text-[#90a4cb] ml-1">units</span></span>
                                    <span className="text-[9px] text-[#ffb347] font-bold">Base: {regionConfig.baseTemp}°C</span>
                                </div>
                                <div className="flex flex-col flex-1 pl-4 border-l border-[#314368]">
                                    <div className="flex justify-between text-[9px] text-[#90a4cb] mb-1">
                                        <span>7-Day Forecast</span>
                                        <span className="text-white font-bold">+{gddStats.forecast}</span>
                                    </div>
                                    <div className="w-full bg-[#101622] h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#ffb347]" style={{ width: '45%' }}></div>
                                    </div>
                                    <span className="text-[8px] text-[#90a4cb] mt-1">Avg Daily: {gddStats.avgDaily}/day</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>

          {/* Action Footer with Push Button */}
          <footer className="absolute bottom-0 left-0 right-0 bg-[#101622]/95 backdrop-blur-xl border-t border-[#314368] p-5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${isConnected ? 'text-emerald-500' : 'text-[#fa6238]'}`}>satellite_alt</span>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Telemetry Status</p>
                  <p className="text-[10px] text-[#90a4cb]">
                    Open-Meteo: {isConnected ? 'Connected | Latency: 42ms' : 'Disconnected (Check API Console)'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* FLOATING PUSH BUTTON LOGIC */}
            <div className="flex gap-4">
              <button onClick={handleDownloadCSV} className="px-6 py-2.5 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#182234] transition-all text-sm font-bold">Download CSV</button>
              
              <button 
                onClick={handlePushToPipeline}
                disabled={isPushing || isPushed || !GLOBAL_MARKET_CONTEXT.isContextSet}
                className={`px-8 py-2.5 rounded-lg text-white transition-all text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-widest ${
                    isPushed 
                    ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                    : isPushing
                    ? 'bg-[#0d59f2]/70 cursor-wait shadow-[#0d59f2]/20'
                    : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20'
                }`}
                title={!GLOBAL_MARKET_CONTEXT.isContextSet ? "Set Global Context in Welcome Hub first" : ""}
              >
                {isPushing ? (
                    <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Fetching Archive...</>
                ) : isPushed ? (
                    <><span className="material-symbols-outlined text-lg">check_circle</span> Layer Added</>
                ) : (
                    <><span className="material-symbols-outlined text-lg">cloud_upload</span> Push Weather Signal</>
                )}
              </button>
            </div>
          </footer>

          {/* DAY DETAIL MODAL */}
          {selectedDay && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-[#101622] border border-[#314368] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">
                    <button 
                        onClick={() => setSelectedDay(null)}
                        className="absolute top-4 right-4 text-[#90a4cb] hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <div className="p-6 bg-[#182234]/50 border-b border-[#314368]">
                        <div className="flex items-center gap-4">
                            <span className={`material-symbols-outlined text-4xl ${getWeatherColor(selectedDay.code)}`}>
                                {getWeatherIcon(selectedDay.code)}
                            </span>
                            <div>
                                <h3 className="text-2xl font-bold text-white">{selectedDay.dayName} <span className="text-sm font-normal text-[#90a4cb]">{new Date(selectedDay.date).toLocaleDateString()}</span></h3>
                                <p className="text-xs text-[#90a4cb] uppercase tracking-widest font-bold">Detailed Met-Report</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#101622] p-4 rounded-xl border border-[#314368] text-center">
                                <span className="material-symbols-outlined text-[#0d59f2] mb-2">air</span>
                                <p className="text-[10px] text-[#90a4cb] uppercase font-bold">Wind Speed</p>
                                <p className="text-xl font-black text-white">{selectedDay.wind.toFixed(1)} <span className="text-xs">km/h</span></p>
                            </div>
                            <div className="bg-[#101622] p-4 rounded-xl border border-[#314368] text-center">
                                <span className="material-symbols-outlined text-[#ffb347] mb-2">light_mode</span>
                                <p className="text-[10px] text-[#90a4cb] uppercase font-bold">UV Index</p>
                                <p className="text-xl font-black text-white">{selectedDay.uv.toFixed(1)}</p>
                            </div>
                            <div className="bg-[#101622] p-4 rounded-xl border border-[#314368] text-center">
                                <span className="material-symbols-outlined text-[#0bda5e] mb-2">water_drop</span>
                                <p className="text-[10px] text-[#90a4cb] uppercase font-bold">Evapotranspiration (ET0)</p>
                                <p className="text-xl font-black text-white">{selectedDay.et0.toFixed(2)} <span className="text-xs">mm</span></p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#90a4cb] uppercase tracking-widest mb-4">Hourly Temperature Projection</h4>
                            <div className="h-48 w-full bg-[#101622] rounded-xl border border-[#314368] p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getHourlyDataForDay(selectedDay)}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fa6238" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#fa6238" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#314368" opacity={0.3} vertical={false} />
                                        <XAxis dataKey="hour" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} interval={3} />
                                        <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="temp" stroke="#fa6238" fill="url(#colorTemp)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

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
