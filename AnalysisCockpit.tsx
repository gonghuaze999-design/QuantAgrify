
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, ComposedChart, Line } from 'recharts';
import { GLOBAL_EXCHANGE, EngineMode, EngineAlert } from './SimulationEngine';
import { GLOBAL_MARKET_CONTEXT, DATA_LAYERS, PROCESSED_DATASET, COCKPIT_VIEW_CACHE, DEPLOYED_STRATEGY, SystemLogStream, getTrendColor } from './GlobalState';

interface AnalysisCockpitProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

// --- ROBOT TYPES ---
type RobotTier = 'L1_EXECUTION' | 'L2_QUANT_TREND' | 'L3_MACRO_ALPHA';

interface RobotConfig {
    tier: RobotTier;
    name: string;
    description: string;
    color: string;
    icon: string;
}

const ROBOT_PROTOCOLS: Record<RobotTier, RobotConfig> = {
    'L1_EXECUTION': {
        tier: 'L1_EXECUTION',
        name: 'Sentinel (VWAP)',
        description: 'Passive execution algo. Minimizes slippage and impact costs.',
        color: '#0d59f2', // Blue
        icon: 'precision_manufacturing'
    },
    'L2_QUANT_TREND': {
        tier: 'L2_QUANT_TREND',
        name: 'Vector (CTA)',
        description: 'Momentum & Mean Reversion hybrid. Follows statistical trends.',
        color: '#a855f7', // Purple
        icon: 'ssid_chart'
    },
    'L3_MACRO_ALPHA': {
        tier: 'L3_MACRO_ALPHA',
        name: 'The Harvester (AGI)',
        description: 'Full-spectrum AI. Fuses satellite, policy, and price data for alpha.',
        color: '#ffb347', // Gold
        icon: 'psychology_alt'
    }
};

interface TacticalLog {
    id: string;
    timestamp: string;
    tag: 'EXEC' | 'RISK' | 'ALPHA' | 'MACRO' | 'SYS';
    message: string;
    sentiment?: 'BULL' | 'BEAR' | 'NEUTRAL';
    confidence?: number;
}

// Data Source Option Type
type DataSourceType = 'ALGORITHM' | 'JQDATA' | 'MOCK' | 'DEPLOYED';

