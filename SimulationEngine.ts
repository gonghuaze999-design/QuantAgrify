
// SimulationEngine.ts
// The "Digital Twin" of a Futures Exchange & Brokerage System
// UPGRADED: Ornstein-Uhlenbeck (Mean Reversion) for Agricultural Commodities

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
    // For Training Mode: The timestamp where History ends and Prediction begins
    splitTimestamp?: number; 
    initialBalance?: number;
    modelType?: 'MJD' | 'OU'; // Default to OU (Agricultural)
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

// --- ADVANCED NUMERICAL MATH (Ornstein-Uhlenbeck Mean Reversion) ---
class StochasticMath {
    /**
     * Calibrates the Ornstein-Uhlenbeck process parameters from historical data.
     * Equation: dXt = theta * (mu - Xt) * dt + sigma * dW
     * Discrete: X_{t+1} = X_t + theta*(mu - X_t)*dt + sigma*sqrt(dt)*epsilon
     */
    static fitOU(prices: number[]) {
        if (prices.length < 10) return { mu: 0, theta: 0.1, sigma: 0.02 };

        const dt = 1 / 252; // Daily time step
        const n = prices.length;

        // 1. Calculate Long-Term Mean (Mu)
        const mu = prices.reduce((a, b) => a + b, 0) / n;

        // 2. Estimate Theta (Speed of Mean Reversion) using Linear Regression
        // Regress (S_{t+1} - S_t) against (mu - S_t)
        // Y = dS, X = (mu - S)
        // Slope approx = theta * dt
        let sumXY = 0;
        let sumXX = 0;
        let sumSquaredResiduals = 0;

        for (let i = 0; i < n - 1; i++) {
            const S_t = prices[i];
            const S_next = prices[i+1];
            const dS = S_next - S_t;
            const deviation = mu - S_t;

            sumXY += deviation * dS;
            sumXX += deviation * deviation;
        }

        // Avoid division by zero
        const slope = sumXX !== 0 ? sumXY / sumXX : 0.05; 
        
        // Theta must be positive for mean reversion. If negative, it implies momentum/divergence.
        // For Ags, we force a minimum reversion speed.
        const theta = Math.max(0.1, slope / dt); 

        // 3. Estimate Sigma (Volatility of the residuals)
        for (let i = 0; i < n - 1; i++) {
            const S_t = prices[i];
            const S_next = prices[i+1];
            
            // Expected change based on drift
            const expected_dS = (theta * dt) * (mu - S_t);
            const actual_dS = S_next - S_t;
            
            // Residual is the diffusion part
            const residual = actual_dS - expected_dS;
            sumSquaredResiduals += residual * residual;
        }

        const variance = sumSquaredResiduals / (n - 1);
        // sigma * sqrt(dt) = sqrt(variance) -> sigma = sqrt(variance / dt)
        const sigma = Math.sqrt(variance / dt);

        return { mu, theta, sigma };
    }

    /**
     * Generates a future price path using the OU process.
     */
    static generateOUPath(
        startPrice: number, 
        steps: number, 
        dt: number, 
        params: { mu: number, theta: number, sigma: number }
    ): number[] {
        const path = [startPrice];
        let current = startPrice;
        const { mu, theta, sigma } = params;

        for (let i = 0; i < steps; i++) {
            // Random Shock (Standard Normal Distribution)
            // Box-Muller transform for better distribution than Math.random()
            let u = 0, v = 0;
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

            // Euler-Maruyama Discretization for OU
            // dS = theta * (mu - S) * dt + sigma * dW
            const drift = theta * (mu - current) * dt;
            const diffusion = sigma * Math.sqrt(dt) * z;
            
            let nextPrice = current + drift + diffusion;
            
            // Physical constraint: Prices rarely go negative (unless oil in 2020), cap at 0.01
            nextPrice = Math.max(0.01, nextPrice);
            
            path.push(nextPrice);
            current = nextPrice;
        }
        return path;
    }
}

