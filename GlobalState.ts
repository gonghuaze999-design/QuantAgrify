
// Shared Global State for Runtime Data Persistence

// 1. Pushed Assets Cache (Set of unique identifiers from Futures Trading)
// Format: "VarietyCode.ExchangeSuffix" (e.g., "C.XDCE", "SR.XZCE")
export const PUSHED_ASSETS = new Set<string>();

// New: Detailed Context for Pushed Assets to maintain query consistency
export interface AssetContext {
    symbol: string;      // Specific contract (e.g., C9999.XDCE)
    variety: string;     // Variety code (e.g., C)
    exchange: string;    // Exchange suffix (e.g., .XDCE)
    startDate: string;   // ISO Date String
    endDate: string;     // ISO Date String
    dataSourceName: string;
}

export const PUSHED_ASSET_CONTEXTS = new Map<string, AssetContext>();

// === NEW: GLOBAL MARKET CONTEXT (Set in WelcomeHub) ===
// This allows the user to define their intent before entering specific modules.
export const GLOBAL_MARKET_CONTEXT = {
    asset: { code: 'C9999.XDCE', name: 'Corn (玉米)' }, // Default Focus
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isContextSet: false // Flag to check if user actively set this
};

// 2. Shared Exchange Configuration
export const EXCHANGE_MAPPING: Record<string, { name: string, varieties: { code: string, name: string }[] }> = {
    '.XDCE': {
        name: 'DCE (Dalian - 大商所)',
        varieties: [
            { code: 'C', name: 'Corn (玉米)' },
            { code: 'CS', name: 'Corn Starch (玉米淀粉)' },
            { code: 'A', name: 'Soybean No.1 (黄大豆1号)' },
            { code: 'B', name: 'Soybean No.2 (黄大豆2号)' },
            { code: 'M', name: 'Soybean Meal (豆粕)' },
            { code: 'Y', name: 'Soybean Oil (豆油)' },
            { code: 'P', name: 'Palm Oil (棕榈油)' },
            { code: 'I', name: 'Iron Ore (铁矿石)' },
            { code: 'JD', name: 'Egg (鸡蛋)' },
        ]
    },
    '.XZCE': {
        name: 'ZCE (Zhengzhou - 郑商所)',
        varieties: [
            { code: 'SR', name: 'Sugar (白糖)' },
            { code: 'CF', name: 'Cotton (棉花)' },
            { code: 'OI', name: 'Rapeseed Oil (菜油)' },
            { code: 'RM', name: 'Rapeseed Meal (菜粕)' },
            { code: 'RS', name: 'Rapeseed (油菜籽)' },
            { code: 'AP', name: 'Apple (苹果)' },
            { code: 'PK', name: 'Peanut (花生)' },
            { code: 'TA', name: 'PTA' },
            { code: 'MA', name: 'Methanol (甲醇)' },
        ]
    },
    '.XSGE': {
        name: 'SHFE (Shanghai - 上期所)',
        varieties: [
            { code: 'RU', name: 'Rubber (橡胶)' },
            { code: 'RB', name: 'Rebar (螺纹钢)' },
            { code: 'HC', name: 'Hot Rolled Coil (热卷)' },
            { code: 'SP', name: 'Paper Pulp (纸浆)' },
            { code: 'AU', name: 'Gold (黄金)' },
            { code: 'AG', name: 'Silver (白银)' },
        ]
    },
    '.CCFX': {
        name: 'CFFEX (Financial - 中金所)',
        varieties: [
            { code: 'IF', name: 'CSI 300 Index' },
            { code: 'IC', name: 'CSI 500 Index' },
            { code: 'IM', name: 'CSI 1000 Index' },
            { code: 'T', name: '10-Year Treasury Bond' },
        ]
    }
};

// 3. Multi-Source Data Layers (The Fusion Bus)

// === NEW High-Dimensional Data Structures ===

export interface WeatherTimeSeriesPoint {
    date: string;       // ISO YYYY-MM-DD
    precip: number;     // mm
    gdd: number;        // degree-days
    soil: number;       // moisture index 0-100
    tempMax: number;    // Celsius
    tempMin: number;    // Celsius
    et0: number;        // Evapotranspiration
    isForecast: boolean; // True if predictive
}

export interface CropPhenologyContext {
    stages: {
        name: string;
        start: number;
        end: number;
        sensitivity: string;
    }[];
    currentStage: {
        name: string;
        index: number;
        progress: number;
    };
}

export interface WeatherDataPackage {
    timeSeries: WeatherTimeSeriesPoint[];
    metadata: {
        assetName: string;
        regionName: string;
        lat: number;
        lon: number;
        baseTemp: number;
    };
    phenology: CropPhenologyContext;
}

// New Packages for other modules
export interface SatelliteDataPackage {
    ndviSeries: any[];
    metadata: {
        assetName: string;
        region: string;
        targetYear: number;
        compareYear: number;
    };
}

