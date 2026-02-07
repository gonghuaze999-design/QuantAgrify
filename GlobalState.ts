
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

export interface MacroDataPackage {
    timeSeries: any[]; // Price vs AI Score
    metadata: {
        assetName: string;
        drivers: any[];
    };
}

export interface SpotDataPackage {
    basisSeries: any[]; // Futures, Spot, Basis
    metadata: {
        assetName: string;
        spotSource: string;
    };
}

export interface KnowledgeDataPackage {
    quantifiedSeries: any[]; // Date, ImpactScore
    sourceFiles: any[];
    metadata: {
        generatedAt: number;
    };
}

export interface DataLayerPoint {
    date: string; // ISO YYYY-MM-DD
    value: number; // The primary signal value
    meta?: any;   // Extra context (e.g., distinct GDD vs Precip)
}

export interface DataLayer {
    sourceId: 'weather' | 'satellite' | 'supply' | 'spot' | 'knowledge';
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

// 6. Global Alarm State (New)
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
