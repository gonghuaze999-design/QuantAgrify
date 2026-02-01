
import React from 'react';

interface RiskControlProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

export const RiskControl: React.FC<RiskControlProps> = ({ onNavigate }) => {
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl', active: true },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration' }
  ];

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const, active: true },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30">
      {/* Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#90a4cb] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-10 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => item.view !== 'algorithm' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <button className="text-[#90a4cb] hover:text-[#0d59f2] transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* Sub-Header */}
      <header className="flex items-center justify-between border-b border-[#222f49] bg-[#161d2b] px-6 py-3 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[#90a4cb] text-sm font-medium cursor-pointer hover:text-white">Project Alpha</span>
            <span className="text-slate-600 text-sm font-medium">/</span>
            <span className="text-[#90a4cb] text-sm font-medium cursor-pointer hover:text-white">Soybean Futures</span>
            <span className="text-slate-600 text-sm font-medium">/</span>
            <span className="text-[#0d59f2] text-sm font-bold flex items-center gap-2">
              Risk_Config_v4
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0d59f2]/10 border border-[#0d59f2]/20 uppercase">RC-7</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 mr-4 border-r border-[#222f49] pr-4">
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">Validation</button>
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">Logs</button>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#0d59f2] text-white px-6 h-10 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/30 ring-2 ring-[#0d59f2] ring-offset-2 ring-offset-[#161d2b]">
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Dry Run
            </button>
            <button className="bg-[#222f49] text-white h-10 w-10 flex items-center justify-center rounded-lg hover:bg-[#2d3b5a] transition-all">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-[#222f49] bg-[#101622] flex flex-col shrink-0">
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] mb-4">Pipeline Layers</p>
            <nav className="flex flex-col gap-2">
              {pipelineLayers.map((layer) => (
                <div 
                  key={layer.name}
                  onClick={() => layer.id && onNavigate(layer.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer border ${
                    layer.active 
                    ? 'bg-[#0d59f2]/10 text-[#0d59f2] border-[#0d59f2]/20 shadow-sm' 
                    : 'text-[#90a4cb] border-transparent hover:bg-[#222f49] hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined ${layer.active ? 'fill-1' : ''}`}>{layer.icon}</span>
                  <p className="text-sm font-semibold">{layer.name}</p>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden workflow-grid p-8">
          <div className="relative w-full h-full flex items-center justify-center gap-10">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 50 300 L 220 300" fill="none" stroke="#222f49" strokeDasharray="4 4" strokeWidth="2" />
              <path d="M 400 300 L 520 300" fill="none" stroke="#222f49" strokeDasharray="4 4" strokeWidth="2" />
              <path d="M 720 300 L 840 300" fill="none" stroke="#0d59f2" strokeWidth="2" className="drop-shadow-[0_0_4px_#0d59f2]" />
            </svg>
            
            {/* Connection Start (Simplified) */}
            <div className="w-48 bg-[#1a2333] border border-slate-700 rounded-xl p-3 opacity-60">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-xs text-slate-400">hub</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fusion Layer</span>
              </div>
              <p className="font-bold text-xs text-slate-300">Factor Combiner</p>
            </div>

            {/* Node: Portfolio Optimizer */}
            <div className="w-56 bg-[#1a2333] border-2 border-[#0d59f2] rounded-xl p-4 shadow-xl z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2] text-sm">balance</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d59f2]">Optimizer</span>
                </div>
              </div>
              <p className="font-bold text-sm text-white">Portfolio Optimizer</p>
              <p className="text-[9px] text-slate-400 mt-1">Mean-Variance Optimization</p>
            </div>

            {/* Node: Stop-Loss Guard */}
            <div className="w-56 bg-[#1a2333] border-2 border-rose-500 rounded-xl p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-sm">dangerous</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Safety</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <p className="font-bold text-sm text-white">Stop-Loss Guard</p>
              <p className="text-[9px] text-slate-400 mt-1">Hard Exit @ -2.5% Target</p>
            </div>
          </div>
        </main>

        {/* Right Panel: Risk Configuration */}
        <aside className="w-[480px] border-l border-[#222f49] bg-[#101622] flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-amber-500 text-lg">admin_panel_settings</span>
                  Risk Limit Parameters
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase">Active Enforcement</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#1a2333] p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-[#90a4cb]">Max Drawdown Limit</span>
                    <span className="text-xs font-bold text-rose-500">8.0%</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500" defaultValue={80} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a2333] p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Value at Risk (VaR)</span>
                    <span className="text-sm font-bold text-white">1.25% Daily</span>
                  </div>
                  <div className="bg-[#1a2333] p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Concentration Limit</span>
                    <span className="text-sm font-bold text-white">15% Per Asset</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[#0d59f2] text-lg">insights</span>
                Signal Generation Logic
              </h3>
              <div className="bg-[#0d1117] rounded-xl p-4 border border-slate-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-mono font-bold">Long Threshold</span>
                  <span className="text-slate-300 font-mono">+0.65</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full flex overflow-hidden">
                  <div className="h-full bg-rose-500/30 w-1/3 border-r border-slate-900"></div>
                  <div className="h-full bg-slate-700/30 w-1/3"></div>
                  <div className="h-full bg-emerald-500/30 w-1/3 border-l border-slate-900"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-mono font-bold">Short Threshold</span>
                  <span className="text-slate-300 font-mono">-0.42</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[#90a4cb] text-lg">show_chart</span>
                Backtest Preview
              </h3>
              <div className="bg-[#1a2333] p-4 rounded-xl border border-slate-700">
                <div className="h-32 w-full relative overflow-hidden chart-gradient rounded">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                    {/* Strategy with RC */}
                    <path d="M0,80 L40,75 L80,85 L120,60 L160,65 L200,40 L240,45 L280,20 L320,30 L360,10 L400,15" fill="none" stroke="#0d59f2" strokeWidth="2" />
                    {/* Vanilla Strategy */}
                    <path d="M0,80 L40,82 L80,95 L120,90 L160,98 L200,99 L240,95 L280,99 L320,99 L360,99 L400,99" fill="none" stroke="#ef4444" strokeDasharray="2 2" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-tight">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#0d59f2]"></span>
                    <span className="text-[#90a4cb]">With Risk Control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-rose-500 border-dashed border-t"></span>
                    <span className="text-[#90a4cb]">Vanilla Strategy</span>
                  </div>
                </div>
              </div>
            </section>

            <button className="w-full py-4 rounded-xl bg-[#0d59f2] text-white font-bold tracking-widest shadow-lg shadow-[#0d59f2]/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 uppercase text-sm">
              <span className="material-symbols-outlined">save</span>
              Commit Risk Strategy
            </button>
          </div>
        </aside>
      </div>

      <style>{`
        .workflow-grid {
          background-image: radial-gradient(circle, #222f49 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        .chart-gradient {
          background: linear-gradient(180deg, rgba(13, 89, 242, 0.1) 0%, transparent 100%);
        }
      `}</style>
    </div>
  );
};
