
import React from 'react';

interface MultiFactorFusionProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

export const MultiFactorFusion: React.FC<MultiFactorFusionProps> = ({ onNavigate }) => {
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion', active: true },
    { name: 'Risk Control', icon: 'security', id: 'riskControl' },
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
              Multi-Factor Fusion
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0d59f2]/10 border border-[#0d59f2]/20 uppercase">v2.4.1</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 mr-4 border-r border-[#222f49] pr-4">
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">Weights</button>
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">Correlation</button>
          </div>
          <button className="bg-[#0d59f2] text-white px-4 h-9 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-lg">merge_type</span>
            Fuse Models
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#90a4cb]">Fusion Engine</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-white font-mono">Ensemble Method: XGBoost + LSTM</p>
            </div>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden workflow-grid p-8">
          <div className="relative w-full h-full flex items-center justify-center gap-12">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 200 200 C 350 200, 350 300, 500 300" fill="none" stroke="#222f49" strokeWidth="2" />
              <path d="M 200 400 C 350 400, 350 300, 500 300" fill="none" stroke="#222f49" strokeWidth="2" />
              <path d="M 700 300 L 850 300" fill="none" stroke="#0d59f2" strokeWidth="2" className="drop-shadow-[0_0_4px_#0d59f2]" />
            </svg>
            
            {/* Input Nodes */}
            <div className="flex flex-col gap-32">
              <div className="w-56 bg-[#1a2333] border border-slate-700 rounded-xl p-4 shadow-xl relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">bar_chart</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Technical</span>
                </div>
                <p className="font-bold text-sm text-white">Price Momentum</p>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-slate-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                </div>
              </div>

              <div className="w-56 bg-[#1a2333] border border-slate-700 rounded-xl p-4 shadow-xl relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">newspaper</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fundamental</span>
                </div>
                <p className="font-bold text-sm text-white">Supply Shock</p>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-slate-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                </div>
              </div>
            </div>

            {/* Fusion Node */}
            <div className="w-64 bg-[#1a2333] border-2 border-[#0d59f2] rounded-xl p-6 shadow-[0_0_30px_rgba(13,89,242,0.2)] relative z-10 scale-110">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0d59f2]/20 border border-[#0d59f2] flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[#0d59f2] text-2xl">hub</span>
                </div>
              </div>
              <p className="font-bold text-base text-center text-white mb-2">Alpha Generator</p>
              <div className="w-full bg-[#101622] h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#0d59f2] to-emerald-400 h-full w-[85%]"></div>
              </div>
              <p className="text-[9px] text-center text-[#90a4cb] mt-2 font-mono">Confidence: 0.85</p>
              
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0d59f2] flex items-center justify-center shadow-[0_0_10px_#0d59f2]"></div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0d59f2] flex items-center justify-center shadow-[0_0_10px_#0d59f2]"></div>
            </div>

            {/* Output Node */}
            <div className="w-56 bg-[#1a2333] border border-slate-700 rounded-xl p-4 shadow-xl relative opacity-80">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Signal</span>
              </div>
              <p className="font-bold text-sm text-white">Strong Buy</p>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel: Weighting */}
        <aside className="w-[450px] border-l border-[#222f49] bg-[#101622] flex flex-col z-20 shrink-0">
          <div className="p-6 border-b border-[#222f49]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Factor Weighting</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {[
              { name: 'Technical Momentum', weight: 45, color: 'bg-[#0d59f2]' },
              { name: 'Fundamental Data', weight: 30, color: 'bg-emerald-500' },
              { name: 'Macro Sentiment', weight: 15, color: 'bg-amber-500' },
              { name: 'Alternative Data', weight: 10, color: 'bg-purple-500' }
            ].map((factor) => (
              <div key={factor.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">{factor.name}</span>
                  <span className="text-[#90a4cb]">{factor.weight}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#1a2333] rounded-full overflow-hidden">
                    <div className={`h-full ${factor.color}`} style={{ width: `${factor.weight}%` }}></div>
                  </div>
                  <input type="range" className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0d59f2]" defaultValue={factor.weight} />
                </div>
              </div>
            ))}

            <div className="mt-8 p-4 bg-[#1a2333] border border-slate-700 rounded-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Correlation Matrix</h4>
              <div className="grid grid-cols-4 gap-1">
                {[1, 0.4, 0.2, 0.1, 0.4, 1, 0.3, 0.0, 0.2, 0.3, 1, 0.5, 0.1, 0.0, 0.5, 1].map((val, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center text-[10px] font-mono text-slate-400 bg-black/20 rounded hover:bg-white/5 cursor-default" style={{ opacity: 0.3 + val * 0.7 }}>
                    {val.toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-[#222f49] bg-[#161d2b]/50">
            <button className="w-full h-12 rounded-xl bg-[#0d59f2] text-white font-bold tracking-wide shadow-lg shadow-[#0d59f2]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-sm">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Confirm Weights
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
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};
