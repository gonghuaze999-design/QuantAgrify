import React from 'react';

interface ApiConsoleProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'apiDocs' | 'apiLogs') => void;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const, active: true }
  ];

  const metrics = [
    { label: 'Request Success', val: '99.92%', icon: 'check_circle', trend: '+0.04%', color: 'text-[#0bda5e]' },
    { label: 'P95 Latency', val: '14.2ms', icon: 'speed', trend: '+2.1ms', color: 'text-[#0d59f2]' },
    { label: 'Data Throughput', val: '1.2M r/s', icon: 'bolt', trend: 'OPTIMAL', color: 'text-amber-500' },
    { label: 'Compute Nodes', val: '128', icon: 'dns', trend: 'ACTIVE', color: 'text-[#90a4cb]' }
  ];

  return (
    <div className="bg-[#05070a] text-slate-100 font-['Space_Grotesk'] min-h-screen flex flex-col selection:bg-[#0d59f2]/30">
      {/* Global Precision Header */}
      <header className="w-full bg-[#0a0e17]/80 border-b border-white/10 sticky top-0 z-[100] h-16 shrink-0 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-10 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 w-[240px] cursor-pointer group" onClick={() => onNavigate('hub')}>
            <div className="bg-[#0d59f2] w-10 h-10 rounded flex items-center justify-center shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-tighter text-white leading-none">QuantAgrify</h1>
              <span className="text-[9px] font-black tracking-[0.4em] text-slate-500 mt-0.5 uppercase opacity-60">System Infrastructure</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-12 h-full">
            {navItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => item.view !== 'api' && onNavigate(item.view)}
                className={`h-full flex items-center px-1 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-[3px] ${item.active ? 'border-[#0d59f2] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 w-[240px] justify-end">
            <div className="hidden xl:flex items-center gap-3 px-4 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-black">99.98% UPTIME</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-navigation & Search */}
      <div className="w-full bg-[#0d1117]/60 border-b border-white/5 py-4 shrink-0 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {['Connection Monitor', 'Security Audit', 'API Configuration'].map((tab, i) => (
              <button key={tab} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${i === 0 ? 'text-[#0d59f2]' : 'text-slate-400 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 max-w-lg mx-12">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-[#0d59f2] transition-colors">search</span>
              <input className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-2 text-[10px] text-white placeholder:text-slate-500 focus:border-[#0d59f2] outline-none font-bold uppercase tracking-widest transition-all" placeholder="Search operational logs, endpoints, or nodes..." />
            </div>
          </div>
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"><span className="material-symbols-outlined text-xl">notifications</span></button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"><span className="material-symbols-outlined text-xl">settings_input_hdmi</span></button>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-10 py-10 flex-1 overflow-y-auto custom-scrollbar w-full">
        {/* Module Tabs */}
        <div className="mb-10 flex gap-10 border-b border-white/5">
          <button onClick={() => onNavigate('api')} className="flex items-center gap-2 border-b-2 border-[#0d59f2] text-[#0d59f2] pb-5 font-black text-[11px] uppercase tracking-[0.3em]">
            <span className="material-symbols-outlined text-lg">monitoring</span> Network Pulse
          </button>
          <button onClick={() => onNavigate('apiDocs')} className="flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-white pb-5 font-black text-[11px] uppercase tracking-[0.3em] transition-all">
            <span className="material-symbols-outlined text-lg">description</span> API Documentation
          </button>
          <button onClick={() => onNavigate('apiLogs')} className="flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-white pb-5 font-black text-[11px] uppercase tracking-[0.3em] transition-all">
            <span className="material-symbols-outlined text-lg">terminal</span> System Console
          </button>
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Streaming Infrastructure</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Regional Clusters: Frankfurt / Chicago / Singapore active
              </p>
            </div>
            <button className="px-6 py-3 bg-[#0d59f2]/10 text-[#0d59f2] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-[#0d59f2]/20 hover:bg-[#0d59f2] hover:text-white transition-all shadow-lg shadow-[#0d59f2]/10">
              Refresh Infrastructure
            </button>
          </div>

          {/* Metrics Precision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m) => (
              <div key={m.label} className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <span className={`material-symbols-outlined text-5xl ${m.color}`}>{m.icon}</span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</p>
                  <span className={`material-symbols-outlined text-lg ${m.color}`}>{m.icon}</span>
                </div>
                <p className="text-3xl font-black leading-none font-mono tracking-tighter">{m.val}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${m.trend.startsWith('+') && m.label.includes('Latency') ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{m.trend}</span>
                  <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest opacity-40">Benchmark v1.0</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feed Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'CME Chicago L1', status: 'SYNCHRONIZED', latency: '8ms', integrity: '100%', color: 'text-[#0bda5e]', icon: 'show_chart' },
              { name: 'ZCE Zhengzhou Feed', status: 'LATENCY_WARN', latency: '22ms', integrity: '99.8%', color: 'text-amber-500', icon: 'analytics' },
              { name: 'Quant Engine Cluster', status: 'IO_CRITICAL', latency: '184ms', integrity: '92.4%', color: 'text-rose-500', icon: 'hub', alert: true }
            ].map((feed) => (
              <div key={feed.name} className={`flex flex-col gap-6 p-8 rounded-3xl border transition-all ${feed.alert ? 'bg-rose-500/[0.03] border-rose-500/20' : 'glass-panel border-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-2xl ${feed.alert ? 'text-rose-500' : 'text-[#0d59f2]'}`}>{feed.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base uppercase tracking-tight">{feed.name}</h3>
                      <p className={`text-[9px] flex items-center gap-2 font-black uppercase tracking-widest ${feed.color} mt-1`}>
                        <span className={`size-1.5 rounded-full ${feed.alert ? 'bg-rose-500 animate-pulse' : 'bg-[#0bda5e]'}`}></span> {feed.status}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <span>Signal Latency</span>
                    <span className={`font-mono ${feed.alert ? 'text-rose-500' : 'text-slate-200'}`}>{feed.latency}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${feed.alert ? 'bg-rose-500 w-[85%]' : 'bg-[#0d59f2] w-[15%]'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* High Fidelity Terminal */}
          <div className="mt-8 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 rounded-3xl bg-black border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-rose-500/20 border border-rose-500/40"></div>
                    <div className="size-3 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                    <div className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">ssh_tunnel // ops@infra-cluster-01</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-mono text-emerald-500 font-black tracking-widest">BUFFER: 4.2GB FREE</span>
                  <button className="material-symbols-outlined text-slate-500 text-lg hover:text-white transition-colors">terminal</button>
                </div>
              </div>
              <div className="p-8 font-mono text-[13px] leading-loose overflow-y-auto max-h-[500px] custom-scrollbar text-slate-400">
                <div className="mb-2"><span className="text-[#0d59f2] font-black">[14:22:01]</span> <span className="text-[#0bda5e] font-black">STMT:</span> HANDSHAKE SUCCESSFUL via CME_GATEWAY_SECURE...</div>
                <div className="mb-2"><span className="text-[#0d59f2] font-black">[14:22:04]</span> <span className="text-[#0bda5e] font-black">STMT:</span> mTLS_AUTH_COMPLETED. SESSION_TTL: 3600s.</div>
                <div className="mb-2"><span className="text-[#0d59f2] font-black">[14:25:55]</span> <span className="text-amber-500 font-black">WARN:</span> JITTER_SPIKE detected on Node-ZCE-02. SHIFTING_LB...</div>
                <div className="mb-4 bg-rose-500/5 px-4 py-3 border-l-2 border-rose-500 rounded-r text-rose-100">
                  <span className="text-[#0d59f2] font-black">[14:28:44]</span> <span className="text-rose-500 font-black">FATAL:</span> QUANT_BACKTEST_PIPELINE(0x77A) EXITED WITH TIMEOUT_ERR.
                  <div className="mt-1 opacity-50 text-[11px]">Dumping stack trace to /var/logs/crash_dump_x32.bin</div>
                </div>
                <div className="mb-2"><span className="text-[#0d59f2] font-black">[14:30:05]</span> <span className="text-slate-500 font-bold">INFO:</span> CACHE_INVALIDATION triggered for Region [CN-ZCE-SOY].</div>
                <div className="animate-pulse text-[#0d59f2] font-black mt-6">QUANT_OS_V4.0_PROMPT: ❯ _</div>
              </div>
            </div>

            {/* AI Insight Assistant Sidebar */}
            <div className="w-full lg:w-96 flex flex-col gap-8">
              <div className="rounded-[32px] border border-[#0d59f2]/30 bg-[#0d59f2]/5 p-8 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-[#0d59f2] text-2xl animate-pulse">auto_awesome</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#0d59f2]">Neural Diagnostics</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-5 glass-panel bg-white/5 rounded-2xl border-white/10 shadow-lg">
                    <p className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-widest">Incident Identified</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-bold">Timeout in <span className="font-mono text-[#0d59f2]">0x77A</span> is likely due to concurrent WASDE data ingestion overflow.</p>
                  </div>
                  <div className="p-5 glass-panel bg-white/5 rounded-2xl border-white/10 shadow-lg">
                    <p className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest">Performance Optimization</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-bold">ZCE node stability is decreasing. Suggesting swap to Singapore Backup Cluster.</p>
                  </div>
                </div>
                <button className="w-full mt-10 py-4 bg-[#0d59f2] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-[#1a66ff] transition-all">Resolve Stack</button>
              </div>

              <div className="glass-panel rounded-3xl p-8 border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-500">Security Log Highlights</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-[#0bda5e] text-lg mt-0.5">security_update_good</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white uppercase tracking-tight">Key Rotation Complete</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">4h 12m AGO // SEC_OPS</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">policy</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white uppercase tracking-tight">IP Anomaly Blocked</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">12h 05m AGO // FIREWALL_B</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};