
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor, SystemLogStream } from './GlobalState';
import { GLOBAL_EXCHANGE, EngineMode } from './SimulationEngine';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface PortfolioAssetsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const PortfolioAssets: React.FC<PortfolioAssetsProps> = ({ onNavigate }) => {
  // --- ENGINE CONNECTION ---
  const [engineStatus, setEngineStatus] = useState(GLOBAL_EXCHANGE.getStatus());
  
  // --- CONFIG FORM STATE ---
  const [initialCapital, setInitialCapital] = useState(engineStatus.config.initialBalance || 1000000);
  const [selectedGateway, setSelectedGateway] = useState<'SIM' | 'REAL'>(engineStatus.config.executionGateway || 'SIM');
  
  // Use Global State directly for Currency
  const currency = engineStatus.config.baseCurrency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : '¥';
  
  // --- AI / UX STATE ---
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTip, setOptimizationTip] = useState<string | null>(null);

  useEffect(() => {
      const interval = setInterval(() => {
          setEngineStatus(GLOBAL_EXCHANGE.getStatus());
      }, 200); 
      return () => clearInterval(interval);
  }, []);

  const handleApplyConfiguration = () => {
      if (engineStatus.isRunning) return;
      GLOBAL_EXCHANGE.configure({
          initialBalance: Number(initialCapital),
          executionGateway: selectedGateway,
          mode: selectedGateway === 'REAL' ? 'REAL' : 'SIMULATION' 
      });
      setEngineStatus(GLOBAL_EXCHANGE.getStatus());
      SystemLogStream.push({ type: 'WARNING', module: 'Portfolio', action: 'AccountReset', message: `Capital reset to ${currencySymbol}${initialCapital}. Gateway: ${selectedGateway}` });
      alert(`Capital Reset to ${currencySymbol}${Number(initialCapital).toLocaleString()} | Gateway: ${selectedGateway}`);
  };

  const updateCurrency = (newCurrency: 'USD' | 'CNY') => {
      GLOBAL_EXCHANGE.configure({ baseCurrency: newCurrency });
      // Force update local status immediately to reflect change in UI
      setEngineStatus(GLOBAL_EXCHANGE.getStatus());
      SystemLogStream.push({ type: 'INFO', module: 'Portfolio', action: 'CurrencySwap', message: `Base currency switched to ${newCurrency}.` });
  };

  const runOptimization = async () => {
      if (!process.env.API_KEY) return;
      setIsOptimizing(true);
      SystemLogStream.push({ type: 'INFO', module: 'Portfolio', action: 'AI_Scan', message: 'Portfolio health scan initiated.' });
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const pos = engineStatus.positions;
          const context = pos 
            ? `Current Position: ${pos.side} ${pos.quantity} units of ${pos.symbol}.` 
            : `Portfolio is currently 100% Cash (${currencySymbol}${engineStatus.account.equity.toFixed(2)}).`;

          const prompt = `Act as a Portfolio Manager. ${context}. Provide a single, short strategic tip (max 20 words).`;
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
          setOptimizationTip(response.text);
          SystemLogStream.push({ type: 'SUCCESS', module: 'Portfolio', action: 'AI_Result', message: 'Optimization tip ready.', payload: { tip: response.text } });
      } catch (e: any) {
          setOptimizationTip("Optimization Service Unavailable.");
          SystemLogStream.push({ type: 'ERROR', module: 'Portfolio', action: 'AI_Error', message: e.message });
      } finally {
          setIsOptimizing(false);
      }
  };

  const freeCash = Math.max(0, engineStatus.account.equity - engineStatus.account.marginUsed);
  const allocationData = [
      { name: 'Margin Used', value: engineStatus.account.marginUsed, color: '#ffb347' }, 
      { name: 'Free Cash', value: freeCash, color: '#0d59f2' }
  ];

  const historyData = engineStatus.account.history.map(h => ({
      time: new Date(h.time).toLocaleTimeString(),
      equity: h.equity
  }));

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const, active: true }
  ];

  return (
    <div className="bg-[#0a0c10] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
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
        {/* Left Sidebar */}
        <aside className="w-20 border-r border-[#222f49] bg-[#0a0c10] flex flex-col items-center py-6 gap-8 shrink-0">
          {sideNavItems.map(item => (
            <div 
              key={item.label} 
              onClick={() => item.view && onNavigate(item.view)}
              className={`group flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#0d59f2]' : 'text-[#90a4cb] hover:text-white'}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-[#0d59f2] text-white shadow-[0_0_15px_rgba(13,89,242,0.3)]' : 'hover:bg-[#182234]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Portfolio Assets</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0bda5e] fill-1">account_balance_wallet</span>
                Real-Time OEMS Account State & Capital Allocation
              </p>
            </div>
            
            <div className="flex gap-4 items-center bg-[#182234] border border-[#222f49] rounded-lg p-2 px-4">
                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Engine Status:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${engineStatus.isRunning ? 'bg-[#0bda5e]/10 text-[#0bda5e] border-[#0bda5e]/20' : 'bg-[#fa6238]/10 text-[#fa6238] border-[#fa6238]/20'}`}>
                    {engineStatus.isRunning ? 'ACTIVE / LOCKED' : 'IDLE / CONFIG'}
                </span>
                <div className="w-px h-4 bg-[#314368] mx-2"></div>
                <span className="text-[9px] text-[#90a4cb] uppercase font-bold">Execution Gateway:</span>
                <span className="text-[10px] font-mono text-white font-bold">
                    {engineStatus.config.executionGateway === 'SIM' ? 'INTERNAL_SIM' : 'REAL_BROKER'}
                </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            
            {/* 1. CONFIGURATION PANEL */}
            <div className="col-span-12">
                <div className={`rounded-xl border p-5 flex items-center justify-between transition-all ${engineStatus.isRunning ? 'bg-[#182234]/30 border-[#222f49] opacity-70 pointer-events-none' : 'bg-[#182234] border-[#0d59f2]/50 shadow-lg'}`}>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <label className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Initial Capital ({currency})</label>
                            <input 
                                type="number" 
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(Number(e.target.value))}
                                className="bg-[#0a0c10] border border-[#314368] text-white font-mono font-bold text-lg px-3 py-1 rounded w-48 focus:border-[#0d59f2] outline-none"
                                disabled={engineStatus.isRunning}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Execution Mode</label>
                            <div className="flex bg-[#0a0c10] rounded p-1 border border-[#314368]">
                                <button onClick={() => setSelectedGateway('SIM')} className={`px-4 py-1 text-[10px] font-bold uppercase rounded transition-all ${selectedGateway === 'SIM' ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb]'}`} disabled={engineStatus.isRunning}>Simulation</button>
                                <button onClick={() => setSelectedGateway('REAL')} className={`px-4 py-1 text-[10px] font-bold uppercase rounded transition-all ${selectedGateway === 'REAL' ? 'bg-[#0bda5e] text-[#0a0c10]' : 'text-[#90a4cb]'}`} disabled={engineStatus.isRunning}>Real Broker</button>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[9px] text-[#90a4cb] font-bold uppercase mb-1">Base Currency</label>
                            <div className="flex bg-[#0a0c10] rounded p-1 border border-[#314368]">
                                <button 
                                    onClick={() => updateCurrency('USD')} 
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${currency === 'USD' ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb]'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                    disabled={engineStatus.isRunning || selectedGateway === 'REAL'}
                                >
                                    USD ($)
                                </button>
                                <button 
                                    onClick={() => updateCurrency('CNY')} 
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${currency === 'CNY' ? 'bg-[#fa6238] text-white' : 'text-[#90a4cb]'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                    disabled={engineStatus.isRunning || selectedGateway === 'REAL'}
                                >
                                    CNY (¥)
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleApplyConfiguration}
                        disabled={engineStatus.isRunning}
                        className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${engineStatus.isRunning ? 'bg-[#314368] text-[#90a4cb]' : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-lg'}`}
                    >
                        {engineStatus.isRunning ? 'Engine Locked (Running)' : 'Reset & Seed Account'}
                        <span className="material-symbols-outlined text-sm">{engineStatus.isRunning ? 'lock' : 'account_balance_wallet'}</span>
                    </button>
                </div>
            </div>

            {/* 2. Allocation */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 h-full flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[#90a4cb] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">pie_chart</span>
                  Liquidity Profile
                </h3>
                <div className="flex-1 min-h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{backgroundColor: '#0a0c10', borderColor: '#314368', borderRadius: '8px', fontSize: '12px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-[#90a4cb] font-bold uppercase">Total Equity</span>
                        <span className="text-2xl font-black text-white">{currencySymbol}{(engineStatus.account.equity / 1000).toFixed(1)}k</span>
                    </div>
                </div>
                
                {/* AI Optimization Tip */}
                <div className="w-full mt-4 bg-[#101622] p-3 rounded-lg border border-[#314368] flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#90a4cb] uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#0d59f2]">medical_services</span> Portfolio Doctor
                          </span>
                          <button onClick={runOptimization} disabled={isOptimizing} className="text-[9px] text-white bg-[#0d59f2] px-2 py-1 rounded hover:bg-[#1a66ff]">{isOptimizing ? 'Scanning...' : 'Scan'}</button>
                      </div>
                      {optimizationTip && <p className="text-[10px] text-slate-300 leading-tight border-l-2 border-[#0bda5e] pl-2 animate-in fade-in">{optimizationTip}</p>}
                  </div>
              </div>
            </div>

            {/* 3. NAV History */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl p-6 flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[#90a4cb] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-lg">trending_up</span>
                    Net Asset Value (NAV)
                  </h3>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#90a4cb]">High Water Mark:</span>
                      <span className="text-xs font-mono font-bold text-[#0bda5e]">{currencySymbol}{engineStatus.account.highWaterMark.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222f49" vertical={false} />
                            <XAxis hide dataKey="time" />
                            <YAxis domain={['auto', 'auto']} tick={{fill: '#90a4cb', fontSize: 10}} axisLine={false} tickLine={false} width={50} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#314368', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                            <Area type="monotone" dataKey="equity" stroke="#0d59f2" strokeWidth={2} fill="url(#colorEquity)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 4. Active Positions Table - EMPTY STATE */}
            <div className="col-span-12">
              <div className="bg-[#182234] border border-[#222f49] rounded-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[#222f49] flex justify-between items-center bg-[#101622]/50 backdrop-blur-sm">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2] text-lg">list_alt</span>
                    Active Derivatives Positions
                  </h3>
                  <div className="flex gap-4 text-[10px] font-bold text-[#90a4cb] uppercase">
                      <span>Total Margin: <span className="text-white">{currencySymbol}{engineStatus.account.marginUsed.toFixed(2)}</span></span>
                      <span>Leverage: <span className="text-white">{engineStatus.account.leverage}x</span></span>
                  </div>
                </div>
                
                {engineStatus.positions ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1a2539]/50 text-[#90a4cb] font-black uppercase tracking-widest text-[9px]">
                          <tr>
                            <th className="px-6 py-4">Symbol</th>
                            <th className="px-6 py-4">Side</th>
                            <th className="px-6 py-4 text-right">Quantity</th>
                            <th className="px-6 py-4 text-right">Avg Entry</th>
                            <th className="px-6 py-4 text-right">Mark Price</th>
                            <th className="px-6 py-4 text-right">Margin Used</th>
                            <th className="px-6 py-4 text-right">Unrealized PnL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222f49] text-xs font-bold">
                              <tr className="hover:bg-white/[0.03] transition-colors group">
                                  <td className="px-6 py-4 font-mono text-white">{engineStatus.positions.symbol}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${engineStatus.positions.side === 'LONG' ? 'bg-[#0d59f2]/10 text-[#0d59f2] border border-[#0d59f2]/20' : 'bg-[#fa6238]/10 text-[#fa6238] border border-[#fa6238]/20'}`}>
                                          {engineStatus.positions.side}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-white">{engineStatus.positions.quantity}</td>
                                  <td className="px-6 py-4 text-right font-mono text-[#90a4cb]">{engineStatus.positions.avgEntryPrice.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono text-white">{engineStatus.positions.currentPrice.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-mono text-[#ffb347]">{currencySymbol}{engineStatus.positions.marginUsed.toFixed(2)}</td>
                                  <td className={`px-6 py-4 text-right font-mono ${getTrendColor(engineStatus.positions.unrealizedPnL)}`}>
                                      {engineStatus.positions.unrealizedPnL >= 0 ? '+' : ''}{engineStatus.positions.unrealizedPnL.toFixed(2)}
                                  </td>
                              </tr>
                        </tbody>
                      </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-[#101622]/30">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#0d59f2]/20 rounded-full blur-xl animate-pulse"></div>
                            <span className="material-symbols-outlined text-5xl text-[#90a4cb] relative z-10">radar</span>
                        </div>
                        <h4 className="text-white font-bold uppercase tracking-widest mt-4">Capital Idle - Ready to Deploy</h4>
                        <p className="text-[10px] text-[#90a4cb] mt-2 max-w-xs text-center">
                            No active derivatives positions detected. Configure a strategy in the <span className="text-[#0d59f2] cursor-pointer hover:underline" onClick={() => onNavigate('cockpit')}>Cockpit</span> to begin execution.
                        </p>
                        <button onClick={() => onNavigate('cockpit')} className="mt-4 px-6 py-2 bg-[#182234] border border-[#314368] hover:border-[#0d59f2] text-xs font-bold uppercase text-white rounded-lg transition-all flex items-center gap-2">
                            Go to Cockpit <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
