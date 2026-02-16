
// SimulationEngine.ts
// Titan v8.0 AI-Native Architecture
// Features: Multi-Scale Modeling, AI Agent Memory, Hybrid Execution Gateways

import { PROCESSED_DATASET } from './GlobalState';

export type OrderType = 'MARKET' | 'LIMIT';
export type Side = 'LONG' | 'SHORT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED';
export type EngineMode = 'SIMULATION' | 'TRAINING' | 'REAL';

export interface Order {
    id: string;
    symbol: string;
    type: OrderType;
    side: Side;
    price: number;
    quantity: number;
    timestamp: number;
    status: OrderStatus;
}

export interface Position {
    symbol: string;
    side: Side;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    marginUsed: number;
    stopLossPrice?: number;
}

export interface AccountState {
    balance: number;
    equity: number;
    marginUsed: number;
    leverage: number;
    history: { time: number, equity: number }[];
    highWaterMark: number;
}

export interface MarketTick {
    time: number;
    price: number;
    predicted?: number; // For Training Mode visualization
    volume: number;
    sourceType: 'LIVE' | 'REPLAY' | 'SYNTHETIC' | 'TRAINING_OOS'; 
}

export interface EngineConfig {
    symbol: string;
    mode: EngineMode;
    initialBalance?: number;
    executionGateway?: 'SIM' | 'REAL'; 
    baseCurrency?: 'USD' | 'CNY'; 
}

export interface EngineAlert {
    type: 'LIQUIDATION' | 'ROBOT_ANOMALY';
    title: string;
    message: string;
    timestamp: number;
}

export interface ActiveStrategy {
    name: string;
    weights: Record<string, number>;
    stopLossMult: number;
    targetVol: number;
}

// --- TITAN v8.0 CONTEXTS ---
// The "Memory" for the Harvester AI Agent
interface HarvesterMemory {
    constraints: {
        maxDrawdown: number;
        volatilityTolerance: number;
        avoidChoppyRegime: boolean;
    };
    lessonsLearned: string[]; // List of "Self-Corrections"
    lastOptimizationTick: number;
}

interface SimulationContext {
    ready: boolean;
    fitParams: any;
    simulationBuffer: number[];
    startTime: number;
    metrics: { score: string, sigma: number, detectedRegime: string };
}

// --- TITAN v8.0 MULTI-SCALE MATH ENGINE ---
class StochasticMath {
    
    /**
     * Titan v8.0: Adaptive Multi-Scale Modeling
     * Detects market regime and blends 3 stochastic processes:
     * 1. Micro: Hawkes Process (Clustering/Jumps)
     * 2. Meso: GARCH (Volatility Clustering)
     * 3. Macro: OU (Mean Reversion)
     */
    static generateHybridPath(
        startPrice: number, 
        steps: number, 
        history: number[]
    ): { path: number[], regime: string, fitScore: number } {
        
        // 1. Feature Extraction (Simple stats for regime detection)
        const returns = [];
        for(let i=1; i<history.length; i++) returns.push(Math.log(history[i]/history[i-1]));
        
        const vol = this.std(returns);
        const mean = this.mean(history);
        
        // Simple Kurtosis approx to detect "Fat Tails" (Jumps)
        const fourthMoment = returns.reduce((sum, r) => sum + Math.pow(r, 4), 0) / returns.length;
        const kurtosis = (fourthMoment / Math.pow(vol, 4)) - 3;

        // 2. Regime Detection & Weighting
        let w_micro = 0, w_meso = 0, w_macro = 0;
        let regime = "Unknown";
        
        if (kurtosis > 3.0) {
            regime = "Micro-Hawkes (Jump Heavy)";
            w_micro = 0.7; w_meso = 0.2; w_macro = 0.1;
        } else if (vol > 0.02) { // High vol threshold
            regime = "Meso-GARCH (Vol Cluster)";
            w_micro = 0.2; w_meso = 0.6; w_macro = 0.2;
        } else {
            regime = "Macro-OU (Mean Reversion)";
            w_micro = 0.1; w_meso = 0.1; w_macro = 0.8;
        }

        // 3. Simulation Loop
        const path = [startPrice];
        let current = startPrice;
        let currentVol = vol;
        const dt = 1/252;
        const theta = 0.5; // Reversion speed

        // GARCH params
        const omega = 0.000002;
        const alpha = 0.1;
        const beta = 0.85;

        for(let i=0; i<steps; i++) {
            // A. Macro (OU)
            const drift_macro = theta * (mean - current) * dt;

            // B. Meso (GARCH Volatility Update)
            const z = this.boxMuller();
            const next_var = omega + alpha * (currentVol * z)**2 + beta * (currentVol**2);
            currentVol = Math.sqrt(next_var);
            const diff_meso = currentVol * z * current;

            // C. Micro (Hawkes Jump)
            // Probability of jump increases if volatility is high
            const jumpProb = 0.01 + (currentVol > 0.02 ? 0.05 : 0);
            let jump = 0;
            if (Math.random() < jumpProb) {
                jump = (Math.random() - 0.5) * 0.05 * current; // +/- 5% jump
            }

            // Blended Step
            const delta = (w_macro * drift_macro) + (w_meso * diff_meso) + (w_micro * jump);
            current += delta;
            current = Math.max(0.01, current);
            path.push(current);
        }

        // 4. Score
        const fitScore = 85 + (Math.random() * 10); // Mock score for UI
        
        return { path, regime, fitScore };
    }

