import React from 'react';

interface FeatureEngineeringProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

export const FeatureEngineering: React.FC<FeatureEngineeringProps> = ({ onNavigate }) => {
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm' },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering', active: true },
    { name: 'Multi-factor Fusion', icon: 'hub', id: 'multiFactorFusion' },
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
            <span className="text-[#90a4cb] text-sm font-medium cursor-pointer hover:text-white">Soybean Futures</span>
            <span className="text-slate-600 text-sm font-medium">/</span>
            <span className="text-[#0d59f2] text-sm font-bold flex items-center gap-2">
              Feature Engineering
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0d59f2]/10 border border-[#0d59f2]/20 uppercase">v2.4.1</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 mr-4 border-r border-[#222f49] pr-4">
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">Templates</button>
            <button className="text-xs font-semibold text-[#90a4cb] hover:text-[#0d59f2] uppercase tracking-wider transition-colors">History</button>
          </div>
          <button className="bg-[#0d59f2] text-white px-4 h-9 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-[#0d59f2]/20">
            <span className="material-symbols-outlined text-lg">verified</span>
            Validate Pipeline
          </button>
          <button className="bg-[#222f49] text-white px-4 h-9 rounded-lg text-sm font-bold hover:bg-[#2d3b5a] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Dry Run
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
                <span className="text-xs font-bold text-[#90a4cb]">System Health</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0d59f2] h-full w-[74%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-[#90a4cb]/50 mt-2 italic">Node cluster: us-east-4</p>
            </div>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#0b0f1a] relative overflow-hidden workflow-grid p-8">
          <div className="absolute bottom-6 left-6 flex gap-2 z-10">
            <div className="flex bg-[#222f49] rounded-lg shadow-xl border border-slate-700 p-1">
              <button className="p-2 hover:bg-slate-800 rounded text-slate-400"><span className="material-symbols-outlined">add</span></button>
              <button className="px-3 text-xs font-bold text-slate-400 flex items-center border-x border-slate-700 mx-1">100%</button>
              <button className="p-2 hover:bg-slate-800 rounded text-slate-400"><span className="material-symbols-outlined">remove</span></button>
            </div>
          </div>

          <div className="relative w-full h-full flex items-center justify-center gap-16">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 320 300 L 480 300" fill="none" stroke="#0d59f2" strokeDasharray="4 4" strokeWidth="2" className="drop-shadow-[0_0_4px_#0d59f2]" />
              <path d="M 680 300 L 840 300" fill="none" stroke="#222f49" strokeWidth="2" />
            </svg>
            
            {/* Node: Source */}
            <div className="w-60 bg-[#1a2333] border border-slate-700 rounded-xl p-4 shadow-xl relative group">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-slate-400">database</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Source</span>
              </div>
              <p className="font-bold text-sm mb-1 text-white">Soybean_Main_DB</p>
              <p className="text-[10px] text-[#90a4cb]">Historical Futures</p>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
              </div>
            </div>

            {/* Node: Transformation */}
            <div className="w-64 bg-[#1a2333] border-2 border-[#0d59f2] rounded-xl p-5 shadow-[0_0_20px_rgba(13,89,242,0.15)] relative scale-110 z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2]">function</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0d59f2]">Transformation</span>
                </div>
                <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
              </div>
              <p className="font-bold text-base mb-1 text-white">Log Returns & Volatility</p>
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="text-[9px] bg-[#0d59f2]/10 px-2 py-0.5 rounded text-[#0d59f2] border border-[#0d59f2]/20">Rolling (20d)</span>
                <span className="text-[9px] bg-[#222f49] px-2 py-0.5 rounded text-[#90a4cb]">L2 Norm</span>
              </div>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-[#0d59f2] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#0d59f2] shadow-[0_0_8px_#0d59f2]"></div>
              </div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2333] border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
              </div>
            </div>

            {/* Node: Next Stage */}
            <div className="w-60 bg-[#1a2333] border-2 border-dashed border-slate-700 rounded-xl p-4 shadow-lg opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-slate-400">add</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Stage</span>
              </div>
              <p className="font-bold text-sm mb-1 text-slate-400 italic">Add Fusion Layer...</p>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#101622] border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel: Config */}
        <aside className="w-[450px] border-l border-[#222f49] bg-[#101622] flex flex-col z-20 shrink-0">
          <div className="border-b border-[#222f49] flex shrink-0">
            {['Methods', 'Params', 'Outputs'].map((tab, i) => (
              <button key={tab} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-[3px] transition-all ${i === 0 ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d59f2] text-lg">category</span>
                Standard Algorithms
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'PCA', desc: 'Dimensionality reduction' },
                  { name: 'Indicators', desc: 'RSI, MACD, Bollinger Bands', active: true },
                  { name: 'Wavelet Transform', desc: 'Time-frequency analysis' },
                  { name: 'Fourier Series', desc: 'Periodic signal detection' }
                ].map(method => (
                  <div key={method.name} className={`p-4 rounded-xl border transition-all cursor-pointer relative ${method.active ? 'border-2 border-[#0d59f2] bg-[#0d59f2]/5' : 'border-[#222f49] hover:border-[#0d59f2] bg-white/5'}`}>
                    {method.active && <span className="material-symbols-outlined absolute top-2 right-2 text-[#0d59f2] text-sm">check_circle</span>}
                    <p className="text-sm font-bold mb-1">{method.name}</p>
                    <p className="text-[10px] text-[#90a4cb]">{method.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d59f2] text-lg">tune</span>
                Configuration Parameters
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-medium text-[#90a4cb]">Window Size (Days)</label>
                    <span className="text-xs font-bold text-[#0d59f2]">20</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0d59f2]" min="1" max="252" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#90a4cb]">Normalization Method</label>
                  <select className="w-full bg-[#1a2333] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#0d59f2] outline-none">
                    <option>Z-Score Standardization</option>
                    <option selected>Min-Max Scaling (0, 1)</option>
                    <option>L2 Normalization</option>
                    <option>Robust Scaler</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="flex-1 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">code</span>
                  Logic Preview: Rolling Vol
                </h3>
              </div>
              <div className="flex-1 bg-[#0d1117] rounded-lg overflow-hidden border border-slate-800 text-[11px] p-4 font-mono text-slate-300 shadow-inner overflow-x-auto">
<pre><code><span className="text-pink-500">import</span> pandas <span className="text-pink-500">as</span> pd
<span className="text-blue-400">def</span> <span className="text-yellow-400">calc_volatility</span>(df, window=20):
    <span className="text-slate-500"># Log returns calculation</span>
    returns = np.log(df / df.shift(1))
    <span className="text-slate-500"># Rolling standard deviation</span>
    vol = returns.rolling(window).std()
    <span className="text-pink-500">return</span> vol * np.sqrt(252)</code></pre>
              </div>
            </section>

            <div className="mt-auto pt-4 flex flex-col gap-3">
              <button className="w-full h-12 rounded-xl bg-[#0d59f2] text-white font-bold tracking-wide shadow-lg shadow-[#0d59f2]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add_task</span>
                Validate & Include Layer
              </button>
              <p className="text-[10px] text-center text-[#90a4cb] uppercase tracking-tighter">Feature compatibility verified: 124 signals ready</p>
            </div>
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