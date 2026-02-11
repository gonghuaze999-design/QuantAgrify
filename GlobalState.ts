
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
    isContextSet: false, // Flag to check if user actively set this
    colorMode: 'US' as 'US' | 'CN' // 'US': Green Up/Red Down, 'CN': Red Up/Green Down
};

// === COLOR UTILITY HELPER ===
export const getTrendColor = (value: number | string, type: 'text' | 'bg' | 'stroke' | 'fill' = 'text') => {
    // Mode logic is now handled by CSS Variables, but we check logic here for Up/Down determination
    let isPositive = false;

    if (typeof value === 'number') {
        isPositive = value >= 0;
    } else if (typeof value === 'string') {
        const v = value.toUpperCase();
        if (v === 'BULLISH' || v === 'LONG' || v === 'PROFIT' || v === 'STRONG BUY' || v === 'ACCUMULATE' || v === 'TIGHTENING') isPositive = true;
        else if (v === 'BEARISH' || v === 'SHORT' || v === 'LOSS' || v === 'SELL' || v === 'LOOSENING') isPositive = false;
        else if (v.includes('+')) isPositive = true;
        else if (v.includes('-')) isPositive = false;
        else isPositive = true; // Default to positive style for neutral/unknown strings unless explicitly negative
    }

    // Use CSS Variables instead of Hardcoded Hex
    const colorUp = 'var(--trend-up)';
    const colorDown = 'var(--trend-down)';

    const finalColor = isPositive ? colorUp : colorDown;

    if (type === 'stroke' || type === 'fill') return finalColor;
    
    // For Tailwind classes, we use arbitrary values referencing the CSS variable
    if (type === 'bg') return `bg-[${finalColor}]`;
    return `text-[${finalColor}]`;
};

// === NEW: CUSTOM UPLOAD MODULE CACHE ===
export const CUSTOM_UPLOAD_STATE = {
    initialized: false,
    library: [] as any[], // Holds KnowledgeAsset[]
    nodes: [] as any[],   // Holds GraphNode[]
    storageUsed: 0
};

// === NEW: COCKPIT VIEW CACHE (Persistence) ===
export const COCKPIT_VIEW_CACHE = {
    chartData: [] as any[],
    logs: [] as any[],
    neuralState: 'IDLE' as 'IDLE' | 'SCANNING' | 'ANALYZING' | 'EXECUTING',
    botConfidence: 0,
    initialized: false
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
        assetName?: string;
        category?: string;
        tags?: string[];
    };
}

export interface FusionDataPackage {
    data: any[]; // Wide format: Date, Open, High, Low, Close, Volume, OI, Factor1, Factor2...
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

// NEW: Composite Signal Package (Output of Fusion -> Input for Risk)
export interface CompositeSignalPackage {
    asset: string;
    signals: { 
        date: string; 
        score: number | null; 
        price: number; 
        // PASSTHROUGH DATA FOR RISK CONTROL
        open: number;
        high: number;
        low: number;
        volume: number;
        oi: number;
        regimeAdjustment: number 
    }[];
    weights: Record<string, number>;
    metrics: {
        sharpe: number;
        turnover: number;
    };
}

// NEW: Risk Analysis Package (Output of Risk -> Input for Model Iteration)
export interface RiskAnalysisPackage {
    sourceAsset: string;
    // Full Time Series of the Executed Strategy
    timeSeries: {
        date: string;
        price: number;
        rawSignal: number; // The alpha before risk control
        position: number; // Actual executed position (-1 to 1)
        equity: number; // Simulated equity curve
        drawdown: number; // Drawdown %
        benchmarkReturn: number; // Buy & Hold return
    }[];
    // Applied Risk Parameters
    config: {
        targetVol: number;
        stopLossMult: number;
        liquidityFilter: boolean;
    };
    // Resulting Metrics
    stats: {
        finalEquity: number;
        maxDrawdown: number;
        realizedVol: number;
        sharpeRatio: number; // Estimated
    };
    // Attribution Data (Passed from Fusion)
    attribution?: {
        weights: Record<string, number>;
        features: string[];
    };
    timestamp: number;
}

// === NEW: LIVE TRADING STATE (For Cockpit) ===
export const LIVE_TRADING_STATE = {
    isDeployed: false,
    strategyId: 'LIVE-001',
    activeAsset: 'CORN (ZC)',
    currentSignal: 'LONG',
    signalStrength: 85,
    lastPrice: 462.25,
    entryPrice: 458.00,
    pnl: 1.2, // %
    riskUsage: 45, // %
    factors: [
        { name: 'Weather', contribution: 0.4 },
        { name: 'Momentum', contribution: 0.3 },
        { name: 'Carry', contribution: 0.3 }
    ],
    logs: [
        { time: '14:30:05', msg: 'Signal Update: Strong Buy confirmed by Weather factor.' },
        { time: '14:28:10', msg: 'Risk Check: Volatility within limits (12%).' },
        { time: '14:25:00', msg: 'Market Data: Tick stream active.' }
    ]
};

export interface DataLayerPoint {
    date: string;
    value: number;
    meta?: any;
}

export interface DataLayer {
    sourceId: 'weather' | 'satellite' | 'supply' | 'spot' | 'knowledge' | 'engineered_features' | 'policy_regime' | 'composite_signal' | 'futures_market' | 'risk_strategy';
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
    riskPackage?: RiskAnalysisPackage; // Risk Control Output
    