// Enhanced Macro Package for Supply/Demand
export interface MacroDataPackage {
    timeSeries: any[]; // Date, aiScore, Price
    metadata: {
        assetName: string;
        drivers: any[];
        interval: { start: string, end: string };
    };
    metrics: {
        supplyScore: number;
        demandScore: number;
        balanceTrend: string;
        confidence: number;
    };
}

export interface SpotDataPackage {
    basisSeries: any[]; // Futures, Spot, Basis, Inventory
    metadata: {
        assetName: string;
        spotSource: string;
        interval: { start: string, end: string };
    };
}

export interface KnowledgeDataPackage {
    quantifiedSeries: any[]; // Date, ImpactScore
    sourceFiles: any[];
    metadata: {
        generatedAt: number;
    };
}

export interface FusionDataPackage {
    data: any[]; // Wide format: Date, Open, High, Low, Close, Factor1, Factor2...
    features: string[]; // List of factor names
    metadata: {
        asset: string;
        generatedAt: number;
    };
}

// NEW: Futures Data Package (Added for FuturesTrading export)
export interface FuturesDataPackage {
    marketData: any[]; // OHLCV Series
    sentiment: any; // AI Sentiment Object
    metadata: {
        symbol: string;
        variety: string;
        exchange: string;
        interval: string;
    };
}

// NEW: Policy Regime Package
export interface PolicyDataPackage {
    sentimentScore: number; // -1 (Bearish) to 1 (Bullish)
    regimeType: string; // e.g. "Risk On", "Stagflation", "Supply Shock"
    topDrivers: string[];
    timestamp: number;
}

// NEW: Composite Signal Package (Output of Fusion)
export interface CompositeSignalPackage {
    asset: string;
    signals: { date: string; score: number; price: number; regimeAdjustment: number }[];
    weights: Record<string, number>;
    metrics: {
        sharpe: number;
        turnover: number;
    };
}

export interface DataLayerPoint {
    date: string;
    value: number;
    meta?: any;
}

export interface DataLayer {
    sourceId: 'weather' | 'satellite' | 'supply' | 'spot' | 'knowledge' | 'engineered_features' | 'policy_regime' | 'composite_signal' | 'futures_market';
    name: string; // Display name
    metricName: string; // e.g., "Soil Moisture Index" (Primary metric for simple charts)
    
    // Legacy / Simple signal
    data: DataLayerPoint[]; 
    
    // High-Dimensional Payloads
    weatherPackage?: WeatherDataPackage; 
    satellitePackage?: SatelliteDataPackage;
    macroPackage?: MacroDataPackage;
    spotPackage?: SpotDataPackage;
    knowledgePackage?: KnowledgeDataPackage;
    fusionPackage?: FusionDataPackage; // Feature Engineering Output
    policyPackage?: PolicyDataPackage; // Policy Output
    compositePackage?: CompositeSignalPackage; // Fusion Output
    futuresPackage?: FuturesDataPackage; // Futures Trading Output
    
    timestamp: number;
}

export const DATA_LAYERS = new Map<string, DataLayer>();

// 4. Algorithm Workflow State Persistence (View Cache)
export const ALGO_VIEW_CACHE = {
    selectedAsset: '', // Initializes empty, will check PUSHED_ASSETS
    rolloverRule: 'MAX_OI',
    gapMethod: 'BACK_ADJ',
    activeLayerId: null as string | null,
    status: 'IDLE' as 'IDLE' | 'PROCESSING' | 'COMPLETED',
    activeStep: 0,
    logs: [] as string[],
    
    // Processed Data
    rawDataCache: [] as any[],
    chartData: [] as any[],
    metrics: { gapSize: 0, healthScore: 0, trendContinuity: 0, volatilitySmoothness: 0, dataIntegrity: 0, rolloverEfficiency: 0 },
    layerMeta: null as any,
    isRegionMismatch: false
};

// 5. Final Processed Dataset (Output of Algorithm Pipeline -> Input for Feature Engineering)
export const PROCESSED_DATASET = {
    ready: false,
    asset: '',
    data: [] as any[],
    metrics: {} as any,
    timestamp: 0
};

// 6. Feature Engineering View Cache (Persistence)
export const FEATURE_VIEW_CACHE = {
    timestamp: 0,
    activeFactors: [] as any[],
    selectedFactorId: null as string | null,
    chartData: [] as any[],
    metrics: { ic: 0, ir: 0, autocorr: 0, turnover: 0 },
    quantileData: [] as any[],
    aiAudit: null as any
};

// 7. Global Alarm State
export interface Alarm {
    id: string;
    time: string; // HH:mm format
    label?: string;
    active: boolean;
}

export const ALARM_STATE = {
    alarms: [] as Alarm[],
    lastTriggered: null as string | null, // timestamp of last trigger to prevent looping
};
