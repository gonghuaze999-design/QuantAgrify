import React from 'react';
import { SystemClock } from './SystemClock';

interface ApiDocsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'apiDocs' | 'apiLogs') => void;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const, active: true }
  ];

  const subNavItems = [
    { label: 'CONNECTION MONITOR', icon: 'sensors', view: 'api' as const },
    { label: 'API DOCUMENTATION', icon: 'menu_book', view: 'apiDocs' as const, active: true },
    { label: 'LOGS CENTER', icon: 'terminal', view: 'apiLogs' as const }
  ];

  return (
    <div className="bg-[#05070a] text-slate-100 font-['Space_Grotesk'] h-screen flex flex-col selection:bg-[#0d59f2]/30">
      {/* Global Navigation - Row 1 */}
      <nav className="h-16 border-b border-[#222f49] bg-[#05070a] px-6 flex items-center justify-between z-[110] shrink-0">
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
              onClick={() => !item.active && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 w-80">
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* Sub Navigation Bar - Row 2 */}
      <div className="w-full bg-slate-900/50 border-b border-slate-800 py-4 z-[100] backdrop-blur-xl shrink-0">
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {subNavItems.map((tab) => (
              <button 
                key={tab.label} 
                onClick={() => tab.view !== 'apiDocs' && onNavigate(tab.view)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${tab.active ? 'text-[#0d59f2]' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                {tab.active && <div className="absolute -bottom-4 left-0 w-full h-[2px] bg-[#0d59f2] shadow-[0_0_10px_#0d59f2]"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] mx-auto w-full flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-slate-800 flex flex-col bg-[#05070a] custom-scrollbar overflow-y-auto shrink-0 text-left">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input className="w-full bg-slate-900 border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#0d59f2] focus:border-[#0d59f2] outline-none" placeholder="Search endpoints..." />
            </div>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Data Stream</h3>
              <div className="space-y-1 text-slate-400">
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-emerald-500 font-mono font-bold text-[10px]">GET</span>
                  <span className="font-medium truncate hover:text-slate-100">/v1/stream/market</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Model Execution</h3>
              <div className="space-y-1">
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded bg-[#0d59f2]/10 border-r-2 border-[#0d59f2] text-[#0d59f2] transition-colors" href="#">
                  <span className="font-mono font-bold text-[10px]">POST</span>
                  <span className="font-medium truncate">/v1/model/execute</span>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Documentation Content */}
        <section className="flex-1 border-r border-slate-800 overflow-y-auto custom-scrollbar bg-[#05070a] text-left">
          <div className="p-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#0d59f2]/10 text-[#0d59f2] font-mono px-2 py-1 rounded text-xs font-bold">POST</span>
              <h2 className="text-2xl font-bold tracking-tight text-white">/v1/model/execute</h2>
            </div>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Triggers the immediate execution of a pre-configured quantitative strategy model. This endpoint supports asynchronous processing for heavy computational loads.
            </p>
            
            <div className="space-y-10">
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
                <h3 className="text-sm font-bold border-b border-slate-800 pb-3 mb-4 text-white uppercase tracking-wide">
                  Response <span className="text-emerald-500 ml-2 font-mono text-[10px]">200 OK</span>
                </h3>
                <div className="font-mono text-[13px] leading-relaxed text-slate-300">
                  <pre>{`{ "status": "QUEUED", "execution_id": "exec_44921_x32" }`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Code Playground Sidebar */}
        <aside className="w-[420px] flex flex-col bg-[#0d1117] overflow-y-auto custom-scrollbar shrink-0 text-left">
          <div className="p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Code Playground</h3>
            <div className="bg-[#0a0c10] rounded-xl border border-slate-800 overflow-hidden mb-8 shadow-2xl">
              <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">execute.py</span>
                <button className="material-symbols-outlined text-sm text-slate-500">content_copy</button>
              </div>
              <div className="p-5 font-mono text-[12px] leading-relaxed text-slate-300">
                <pre>import requests<br/>url = "https://api.quantagrify.io/v1/..."</pre>
              </div>
            </div>
            <button className="w-full py-4 bg-[#0d59f2] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">Try it out</button>
          </div>
        </aside>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};