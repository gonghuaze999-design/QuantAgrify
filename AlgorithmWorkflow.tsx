
import React, { useState } from 'react';

interface AlgorithmWorkflowProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api') => void;
}

export const AlgorithmWorkflow: React.FC<AlgorithmWorkflowProps> = ({ onNavigate }) => {
  const pipelineLayers = [
    { name: 'Pre-processing', icon: 'settings_input_component', id: 'algorithm', active: true },
    { name: 'Feature Engineering', icon: 'bar_chart_4_bars', id: 'featureEngineering' },
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
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] min-h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Precision Navigation Bar */}
      <nav className="h-16 border-b border-white/10 bg-[#0a0e17]/80 backdrop-blur-2xl px-8 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer group" onClick={() => onNavigate('hub')}>
          <div className="flex items-center justify-center bg-[#0d59f2] w-10 h-10 rounded shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-xl font-bold tracking-tight text-white">QuantAgrify</h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-white uppercase mt-1">WEALTH FROM AGRI</span>
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
          <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d59f2] transition-colors">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* Control Strip */}
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0d1117]/40 px-8 py-3 z-50 shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded border border-white/5">
            <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest">Active Project:</span>
            <span className="text-xs font-bold text-white uppercase tracking-tight">Soybean_Alpha_Ensemble</span>
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs font-bold text-[#90a4cb] hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span> Version 2.4.1
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <button className="bg-[#0d59f2] text-white px-6 h-10 rounded font-black text-[10px] uppercase tracking-widest hover:bg-[#1a66ff] transition-all shadow-lg shadow-[#0d59f2]/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">play_circle</span> Deploy Pipeline
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 glass-panel flex flex-col shrink-0">
          <div className="p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#90a4cb] mb-8 opacity-50">Orchestration Layers</p>
            <nav className="flex flex-col gap-3">
              {pipelineLayers.map((layer) => (
                <div 
                  key={layer.name}
                  onClick={() => layer.id && onNavigate(layer.id as any)}
                  className={`flex items-center justify-between px-5 py-4 rounded-xl transition-all cursor-pointer border ${
                    layer.active 
                    ? 'bg-[#0d59f2]/10 text-white border-[#0d59f2]/30 shadow-[0_0_20px_rgba(13,89,242,0.1)]' 
                    : 'text-[#90a4cb] border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined text-xl ${layer.active ? 'text-[#0d59f2]' : 'opacity-40'}`}>{layer.icon}</span>
                    <p className="text-xs font-bold uppercase tracking-widest">{layer.name}</p>
                  </div>
                  {layer.active && <span className="w-1.5 h-1.5 rounded-full bg-[#0d59f2]"></span>}
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-8">
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0d59f2]"></div>
              <span className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest opacity-60">Compute Health</span>
              <div className="flex items-center justify-between mt-3 mb-2">
                <span className="text-xs font-bold text-white font-mono tracking-tight">Node Cluster B</span>
                <span className="text-xs font-bold text-[#0d59f2] font-mono">74%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-[#0d59f2] h-full w-[74%] rounded-full shadow-[0_0_10px_#0d59f2]"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Workflow Canvas */}
        <main className="flex-1 bg-[#05070a] relative overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#0d59f2 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>

          <div className="relative w-full h-full flex items-center justify-center gap-16">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 320 300 L 480 300" fill="none" stroke="#0d59f2" strokeWidth="2" className="animate-flow opacity-60" />
              <path d="M 680 300 L 840 300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </svg>
            
            {/* Professional Nodes */}
            <div className="w-64 glass-panel p-5 rounded-2xl shadow-2xl relative group hover:border-[#0d59f2]/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm opacity-50">database</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#90a4cb]">Ingest</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <p className="font-bold text-sm text-white uppercase tracking-tight">Global_Soy_Futures</p>
              <p className="text-[10px] text-[#90a4cb] font-mono mt-1 opacity-60">SCHEMA: TIME_SERIES_V2</p>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel flex items-center justify-center border-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
            </div>

            <div className="w-72 glass-panel p-6 rounded-3xl border-2 border-[#0d59f2]/40 shadow-[0_0_40px_rgba(13,89,242,0.2)] relative scale-110 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d59f2] text-lg">filter_alt</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0d59f2]">Processor</span>
                </div>
                <span className="material-symbols-outlined text-[#0bda5e] text-sm">verified</span>
              </div>
              <p className="font-bold text-base text-white tracking-tighter uppercase">Kalman Signal Filter</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded text-[#90a4cb] font-mono">Q_VAL=1e-3</span>
                <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded text-[#90a4cb] font-mono">R_VAL=0.1</span>
              </div>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0d59f2] flex items-center justify-center shadow-[0_0_15px_#0d59f2]">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></div>
              </div>
            </div>

            <div className="w-64 glass-panel p-5 rounded-2xl opacity-40 border-dashed relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-sm opacity-50">add_box</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Next Layer</span>
              </div>
              <p className="font-bold text-sm italic opacity-50">Select Logic Module...</p>
            </div>
          </div>
        </main>

        {/* Logic Panel */}
        <aside className="w-[450px] glass-panel flex flex-col z-20 shrink-0">
          <div className="flex border-b border-white/5 h-14 shrink-0">
            {['Logic Library', 'Params', 'Security'].map((tab, i) => (
              <button key={tab} className={`flex-1 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${i === 0 ? 'border-[#0d59f2] text-white' : 'border-transparent text-[#90a4cb] hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <section>
              <h3 className="text-xs font-black text-[#90a4cb] uppercase tracking-[0.4em] mb-6 opacity-60">System Templates</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 rounded-2xl border-2 border-[#0d59f2] bg-[#0d59f2]/5 relative group cursor-pointer transition-all">
                  <span className="material-symbols-outlined absolute top-4 right-4 text-[#0d59f2] text-sm">check_circle</span>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">Kalman State Filter</p>
                  <p className="text-[11px] text-[#90a4cb] mt-1 leading-relaxed">Dynamic state estimation for high-frequency volatility smoothing.</p>
                </div>
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 cursor-pointer transition-all opacity-60 hover:opacity-100">
                  <p className="text-sm font-bold text-white uppercase tracking-tight">Z-Score Normalization</p>
                  <p className="text-[11px] text-[#90a4cb] mt-1 leading-relaxed">Outlier detection using rolling standard deviations.</p>
                </div>
              </div>
            </section>

            <section className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-[#90a4cb] uppercase tracking-[0.4em] opacity-60">Python Logic Preview</h3>
                <span className="text-[10px] font-mono text-[#0d59f2]">v3.12</span>
              </div>
              <div className="flex-1 glass-panel bg-[#05070a]/80 rounded-2xl overflow-hidden text-[12px] p-6 font-mono text-slate-300 shadow-inner">
<pre><code><span className="text-[#0d59f2]">import</span> numpy <span className="text-[#0d59f2]">as</span> np
<span className="text-amber-500">def</span> <span className="text-[#0d59f2]">kalman</span>(z, q=1e-3, r=0.1):
    x_hat = z[0]
    p = 1.0
    res = []
    <span className="text-amber-500">for</span> i <span className="text-amber-500">in</span> z:
        p += q
        k = p / (p + r)
        x_hat += k * (i - x_hat)
        p = (1 - k) * p
        res.append(x_hat)
    <span className="text-amber-500">return</span> res</code></pre>
              </div>
            </section>

            <button className="w-full h-14 rounded-2xl bg-[#0d59f2] text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-[#0d59f2]/20 hover:bg-[#1a66ff] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              Validate Logic Block
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