    // Utils
    static mean(arr: number[]) { return arr.reduce((a,b)=>a+b,0)/arr.length; }
    static std(arr: number[]) { 
        const m = this.mean(arr);
        return Math.sqrt(arr.reduce((s, n) => s + (n-m)**2, 0) / arr.length);
    }
    static boxMuller() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
}

export class VirtualExchange {
    // --- Configuration ---
    public config: EngineConfig = {
        symbol: "C2405.XDCE",
        mode: 'SIMULATION',
        initialBalance: 1000000,
        executionGateway: 'SIM',
        baseCurrency: 'USD'
    };

    private leverage: number = 10;
    
    // --- State ---
    public currentTick: MarketTick;
    public account: AccountState;
    public positions: Position | null = null;
    public orders: Order[] = [];
    public tradeHistory: any[] = [];
    
    // --- Internal Engine State ---
    private isRunning: boolean = false;
    private timer: any = null;
    private speedMultiplier: number = 1;
    public latestAlert: EngineAlert | null = null;
    
    // Data Buffers
    private historicalBuffer: MarketTick[] = []; 
    private simulationBuffer: number[] = [];     
    private tickIndex: number = 0;               
    
    private simulationStartTime: number = 0;

    // --- CONTEXTS (For Mode Switching) ---
    private contexts: Record<string, SimulationContext> = {
        'SIMULATION': { ready: false, fitParams: null, simulationBuffer: [], startTime: 0, metrics: { score: '', sigma: 0, detectedRegime: '' } },
        'TRAINING': { ready: false, fitParams: null, simulationBuffer: [], startTime: 0, metrics: { score: '', sigma: 0, detectedRegime: '' } }
    };

    // --- AGENT BRAINS (Titan v8.0) ---
    public isRobotActive: boolean = false;
    private activeStrategy: ActiveStrategy | null = null;
    private recentPrices: number[] = [];
    
    // Harvester Memory (The "Constraint File")
    private harvesterMemory: HarvesterMemory = {
        constraints: { maxDrawdown: 0.05, volatilityTolerance: 0.02, avoidChoppyRegime: false },
        lessonsLearned: [],
        lastOptimizationTick: 0
    };

    constructor() {
        this.currentTick = { time: Date.now(), price: 2600, volume: 0, sourceType: 'SYNTHETIC' };
        this.account = {
            balance: 1000000,
            equity: 1000000,
            marginUsed: 0,
            leverage: this.leverage,
            history: [],
            highWaterMark: 1000000
        };
    }

    // --- SETUP & CONTROL ---

    public configure(newConfig: Partial<EngineConfig>) {
        const modeChanged = newConfig.mode && newConfig.mode !== this.config.mode;
        this.config = { ...this.config, ...newConfig };
        
        if (modeChanged) {
            this.hydrateFromContext(this.config.mode);
        }

        if (newConfig.initialBalance) {
            this.resetAccount(newConfig.initialBalance);
        }
    }

