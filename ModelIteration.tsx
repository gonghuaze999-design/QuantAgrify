import React from 'react';
import { SystemClock } from './SystemClock';

interface ModelIterationProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

export const ModelIteration: React.FC<ModelIterationProps> = ({ onNavigate }) => {
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
    { name: 'Risk Control', icon: 'security', id: 'riskControl' },
    { name: 'Model Iteration', icon: 'refresh', id: 'modelIteration', active: true }
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
              onClick={() => item.view !== 'algorithm' && onNavigate(item.view)}
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
              Model Iteration
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0d59f2]/10 border border-[#0d59f2]/20 uppercase">Active Tuning</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#0d59f2] text-white px-4 h-9 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-lg">sync</span>
            Deploy Version
          </button>
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
          <div className="mt-auto p-6 border-t border-[#222f49]">
            <div className="p-4 rounded-xl bg-[#1a2333] border border-[#222f49]">
              <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-wider">Training Engine</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"></div>
                <span className="text-xs font-medium text-white">GPU-Cluster-04</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden workflow-grid flex items-center justify-center p-8">
          <div className="relative flex flex-col items-center">
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#222f49" strokeWidth="0.5" />
                <circle className="iteration-path" cx="50" cy="50" r="45" fill="none" stroke="#0d59f2" strokeWidth="1.5" strokeDasharray="10" />
              </svg>
              <div className="z-10 flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-[#0d59f2]/20 border-2 border-[#0d59f2] flex items-center justify-center shadow-[0_0_30px_rgba(13,89,242,0.3)]">
                  <span className="material-symbols-outlined text-5xl text-[#0d59f2] animate-pulse">all_inclusive</span>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Continuous Learning</h2>
                  <p className="text-xs text-[#90a4cb]">Iterating v2.9.0 → v3.0.0</p>
                </div>
              </div>

              {/* Badges on the circle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a2333] border border-slate-700 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                <span className="material-symbols-outlined text-xs text-[#0d59f2]">data_thresholding</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white">Feedback</span>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#1a2333] border border-slate-700 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                <span className="material-symbols-outlined text-xs text-[#0d59f2]">model_training</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white">Retrain</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex bg-[#222f49] rounded-lg shadow-xl border border-slate-700 p-1">
            <button className="p-2 hover:bg-slate-800 rounded text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
            <button className="px-3 text-xs font-bold text-[#90a4cb] flex items-center border-x border-slate-700 mx-1">100%</button>
            <button className="p-2 hover:bg-slate-800 rounded text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">remove</span></button>
          </div>
        </main>

        {/* Right Panel: Iteration Controls */}
        <aside className="w-[480px] border-l border-[#222f49] bg-[#101622] flex flex-col z-20 shrink-0">
          <div className="border-b border-[#222f49] flex h-14 shrink-0">
            {['Tuning', 'Lineage', 'Alerts'].map((tab, i) => (
              <button key={tab} className={`flex-1 flex items-center justify-center border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${i === 0 ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">tune</span>
                  Hyperparameter Tuning
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase">Optimized</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button className="flex flex-col gap-1 p-3 rounded-xl border-2 border-[#0d59f2] bg-[#0d59f2]/5 text-left transition-all">
                  <span className="text-xs font-bold text-white">Bayesian Opt.</span>
                  <span className="text-[10px] text-[#90a4cb] leading-tight">Probabilistic model-based search</span>
                </button>
                <button className="flex flex-col gap-1 p-3 rounded-xl border border-slate-700 bg-white/5 text-left hover:border-[#0d59f2] transition-all opacity-60">
                  <span className="text-xs font-bold text-white">Grid Search</span>
                  <span className="text-[10px] text-[#90a4cb] leading-tight">Exhaustive param scan</span>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#90a4cb] uppercase font-bold tracking-widest text-[9px]">Search Iterations</span>
                  <span className="font-mono text-[#0d59f2] font-bold">250/500</span>
                </div>
                <div className="w-full h-1.5 bg-[#222f49] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0d59f2] w-1/2"></div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-[#0d59f2] text-lg">calendar_month</span>
                Retraining Schedule
              </h3>
              <div className="bg-[#1a2333] rounded-xl border border-slate-700 p-4">
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-[#0d59f2] text-white text-[10px] font-bold uppercase">Daily</button>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-700 text-[#90a4cb] text-[10px] font-bold uppercase hover:text-white transition-colors">Weekly</button>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-700 text-[#90a4cb] text-[10px] font-bold uppercase hover:text-white transition-colors">Event-driven</button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-[#90a4cb] font-medium uppercase tracking-wider">Next Scheduled Run:</span>
                  <span className="text-[11px] font-bold text-white">Today, 23:00 UTC</span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">warning_amber</span>
                  Drift Detection
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0d59f2]"></div>
                </label>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-700 bg-white/5 flex items-center justify-between">
                  <span className="text-xs text-[#90a4cb]">Concept Drift Threshold</span>
                  <span className="text-xs font-mono font-bold text-white">0.025 α</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-700 bg-white/5 flex items-center justify-between">
                  <span className="text-xs text-[#90a4cb]">Feature Divergence (PSI)</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">0.081</span>
                </div>
              </div>
            </section>

            <section className="pb-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white uppercase tracking-wider">
                <span className="material-symbols-outlined text-[#0d59f2] text-lg">account_tree</span>
                Model Lineage
              </h3>
              <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700">
                {[
                  { label: 'Current: v2.9.0', date: '2024-05-20 12:00', active: true },
                  { label: 'Stable: v2.8.8', date: '2024-05-19 14:20' },
                  { label: 'v2.4.1 (Legacy)', date: '2023-11-20 09:45' }
                ].map((item, i) => (
                  <div key={i} className="relative flex items-center gap-3">
                    <div className={`absolute -left-[19px] w-2 h-2 rounded-full ${item.active ? 'bg-[#0d59f2] ring-4 ring-[#0d59f2]/20' : 'bg-slate-700'}`}></div>
                    <div className={`flex-1 p-3 border rounded-lg transition-all ${item.active ? 'bg-[#0d59f2]/10 border-[#0d59f2]/30' : 'bg-white/5 border-slate-700'}`}>
                      <p className={`text-[10px] font-bold uppercase ${item.active ? 'text-[#0d59f2]' : 'text-slate-300'}`}>{item.label}</p>
                      <p className="text-[9px] text-[#90a4cb] mt-0.5">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-[#222f49] bg-[#161d2b]/50">
            <button className="w-full h-12 rounded-xl bg-[#0d59f2] text-white font-bold tracking-wide shadow-lg shadow-[#0d59f2]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-sm">
              <span className="material-symbols-outlined text-lg">bolt</span>
              Execute Retraining
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
        .iteration-path {
          stroke-dasharray: 10;
          animation: dash 30s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
      `}</style>
    </div>
  );
};