
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { getTrendColor } from './GlobalState';

interface BacktestEngineProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api') => void;
}

export const BacktestEngine: React.FC<BacktestEngineProps> = ({ onNavigate }) => {
  const [scenario, setScenario] = useState("");
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runCounterfactual = async () => {
      if (!process.env.API_KEY || !scenario) return;
      setIsSimulating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Act as a Quantitative Risk Analyst.
            Current Strategy: Mean Reversion Agriculture v2.4 (Sharpe 2.8).
            
            Counterfactual Scenario Input: "${scenario}"
            
            Task:
            1. Estimate the impact on Equity Curve and Max Drawdown.
            2. Describe the mechanism of failure or success in this specific scenario.
            
            Return a short paragraph (max 50 words).
          `;
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
          });
          setSimulationResult(response.text);
      } catch (e) {
          setSimulationResult("Simulation Engine Offline.");
      } finally {
          setIsSimulating(false);
      }
  };

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const, active: true },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const sideNavItems = [
    { label: 'Cockpit', icon: 'dashboard', view: 'cockpit' as const },
    { label: 'Analytics', icon: 'analytics', view: 'inDepthAnalytics' as const },
    { label: 'Backtest', icon: 'candlestick_chart', view: 'backtestEngine' as const, active: true },
    { label: 'Risk Mgmt', icon: 'shield_with_heart', view: 'riskManagement' as const },
    { label: 'Assets', icon: 'layers', view: 'portfolioAssets' as const }
  ];

  const monthlyData = [
    { year: 2023, data: [3.2, 1.1, -2.4, 0.5, 4.8, 2.1, 0.0, -0.8, 1.2, 3.1, 0.4, 1.8] },
    { year: 2022, data: [-3.5, 1.6, 0.9, -0.4, 1.4, 0.7, 2.2, 1.1, -1.1, 0.8, 1.6, 0.4] },
    { year: 2021, data: [1.2, 3.4, 0.6, 4.1, -2.1, 1.2, 0.2, 0.9, 5.2, -0.2, 1.5, 0.7] }
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

      {/* Control Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#222f49] bg-[#101622] shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 bg-[#182234]/50 px-3 py-1.5 rounded-lg border border-[#222f49]">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#90a4cb] uppercase font-bold tracking-wider">Date Range</span>
              <span className="text-xs font-medium text-white uppercase">Jan 2020 - Dec 2023</span>
            </div>
            <span className="material-symbols-outlined text-[#90a4cb] text-sm">calendar_month</span>
          </div>
          <div className="flex items-center gap-4 bg-[#182234]/50 px-3 py-1.5 rounded-lg border border-[#222f49]">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#90a4cb] uppercase font-bold tracking-wider">Initial Capital</span>
              <span className="text-xs font-medium text-white">$100,000</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[#182234] border border-[#222f49] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#222f49] transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Rerun Backtest
          </button>
        </div>
      </div>

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
          <div className="mt-auto group flex flex-col items-center gap-1 cursor-pointer text-[#fa6238] transition-colors" onClick={() => onNavigate('login')}>
            <div className="p-2.5 rounded-xl hover:bg-red-500/10"><span className="material-symbols-outlined">logout</span></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Logout</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10] p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1 uppercase tracking-tighter">Analysis: Backtest Engine</h1>
              <p className="text-[#90a4cb] text-sm flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-xs text-[#0bda5e] fill-1">check_circle</span>
                Simulation Complete — Strategy: Mean Reversion Agriculture v2.4
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 auto-rows-max">
            {/* Top Metrics Row */}
            <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Sharpe Ratio', val: '2.84', trend: '+0.4 vs Benchmark', color: 'text-[var(--trend-up)]' },
                { label: 'Sortino Ratio', val: '3.12', trend: 'Excellent risk-adj', color: 'text-[var(--trend-up)]' },
                { label: 'Max Drawdown', val: '-8.42%', trend: 'Recovery: 42 days', color: 'text-[var(--trend-down)]', valColor: 'text-[var(--trend-down)]' },
                { label: 'Calmar Ratio', val: '2.55', trend: 'Optimal leverage', color: 'text-[var(--trend-up)]' }
              ].map(metric => (
                <div key={metric.label} className="bg-[#182234] border border-[#222f49] p-4 rounded-xl">
                  <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">{metric.label}</span>
                  <div className={`text-2xl font-bold ${metric.valColor || 'text-white'} mt-1`}>{metric.val}</div>
                  <div className={`text-[10px] ${metric.color} font-bold mt-1 uppercase tracking-tighter`}>{metric.trend}</div>
                </div>
              ))}
            </div>

            {/* Equity Curve Chart */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-6 h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[#0d59f2]">monitoring</span>
                    Equity Growth & Underwater Drawdown
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0d59f2] rounded-sm"></span><span className="text-[10px] text-[#90a4cb] font-bold uppercase">Equity</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[var(--trend-down)] opacity-30 rounded-sm"></span><span className="text-[10px] text-[#90a4cb] font-bold uppercase">Drawdown</span></div>
                  </div>
                </div>
                <div className="relative h-64 w-full">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 200">
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
                    <line stroke="#222f49" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
                    <path d="M120 110 L 160 140 L 200 120 L 120 110" fill="var(--trend-down)" fillOpacity="0.3" />
                    <path d="M400 60 L 450 100 L 500 80 L 400 60" fill="var(--trend-down)" fillOpacity="0.3" />
                    <path d="M0 160 Q 100 150, 150 110 T 300 100 T 450 60 T 600 50 T 800 20" fill="none" stroke="#0d59f2" strokeWidth="3" />
                    <path d="M0 160 Q 100 150, 150 110 T 300 100 T 450 60 T 600 50 T 800 20 V 200 H 0 Z" fill="url(#mainEquityGradient)" />
                    <defs>
                      <linearGradient id="mainEquityGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0d59f2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[10px] text-[#90a4cb] font-black pl-3 border-l border-[#222f49]">
                    <span>$180k</span><span>$160k</span><span>$140k</span><span>$120k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Counterfactual Simulator (NEW) */}
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-5 h-full flex flex-col">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#90a4cb] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#0d59f2]">science</span>
                    Generative Stress Testing
                </h3>
                <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="E.g., What if 2012 drought conditions repeat with 2024 interest rates?"
                        className="w-full h-24 bg-[#0a0c10] border border-[#314368] rounded-xl p-3 text-xs text-white focus:border-[#0d59f2] outline-none resize-none placeholder:text-[#90a4cb]"
                    ></textarea>
                    <button 
                        onClick={runCounterfactual}
                        disabled={isSimulating || !scenario}
                        className="w-full py-2 bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-bold uppercase text-xs rounded transition-all disabled:opacity-50"
                    >
                        {isSimulating ? 'Simulating...' : 'Run Counterfactual'}
                    </button>
                    <div className="flex-1 bg-[#0a0c10] rounded-xl p-3 border border-[#314368] overflow-y-auto">
                        <span className="text-[9px] font-bold text-[#90a4cb] uppercase block mb-1">Impact Analysis</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {simulationResult || "Waiting for scenario input..."}
                        </p>
                    </div>
                </div>
              </div>
            </div>

            {/* Monthly Return Matrix */}
            <div className="col-span-12 lg:col-span-12">
              <div className="rounded-xl bg-[#182234] border border-[#222f49] p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#90a4cb] mb-4">Monthly Return Matrix (%)</h3>
                <div className="grid grid-cols-[32px_repeat(12,1fr)] gap-1">
                  <div className="w-8 h-6"></div>
                  {['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => (
                    <div key={m} className="text-[9px] text-center text-[#90a4cb] font-black uppercase">{m}</div>
                  ))}
                  {monthlyData.map(row => (
                    <React.Fragment key={row.year}>
                      <div className="text-[10px] flex items-center text-[#90a4cb] font-bold">{row.year}</div>
                      {row.data.map((val, i) => {
                        const isPositive = val > 0;
                        const isNeutral = val === 0;
                        const opacity = Math.min(0.9, 0.2 + Math.abs(val) / 5);
                        const bgColor = isPositive ? 'var(--trend-up)' : isNeutral ? '#222f49' : 'var(--trend-down)';
                        
                        return (
                          <div 
                            key={i} 
                            className="h-8 flex items-center justify-center text-[10px] font-bold rounded-sm text-white"
                            style={{ backgroundColor: bgColor, opacity: isNeutral ? 0.5 : opacity }}
                          >
                            {val > 0 ? `+${val}` : val}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