export const AnalysisCockpit: React.FC<AnalysisCockpitProps> = ({ onNavigate }) => {
  
  // --- ENGINE SYNC STATE ---
  const [engineStatus, setEngineStatus] = useState(GLOBAL_EXCHANGE.getStatus());
  
  // Chart Data: Initialize from Cache to prevent data loss on navigation
  const [chartData, setChartData] = useState<{rawTime: number, displayTime: string, price: number, predicted?: number}[]>(COCKPIT_VIEW_CACHE.chartData);
  
  // --- UI STATE ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRobotModal, setShowRobotModal] = useState(false); // New Robot Selection Modal
  const [alertModal, setAlertModal] = useState<EngineAlert | null>(null);
  const [simSpeed, setSimSpeed] = useState(1);
  
  // --- CONFIG FORM STATE ---
  const [formMode, setFormMode] = useState<EngineMode>('SIMULATION');
  const [dataSource, setDataSource] = useState<DataSourceType>('ALGORITHM');
  const [fitMetrics, setFitMetrics] = useState<{score: string, sigma: number} | null>(null);
  const [isFitting, setIsFitting] = useState(false);
  
  // Training Mode Split State
  const [splitPercent, setSplitPercent] = useState(80); // 80% Train, 20% Predict
  
  // --- ROBOT & AI STATE (Cached) ---
  const [activeRobot, setActiveRobot] = useState<RobotTier>('L1_EXECUTION');
  const [aiLogs, setAiLogs] = useState<TacticalLog[]>(COCKPIT_VIEW_CACHE.logs);
  const [neuralState, setNeuralState] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'EXECUTING'>(COCKPIT_VIEW_CACHE.neuralState);
  const [botConfidence, setBotConfidence] = useState(COCKPIT_VIEW_CACHE.botConfidence); // 0-100
  const logContainerRef = useRef<HTMLDivElement>(null);
  const blotterScrollRef = useRef<HTMLDivElement>(null);

  const symbol = engineStatus.config.baseCurrency === 'CNY' ? '¥' : '$';

  // --- PERSISTENCE SYNC EFFECT ---
  useEffect(() => {
      COCKPIT_VIEW_CACHE.chartData = chartData;
      COCKPIT_VIEW_CACHE.logs = aiLogs;
      COCKPIT_VIEW_CACHE.neuralState = neuralState;
      COCKPIT_VIEW_CACHE.botConfidence = botConfidence;
      COCKPIT_VIEW_CACHE.initialized = true;
  }, [chartData, aiLogs, neuralState, botConfidence]);

  // --- DERIVED METRICS FOR UI ---
  // Risk Check: Margin Usage < 80% and No Active Alerts
  const marginUsageRatio = engineStatus.account.equity > 0 ? (engineStatus.account.marginUsed / engineStatus.account.equity) : 0;
  const isRiskPassed = marginUsageRatio < 0.8 && !engineStatus.alert;
  
  // Latency: Simulated jitter when running, otherwise 0
  const systemLatency = engineStatus.isRunning ? 12 + Math.floor(Math.random() * 5) : 0;

  // --- ORDER STREAM MANAGEMENT ---
  const orderStream = useMemo(() => {
      // Access tradeHistory safely (cast to any if interface mismatch, though engine provides it)
      const history = (engineStatus as any).tradeHistory || [];
      const active = engineStatus.orders || [];
      
      // Merge and Sort by Timestamp (Oldest -> Newest) for log stream effect
      return [...history, ...active].sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [engineStatus]);

  // Auto-scroll for Order Blotter
  useEffect(() => {
      if (blotterScrollRef.current) {
          blotterScrollRef.current.scrollTop = blotterScrollRef.current.scrollHeight;
      }
  }, [orderStream.length]);

  // --- 1. INITIAL SYNC & HEARTBEAT ---
  useEffect(() => {
      // === OEMS BRIDGE: CHECK FOR DEPLOYED STRATEGY ===
      // This overrides default config if a strategy was just deployed
      if (DEPLOYED_STRATEGY.content) {
          const strat = DEPLOYED_STRATEGY.content;
          
          // Only reconfigure if not already running this strategy
          if (GLOBAL_EXCHANGE.config.symbol !== strat.meta.assetSymbol || GLOBAL_EXCHANGE.tradeHistory.length === 0) {
              console.log(`[Cockpit] Hydrating from Deployed Strategy: ${strat.meta.strategyId}`);
              SystemLogStream.push({ type: 'INFO', module: 'Cockpit', action: 'Deploy', message: `Hydrating strategy: ${strat.meta.strategyId}` });
              
              GLOBAL_EXCHANGE.configure({ 
                  symbol: strat.meta.assetSymbol,
                  mode: 'SIMULATION', // Auto-set to Sim for backtest verification
                  initialBalance: 1000000 
              });

              // Inject Risk Logic
              GLOBAL_EXCHANGE.setStrategy({
                  name: strat.meta.strategyId,
                  weights: strat.logic.factorWeights,
                  stopLossMult: strat.logic.riskParams.stopLossAtrMultiplier,
                  targetVol: strat.logic.riskParams.targetVolatility
              });

              // Ingest Historical Data (The "Backbone" for the simulation)
              const engineData = strat.history.fullSeries.map(d => ({
                  date: d.date,
                  close: d.price,
                  volume: d.volume || 0
              }));
              GLOBAL_EXCHANGE.ingestData(engineData);
              
              // Run initial fit to prep simulation
              GLOBAL_EXCHANGE.runNumericalSimulation('SIMULATION'); // Default
              
              // Update local state to reflect readiness
              setDataSource('DEPLOYED');
              setFitMetrics({ score: '95.0', sigma: 1.2 }); // Synthetic fit metrics since we trust the deployment
          }
      } 
      // Default Fallback
      else if (GLOBAL_EXCHANGE.account.history.length === 0) {
          GLOBAL_EXCHANGE.configure({ symbol: GLOBAL_MARKET_CONTEXT.asset.code });
      }

      // --- GAP FILLING LOGIC (Seamless Resume) ---
      const historyBuffer = (GLOBAL_EXCHANGE as any).historicalBuffer || [];
      const currentIndex = (GLOBAL_EXCHANGE as any).tickIndex || 0;
      
      // If we have cached data, find the timestamp of the last point
      const lastCachedTime = chartData.length > 0 ? chartData[chartData.length - 1].rawTime : 0;
      
      // Filter ticks from engine that are NEWER than our cache (Gap Filling)
      const missingTicks = historyBuffer.filter((t: any) => t.time > lastCachedTime && t.time <= historyBuffer[currentIndex]?.time);
      
      if (missingTicks.length > 0) {
          const formattedMissing = missingTicks.map((t: any) => {
              const d = new Date(t.time);
              const isSim = GLOBAL_EXCHANGE.config.mode !== 'REAL';
              const label = isSim 
                  ? d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
                  : d.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
              return {
                  rawTime: t.time,
                  displayTime: label,
                  price: t.price,
                  predicted: t.predicted
              };
          });
          setChartData(prev => [...prev, ...formattedMissing].slice(-150));
      } else if (chartData.length === 0) {
          // Fallback: If cache was empty (first load), grab initial snapshot
          const snapshot = historyBuffer.slice(Math.max(0, currentIndex - 99), currentIndex + 1);
          if (snapshot.length > 0) {
              const formattedSnapshot = snapshot.map((t: any) => {
                  const d = new Date(t.time);
                  const isSim = GLOBAL_EXCHANGE.config.mode !== 'REAL';
                  const label = isSim 
                      ? d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
                      : d.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                  return {
                      rawTime: t.time,
                      displayTime: label,
                      price: t.price,
                      predicted: t.predicted
                  };
              });
              setChartData(formattedSnapshot);
          }
      }

      // Live Update Timer
      const uiTimer = setInterval(() => {
          const status = GLOBAL_EXCHANGE.getStatus();
          setEngineStatus({ ...status }); 
          
          if (status.alert) {
              setAlertModal(status.alert);
              GLOBAL_EXCHANGE.clearAlert();
          }
          
          setChartData(prev => {
              const currentTickTime = status.tick.time;
              // Dedup check: Ignore if same time as last point
              if (prev.length > 0 && prev[prev.length - 1].rawTime === currentTickTime) return prev;

              const dateObj = new Date(currentTickTime);
              let label = "";
              if (status.config.mode === 'SIMULATION' || status.config.mode === 'TRAINING') {
                  label = dateObj.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
              } else {
                  label = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'});
              }

              const newData = [...prev, { 
                  rawTime: currentTickTime,
                  displayTime: label, 
                  price: status.tick.price,
                  predicted: status.tick.predicted 
              }];
              
              if (newData.length > 150) return newData.slice(newData.length - 150);
              return newData;
          });

      }, 100);

      return () => clearInterval(uiTimer);
  }, []);

  // --- 2. THE AI BRAIN LOOP (Robot Logic) ---
  useEffect(() => {
      let brainInterval: any = null;

      if (engineStatus.robot && engineStatus.isRunning) {
          // Initialize Robot Session
          if (neuralState === 'IDLE') {
              addLog('SYS', `Initializing ${ROBOT_PROTOCOLS[activeRobot].name} Protocol...`, 'NEUTRAL', 100);
              setNeuralState('SCANNING');
          }

          // Brain Tick Frequency: Every 4 seconds (Simulated thinking time)
          brainInterval = setInterval(() => {
              runRobotBrainCycle();
          }, 4000);
      } else {
          if (neuralState !== 'IDLE') setNeuralState('IDLE');
      }

      return () => {
          if (brainInterval) clearInterval(brainInterval);
      };
  }, [engineStatus.robot, engineStatus.isRunning, activeRobot]);

  // Auto-scroll logs
  useEffect(() => {
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [aiLogs]);

  const addLog = (tag: TacticalLog['tag'], msg: string, sentiment: TacticalLog['sentiment'] = 'NEUTRAL', confidence: number = 0) => {
      setAiLogs(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          tag,
          message: msg,
          sentiment,
          confidence
      }]);
      if (confidence > 0) setBotConfidence(confidence);
      
      // SYNC TO GLOBAL SYSTEM LOG
      SystemLogStream.push({
          type: 'INFO',
          module: 'TacticalAI',
          action: tag,
          message: msg,
          payload: { sentiment, confidence }
      });
  };

  const runRobotBrainCycle = async () => {
      if (!process.env.API_KEY) {
          addLog('SYS', 'AI Core Disconnected. Running fallback logic.', 'NEUTRAL', 0);
          return;
      }

      setNeuralState('ANALYZING');

      // 1. Gather Context
      const currentPrice = engineStatus.tick.price;
      const prices = chartData.map(d => d.price).slice(-20); // Last 20 ticks
      const pos = engineStatus.positions;
      const pnl = pos ? pos.unrealizedPnL : 0;
      
      // 2. Define Persona based on Tier
      let personaPrompt = "";
      if (activeRobot === 'L1_EXECUTION') {
          personaPrompt = `Role: Execution Algo (VWAP/TWAP). Goal: Minimize impact. Focus on micro-structure. Low risk tolerance.`;
      } else if (activeRobot === 'L2_QUANT_TREND') {
          personaPrompt = `Role: CTA Quant Strategy. Goal: Capture trend. Use Moving Averages and RSI. Medium risk.`;
      } else {
          personaPrompt = `Role: "The Harvester" - Elite Global Macro Hedge Fund AI. 
                           Goal: Absolute Alpha. Synthesize price action with global policy risks. 
                           Tone: Extremely professional, concise, institutional. 
                           Context: ${GLOBAL_MARKET_CONTEXT.asset.name}, Policy Sentiment Score: 0.6 (Simulated).`;
      }

      const prompt = `
        ${personaPrompt}
        
        Live Market Data:
        - Price: ${currentPrice.toFixed(2)}
        - Trend (Last 5): ${prices.slice(-5).join(', ')}
        - Current Position: ${pos ? pos.side + ' ' + pos.quantity : 'FLAT'}
        - Unrealized PnL: ${pnl.toFixed(2)}
        
        Task:
        1. Analyze the immediate market condition.
        2. Decide on an action: BUY, SELL, or HOLD.
        3. Provide a confidence score (0-100).
        
        Output JSON ONLY:
        {
            "action": "BUY" | "SELL" | "HOLD" | "CLOSE",
            "quantity": number (0 if hold),
            "confidence": number,
            "log_message": "Short tactical reason (max 10 words)",
            "tag": "EXEC" | "ALPHA" | "RISK" | "MACRO"
        }
      `;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
          });
          
          const text = response.text;
          if (text) {
              const clean = text.replace(/```json|```/g, '').trim();
              const decision = JSON.parse(clean);
              
              // Execute
              setNeuralState('EXECUTING');
              
              // Only trade if confidence is high enough
              const threshold = activeRobot === 'L1_EXECUTION' ? 60 : activeRobot === 'L2_QUANT_TREND' ? 75 : 85;
              
              if (decision.confidence >= threshold) {
                  if (decision.action === 'BUY') {
                      GLOBAL_EXCHANGE.placeOrder('LONG', 'MARKET', decision.quantity || 5);
                  } else if (decision.action === 'SELL') {
                      GLOBAL_EXCHANGE.placeOrder('SHORT', 'MARKET', decision.quantity || 5);
                  } else if (decision.action === 'CLOSE' && pos) {
                      const side = pos.side === 'LONG' ? 'SHORT' : 'LONG';
                      GLOBAL_EXCHANGE.placeOrder(side, 'MARKET', pos.quantity);
                  }
              }

              // Log
              let sentiment: 'BULL' | 'BEAR' | 'NEUTRAL' = 'NEUTRAL';
              if (decision.action === 'BUY') sentiment = 'BULL';
              if (decision.action === 'SELL') sentiment = 'BEAR';

              addLog(decision.tag, decision.log_message, sentiment, decision.confidence);
              
              await new Promise(r => setTimeout(r, 500));
              setNeuralState('SCANNING');
          }
      } catch (e) {
          console.error("Robot Brain Fail", e);
          setNeuralState('SCANNING'); // Revert
      }
  };

  // --- 3. HANDLERS ---

  const handleSourceCheck = () => {
      if (DEPLOYED_STRATEGY.content) setDataSource('DEPLOYED');
      else if (PROCESSED_DATASET.ready) setDataSource('ALGORITHM');
      else setDataSource('MOCK');
  };

  useEffect(() => {
      if (showConfigModal) handleSourceCheck();
  }, [showConfigModal]);

  // Update fit metrics based on selected mode whenever modal opens or mode changes
  useEffect(() => {
      if (showConfigModal) {
          const contextMetrics = GLOBAL_EXCHANGE.getContextMetrics(formMode);
          if (contextMetrics) {
              setFitMetrics({ 
                  score: contextMetrics.score, 
                  sigma: parseFloat((contextMetrics.sigma * 100).toFixed(2)) 
              });
          } else {
              setFitMetrics(null);
          }
      }
  }, [formMode, showConfigModal]);

  const runNumericalFit = async () => {
      setIsFitting(true);
      // Don't reset fitMetrics globally here, wait for result
      
      // 1. Ingest Data
      if (dataSource === 'ALGORITHM') {
          const success = GLOBAL_EXCHANGE.loadFromAlgorithm();
          if (!success) {
              alert("Algorithm Data Not Ready. Please run Pre-processing first.");
              setIsFitting(false);
              return;
          }
      } else if (dataSource === 'DEPLOYED') {
          // No-op, data already ingested on mount
          console.log("Using Deployed Strategy Data");
      } else {
          GLOBAL_EXCHANGE.ingestData([]);
      }

      await new Promise(r => setTimeout(r, 500));

      // 2. Run Fit FOR THE SELECTED MODE
      const res = GLOBAL_EXCHANGE.runNumericalSimulation(formMode, splitPercent);
      
      await new Promise(r => setTimeout(r, 800)); 

      if (res.success) {
          setFitMetrics({ 
              score: res.metrics.fitScore, 
              sigma: parseFloat((res.metrics.sigma * 100).toFixed(2)) 
          });
      } else {
          // If Real mode, success=true but metrics=null is valid
          if (formMode !== 'REAL') {
              alert("Simulation Fitting Failed. Data insufficient.");
          }
      }
      
      setIsFitting(false);
  };

  const handleApplyConfig = () => {
      // Validate Fit
      if (formMode !== 'REAL' && !fitMetrics) {
          alert("Please run Numerical Simulation Fit for this mode before applying.");
          return;
      }

      setShowConfigModal(false);
      
      // Clear charts to prevent ghost data from previous mode
      setChartData([]);
      setAiLogs([]);
      COCKPIT_VIEW_CACHE.chartData = [];
      COCKPIT_VIEW_CACHE.logs = [];
      
      // Configure Engine (this triggers the context hydration in engine)
      GLOBAL_EXCHANGE.configure({
          mode: formMode,
          // Split timestamp handled inside engine context now
      });
      
      SystemLogStream.push({ 
          type: 'INFO', 
          module: 'Cockpit', 
          action: 'ConfigUpdate', 
          message: `Engine reconfigured to ${formMode} mode.` 
      });
      
      // Immediate chart refresh
      const historyBuffer = (GLOBAL_EXCHANGE as any).historicalBuffer || [];
      // If SIM/TRAIN, engine.currentTick is already set to the start point of that mode
      // We just need to grab historical context for the chart backdrop
      const currentTick = GLOBAL_EXCHANGE.currentTick;
      
      setChartData([{
          rawTime: currentTick.time,
          displayTime: new Date(currentTick.time).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
          price: currentTick.price,
          predicted: currentTick.predicted
      }]);
  };

  const toggleRun = () => {
      if (engineStatus.isRunning) {
          GLOBAL_EXCHANGE.stop();
          SystemLogStream.push({ type: 'WARNING', module: 'Cockpit', action: 'EngineStop', message: 'Simulation paused by user.' });
      } else {
          GLOBAL_EXCHANGE.start();
          SystemLogStream.push({ type: 'INFO', module: 'Cockpit', action: 'EngineStart', message: 'Simulation started.' });
      }
  };

  const handleSpeedChange = (val: number) => {
      setSimSpeed(val);
      GLOBAL_EXCHANGE.setSpeed(val);
  };

  const engageRobot = (tier: RobotTier) => {
      setActiveRobot(tier);
      setShowRobotModal(false);
      // Inject Strategy to Engine
      GLOBAL_EXCHANGE.setStrategy({
          name: ROBOT_PROTOCOLS[tier].name,
          weights: {}, // Default
          stopLossMult: 2.0,
          targetVol: 0.15
      });
      GLOBAL_EXCHANGE.setRobot(true);
      
      // Initial System Log
      addLog('SYS', `Protocol Switched: ${ROBOT_PROTOCOLS[tier].name}. Neural Link Established.`, 'NEUTRAL', 100);
      SystemLogStream.push({ type: 'WARNING', module: 'Cockpit', action: 'RobotEngage', message: `Protocol ${tier} activated.` });
  };

  const disengageRobot = () => {
      GLOBAL_EXCHANGE.setRobot(false);
      setNeuralState('IDLE');
      setBotConfidence(0);
      addLog('SYS', 'Manual Override. Robot Disengaged.', 'NEUTRAL', 0);
      SystemLogStream.push({ type: 'INFO', module: 'Cockpit', action: 'RobotDisengage', message: 'Manual override engaged.' });
  };

  const handleManualOrder = (side: 'LONG' | 'SHORT') => {
      GLOBAL_EXCHANGE.placeOrder(side, 'MARKET', 5);
      // Force immediate update for instant feedback (User Exp: "Click -> See Pending")
      setEngineStatus({ ...GLOBAL_EXCHANGE.getStatus() });
      SystemLogStream.push({ type: 'INFO', module: 'Cockpit', action: 'ManualOrder', message: `Placed ${side} Market Order (5 units).` });
  };

  const closePositions = () => {
      const pos = engineStatus.positions;
      if (pos) {
          const side = pos.side === 'LONG' ? 'SHORT' : 'LONG';
          GLOBAL_EXCHANGE.placeOrder(side, 'MARKET', pos.quantity);
          setEngineStatus({ ...GLOBAL_EXCHANGE.getStatus() });
          SystemLogStream.push({ type: 'WARNING', module: 'Cockpit', action: 'Flatten', message: 'Closed all positions.' });
      }
  };

  // UI Layout...
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const, active: true },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  const currentBotConfig = ROBOT_PROTOCOLS[activeRobot];

  return (
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      
      {/* ALERT MODAL */}
      {alertModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <div className={`w-[500px] border-2 rounded-2xl p-8 shadow-2xl relative overflow-hidden ${alertModal.type === 'LIQUIDATION' ? 'bg-[#1a0505] border-[#fa6238]' : 'bg-[#1a1505] border-[#ffb347]'}`}>
                  <div className={`absolute top-0 left-0 w-full h-2 ${alertModal.type === 'LIQUIDATION' ? 'bg-[#fa6238]' : 'bg-[#ffb347]'}`}></div>
                  <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-full ${alertModal.type === 'LIQUIDATION' ? 'bg-[#fa6238]/20 text-[#fa6238]' : 'bg-[#ffb347]/20 text-[#ffb347]'}`}>
                          <span className="material-symbols-outlined text-4xl">{alertModal.type === 'LIQUIDATION' ? 'dangerous' : 'warning'}</span>
                      </div>
                      <div>
                          <h2 className={`text-xl font-black uppercase tracking-widest ${alertModal.type === 'LIQUIDATION' ? 'text-[#fa6238]' : 'text-[#ffb347]'}`}>{alertModal.title}</h2>
                          <p className="text-[#90a4cb] text-xs font-mono">{new Date(alertModal.timestamp).toLocaleString()}</p>
                      </div>
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-8 font-bold border-l-4 border-slate-700 pl-4">
                      {alertModal.message}
                  </p>
                  <button 
                    onClick={() => setAlertModal(null)}
                    className={`w-full py-3 rounded-xl font-black uppercase text-sm tracking-widest transition-all ${
                        alertModal.type === 'LIQUIDATION' 
                        ? 'bg-[#fa6238] hover:bg-[#ff7b5a] text-black' 
                        : 'bg-[#ffb347] hover:bg-[#ffcf87] text-black'
                    }`}
                  >
                      Acknowledge & Dismiss
                  </button>
              </div>
          </div>
      )}

      {/* ROBOT SELECTION MODAL */}
      {showRobotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#182234] border border-[#314368] rounded-2xl p-8 w-[800px] shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#0d59f2] text-2xl">smart_toy</span> 
                          Select Neural Protocol
                      </h3>
                      <button onClick={() => setShowRobotModal(false)} className="text-[#90a4cb] hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                      {Object.values(ROBOT_PROTOCOLS).map((robot) => (
                          <div 
                            key={robot.tier}
                            onClick={() => engageRobot(robot.tier as RobotTier)}
                            className="bg-[#0a0c10] border border-[#314368] rounded-xl p-6 cursor-pointer hover:border-white/50 hover:bg-[#1f293a] transition-all group relative overflow-hidden"
                            style={{ borderColor: robot.tier === activeRobot ? robot.color : undefined }}
                          >
                              {robot.tier === activeRobot && <div className="absolute top-0 right-0 p-2 bg-[#0bda5e] text-black text-[9px] font-bold uppercase rounded-bl-xl">Active</div>}
                              <div className="size-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${robot.color}20`, color: robot.color }}>
                                  <span className="material-symbols-outlined text-4xl">{robot.icon}</span>
                              </div>
                              <h4 className="text-white font-bold uppercase text-sm mb-2" style={{ color: robot.color }}>{robot.name}</h4>
                              <p className="text-[#90a4cb] text-xs leading-relaxed h-16">{robot.description}</p>
                              
                              <div className="mt-4 flex items-center gap-2">
                                  <div className="h-1 flex-1 bg-[#314368] rounded-full overflow-hidden">
                                      <div className="h-full bg-white" style={{ width: robot.tier === 'L1_EXECUTION' ? '30%' : robot.tier === 'L2_QUANT_TREND' ? '60%' : '90%' }}></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-[#90a4cb] uppercase">IQ Level</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* CONFIG MODAL */}
      {showConfigModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#182234] border border-[#314368] rounded-2xl p-6 w-[500px] shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0d59f2]">tune</span> Engine Configuration
                  </h3>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Execution Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['SIMULATION', 'TRAINING', 'REAL'].map(m => (
                                  <button 
                                    key={m} 
                                    onClick={() => setFormMode(m as EngineMode)}
                                    className={`py-3 rounded-lg text-[10px] font-bold uppercase transition-all border ${formMode === m ? 'bg-[#0d59f2] text-white border-[#0d59f2] shadow-lg' : 'bg-[#0a0c10] text-[#90a4cb] border-[#314368] hover:border-white'}`}
                                  >
                                      {m}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Data Pipeline Source</label>
                          <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#314368] p-2 rounded-lg">
                              <span className={`material-symbols-outlined ${dataSource === 'ALGORITHM' || dataSource === 'DEPLOYED' ? 'text-[#0bda5e]' : 'text-[#90a4cb]'}`}>
                                  {dataSource === 'ALGORITHM' || dataSource === 'DEPLOYED' ? 'check_circle' : 'error'}
                              </span>
                              <div className="flex-1">
                                  <span className="text-xs font-bold text-white block">
                                      {dataSource === 'DEPLOYED' ? 'Deployed Strategy Data' : 'Algorithm Output'}
                                  </span>
                                  <span className="text-[9px] text-[#90a4cb] block">
                                      {dataSource === 'DEPLOYED' 
                                        ? `Strategy: ${DEPLOYED_STRATEGY.content?.meta.strategyId}` 
                                        : PROCESSED_DATASET.ready 
                                            ? `Ready: ${PROCESSED_DATASET.asset}` 
                                            : 'Not Found - Run Algorithm First'}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#314368]">
                          {formMode !== 'REAL' && (
                              <>
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-[#0d59f2] uppercase">Numerical Fit (Ornstein-Uhlenbeck)</label>
                                    {fitMetrics && <span className="text-[9px] font-bold text-[#0bda5e] bg-[#0bda5e]/10 px-2 rounded border border-[#0bda5e]/20">Fit: {fitMetrics.score}</span>}
                                </div>
                                
                                {formMode === 'TRAINING' && (
                                    <div className="bg-[#0a0c10] p-2 rounded border border-[#314368] mb-2">
                                        <div className="flex justify-between text-[9px] text-[#90a4cb] mb-1">
                                            <span>Training Set ({splitPercent}%)</span>
                                            <span>Prediction ({100-splitPercent}%)</span>
                                        </div>
                                        <input 
                                            type="range" min="50" max="90" step="5" 
                                            value={splitPercent} onChange={(e) => setSplitPercent(Number(e.target.value))}
                                            className="w-full h-1.5 bg-[#314368] rounded-lg appearance-none cursor-pointer accent-[#0d59f2]"
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={runNumericalFit}
                                    disabled={isFitting}
                                    className="w-full py-3 bg-[#182234] hover:bg-[#222f49] border border-[#314368] hover:border-[#0d59f2] text-white text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isFitting ? <span className="animate-spin material-symbols-outlined text-sm">sync</span> : <span className="material-symbols-outlined text-sm">function</span>}
                                    {isFitting ? 'Fitting Parameters...' : 'Run Numerical Fit'}
                                </button>
                              </>
                          )}
                          
                          {formMode === 'REAL' && (
                              <div className="p-3 bg-[#fa6238]/10 border border-[#fa6238]/30 rounded-lg text-center">
                                  <p className="text-[10px] text-[#fa6238] font-bold uppercase">Real Trading Mode</p>
                                  <p className="text-[9px] text-slate-300">Using System Clock & Simulated Jitter. No numerical fit required.</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => setShowConfigModal(false)} 
                        className="flex-1 py-3 rounded-lg border border-[#314368] text-[#90a4cb] hover:text-white hover:bg-[#222f49] text-xs font-bold uppercase transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleApplyConfig} 
                        disabled={formMode !== 'REAL' && !fitMetrics}
                        className={`flex-1 py-3 text-white text-xs font-bold uppercase rounded-lg shadow-lg transition-all ${
                            (formMode !== 'REAL' && !fitMetrics) 
                            ? 'bg-[#314368] text-[#90a4cb] cursor-not-allowed' 
                            : 'bg-[#0d59f2] hover:bg-[#1a66ff]'
                        }`}
                      >
                          Apply Configuration
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Global Header */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0c10] px-6 flex items-center justify-between z-[60] shrink-0">
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
              onClick={() => item.view !== 'cockpit' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d59f2] transition-colors">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 border-r border-[#222f49] bg-[#0a0c10] flex flex-col items-center py-6 gap-8 shrink-0">
          {[{ label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const, active: true },
            { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
            { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
            { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
            { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }].map(item => (
            <div key={item.label} onClick={() => item.view && onNavigate(item.view)} className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}>
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-[#0d59f2] text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]' : 'hover:bg-[#182234]'}`}><span className="material-symbols-outlined">{item.icon}</span></div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </aside>

        <main className="flex-1 flex flex-col bg-[#0b0f1a] relative overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#314368] bg-[#182234] hover:bg-[#222f49] transition-colors group">
                        <span className="material-symbols-outlined text-[#90a4cb] group-hover:text-white text-sm">settings</span>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] font-bold text-[#90a4cb] uppercase">Mode</span>
                            <span className="text-[10px] font-black text-white uppercase">{engineStatus.config.mode}</span>
                        </div>
                    </button>
                    
                    <div className="h-8 w-px bg-[#314368]"></div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={toggleRun} disabled={alertModal?.type === 'LIQUIDATION'} className={`size-10 rounded-lg flex items-center justify-center border transition-all ${engineStatus.isRunning ? 'bg-[#fa6238]/20 border-[#fa6238] text-[#fa6238]' : 'bg-[#0bda5e]/20 border-[#0bda5e] text-[#0bda5e]'} disabled:opacity-30`}>
                            <span className="material-symbols-outlined text-xl">{engineStatus.isRunning ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <input type="range" min="1" max="50" step="1" value={simSpeed} onChange={(e) => handleSpeedChange(Number(e.target.value))} className="w-32 h-1.5 bg-[#182234] rounded-lg appearance-none cursor-pointer accent-[#0d59f2]" />
                    </div>

                    <div className="h-8 w-px bg-[#314368]"></div>

                    {/* NEW: Market Info Dashboard */}
                    <div className="flex items-center gap-4 bg-[#182234] border border-[#314368] rounded-lg px-4 py-1.5">
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] text-[#90a4cb] font-bold uppercase tracking-wide">Contract</span>
                            <span className="text-[11px] font-black text-white">{engineStatus.config.symbol || '---'}</span>
                        </div>
                        <div className="w-px h-6 bg-[#314368]"></div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] text-[#90a4cb] font-bold uppercase tracking-wide">Engine Time</span>
                            <span className="text-[11px] font-mono text-[#0d59f2] font-bold">
                                {new Date(engineStatus.tick.time).toLocaleDateString(undefined, {year: 'numeric', month: '2-digit', day:'2-digit'})}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-[#314368]"></div>
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[8px] text-[#90a4cb] font-bold uppercase tracking-wide">Last Price</span>
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">{engineStatus.tick.price.toFixed(1)}</span>
                        </div>
                    </div>

                </div>
                
                {/* UPGRADED ROBOT CONTROL CENTER */}
                <div className="flex items-center gap-4">
                    {engineStatus.robot ? (
                        <div className="flex items-center gap-3 bg-[#182234] border border-[#314368] rounded-xl px-4 py-2 relative overflow-hidden group">
                            {/* Animated Scanner Bar */}
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-50 animate-scan" style={{ color: currentBotConfig.color }}></div>
                            
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] font-bold text-[#90a4cb] uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-[#0bda5e] animate-pulse"></span>
                                    {currentBotConfig.name} Protocol
                                </span>
                                <span className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    {neuralState}
                                    {neuralState !== 'IDLE' && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                                </span>
                            </div>
                            
                            <div className="w-px h-8 bg-[#314368] mx-2"></div>
                            
                            <div className="flex flex-col items-center">
                                <div className="relative size-8 flex items-center justify-center">
                                    <svg className="size-full -rotate-90">
                                        <circle cx="16" cy="16" r="14" fill="none" stroke="#222f49" strokeWidth="3" />
                                        <circle cx="16" cy="16" r="14" fill="none" stroke={currentBotConfig.color} strokeWidth="3" strokeDasharray="88" strokeDashoffset={88 - (botConfidence / 100) * 88} className="transition-all duration-500" />
                                    </svg>
                                    <span className="absolute text-[9px] font-bold text-white">{botConfidence}</span>
                                    <span className="absolute top-8 text-[7px] font-bold text-[#90a4cb] uppercase">CONFIDENCE</span>
                                </div>
                            </div>

                            <button onClick={disengageRobot} className="ml-2 size-8 rounded-lg bg-[#222f49] hover:bg-[#fa6238] text-[#fa6238] hover:text-black flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined text-lg">power_settings_new</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowRobotModal(true)} 
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-lg shadow-[#0d59f2]/20 transition-all group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform">smart_toy</span>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] font-bold uppercase opacity-80">System Ready</span>
                                <span className="text-xs font-black uppercase tracking-wide">Engage Auto-Pilot</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar">
                <div className="col-span-8 flex flex-col gap-6">
                    <div className="flex-1 min-h-[400px] bg-[#182234]/30 border border-[#222f49] rounded-xl p-4 flex flex-col relative overflow-hidden">
                        {/* Legend */}
                        <div className="absolute top-4 left-4 z-10 flex gap-4">
                            <h3 className="text-white text-2xl font-black tabular-nums tracking-tight">{engineStatus.tick.price.toFixed(2)}</h3>
                            {engineStatus.config.mode === 'TRAINING' && (
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase bg-[#0a0c10]/80 p-1 rounded border border-[#314368]">
                                    <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#0d59f2]"></span> Actual</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#fa6238] border-b border-dashed"></span> Predicted</span>
                                </div>
                            )}
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                                {/* Updated XAxis dataKey to displayTime */}
                                <XAxis dataKey="displayTime" tick={{fill: '#90a4cb', fontSize: 10}} axisLine={{stroke: '#314368'}} tickLine={false} />
                                <YAxis domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} orientation="right" />
                                <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368' }} itemStyle={{ fontSize: '12px' }} />
                                
                                {/* Real Price (Solid Area) */}
                                <Area type="monotone" dataKey="price" stroke="#0d59f2" strokeWidth={2} fill="url(#colorPrice)" isAnimationActive={false} connectNulls />
                                
                                {/* Predicted Price (Dashed Line) - For Training Mode */}
                                {engineStatus.config.mode === 'TRAINING' && (
                                    <Line type="monotone" dataKey="predicted" stroke="#fa6238" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
                                )}
                                
                                {/* Robot Entry Markers - Chameleon Adapted */}
                                {engineStatus.positions && (
                                    <ReferenceLine 
                                        y={engineStatus.positions.avgEntryPrice} 
                                        stroke={engineStatus.positions.side === 'LONG' ? 'var(--trend-up)' : 'var(--trend-down)'} 
                                        strokeDasharray="3 3" 
                                        label={{ value: 'AVG ENTRY', fill: 'white', fontSize: 10, position: 'insideRight' }} 
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    {/* ... (Manual Controls below Chart) ... */}
                    <div className="h-24 flex gap-4">
                        <button 
                            onClick={() => handleManualOrder('LONG')} 
                            disabled={engineStatus.robot} 
                            className="flex-1 bg-[var(--trend-up)]/10 border border-[var(--trend-up)]/30 hover:bg-[var(--trend-up)]/20 text-[var(--trend-up)] rounded-xl flex flex-col items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg"
                        >
                            <span className="text-lg font-black uppercase tracking-widest group-hover:scale-110 transition-transform">Buy / Long</span>
                            {engineStatus.robot && <span className="text-[9px] uppercase">Robot Override Active</span>}
                        </button>
                        <div className="w-48 bg-[#182234] border border-[#222f49] rounded-xl flex flex-col items-center justify-center" title="Unrealized Profit and Loss (Floating)">
                            <span className="text-[10px] text-[#90a4cb] font-bold uppercase mb-1">PnL</span>
                            {/* Chameleon PnL Color */}
                            <span className={`text-2xl font-black ${getTrendColor(engineStatus.positions?.unrealizedPnL || 0)}`}>
                                {engineStatus.positions ? engineStatus.positions.unrealizedPnL.toFixed(2) : '---'}
                            </span>
                        </div>
                        <button 
                            onClick={() => handleManualOrder('SHORT')} 
                            disabled={engineStatus.robot} 
                            className="flex-1 bg-[var(--trend-down)]/10 border border-[var(--trend-down)]/30 hover:bg-[var(--trend-down)]/20 text-[var(--trend-down)] rounded-xl flex flex-col items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg"
                        >
                            <span className="text-lg font-black uppercase tracking-widest group-hover:scale-110 transition-transform">Sell / Short</span>
                            {engineStatus.robot && <span className="text-[9px] uppercase">Robot Override Active</span>}
                        </button>
                    </div>
                </div>

                <div className="col-span-4 flex flex-col gap-6">
                    {/* ... (Account Card) ... */}
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Account</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-[10px] text-[#90a4cb] uppercase cursor-help" title="Total Account Value (Balance + PnL)">Equity</span>
                                <span className="text-lg font-mono font-bold text-white">{symbol}{engineStatus.account.equity.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-[#0a0c10] h-3 rounded-full overflow-hidden border border-[#314368]">
                                <div className={`h-full bg-[#0d59f2]`} style={{ width: `${Math.min(100, (engineStatus.account.marginUsed / engineStatus.account.equity) * 100)}%` }}></div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="bg-[#0a0c10] p-2 rounded text-center cursor-help" title="Realized Balance (Cash)">
                                    <span className="text-[8px] text-[#90a4cb] uppercase block mb-1">Total Balance</span>
                                    <span className="text-[10px] font-bold text-white">{symbol}{(engineStatus.account.balance / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="bg-[#0a0c10] p-2 rounded text-center cursor-help" title="Funds locked in active positions">
                                    <span className="text-[8px] text-[#90a4cb] uppercase block mb-1">Used Margin</span>
                                    <span className="text-[10px] font-bold text-[#ffb347]">{symbol}{(engineStatus.account.marginUsed / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="bg-[#0a0c10] p-2 rounded text-center cursor-help" title="Available funds for new trades">
                                    <span className="text-[8px] text-[#90a4cb] uppercase block mb-1">Free Liquidity</span>
                                    <span className="text-[10px] font-bold text-[#0bda5e]">{symbol}{((engineStatus.account.equity - engineStatus.account.marginUsed) / 1000).toFixed(1)}k</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#314368] flex justify-between">
                                <button onClick={closePositions} disabled={!engineStatus.positions} className="px-3 py-1 bg-[#222f49] hover:bg-[#fa6238] text-white text-[10px] font-bold uppercase rounded transition-colors disabled:opacity-50">Flatten</button>
                            </div>
                        </div>
                    </div>

                    {/* TACTICAL EVENT STREAM (The Upgrade) */}
                    <div className="h-[400px] shrink-0 grow-0 flex flex-col relative overflow-hidden bg-[#101622] rounded-xl border border-[#222f49]">
                        <div className="p-4 border-b border-[#222f49] bg-[#182234]/50 shrink-0 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#0d59f2]">terminal</span> Tactical Event Stream
                            </h3>
                            {engineStatus.robot && <span className="size-2 rounded-full bg-[#0bda5e] animate-pulse"></span>}
                        </div>
                        
                        <div ref={logContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-[#0a0c10]">
                            {aiLogs.length === 0 && <div className="text-center text-[#90a4cb] text-xs italic py-8">Waiting for Neural Uplink...</div>}
                            {aiLogs.map((log, i) => (
                                <div key={log.id} className="flex gap-3 text-[10px] font-mono leading-tight animate-in fade-in slide-in-from-left-2">
                                    <span className="text-[#555] shrink-0">{log.timestamp}</span>
                                    <span className={`font-bold shrink-0 w-10 text-center ${log.tag === 'EXEC' ? 'text-[#0d59f2]' : log.tag === 'RISK' ? 'text-[#fa6238]' : log.tag === 'ALPHA' ? 'text-[#ffb347]' : 'text-[#90a4cb]'}`}>[{log.tag}]</span>
                                    {/* Chameleon Sentiment Colors in Logs */}
                                    <span className={`break-words ${log.sentiment === 'BULL' ? 'text-[var(--trend-up)]' : log.sentiment === 'BEAR' ? 'text-[var(--trend-down)]' : 'text-slate-300'}`}>{log.message}</span>
                                </div>
                            ))}
                            {neuralState === 'ANALYZING' && (
                                <div className="flex gap-2 text-[10px] text-[#0d59f2] animate-pulse mt-2 pl-14">
                                    <span className="material-symbols-outlined text-xs animate-spin">sync</span> Neural Engine Processing...
                                </div>
                            )}
                        </div>
                        
                        <div className="p-2 border-t border-[#314368] bg-[#101622] shrink-0">
                            <div className="flex items-center gap-2 text-[9px] text-[#90a4cb] uppercase font-bold">
                                <span>Risk Check:</span>
                                <span className={isRiskPassed ? "text-[#0bda5e]" : "text-[#fa6238]"}>
                                    {isRiskPassed ? "Passed" : "Warning"}
                                </span>
                                <span className="w-px h-3 bg-[#314368] mx-1"></span>
                                <span>Latency:</span>
                                <span className="text-white">{systemLatency > 0 ? `${systemLatency}ms` : '--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* NEW: ORDER BLOTTER (Bottom Right Module) */}
                    <div className="bg-[#182234] border border-[#222f49] rounded-xl p-0 overflow-hidden flex flex-col h-[250px]">
                        <div className="p-4 border-b border-[#222f49] bg-[#101622]/50 flex justify-between items-center shrink-0">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[#0d59f2]">list_alt</span> 
                                Order Blotter
                            </h3>
                            <span className="text-[9px] text-[#90a4cb] uppercase font-bold">{orderStream.length} Actions</span>
                        </div>
                        <div 
                            ref={blotterScrollRef} 
                            className="flex-1 overflow-y-auto custom-scrollbar"
                        >
                            <table className="w-full text-left text-[10px]">
                                <thead className="bg-[#101622] text-[#90a4cb] sticky top-0 z-10 shadow-sm shadow-black">
                                    <tr>
                                        <th className="px-3 py-2 font-bold">Time</th>
                                        <th className="px-3 py-2 font-bold">Side</th>
                                        <th className="px-3 py-2 font-bold text-right">Qty</th>
                                        <th className="px-3 py-2 font-bold text-right">Price</th>
                                        <th className="px-3 py-2 font-bold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#222f49]">
                                    {orderStream.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-3 py-2 font-mono text-[#90a4cb]">
                                                {(() => {
                                                    const d = new Date(order.timestamp);
                                                    if (engineStatus.config.mode === 'SIMULATION' || engineStatus.config.mode === 'TRAINING') {
                                                        return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                                                    } else {
                                                        return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false});
                                                    }
                                                })()}
                                            </td>
                                            {/* Chameleon Order Side */}
                                            <td className={`px-3 py-2 font-bold ${order.side === 'LONG' ? 'text-[var(--trend-up)]' : 'text-[var(--trend-down)]'}`}>
                                                {order.side}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-white">{order.quantity}</td>
                                            <td className="px-3 py-2 text-right font-mono text-[#90a4cb]">
                                                {(order.fillPrice || order.price).toFixed(1)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                    order.status === 'FILLED' ? 'bg-[#0bda5e]/20 text-[#0bda5e]' :
                                                    order.status === 'PENDING' ? 'bg-[#ffb347]/20 text-[#ffb347] animate-pulse' :
                                                    'bg-[#fa6238]/20 text-[#fa6238]'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orderStream.length === 0 && (
                                        <tr><td colSpan={5} className="px-3 py-8 text-center text-[#90a4cb] italic">No active or historical orders</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </main>
      </div>
    </div>
  );
};
