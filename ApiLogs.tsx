import React from 'react';

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

  return (
    <div className="bg-[#0a0f1a] text-slate-100 font-['Space_Grotesk'] min-h-screen flex flex-col selection:bg-[#0d59f2]/30">
      {/* Global Header */}
      <header className="w-full bg-[#111827] border-b border-slate-800 sticky top-0 z-[100] h-16 shrink-0">
        <div className="max-w-[1440px] mx-auto px-10 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-[240px] cursor-pointer" onClick={() => onNavigate('hub')}>
            <div className="bg-[#0d59f2] w-10 h-10 rounded flex items-center justify-center shadow-lg shadow-[#0d59f2]/20">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>agriculture</span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">QuantAgrify</h1>
              <span className="text-[9px] font-bold tracking-[0.15em] text-slate-500 mt-0.5 uppercase">BIG DATA PLATFORM</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 h-full">
            {navItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => item.view !== 'api' && onNavigate(item.view)}
                className={`h-full flex items-center px-1 text-sm font-semibold transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 min-w-[200px] justify-end">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">99.98%</span>
            </div>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 border border-slate-700 cursor-pointer" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDVndWusPYa4AViWO2CCxZ2pu95nNHg-ZmGy7Zgbgw9CE62xkghsiZnjoIHwyTNgKWyL8b45Ezho6m9mz1IdFhO-F3jqnP6k0Ip7Lw768G2yn00CljOBCUFACFgjw4WXBQMHZFdpsIMYbVzmbQ6BRC6IO9llWI9KDK9qsjGXuQVK68MXKQt8XzGXc4nP34lJsRyBqKnk57ihjRk4FCqRD6rCVvhxsJBR5X8__OaCF8swFWIXz5CMhSSMAfO0UchQ9seefOUrnrKZzE')" }}></div>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="w-full bg-slate-900/50 border-b border-slate-800 py-3 shrink-0">
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex border-slate-800 gap-6">
              <button onClick={() => onNavigate('api')} className="flex items-center gap-2 text-slate-400 hover:text-[#0d59f2] font-bold text-xs transition-all uppercase">
                <span className="material-symbols-outlined text-sm">monitoring</span>
                Connection Monitor
              </button>
              <button onClick={() => onNavigate('apiDocs')} className="flex items-center gap-2 text-slate-400 hover:text-[#0d59f2] font-bold text-xs transition-all uppercase">
                <span className="material-symbols-outlined text-sm">description</span>
                API Docs
              </button>
              <button onClick={() => onNavigate('apiLogs')} className="flex items-center gap-2 text-[#0d59f2] border-b-2 border-[#0d59f2] font-bold text-xs transition-all uppercase pb-0.5">
                <span className="material-symbols-outlined text-sm">terminal</span>
                Ops Log Center
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Feed:</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-tight">Connected</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-10 py-6 flex-1 w-full overflow-hidden flex flex-col gap-6">
        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <span className="material-symbols-outlined text-slate-500 text-lg">schedule</span>
            <select className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-slate-300">
              <option>Last 15 Minutes</option>
              <option>Last 1 Hour</option>
              <option>Last 24 Hours</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Levels:</span>
            <div className="flex gap-1.5">
              <button className="px-2 py-1 rounded bg-slate-800 text-[10px] font-black text-slate-400 border border-slate-700 hover:border-[#0d59f2] transition-colors">INFO</button>
              <button className="px-2 py-1 rounded bg-amber-500/10 text-[10px] font-black text-amber-500 border border-amber-500/30">WARN</button>
              <button className="px-2 py-1 rounded bg-rose-500/10 text-[10px] font-black text-rose-500 border border-rose-500/30">ERROR</button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source:</span>
            <select className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-slate-300">
              <option>All Sources</option>
              <option>Web Server</option>
              <option>Quant Engine</option>
              <option>Database</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
            <input className="w-full bg-slate-800/30 border-slate-700 rounded-md pl-10 pr-4 py-1.5 text-xs text-white focus:ring-1 focus:ring-[#0d59f2] outline-none" placeholder="Search keyword highlighting..." type="text" />
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#0d59f2] text-white text-xs font-black uppercase rounded hover:bg-blue-600 transition-all tracking-widest">
            <span className="material-symbols-outlined text-sm">download</span> Export
          </button>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          {/* Main Terminal Section */}
          <div className="col-span-12 lg:col-span-9 flex flex-col rounded-xl bg-[#0a0e17] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-rose-500/50"></div>
                  <div className="size-2.5 rounded-full bg-amber-500/50"></div>
                  <div className="size-2.5 rounded-full bg-emerald-500/50"></div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">root@quant-ops-log-stream:/var/log/main.tail -f</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Tailing</span>
                </div>
                <button className="material-symbols-outlined text-slate-500 text-sm hover:text-white transition-colors">settings</button>
              </div>
            </div>
            <div className="flex-1 p-5 font-mono text-[13px] leading-relaxed overflow-y-auto custom-scrollbar text-slate-400">
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:01.002</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[web-server-01]</span> GET /api/v2/market/stream/cme - 200 OK (12ms)
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:01.442</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[quant-engine-alpha]</span> Processing signal 'SOY-FUT-DEC' for cluster 'Asia-S'
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:02.109</span> <span className="text-amber-500 font-bold">WARN</span> <span className="text-slate-500">[db-main]</span> Query execution time (450ms) exceeding threshold (200ms) on 'trades_historical'
              </div>
              <div className="bg-rose-500/10 text-slate-200 px-3 py-1.5 border-l-4 border-rose-500 rounded-r my-2">
                <span className="text-slate-400">2023-10-27 14:45:04.887</span> <span className="text-rose-500 font-bold">ERROR</span> <span className="text-slate-500">[quant-engine-alpha]</span> FATAL: Buffer overflow in backtest pipeline 0x77A - Context: overflow_size=2.4MB
                <div className="mt-1 text-[11px] text-slate-500 ml-4 font-mono opacity-80 italic">
                  at Engine.Backtest.Process (pipeline.go:124)<br/>
                  at Engine.Stream.Listener (listener.go:58)
                </div>
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:05.101</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[ops-autoscaler]</span> Scaling group 'quant-workers' +2 nodes (Total: 130)
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:06.002</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[web-server-01]</span> WebSocket handshake successful for client 192.168.1.144
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:06.912</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[quant-engine-beta]</span> Heartbeat OK
              </div>
              <div className="mb-1">
                <span className="text-slate-600">2023-10-27 14:45:08.221</span> <span className="text-emerald-500 font-bold">INFO</span> <span className="text-slate-500">[db-main]</span> Successfully compacted partition 'logs_2023_10'
              </div>
              <div className="mb-1 italic">
                <span className="text-slate-600">2023-10-27 14:45:09.400</span> <span className="text-slate-500 font-bold">DEBUG</span> <span className="text-slate-500">[auth-provider]</span> Session validated for user 'admin_root'
              </div>
              <div className="animate-pulse text-[#0d59f2] font-bold mt-4">_</div>
            </div>
            <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center">
              <span className="text-[#0d59f2] font-mono text-sm mr-2 pl-2">❯</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm font-mono text-slate-300 w-full placeholder:text-slate-700 outline-none" placeholder="Type a command or filter regex..." type="text" />
            </div>
          </div>

          {/* AI Analyzer Sidebar */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="rounded-xl border border-[#0d59f2]/30 bg-[#0d59f2]/5 p-5 relative overflow-hidden flex-1 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#0d59f2] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0d59f2]">AI Log Analyzer</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 shadow-sm transition-all hover:border-[#0d59f2]/50 group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-rose-500 text-base">emergency_home</span>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Active Pattern</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    The <span className="text-[#0d59f2] font-black">0x77A Timeout</span> error in Quant Engine is matching a known signature of 'Inbound Buffer Overflow'.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Suggested Fix:</div>
                    <div className="bg-slate-800 p-2 rounded text-[10px] font-mono text-slate-300 border border-slate-700 group-hover:border-[#0d59f2]/30">
                      config set engine.buffer.max_size 4096MB
                    </div>
                    <button className="mt-1 w-full py-2 bg-[#0d59f2]/10 text-[#0d59f2] text-[10px] font-black uppercase rounded border border-[#0d59f2]/20 hover:bg-[#0d59f2] hover:text-white transition-all tracking-widest">
                      Execute Recommendation
                    </button>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 shadow-sm transition-all hover:border-amber-500/50 group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-amber-500 text-base">analytics</span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Performance Insight</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    DB Query latency is trending up by <span className="text-amber-500 font-black">12%</span> over the last 15 minutes. High correlation with 'Soybean' batch updates.
                  </p>
                  <button className="mt-2 text-[10px] font-black text-[#0d59f2] flex items-center gap-1 hover:underline uppercase tracking-widest">
                    Correlation Map <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 p-5 bg-slate-900/40">
              <h3 className="text-xs font-black mb-4 flex items-center gap-2 uppercase text-slate-500 tracking-widest">
                <span className="material-symbols-outlined text-lg">router</span>
                Live Nodes
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Web-Server-01', status: 'OK', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { name: 'Quant-Alpha', status: 'ERR', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                  { name: 'DB-Main-Master', status: 'LOAD', color: 'text-amber-500', bg: 'bg-amber-500/10' }
                ].map((node) => (
                  <div key={node.name} className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-tight">{node.name}</span>
                    <span className={`px-1.5 py-0.5 rounded ${node.bg} ${node.color} font-black uppercase text-[9px]`}>{node.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Volume Charts Footer area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-slate-900/40 rounded-xl border border-slate-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d59f2]">bar_chart</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Log Volume Trends</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter">
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0d59f2]"></span> INFO</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500"></span> WARN</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500"></span> ERROR</div>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-2 h-24 pb-2">
              {[0.6, 0.75, 0.45, 0.9, 0.65, 0.8, 0.55].map((h, i) => (
                <div key={i} className="flex-1 bg-slate-800 rounded-t relative group transition-all" style={{ height: `${h * 100}%` }}>
                  <div className="absolute bottom-0 w-full bg-[#0d59f2]/40 rounded-t group-hover:bg-[#0d59f2] transition-all" style={{ height: '70%' }}></div>
                  <div className="absolute bottom-0 w-full bg-rose-500/60 rounded-t" style={{ height: `${(i % 3 === 0 ? 0.2 : 0.05) * 100}%` }}></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Errors (Last 1H)</p>
              <p className="text-2xl font-black text-rose-500 tabular-nums">1,242 <span className="text-xs font-medium text-slate-500 ml-1 uppercase tracking-widest font-display">events</span></p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Throughput</p>
              <p className="text-xl font-black text-white tabular-nums">14.2 GB<span className="text-xs font-medium text-slate-500 ml-1 uppercase tracking-widest font-display">/day</span></p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating help button */}
      <button className="fixed bottom-6 right-6 size-12 bg-[#0d59f2] text-white rounded-full shadow-lg shadow-[#0d59f2]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined">help</span>
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0e17; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
      `}</style>
    </div>
  );
};