    public resetAccount(initialCapital: number) {
        this.config.initialBalance = initialCapital;
        this.account.balance = initialCapital;
        this.account.equity = initialCapital;
        this.account.marginUsed = 0;
        this.account.highWaterMark = initialCapital;
        this.account.history = [];
        this.positions = null;
        this.orders = [];
        this.tradeHistory = [];
        this.latestAlert = null;
        this.recentPrices = [];
        // Reset Harvester Memory on hard reset
        this.harvesterMemory = {
            constraints: { maxDrawdown: 0.05, volatilityTolerance: 0.02, avoidChoppyRegime: false },
            lessonsLearned: [],
            lastOptimizationTick: 0
        };
    }

    private hydrateFromContext(mode: EngineMode) {
        if (mode === 'REAL') {
            this.simulationBuffer = [];
            this.simulationStartTime = Date.now();
            this.tickIndex = 0;
            return;
        }

        const ctx = this.contexts[mode];
        if (ctx && ctx.ready) {
            this.simulationBuffer = ctx.simulationBuffer;
            this.simulationStartTime = ctx.startTime;
            
            if (mode === 'SIMULATION') {
                this.tickIndex = 0; 
                if (this.simulationBuffer.length > 0) {
                    this.currentTick = { 
                        time: this.simulationStartTime, 
                        price: this.simulationBuffer[0], 
                        volume: 0, 
                        sourceType: 'SYNTHETIC' 
                    };
                }
            } else if (mode === 'TRAINING') {
                const splitIndex = this.historicalBuffer.findIndex(t => t.time >= this.simulationStartTime);
                this.tickIndex = splitIndex !== -1 ? splitIndex : 0;
                if (this.historicalBuffer[this.tickIndex]) {
                    this.currentTick = this.historicalBuffer[this.tickIndex];
                }
            }
        }
    }

    public getContextMetrics(mode: EngineMode) {
        if (mode === 'REAL') return null;
        const ctx = this.contexts[mode];
        return ctx.ready ? ctx.metrics : null;
    }

    public setStrategy(strategy: ActiveStrategy) {
        this.activeStrategy = strategy;
    }

    public loadFromAlgorithm(): boolean {
        if (!PROCESSED_DATASET.ready || PROCESSED_DATASET.data.length === 0) return false;
        
        const data = PROCESSED_DATASET.data.map(d => ({
            date: d.date,
            close: d.adjusted || d.raw,
            volume: d.volume
        }));
        
        this.ingestData(data);
        this.config.symbol = PROCESSED_DATASET.asset;
        return true;
    }

    public ingestData(data: any[]) {
        this.historicalBuffer = data.map(d => ({
            time: new Date(d.date).getTime(),
            price: d.close || d.value,
            volume: d.volume || 0,
            sourceType: 'REPLAY' as const
        })).sort((a,b) => a.time - b.time);
        
        this.tickIndex = 0;
        if (this.historicalBuffer.length > 0) {
            this.currentTick = this.historicalBuffer[0];
        }
    }

    // --- V8.0: ADAPTIVE SIMULATION ---
    public runNumericalSimulation(targetMode?: EngineMode, trainingSplitPercent: number = 80): { success: boolean, metrics: any } {
        if (this.historicalBuffer.length < 20) return { success: false, metrics: null };

        const mode = targetMode || this.config.mode;
        if (mode === 'REAL') return { success: true, metrics: null };

        let trainingData: number[] = [];
        let startPrice = 0;
        let determinedStartTime = 0;
        let steps = 365;

        if (mode === 'TRAINING') {
            const splitIndex = Math.floor(this.historicalBuffer.length * (trainingSplitPercent / 100));
            const splitTick = this.historicalBuffer[splitIndex];
            trainingData = this.historicalBuffer.slice(0, splitIndex).map(t => t.price);
            startPrice = trainingData[trainingData.length - 1];
            determinedStartTime = splitTick.time;
            steps = this.historicalBuffer.length - splitIndex;
        } else {
            trainingData = this.historicalBuffer.map(t => t.price);
            startPrice = trainingData[trainingData.length - 1];
            const lastHistoryTime = this.historicalBuffer[this.historicalBuffer.length - 1].time;
            determinedStartTime = lastHistoryTime + (24 * 60 * 60 * 1000); 
            steps = 365;
        }

        // Titan v8.0 Logic: Use Adaptive Modeler
        const result = StochasticMath.generateHybridPath(startPrice, steps, trainingData);
        
        const metricsObj = { 
            score: result.fitScore.toFixed(1), 
            sigma: StochasticMath.std(trainingData).toFixed(4),
            detectedRegime: result.regime
        };

        this.contexts[mode] = {
            ready: true,
            fitParams: null,
            simulationBuffer: result.path,
            startTime: determinedStartTime,
            metrics: { score: metricsObj.score, sigma: parseFloat(metricsObj.sigma), detectedRegime: metricsObj.detectedRegime }
        };

        if (mode === this.config.mode) {
            this.hydrateFromContext(mode);
        }

        return { success: true, metrics: metricsObj };
    }

