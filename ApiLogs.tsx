import React from 'react';
import { SystemClock } from './SystemClock';

interface ApiLogsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'apiDocs' | 'apiLogs') => void;
}

export const ApiLogs: React.FC<ApiLogsProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const, active: true }
  ];

  const subNavItems = [
    { label: 'CONNECTION MONITOR', icon: 'sensors', view: 'api' as const },
    { label: 'API DOCUMENTATION', icon: 'menu_book', view: 'apiDocs' as const },
    { label: 'LOGS CENTER', icon: 'terminal', view: 'apiLogs' as const, active: true }
  ];

  return (
    <div className="bg-[#05070a] text-slate-100 font-['Space_Grotesk'] h-screen flex flex-col selection:bg-[#0d59f2]/30 overflow-hidden">
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
                onClick={() => tab.view !== 'apiLogs' && onNavigate(tab.view)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${tab.active ? 'text-[#0d59f2]' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                {tab.active && <div className="absolute -bottom-4 left-0 w-full h-[2px] bg-[#0d59f2] shadow-[0_0_10px_#0d59f2]"></div>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live:</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-10 py-6 flex-1 w-full overflow-hidden flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800 shadow-sm text-left">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
            <input className="w-full bg-slate-800/30 border-slate-700 rounded-md pl-10 pr-4 py-1.5 text-xs text-white focus:ring-1 focus:ring-[#0d59f2] outline-none" placeholder="Search keyword highlighting..." type="text" />
          </div>
          <button className="px-4 py-1.5 bg-[#0d59f2] text-white text-xs font-black uppercase rounded tracking-widest">Export</button>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          <div className="col-span-12 flex flex-col rounded-xl bg-[#0a0e17] border border-slate-800 overflow-hidden shadow-2xl text-left">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">root@quant-ops-log-stream:/var/log/main.tail -f</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Tailing System-wide Logs</span>
              </div>
            </div>
            <div className="flex-1 p-5 font-mono text-[13px] leading-relaxed overflow-y-auto custom-scrollbar text-slate-400">
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:01.002</span> <span className="text-emerald-500 font-bold">INFO</span> Platform Core Initialized successfully.
              </div>
              <div className="bg-rose-500/10 text-slate-200 px-3 py-1.5 border-l-4 border-rose-500 rounded-r my-2">
                <span className="text-slate-400">2023-10-27 14:45:04.887</span> <span className="text-rose-500 font-bold">ERROR</span> Global Load Balancer high-latency warning (Region: US-East)
              </div>
              <div className="animate-pulse text-[#0d59f2] font-bold mt-4">_</div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0e17; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};