
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SystemClock } from './SystemClock';
import { SystemLogStream, LogEntry } from './GlobalState';

interface ApiLogsProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'apiDocs' | 'apiLogs') => void;
}

// --- Internal Component: JSON Tree Viewer ---
// Recursive component to display complex data structures elegantly
const JsonNode: React.FC<{ name?: string, value: any, level?: number }> = ({ name, value, level = 0 }) => {
    const [expanded, setExpanded] = useState(level < 2); // Default expand top 2 levels
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const isEmpty = isObject && Object.keys(value).length === 0;
    
    const toggle = () => setExpanded(!expanded);

    if (!isObject) {
        let valDisplay = JSON.stringify(value);
        let colorClass = 'text-emerald-400'; // String
        if (typeof value === 'number') colorClass = 'text-[#0d59f2]';
        if (typeof value === 'boolean') colorClass = 'text-[#fa6238]';
        if (value === null || value === undefined) colorClass = 'text-slate-500';

        return (
            <div className="font-mono text-[10px] leading-tight my-0.5 hover:bg-white/5 px-1 rounded">
                {name && <span className="text-[#90a4cb] mr-1">{name}:</span>}
                <span className={`${colorClass} break-all`}>{valDisplay}</span>
            </div>
        );
    }

    return (
        <div className="font-mono text-[10px] leading-tight my-0.5">
            <div className="flex items-center hover:bg-white/5 cursor-pointer px-1 rounded select-none" onClick={toggle}>
                <span className={`material-symbols-outlined text-[10px] text-slate-500 mr-1 transition-transform ${expanded ? 'rotate-90' : ''}`}>arrow_right</span>
                {name && <span className="text-[#90a4cb] mr-1">{name}:</span>}
                <span className="text-slate-400 font-bold">{isArray ? `Array(${value.length})` : `Object {${Object.keys(value).length}}`}</span>
                {isEmpty && <span className="text-slate-600 ml-1 italic">(empty)</span>}
            </div>
            {expanded && !isEmpty && (
                <div className="ml-4 border-l border-slate-700 pl-1">
                    {isArray ? (
                        value.map((item: any, idx: number) => (
                            <JsonNode key={idx} name={idx.toString()} value={item} level={level + 1} />
                        ))
                    ) : (
                        Object.entries(value).map(([k, v]) => (
                            <JsonNode key={k} name={k} value={v} level={level + 1} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

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

  // --- State ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set()); // For DATA_PACKET expansion in list
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]); // Indices of matching logs
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1); // Index within searchResults
  
  // AI Panel State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Refs
  const logListRef = useRef<HTMLDivElement>(null);
  const logItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Tracking Auto-Scroll State (Defaults to true to fix initial load position)
  const shouldAutoScroll = useRef(true);

  // 1. Subscribe to Global Log Stream
  useEffect(() => {
      // Load initial history
      setLogs([...SystemLogStream.getHistory()]);

      // Subscribe
      const unsubscribe = SystemLogStream.subscribe((newEntry) => {
          setLogs(prev => [...prev, newEntry]); // Append to end
      });

      return () => unsubscribe();
  }, []);

  // 2. Auto-scroll Logic (Smart Tracking)
  useEffect(() => {
      // If we are searching through history, do not auto-scroll
      if (currentSearchIndex !== -1) return;

      if (logListRef.current && shouldAutoScroll.current) {
          logListRef.current.scrollTop = logListRef.current.scrollHeight;
      }
  }, [logs, currentSearchIndex]);

  // Handle manual scroll to toggle auto-scroll latch
  const handleListScroll = () => {
      if (!logListRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = logListRef.current;
      
      // If user is within 150px of the bottom, enable auto-scroll. Otherwise, assume they are reading history.
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      shouldAutoScroll.current = isNearBottom;
  };

  // 3. Search Logic
  useEffect(() => {
      if (!searchQuery.trim()) {
          setSearchResults([]);
          setCurrentSearchIndex(-1);
          return;
      }
      
      const lowerQuery = searchQuery.toLowerCase();
      const matches: number[] = [];
      logs.forEach((log, idx) => {
          const content = `${log.module} ${log.message} ${log.action}`.toLowerCase();
          if (content.includes(lowerQuery)) {
              matches.push(idx);
          }
      });
      setSearchResults(matches);
      if (matches.length > 0) {
          setCurrentSearchIndex(matches.length - 1); // Start at latest
      } else {
          setCurrentSearchIndex(-1);
      }
  }, [searchQuery, logs]);

  // Scroll to search match
  useEffect(() => {
      if (currentSearchIndex >= 0 && searchResults.length > 0) {
          const logIdx = searchResults[currentSearchIndex];
          const logId = logs[logIdx].id;
          const el = logItemRefs.current.get(logId);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [currentSearchIndex, searchResults]);

  // Handlers
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedLogIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedLogIds(newSet);
  };

  const toggleExpand = (id: string) => {
      const newSet = new Set(expandedLogIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedLogIds(newSet);
  };

  const clearLogs = () => {
      SystemLogStream.logs = [];
      setLogs([]);
      setSelectedLogIds(new Set());
      setAiResponse(null);
      shouldAutoScroll.current = true; // Reset auto-scroll on clear
  };

  const simulateTraffic = () => {
      const modules = ['FuturesSocket', 'AlgorithmEngine', 'RiskController', 'DataLake'];
      const actions = ['Heartbeat', 'OrderFill', 'Recalculate', 'PacketDrop', 'Sync'];
      
      const randomModule = modules[Math.floor(Math.random() * modules.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      const r = Math.random();
      let type: LogEntry['type'] = 'INFO';
      let msg = `Routine operation check for ${randomModule}.`;
      let payload = undefined;

      if (r > 0.9) {
          type = 'ERROR';
          msg = `Connection timeout in ${randomModule} during ${randomAction}. Retrying...`;
      } else if (r > 0.7) {
          type = 'WARNING';
          msg = `High latency detected on ${randomModule}. > 200ms`;
      } else if (r > 0.5) {
          type = 'DATA_PACKET';
          msg = `Inbound telemetry packet from ${randomModule}`;
          payload = {
              seq: Math.floor(Math.random() * 10000),
              metrics: { cpu: Math.random(), mem: Math.random() * 1024 },
              tags: ['prod', 'us-east'],
              matrix: [[1, 2], [3, 4]]
          };
      } else if (r > 0.3) {
          type = 'SUCCESS';
          msg = `${randomAction} completed successfully in 12ms.`;
      }

      SystemLogStream.push({
          module: randomModule,
          action: randomAction,
          type: type,
          message: msg,
          payload: payload
      });
  };

  const runAiAnalysis = async () => {
      if (!process.env.API_KEY) {
          setAiResponse("Error: Gemini API Key is missing.");
          return;
      }
      
      const targetLogs = logs.filter(l => selectedLogIds.has(l.id));
      if (targetLogs.length === 0) {
          setAiResponse("Please select logs from the stream to analyze.");
          return;
      }

      setAiLoading(true);
      setAiResponse(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            You are a Senior Site Reliability Engineer (SRE) for the QuantAgrify platform.
            Analyze the selected system logs below. 
            
            User Question: "${aiPrompt || 'Analyze root cause and sequence of events.'}"
            
            Selected Logs:
            ${JSON.stringify(targetLogs.map(l => ({ 
                time: l.timestampStr, 
                module: l.module, 
                type: l.type, 
                msg: l.message,
                data: l.payload ? JSON.stringify(l.payload).substring(0, 500) : 'N/A' 
            })), null, 2)}
            
            Output Format:
            Provide a concise Markdown summary. 
            1. **Situation**: What happened?
            2. **Diagnosis**: If there are errors, what is the likely cause? If data packets, what do they represent?
            3. **Action**: Recommended fix or next step.
          `;

          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
          });
          
          setAiResponse(response.text || "No response generated.");
      } catch (e: any) {
          setAiResponse(`AI Error: ${e.message}`);
      } finally {
          setAiLoading(false);
      }
  };

  // Helper for highlighting text
  const highlightText = (text: string) => {
      if (!searchQuery) return text;
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() 
              ? <span key={i} className="bg-yellow-500/50 text-white font-bold">{part}</span> 
              : part
      );
  };

  const getTypeStyle = (type: LogEntry['type']) => {
      switch (type) {
          case 'ERROR': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
          case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
          case 'SUCCESS': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
          case 'DATA_PACKET': return 'text-[#00f2ff] bg-[#00f2ff]/10 border-[#00f2ff]/30';
          default: return 'text-slate-400 bg-slate-800 border-slate-700';
      }
  };

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
        <div className="max-w-[1920px] mx-auto px-6 flex items-center justify-between">
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
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-[#182234] rounded-lg border border-[#314368] flex items-center gap-2">
                 <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">System Event Bus: Active</span>
             </div>
             <button onClick={simulateTraffic} className="text-[10px] font-bold uppercase bg-[#0d59f2]/10 text-[#0d59f2] px-3 py-1.5 rounded border border-[#0d59f2]/30 hover:bg-[#0d59f2] hover:text-white transition-all">
                 + Simulate Traffic
             </button>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden w-full">
        
        {/* LEFT COLUMN: HOLOGRAPHIC LOG STREAM */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#222f49] bg-[#05070a] relative">
            
            {/* Toolbar */}
            <div className="h-12 border-b border-[#222f49] bg-[#0a0e17] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2 bg-[#182234] border border-[#314368] rounded-lg p-1">
                    <span className="material-symbols-outlined text-slate-500 text-sm ml-2">search</span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter logs..." 
                        className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none w-48 font-mono"
                    />
                    <div className="h-4 w-px bg-[#314368]"></div>
                    <span className="text-[10px] text-[#90a4cb] px-2 font-mono">
                        {searchResults.length > 0 ? `${currentSearchIndex + 1}/${searchResults.length}` : '0/0'}
                    </span>
                    <button 
                        onClick={() => setCurrentSearchIndex(prev => Math.max(0, prev - 1))}
                        disabled={searchResults.length === 0}
                        className="hover:bg-[#314368] rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                    </button>
                    <button 
                        onClick={() => setCurrentSearchIndex(prev => Math.min(searchResults.length - 1, prev + 1))}
                        disabled={searchResults.length === 0}
                        className="hover:bg-[#314368] rounded p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={clearLogs} className="p-2 text-slate-500 hover:text-rose-500 transition-colors" title="Clear All Logs">
                        <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    </button>
                    <div className="flex gap-1 text-[9px] font-bold uppercase text-slate-500 bg-[#182234] px-2 py-1 rounded">
                        <span>Total: {logs.length}</span>
                        <span>Selected: {selectedLogIds.size}</span>
                    </div>
                </div>
            </div>

            {/* Log List */}
            <div 
                ref={logListRef} 
                className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1"
                onScroll={handleListScroll}
            >
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[#90a4cb] opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">terminal</span>
                        <p className="text-xs uppercase font-bold tracking-widest">System Log Stream Empty</p>
                    </div>
                )}
                {logs.map((log, index) => {
                    const isSelected = selectedLogIds.has(log.id);
                    const isSearchMatch = searchResults.includes(index);
                    const isCurrentMatch = isSearchMatch && searchResults[currentSearchIndex] === index;
                    const hasPayload = !!log.payload;
                    const isExpanded = expandedLogIds.has(log.id);

                    return (
                        <div 
                            key={log.id}
                            ref={el => { if (el) logItemRefs.current.set(log.id, el); }}
                            className={`group rounded border border-transparent hover:border-[#314368] transition-all text-xs font-mono relative ${
                                isSelected ? 'bg-[#0d59f2]/10 border-[#0d59f2]/30' : 
                                isCurrentMatch ? 'bg-yellow-500/10 border-yellow-500/50' : 
                                'hover:bg-[#182234]'
                            }`}
                        >
                            {/* Row Header */}
                            <div className="flex items-start p-1.5 gap-3 cursor-pointer" onClick={() => toggleSelection(log.id)}>
                                {/* Checkbox */}
                                <div className={`mt-0.5 size-3 border rounded-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0d59f2] border-[#0d59f2]' : 'border-slate-600 group-hover:border-slate-400'}`}>
                                    {isSelected && <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>}
                                </div>

                                {/* Timestamp */}
                                <span className="text-slate-500 shrink-0 select-none w-16">{log.timestampStr}</span>

                                {/* Badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase w-20 text-center shrink-0 border ${getTypeStyle(log.type)}`}>
                                    {log.type.replace('_', ' ')}
                                </span>

                                {/* Module */}
                                <span className="text-[#90a4cb] font-bold w-32 shrink-0 truncate" title={log.module}>{highlightText(log.module)}</span>

                                {/* Message */}
                                <div className="flex-1 text-slate-300 break-all leading-tight">
                                    {highlightText(log.message)}
                                    {hasPayload && !isExpanded && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }}
                                            className="ml-2 text-[9px] bg-[#182234] border border-[#314368] px-1.5 rounded text-[#00f2ff] hover:text-white hover:border-[#00f2ff] transition-colors inline-flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[10px]">data_object</span> Payload
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Payload Area */}
                            {hasPayload && isExpanded && (
                                <div className="ml-10 mb-2 mr-2 bg-[#0a0c10] border border-[#314368] rounded p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between items-center border-b border-[#314368] pb-1 mb-1">
                                        <span className="text-[9px] font-bold text-[#00f2ff] uppercase tracking-wider">Data Packet Inspection</span>
                                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }} className="text-[#90a4cb] hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                                    </div>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <JsonNode value={log.payload} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: AI TACTICAL ANALYST */}
        <div className="w-[400px] bg-[#0a0c10] border-l border-[#222f49] flex flex-col shrink-0 shadow-2xl z-20">
            <div className="p-4 border-b border-[#222f49] bg-[#101622] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0d59f2]">smart_toy</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Tactical Analyst</h3>
                </div>
                <div className={`size-2 rounded-full ${aiLoading ? 'bg-[#ffb347] animate-spin' : 'bg-[#0bda5e]'} shadow-[0_0_8px_#0bda5e]`}></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Context Selector Info */}
                {selectedLogIds.size === 0 ? (
                    <div className="p-6 border-2 border-dashed border-[#314368] rounded-xl text-center text-[#90a4cb] opacity-70">
                        <span className="material-symbols-outlined text-3xl mb-2">checklist</span>
                        <p className="text-xs font-bold uppercase">Select logs to analyze</p>
                        <p className="text-[10px] mt-1">Click checkboxes in the stream to build context.</p>
                    </div>
                ) : (
                    <div className="bg-[#182234] border border-[#314368] rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Active Context</span>
                            <span className="text-[10px] font-bold text-white bg-[#0d59f2] px-2 py-0.5 rounded-full">{selectedLogIds.size} Items</span>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                            {logs.filter(l => selectedLogIds.has(l.id)).map(l => (
                                <div key={l.id} className="text-[10px] text-slate-300 truncate border-l-2 border-[#314368] pl-2 hover:border-[#0d59f2] transition-colors">
                                    <span className={getTypeStyle(l.type).split(' ')[0]}>[{l.type}]</span> {l.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Output Area */}
                {aiResponse && (
                    <div className="bg-[#0d59f2]/5 border border-[#0d59f2]/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h4 className="text-[10px] font-black text-[#0d59f2] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            Gemini Analysis
                        </h4>
                        <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                            {aiResponse}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#222f49] bg-[#101622]">
                <div className="relative">
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask about the selected logs (e.g. 'Why did the connection fail?')" 
                        className="w-full bg-[#0a0c10] border border-[#314368] rounded-xl p-3 pr-12 text-xs text-white placeholder:text-[#90a4cb] focus:border-[#0d59f2] outline-none resize-none custom-scrollbar shadow-inner"
                        rows={3}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAiAnalysis(); } }}
                    ></textarea>
                    <button 
                        onClick={runAiAnalysis}
                        disabled={aiLoading || selectedLogIds.size === 0}
                        className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                            aiLoading || selectedLogIds.size === 0 
                            ? 'bg-[#182234] text-[#90a4cb] cursor-not-allowed' 
                            : 'bg-[#0d59f2] text-white hover:bg-[#1a66ff] shadow-lg'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-lg ${aiLoading ? 'animate-spin' : ''}`}>
                            {aiLoading ? 'sync' : 'send'}
                        </span>
                    </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[9px] text-[#90a4cb]">Model: Gemini 2.5 Flash</span>
                    <span className="text-[9px] text-[#90a4cb]">{aiLoading ? 'Processing...' : 'Ready'}</span>
                </div>
            </div>
        </div>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0c10; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d59f2; }
      `}</style>
    </div>
  );
};