    timestamp: number;
}

// === CENTRAL LOGGING SYSTEM (SystemLogStream) ===
// Implemented before DATA_LAYERS so the proxy can use it.

export interface LogEntry {
    id: string;
    timestamp: number;
    timestampStr: string; // HH:MM:SS
    module: string;       // e.g., "Algorithm", "Network"
    action: string;       // e.g., "Fetch Data", "Push Signal"
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DATA_PACKET';
    message: string;
    payload?: any;        // Complex object for JSON viewer
}

type LogListener = (entry: LogEntry) => void;

export const SystemLogStream = {
    logs: [] as LogEntry[],
    listeners: [] as LogListener[],

    // Subscribe to new logs
    subscribe(listener: LogListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    // Push a new log entry
    push(entry: Omit<LogEntry, 'id' | 'timestamp' | 'timestampStr'>) {
        const fullEntry: LogEntry = {
            ...entry,
            id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            timestampStr: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        
        this.logs.push(fullEntry);
        
        // Rolling buffer: Keep last 2000 logs to manage memory
        if (this.logs.length > 2000) this.logs.shift();
        
        this.listeners.forEach(l => l(fullEntry));
    },
    
    // Get current history
    getHistory() {
        return this.logs;
    }
};

// === INTERCEPTED DATA LAYER (PROXY PATTERN) ===
// We wrap the Map in a Proxy to detect .set() calls and log them to SystemLogStream automatically.

const _dataLayersMap = new Map<string, DataLayer>();

export const DATA_LAYERS = new Proxy(_dataLayersMap, {
    get(target, prop, receiver) {
        // Intercept the 'set' method
        if (prop === 'set') {
            return function (key: string, value: DataLayer) {
                // 1. Log to Central System
                SystemLogStream.push({
                    type: 'DATA_PACKET',
                    module: 'GlobalDataBus',
                    action: 'Push Layer',
                    message: `Pushing [${value.sourceId}] to Pipeline: ${value.name}`,
                    payload: value // Capture full payload for JSON inspection
                });
                
                // 2. Perform the actual set operation
                return target.set(key, value);
            }
        }
        
        // Default behavior for other methods (get, has, delete, etc.)
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
    }
});


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

// 7. Risk Control View Cache (Persistence)
export const RISK_VIEW_CACHE = {
    timestamp: 0, // Timestamp of the signal used for current calc
    // Configuration
    targetVol: 0.15,
    stopLossMult: 2.0,
    liquidityFilter: true,
    maxDrawdownLimit: 0.10,
    // AI State
    stressScenario: "Supply Chain Disruption",
    customScenarioPrompt: "",
    aiAnalysis: { text: "System Standby", status: "IDLE" },
    // Calculation Results
    riskData: [] as any[],
    currentMetrics: { 
        volatility: 0, 
        liquidityScore: 100, 
        currentDrawdown: 0, 
        exposure: 0 
    }
};

// 8. Global Alarm State
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
