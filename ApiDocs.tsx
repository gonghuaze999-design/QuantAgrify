import React from 'react';

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

      {/* Sub Navigation */}
      <div className="w-full bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto px-10 flex items-center gap-8">
          <button onClick={() => onNavigate('api')} className="flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-white py-4 font-bold text-sm transition-all">
            <span className="material-symbols-outlined text-lg">monitoring</span>
            Connection Monitor
          </button>
          <button onClick={() => onNavigate('apiDocs')} className="flex items-center gap-2 border-b-2 border-[#0d59f2] text-[#0d59f2] py-4 font-bold text-sm tracking-wide">
            <span className="material-symbols-outlined text-lg">description</span>
            API Docs
          </button>
          <button onClick={() => onNavigate('apiLogs')} className="flex items-center gap-2 border-b-2 border-transparent text-slate-400 hover:text-white py-4 font-bold text-sm transition-all">
            <span className="material-symbols-outlined text-lg">terminal</span>
            Ops Log Center
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] mx-auto w-full flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-slate-800 flex flex-col bg-[#0a0f1a] custom-scrollbar overflow-y-auto shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input className="w-full bg-slate-900 border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#0d59f2] focus:border-[#0d59f2] outline-none" placeholder="Search endpoints..." />
            </div>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Data Stream</h3>
              <div className="space-y-1">
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-emerald-500 font-mono font-bold text-[10px]">GET</span>
                  <span className="font-medium truncate text-slate-400 hover:text-slate-100">/v1/stream/market</span>
                </a>
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-emerald-500 font-mono font-bold text-[10px]">GET</span>
                  <span className="font-medium truncate text-slate-400 hover:text-slate-100">/v1/stream/history</span>
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
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-[#0d59f2] font-mono font-bold text-[10px]">POST</span>
                  <span className="font-medium truncate text-slate-400 hover:text-slate-100">/v1/model/backtest</span>
                </a>
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors text-slate-600" href="#">
                  <span className="text-rose-500 font-mono font-bold text-[10px]">DEL</span>
                  <span className="font-medium truncate">/v1/model/instance</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">User Management</h3>
              <div className="space-y-1">
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-emerald-500 font-mono font-bold text-[10px]">GET</span>
                  <span className="font-medium truncate text-slate-400 hover:text-slate-100">/v1/user/keys</span>
                </a>
                <a className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors" href="#">
                  <span className="text-[#0d59f2] font-mono font-bold text-[10px]">POST</span>
                  <span className="font-medium truncate text-slate-400 hover:text-slate-100">/v1/user/rotate</span>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Documentation Content */}
        <section className="flex-1 border-r border-slate-800 overflow-y-auto custom-scrollbar bg-[#0a0f1a]">
          <div className="p-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#0d59f2]/10 text-[#0d59f2] font-mono px-2 py-1 rounded text-xs font-bold">POST</span>
              <h2 className="text-2xl font-bold tracking-tight text-white">/v1/model/execute</h2>
            </div>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Triggers the immediate execution of a pre-configured quantitative strategy model. This endpoint supports asynchronous processing for heavy computational loads and provides a unique execution ID for status monitoring.
            </p>
            
            <div className="space-y-10">
              <div>
                <h3 className="text-sm font-bold border-b border-slate-800 pb-3 mb-4 flex items-center gap-2 text-white uppercase tracking-wide">
                  <span className="material-symbols-outlined text-sm text-[#0d59f2]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span> Authentication
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">Requires Bearer Token authentication. Use the <code className="bg-slate-800 px-1.5 py-0.5 rounded text-[#0d59f2] font-mono">X-API-KEY</code> header for server-to-server requests.</p>
              </div>

              <div>
                <h3 className="text-sm font-bold border-b border-slate-800 pb-3 mb-4 text-white uppercase tracking-wide">Body Parameters</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-1/3">
                      <p className="text-xs font-mono font-bold text-slate-100">model_id</p>
                      <p className="text-[9px] text-rose-500 uppercase font-black tracking-tighter mt-1">Required</p>
                    </div>
                    <div className="w-2/3">
                      <p className="text-[11px] text-slate-500 mb-1 italic">string (uuid)</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Unique identifier of the validated strategy model to execute.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1/3">
                      <p className="text-xs font-mono font-bold text-slate-100">parameters</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-1">Optional</p>
                    </div>
                    <div className="w-2/3">
                      <p className="text-[11px] text-slate-500 mb-1 italic">object</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Key-value pairs to override model default environment variables.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1/3">
                      <p className="text-xs font-mono font-bold text-slate-100">priority</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-1">Optional</p>
                    </div>
                    <div className="w-2/3">
                      <p className="text-[11px] text-slate-500 mb-1 italic">integer [0, 10]</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Execution queue priority. Higher values bypass standard processing queues.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold border-b border-slate-800 pb-3 mb-4 text-white uppercase tracking-wide">
                  Response <span className="text-emerald-500 ml-2 font-mono text-[10px]">200 OK</span>
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-800 font-mono text-[13px] leading-relaxed">
                  <pre className="text-slate-300">
{`{
  "`}<span className="text-[#0d59f2]">status</span>{`": "`}<span className="text-emerald-500">QUEUED</span>{`",
  "`}<span className="text-[#0d59f2]">execution_id</span>{`": "`}<span className="text-amber-500">exec_44921_x32</span>{`",
  "`}<span className="text-[#0d59f2]">timestamp</span>{`": "`}<span className="text-slate-500">2023-11-15T10:30:00Z</span>{`",
  "`}<span className="text-[#0d59f2]">nodes_allocated</span>{`": `}<span className="text-slate-500">4</span>{`
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Code Playground Sidebar */}
        <section className="w-[420px] flex flex-col bg-[#0d1117] overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Code Playground</h3>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button className="px-3 py-1 text-[10px] font-black uppercase bg-slate-700 text-white rounded shadow-sm transition-all">Python</button>
                <button className="px-3 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-100 transition-all">Node.js</button>
                <button className="px-3 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-100 transition-all">Curl</button>
              </div>
            </div>
            
            <div className="bg-[#0a0c10] rounded-xl border border-slate-800 overflow-hidden mb-8 shadow-2xl">
              <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">execute.py</span>
                <button className="material-symbols-outlined text-sm text-slate-500 hover:text-white transition-colors">content_copy</button>
              </div>
              <div className="p-5 font-mono text-[12px] leading-relaxed text-slate-300 overflow-x-auto custom-scrollbar">
<pre>
<span className="text-[#0d59f2]">import</span> requests{`
url = `}<span className="text-emerald-500">"https://api.quantagrify.io/v1/model/execute"</span>{`
headers = {
    "`}<span className="text-emerald-500">Authorization</span>{`": "`}<span className="text-emerald-500">Bearer $TOKEN</span>{`",
    "`}<span className="text-emerald-500">Content-Type</span>{`": "`}<span className="text-emerald-500">application/json</span>{`"
}
payload = {
    "`}<span className="text-[#0d59f2]">model_id</span>{`": "`}<span className="text-emerald-500">77a1-ff92</span>{`",
    "`}<span className="text-[#0d59f2]">priority</span>{`": 5
}
response = requests.post(url, json=payload, headers=headers)
`}<span className="text-[#0d59f2]">print</span>(response.json())
</pre>
              </div>
            </div>

            <div className="space-y-6">
              <button className="w-full py-4 bg-[#0d59f2] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-[#0d59f2]/20">
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Try it out
              </button>
              
              <div className="border-t border-slate-800 pt-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Sample Input Variables</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-tighter">Model_ID</label>
                    <input className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs font-mono text-white focus:border-[#0d59f2] outline-none" type="text" defaultValue="77a1-ff92-v4" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-tighter">API_Token</label>
                    <input className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs font-mono text-white focus:border-[#0d59f2] outline-none" type="password" defaultValue="••••••••••••••••" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating help button */}
      <button className="fixed bottom-6 right-6 size-12 bg-[#0d59f2] text-white rounded-full shadow-lg shadow-[#0d59f2]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined">help</span>
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};