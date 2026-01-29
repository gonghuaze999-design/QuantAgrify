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
        <div className="flex items-center gap-3 w-80 cursor-pointer" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded-lg shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#90a4cb] uppercase mt-1">Big Data Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => item.view !== 'algorithm' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-medium transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
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
            <span className="text-[#90a4cb] text-sm font-medium cursor-pointer hover:text-white">Corn & Soybean Hub</span>
            <span className="text-slate-600 text-sm font-medium">/</span>
            <span className="text-[#0d59f2] text-sm font-bold flex items-center gap-2">
              Multi-factor Fusion
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-bold">Active</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#222f49] text-white px-4 h-9 rounded-lg text-sm font-bold hover:bg-[#2d3b5a] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            Backtest History
          </button>
          <button className="bg-[#0d59f2] text-white px-4 h-9 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Deploy Model
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
                    ? 'bg-[#0d59f2]/10 text-[#0d59f2] border-[#0d59f2]/20' 
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
                <span className="text-xs font-bold text-[#90a4cb]">Processing Units</span>
                <span className="text-[10px] text-[#0d59f2] font-bold uppercase">84%</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0d59f2] h-full w-[84%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-[#90a4cb]/50 mt-2 italic flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Tesla A100 Online
              </p>
            </div>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden workflow-grid p-8 flex flex-col items-center justify-center">
          <div className="absolute bottom-6 left-6 flex gap-2 z-10">
            <div className="flex bg-[#222f49] rounded-lg shadow-xl border border-slate-700 p-1">
              <button className="p-2 hover:bg-slate-800 rounded text-slate-400"><span className="material-symbols-outlined">add</span></button>
              <button className="px-3 text-xs font-bold text-slate-400 flex items-center border-x border-slate-700 mx-1">85%</button>
              <button className="p-2 hover:bg-slate-800 rounded text-slate-400"><span className="material-symbols-outlined">remove</span></button>
            </div>
            <button className="bg-[#222f49] p-3 rounded-lg shadow-xl border border-slate-700 text-slate-400 hover:text-[#0d59f2] transition-all">
              <span className="material-symbols-outlined text-lg">center_focus_weak</span>
            </button>
          </div>

          <div className="relative w-full max-w-4xl h-[500px] flex items-center justify-between px-12">
            <div className="flex flex-col gap-6">
              {[
                { label: 'Seasonality', name: 'Crop_Cycle_Index', color: 'bg-blue-400' },
                { label: 'Macro', name: 'USD_Exchange_Volatility', color: 'bg-emerald-400' },
                { label: 'Weather', name: 'Precipitation_Anomaly', color: 'bg-amber-400' },
                { label: 'Sentiment', name: 'AgriNews_Score', color: 'bg-purple-400' }
              ].map((input, i) => (
                <div key={input.name} className="w-44 bg-[#1a2333] border border-slate-700 rounded-lg p-3 shadow-md relative group hover:border-[#0d59f2] transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${input.color}`}></span>
                    <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-wider">{input.label}</span>
                  </div>
                  <p className="text-xs font-bold text-white">{input.name}</p>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"></div>
                </div>
              ))}
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path d="M 230 115 C 350 115, 350 250, 480 250" fill="none" stroke="#0d59f2" strokeWidth="1.5" />
              <path d="M 230 205 C 350 205, 350 250, 480 250" fill="none" stroke="#0d59f2" strokeWidth="1.5" />
              <path d="M 230 295 C 350 295, 350 250, 480 250" fill="none" stroke="#0d59f2" strokeWidth="1.5" />
              <path d="M 230 385 C 350 385, 350 250, 480 250" fill="none" stroke="#0d59f2" strokeWidth="1.5" />
            </svg>

            <div className="w-72 bg-[#1a2333] border-2 border-[#0d59f2] rounded-xl p-6 shadow-[0_0_30px_rgba(13,89,242,0.2)] relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2]">account_tree</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d59f2]">Fusion Ensemble</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase">XGBoost</span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Ensemble XGBoost</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#90a4cb]">Total Features</span>
                  <span className="font-bold">32 Nodes</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#90a4cb]">Confidence Score</span>
                  <span className="font-bold text-emerald-500">0.942</span>
                </div>
                <div className="w-full bg-[#222f49] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#0d59f2] h-full w-[94%]"></div>
                </div>
              </div>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0d59f2] border-2 border-[#101622] shadow-[0_0_10px_#0d59f2]"></div>
            </div>
          </div>
        </main>

        {/* Right Panel: Configuration */}
        <aside className="w-[480px] border-l border-[#222f49] bg-[#101622] flex flex-col z-20 shrink-0">
          <div className="border-b border-[#222f49] p-4 bg-[#161d2b]/30">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0d59f2]">tune</span>
              Fusion Configuration
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb]">Factor Weighting Strategy</h3>
                <div className="flex bg-[#222f49] p-0.5 rounded-lg text-[10px] font-bold uppercase">
                  <button className="px-3 py-1 bg-[#101622] rounded shadow-sm text-[#0d59f2]">Manual</button>
                  <button className="px-3 py-1 text-[#90a4cb] hover:text-white transition-colors">AI-Optimized</button>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Seasonality Cluster', val: '40%' },
                  { label: 'Macro Volatility Cluster', val: '25%' },
                  { label: 'Weather/Agri Cluster', val: '35%' }
                ].map(row => (
                  <div key={row.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#90a4cb]">{row.label}</span>
                      <span>{row.val}</span>
                    </div>
                    <input type="range" className="w-full h-1 bg-[#222f49] appearance-none rounded-lg accent-[#0d59f2]" defaultValue={parseInt(row.val)} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb] mb-4">Optimization Objective</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border-2 border-[#0d59f2] bg-[#0d59f2]/5 cursor-pointer">
                  <p className="text-sm font-bold">Sharpe Ratio</p>
                  <p className="text-[10px] text-[#90a4cb] mt-1">Risk-adjusted returns maximization</p>
                </div>
                <div className="p-3 rounded-lg border border-[#222f49] hover:border-[#90a4cb] transition-all cursor-pointer bg-white/5">
                  <p className="text-sm font-bold text-white">Information Ratio</p>
                  <p className="text-[10px] text-[#90a4cb] mt-1">Active return vs benchmark risk</p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb]">Collinearity Check</h3>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-sm">check</span> Low Correlation
                </span>
              </div>
              <div className="bg-[#161d2b] p-4 rounded-xl border border-slate-700">
                <div className="grid grid-cols-5 gap-1 w-fit mx-auto">
                  {/* Correlation Heatmap Visualization */}
                  {[...Array(25)].map((_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const opacity = row === col ? 0.9 : Math.random() * 0.4;
                    return (
                      <div key={i} className="w-6 h-6 rounded-sm bg-[#0d59f2]" style={{ opacity }} />
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between items-center px-2">
                  <span className="text-[9px] text-[#90a4cb]">Correlation Coefficient Scale</span>
                  <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#0d59f2]/10 to-[#0d59f2]"></div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90a4cb]">Model Training Loop</h3>
                <span className="text-[9px] font-mono text-slate-500 uppercase">xgboost_fusion.py</span>
              </div>
              <div className="bg-[#0d1117] rounded-lg border border-slate-800 text-[11px] p-4 font-mono text-slate-300 overflow-x-auto h-48 custom-scrollbar">
<pre><code><span className="text-pink-500">def</span> <span className="text-yellow-400">train_ensemble</span>(X, y, weights):
    <span className="text-slate-500"># Apply custom factor weighting</span>
    X_weighted = X * weights
    <span className="text-pink-500">params</span> = {'{'}
        <span className="text-emerald-400">'max_depth'</span>: 6,
        <span className="text-emerald-400">'eta'</span>: 0.1,
        <span className="text-emerald-400">'objective'</span>: <span className="text-emerald-400">'reg:squarederror'</span>,
        <span className="text-emerald-400">'eval_metric'</span>: <span className="text-emerald-400">'rmse'</span>
    {'}'}
    <span className="text-slate-500"># Start training iteration</span>
    model = xgb.train(params, dtrain, num_boost_round=100)
    <span className="text-pink-500">return</span> model</code></pre>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-[#222f49] bg-[#161d2b]/50">
            <button className="w-full h-12 rounded-xl bg-[#0d59f2] text-white font-bold tracking-wide shadow-lg shadow-[#0d59f2]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              Validate & Include Layer
            </button>
            <p className="text-[10px] text-center text-[#90a4cb] mt-3 uppercase tracking-tighter">Verified layers are locked into the production DAG</p>
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
      `}</style>
    </div>
  );
};