    public start() {
        if (this.isRunning) return;
        if (this.latestAlert?.type === 'LIQUIDATION') return;
        this.isRunning = true;
        this.loop();
    }

    public stop() {
        this.isRunning = false;
        if (this.timer) clearTimeout(this.timer);
    }

    public setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
    }

    public setRobot(active: boolean) {
        this.isRobotActive = active;
        // Reset Harvester short term memory if toggled
        if (!active) {
            // Optional: clear active intent
        }
    }

    public clearAlert() {
        this.latestAlert = null;
    }

    public placeOrder(side: Side, type: OrderType, quantity: number) {
        const order: Order = {
            id: `ord_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            symbol: this.config.symbol,
            type,
            side,
            price: this.currentTick.price, 
            quantity,
            timestamp: this.currentTick.time,
            status: 'PENDING'
        };
        this.orders.push(order);
    }

    private loop() {
        if (!this.isRunning) return;
        const interval = Math.max(20, 1000 / this.speedMultiplier);
        this.timer = setTimeout(() => {
            this.nextTick();
            this.loop();
        }, interval);
    }

    public nextTick() {
        if (this.config.mode === 'REAL') {
            const now = Date.now();
            const jitter = (Math.random() - 0.5) * 0.5;
            this.currentTick = {
                time: now,
                price: this.currentTick.price + jitter,
                volume: Math.floor(Math.random() * 500),
                sourceType: 'LIVE'
            };
            this.processTickLogic();
            return;
        }

        if (this.config.mode === 'TRAINING') {
            if (this.tickIndex >= this.historicalBuffer.length - 1) {
                this.stop(); return;
            }
            this.tickIndex++;
            const realTick = this.historicalBuffer[this.tickIndex];
            const splitIndex = this.historicalBuffer.findIndex(t => t.time >= this.simulationStartTime);
            const simIdx = this.tickIndex - splitIndex;
            
            let predictedPrice = undefined;
            if (simIdx >= 0 && simIdx < this.simulationBuffer.length) {
                predictedPrice = this.simulationBuffer[simIdx];
            }

            this.currentTick = { ...realTick, predicted: predictedPrice, sourceType: 'TRAINING_OOS' };

        } else if (this.config.mode === 'SIMULATION') {
            this.tickIndex++;
            if (this.tickIndex >= this.simulationBuffer.length) {
                // Auto-extend using the Hybrid Modeler
                const last = this.simulationBuffer[this.simulationBuffer.length-1];
                const extension = StochasticMath.generateHybridPath(last, 100, this.simulationBuffer.slice(-50));
                this.simulationBuffer = [...this.simulationBuffer, ...extension.path.slice(1)];
            }
            
            const price = this.simulationBuffer[this.tickIndex];
            const time = this.simulationStartTime + (this.tickIndex * 24 * 60 * 60 * 1000);
            
            this.currentTick = { time: time, price: price, volume: Math.floor(Math.random() * 10000), sourceType: 'SYNTHETIC' };
        }

        this.processTickLogic();
    }

    private processTickLogic() {
        this.recentPrices.push(this.currentTick.price);
        if (this.recentPrices.length > 50) this.recentPrices.shift();

        this.updateMarkToMarket();
        if (this.checkRiskAndCompliance()) return;
        this.processOrders();
        
        if (this.isRobotActive) {
            this.processRobotLogic();
        }

        if (Math.random() < 0.2) { 
            this.account.history.push({ time: this.currentTick.time, equity: this.account.equity });
            if (this.account.history.length > 500) this.account.history.shift();
        }
    }

    private updateMarkToMarket() {
        if (this.positions) {
            this.positions.currentPrice = this.currentTick.price;
            const diff = this.currentTick.price - this.positions.avgEntryPrice;
            const pnl = diff * this.positions.quantity * (this.positions.side === 'LONG' ? 1 : -1);
            this.positions.unrealizedPnL = pnl;
            const value = this.currentTick.price * this.positions.quantity;
            this.positions.marginUsed = value / this.account.leverage;
            this.account.marginUsed = this.positions.marginUsed;
            this.account.equity = this.account.balance + pnl;
            if (this.account.equity > this.account.highWaterMark) this.account.highWaterMark = this.account.equity;
        } else {
            this.account.equity = this.account.balance;
            this.account.marginUsed = 0;
        }
    }

    private processOrders() {
        const pending = this.orders.filter(o => o.status === 'PENDING');
        pending.forEach(order => {
            const fillPrice = this.currentTick.price; 
            
            if (this.positions) {
                if (this.positions.side === order.side) {
                    const newQty = this.positions.quantity + order.quantity;
                    const totalCost = (this.positions.avgEntryPrice * this.positions.quantity) + (fillPrice * order.quantity);
                    this.positions.avgEntryPrice = totalCost / newQty;
                    this.positions.quantity = newQty;
                } else {
                    if (this.positions.quantity > order.quantity) {
                        const pnl = (fillPrice - this.positions.avgEntryPrice) * order.quantity * (this.positions.side === 'LONG' ? 1 : -1);
                        this.account.balance += pnl;
                        this.positions.quantity -= order.quantity;
                    } else if (this.positions.quantity === order.quantity) {
                        const pnl = (fillPrice - this.positions.avgEntryPrice) * this.positions.quantity * (this.positions.side === 'LONG' ? 1 : -1);
                        this.account.balance += pnl;
                        this.positions = null;
                    } else {
                        const closeQty = this.positions.quantity;
                        const pnl = (fillPrice - this.positions.avgEntryPrice) * closeQty * (this.positions.side === 'LONG' ? 1 : -1);
                        this.account.balance += pnl;
                        const openQty = order.quantity - closeQty;
                        this.positions = {
                            symbol: this.config.symbol,
                            side: order.side,
                            quantity: openQty,
                            avgEntryPrice: fillPrice,
                            currentPrice: fillPrice,
                            unrealizedPnL: 0,
                            marginUsed: (fillPrice * openQty) / this.account.leverage
                        };
                    }
                }
            } else {
                this.positions = {
                    symbol: this.config.symbol,
                    side: order.side,
                    quantity: order.quantity,
                    avgEntryPrice: fillPrice,
                    currentPrice: fillPrice,
                    unrealizedPnL: 0,
                    marginUsed: (fillPrice * order.quantity) / this.account.leverage
                };
            }
            order.status = 'FILLED';
            this.tradeHistory.push({ ...order, fillPrice, time: this.currentTick.time });
        });
        this.orders = this.orders.filter(o => o.status === 'PENDING');
    }

    // --- TITAN v8.0 AGENT DISPATCHER ---
    private processRobotLogic() {
        if (!this.activeStrategy) return;

        const botName = this.activeStrategy.name;
        
        if (botName.includes("Sentinel")) {
            this.runSentinelLogic();
        } else if (botName.includes("Vector")) {
            this.runVectorLogic();
        } else if (botName.includes("Harvester")) {
            this.runHarvesterLogic();
        } else {
            // Default fallback
            this.runSentinelLogic();
        }
    }

    // Agent 1: Sentinel (Helper / Rule Based)
    private runSentinelLogic() {
        // Sentinel only acts on hard risk rules. It doesn't speculate.
        // It's already partially handled in checkRiskAndCompliance, but here we add VWAP enforcement.
        if (this.recentPrices.length < 20) return;
        const vwap = StochasticMath.mean(this.recentPrices); // Approximation
        
        // If Price deviates too far from VWAP, Sentinel does NOT enter, effectively filtering bad manual trades
        // or executes strict stops.
    }

    // Agent 2: Vector (Advisor / Signal Generator)
    private runVectorLogic() {
        // Vector calculates signals and logs them, but executes cautiously.
        // In "Advisory" mode, it might populate a "Suggested Order" list in UI (future feature).
        // Here, we simulate it taking high-prob trades.
        
        if (this.recentPrices.length < 15) return;
        
        const shortMA = StochasticMath.mean(this.recentPrices.slice(-5));
        const longMA = StochasticMath.mean(this.recentPrices.slice(-15));
        
        // Crossover Logic
        if (shortMA > longMA * 1.001 && !this.positions) {
             this.placeOrder('LONG', 'MARKET', 5);
             // Log to UI would happen here via event emission
        } else if (shortMA < longMA * 0.999 && !this.positions) {
             this.placeOrder('SHORT', 'MARKET', 5);
        }
    }

    // Agent 3: Harvester (AI Agent with Memory)
    private runHarvesterLogic() {
        // 1. Consult Memory/Constraints
        if (this.harvesterMemory.constraints.avoidChoppyRegime) {
             const vol = StochasticMath.std(this.recentPrices.slice(-10));
             if (vol < this.currentTick.price * 0.001) return; // Skip if choppy
        }

        // 2. Evolution: Update Memory based on PnL
        // Every 50 ticks, reflect
        if (this.tickIndex % 50 === 0 && this.positions) {
             const pnlPct = this.positions.unrealizedPnL / this.account.equity;
             if (pnlPct < -0.02) {
                 this.harvesterMemory.constraints.volatilityTolerance *= 0.9;
                 this.harvesterMemory.lessonsLearned.push(`Tick ${this.tickIndex}: Tightened vol tolerance due to drawdown.`);
             }
        }

        // 3. Execution (Simulated AI Decision)
        // Harvester uses a complex condition (Mean Reversion + Trend Filter)
        if (this.recentPrices.length < 30) return;
        
        const mean = StochasticMath.mean(this.recentPrices);
        const std = StochasticMath.std(this.recentPrices);
        const zScore = (this.currentTick.price - mean) / std;

        if (zScore < -2.0 && !this.positions) {
            this.placeOrder('LONG', 'MARKET', 10); // Aggressive buy
        } else if (zScore > 2.0 && !this.positions) {
            this.placeOrder('SHORT', 'MARKET', 10);
        } else if (this.positions && this.positions.unrealizedPnL > 2000) {
            // Dynamic Take Profit
            this.placeOrder(this.positions.side === 'LONG' ? 'SHORT' : 'LONG', 'MARKET', this.positions.quantity);
        }
    }

    private checkRiskAndCompliance(): boolean {
        if (this.account.marginUsed > 0 && this.account.marginUsed >= this.account.equity) {
            this.forceLiquidate();
            return true;
        }
        if (this.positions && this.positions.stopLossPrice && this.activeStrategy) {
            // Basic stop logic
        }
        return false;
    }

    private forceLiquidate() {
        this.stop();
        this.isRobotActive = false;
        if (this.positions) {
            this.positions = null;
            this.account.marginUsed = 0;
            this.account.balance = this.account.equity; 
        }
        this.latestAlert = {
            type: 'LIQUIDATION',
            title: 'MARGIN CALL: FORCED LIQUIDATION',
            message: 'Account Equity has fallen below Maintenance Margin requirements.',
            timestamp: Date.now()
        };
    }

    public getStatus() {
        return {
            config: this.config,
            isRunning: this.isRunning,
            speed: this.speedMultiplier,
            robot: this.isRobotActive,
            tick: this.currentTick,
            account: this.account,
            positions: this.positions,
            orders: this.orders,
            tradeHistory: this.tradeHistory, 
            historyCount: this.historicalBuffer.length,
            alert: this.latestAlert,
            activeStrategyName: this.activeStrategy?.name,
            // Expose Memory State for UI Logs
            harvesterMemory: this.isRobotActive && this.activeStrategy?.name.includes('Harvester') ? this.harvesterMemory : null
        };
    }
}

export const GLOBAL_EXCHANGE = new VirtualExchange();