export class VirtualExchange {
    // --- Configuration ---
    public config: EngineConfig = {
        symbol: "C2405.XDCE",
        mode: 'SIMULATION',
        initialBalance: 1000000,
        modelType: 'OU' // Upgraded Default
    };

    private leverage: number = 10;
    private commissionRate: number = 0.0001; 
    private slippageRate: number = 0.0002;

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
    private historicalBuffer: MarketTick[] = []; // Full history from source
    private simulationBuffer: number[] = [];     // Generated Future path
    private tickIndex: number = 0;               // Current cursor
    
    // Sim Math State
    private fitParams: any = null;
    private simulationStartTime: number = 0;
    private lastSimPrice: number = 0; // Tracks last known valid price for sim continuity

    // Robot & Risk
    public isRobotActive: boolean = false;
    private activeStrategy: ActiveStrategy | null = null;
    private sessionStartEquity: number = 0;
    private recentPrices: number[] = [];

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
        this.config = { ...this.config, ...newConfig };
        
        if (newConfig.initialBalance) {
            this.account.balance = newConfig.initialBalance;
            this.account.equity = newConfig.initialBalance;
            this.account.highWaterMark = newConfig.initialBalance;
            this.account.history = [];
            this.positions = null;
            this.orders = [];
            this.latestAlert = null;
            this.recentPrices = [];
        }
    }

    public setStrategy(strategy: ActiveStrategy) {
        this.activeStrategy = strategy;
    }

    // Load data from Algorithm module (The "Single Source of Truth")
    public loadFromAlgorithm(): boolean {
        if (!PROCESSED_DATASET.ready || PROCESSED_DATASET.data.length === 0) return false;
        
        // Convert to Engine Format
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
        
        // Reset Cursor
        this.tickIndex = 0;
        if (this.historicalBuffer.length > 0) {
            this.currentTick = this.historicalBuffer[0];
            this.lastSimPrice = this.currentTick.price;
        }
    }

    // CORE NUMERICAL SIMULATION - UPGRADED TO OU PROCESS
    public runNumericalSimulation(): { success: boolean, metrics: any } {
        if (this.historicalBuffer.length < 20) return { success: false, metrics: null };

        let trainingData: number[] = [];
        let startPrice = 0;
        let startTime = 0;

        // --- 1. Data Splitting ---
        if (this.config.mode === 'TRAINING' && this.config.splitTimestamp) {
            // Fit on Pre-Split Data (Train Set)
            const splitIndex = this.historicalBuffer.findIndex(t => t.time >= this.config.splitTimestamp!);
            if (splitIndex === -1) return { success: false, metrics: null };
            
            this.tickIndex = splitIndex; // Start playback at split point
            trainingData = this.historicalBuffer.slice(0, splitIndex).map(t => t.price);
            startPrice = trainingData[trainingData.length - 1];
            startTime = this.historicalBuffer[splitIndex].time;
        } else {
            // SIMULATION: Fit on ALL Data (Full History)
            trainingData = this.historicalBuffer.map(t => t.price);
            startPrice = trainingData[trainingData.length - 1];
            this.tickIndex = this.historicalBuffer.length - 1; // Start at end
            startTime = this.historicalBuffer[this.historicalBuffer.length - 1].time;
        }

        // --- 2. Fit OU Parameters (Mean Reversion) ---
        // Using the upgraded fitOU method instead of MJD
        this.fitParams = StochasticMath.fitOU(trainingData);
        
        // --- 3. Generate Future Path ---
        let steps = 365;
        if (this.config.mode === 'TRAINING') {
            // Generate exact number of steps remaining in the validation set
            steps = this.historicalBuffer.length - this.tickIndex;
        }

        this.simulationBuffer = StochasticMath.generateOUPath(
            startPrice, 
            steps, 
            1/252, // Daily step size
            this.fitParams
        );
        
        this.simulationStartTime = startTime;

        // Calculate "Fit Score"
        // For OU, a high Theta implies strong mean reversion (good for ags). 
        // A low Sigma implies stable fit.
        // We synthesize a score 0-100 based on fit confidence.
        const reversionStrength = Math.min(10, this.fitParams.theta) * 10; 
        const stability = Math.max(0, 100 - (this.fitParams.sigma * 1000));
        const fitScore = (reversionStrength * 0.4 + stability * 0.6);

        return { 
            success: true, 
            metrics: { 
                mu: this.fitParams.mu.toFixed(2), 
                theta: this.fitParams.theta.toFixed(3), 
                sigma: this.fitParams.sigma.toFixed(3),
                fitScore: Math.max(10, Math.min(99, fitScore)).toFixed(1)
            } 
        };
    }

    public start() {
        if (this.isRunning) return;
        if (this.latestAlert?.type === 'LIQUIDATION') return;
        
        this.isRunning = true;
        this.sessionStartEquity = this.account.equity;
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
        if (active) this.sessionStartEquity = this.account.equity;
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
            price: this.currentTick.price, // Assuming market order for simplicity or current price for limit placeholder
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
        // --- 1. DETERMINE NEXT PRICE (Dual-Track Logic) ---
        
        if (this.config.mode === 'TRAINING') {
            // Step forward in history
            if (this.tickIndex >= this.historicalBuffer.length - 1) {
                this.stop(); return;
            }
            this.tickIndex++;
            
            const realTick = this.historicalBuffer[this.tickIndex];
            
            const splitIndex = this.historicalBuffer.length - this.simulationBuffer.length;
            const simIdx = this.tickIndex - splitIndex;
            
            let predictedPrice = undefined;
            if (simIdx >= 0 && simIdx < this.simulationBuffer.length) {
                predictedPrice = this.simulationBuffer[simIdx];
            }

            this.currentTick = {
                ...realTick,
                predicted: predictedPrice,
                sourceType: 'TRAINING_OOS' // Out of Sample
            };

        } else if (this.config.mode === 'SIMULATION') {
            // Pure Math Generation
            this.tickIndex++;
            if (this.tickIndex >= this.simulationBuffer.length) {
                // Generate infinite future using last known point
                const last = this.simulationBuffer[this.simulationBuffer.length-1];
                const newPath = StochasticMath.generateOUPath(last, 100, 1/252, this.fitParams);
                this.simulationBuffer = [...this.simulationBuffer, ...newPath.slice(1)];
            }
            
            const price = this.simulationBuffer[this.tickIndex] !== undefined ? this.simulationBuffer[this.tickIndex] : this.lastSimPrice;
            const time = this.simulationStartTime + (this.tickIndex * 24 * 60 * 60 * 1000); // Daily steps
            
            this.currentTick = {
                time: time,
                price: price,
                volume: Math.floor(Math.random() * 10000),
                sourceType: 'SYNTHETIC'
            };
        }

        // Update last known price for continuity
        this.lastSimPrice = this.currentTick.price;

        this.recentPrices.push(this.currentTick.price);
        if (this.recentPrices.length > 50) this.recentPrices.shift();

        this.updateMarkToMarket();
        
        if (this.checkRiskAndCompliance()) return;

        this.processOrders();
        
        if (this.isRobotActive) {
            this.processRobotLogic();
        }

        // History recording (throttled)
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
            
            // Calc Margin
            const value = this.currentTick.price * this.positions.quantity;
            this.positions.marginUsed = value / this.account.leverage;
            this.account.marginUsed = this.positions.marginUsed;
            
            // Update Equity
            this.account.equity = this.account.balance + pnl;
            
            if (this.account.equity > this.account.highWaterMark) {
                this.account.highWaterMark = this.account.equity;
            }
        } else {
            this.account.equity = this.account.balance;
            this.account.marginUsed = 0;
        }
    }

    private processOrders() {
        // Simple fill engine
        const pending = this.orders.filter(o => o.status === 'PENDING');
        pending.forEach(order => {
            // Slippage logic
            const slippage = this.currentTick.price * this.slippageRate * (Math.random() - 0.5);
            const fillPrice = this.currentTick.price + slippage;
            
            // Execute
            if (this.positions) {
                if (this.positions.side === order.side) {
                    // Add to position
                    const newQty = this.positions.quantity + order.quantity;
                    const totalCost = (this.positions.avgEntryPrice * this.positions.quantity) + (fillPrice * order.quantity);
                    this.positions.avgEntryPrice = totalCost / newQty;
                    this.positions.quantity = newQty;
                } else {
                    // Close/Flip
                    if (this.positions.quantity > order.quantity) {
                        // Partial Close
                        const pnl = (fillPrice - this.positions.avgEntryPrice) * order.quantity * (this.positions.side === 'LONG' ? 1 : -1);
                        this.account.balance += pnl;
                        this.positions.quantity -= order.quantity;
                    } else if (this.positions.quantity === order.quantity) {
                        // Full Close
                        const pnl = (fillPrice - this.positions.avgEntryPrice) * this.positions.quantity * (this.positions.side === 'LONG' ? 1 : -1);
                        this.account.balance += pnl;
                        this.positions = null;
                    } else {
                        // Flip
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
                // New Position
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
            
            // Commission
            const comm = fillPrice * order.quantity * this.commissionRate;
            this.account.balance -= comm;
            
            order.status = 'FILLED';
            this.tradeHistory.push({ ...order, fillPrice, time: this.currentTick.time });
        });
        
        // Remove filled orders
        this.orders = this.orders.filter(o => o.status === 'PENDING');
    }

    private processRobotLogic() {
        if (!this.activeStrategy) return;
        
        // Simple Mean Reversion logic based on weights if available
        if (this.recentPrices.length > 10) {
            const current = this.currentTick.price;
            const sma = this.recentPrices.reduce((a,b)=>a+b,0) / this.recentPrices.length;
            
            if (!this.positions) {
                if (current < sma * 0.98) {
                    this.placeOrder('LONG', 'MARKET', 5);
                } else if (current > sma * 1.02) {
                    this.placeOrder('SHORT', 'MARKET', 5);
                }
            } else {
                // Take Profit
                if (this.positions.unrealizedPnL > this.account.equity * 0.02) {
                    this.placeOrder(this.positions.side === 'LONG' ? 'SHORT' : 'LONG', 'MARKET', this.positions.quantity);
                }
            }
        }
    }

    private checkRiskAndCompliance(): boolean {
        if (this.account.marginUsed > 0 && this.account.marginUsed >= this.account.equity) {
            this.forceLiquidate();
            return true;
        }
        if (this.isRobotActive) {
            const currentDrawdown = (this.sessionStartEquity - this.account.equity) / this.sessionStartEquity;
            if (currentDrawdown > 0.05) {
                this.triggerAnomalyPause("Excessive Drawdown (>5%) detected in automated session.");
                return true;
            }
        }
        if (this.positions && this.positions.stopLossPrice && this.activeStrategy) {
            if (this.positions.side === 'LONG' && this.currentTick.price <= this.positions.stopLossPrice) {
                this.placeOrder('SHORT', 'MARKET', this.positions.quantity); 
                return false; 
            } else if (this.positions.side === 'SHORT' && this.currentTick.price >= this.positions.stopLossPrice) {
                this.placeOrder('LONG', 'MARKET', this.positions.quantity);
                return false;
            }
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

    private triggerAnomalyPause(reason: string) {
        this.stop();
        this.isRobotActive = false;
        this.latestAlert = {
            type: 'ROBOT_ANOMALY',
            title: 'ROBOT OVERWATCH TRIGGERED',
            message: `Automated trading suspended. Reason: ${reason}.`,
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
            historyCount: this.historicalBuffer.length,
            alert: this.latestAlert,
            activeStrategyName: this.activeStrategy?.name
        };
    }
}

export const GLOBAL_EXCHANGE = new VirtualExchange();
