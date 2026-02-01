import React, { useState, useEffect, useRef, useCallback } from 'react';

type SourcePreset = 'Custom REST' | 'Google Earth Engine' | 'Google Maps API' | 'Open-Meteo' | 'USDA QuickStats' | 'Datayes (通联数据)';
type AuthMethod = 'API Key' | 'OAuth 2.0' | 'Service Account (JSON)' | 'No Auth';
type DatayesDomain = 'Futures Market' | 'Spot Price' | 'News & Sentiment' | 'Macro & Supply';

type RegionContext = 'US Corn Belt (Iowa)' | 'Brazil Soy (Mato Grosso)' | 'China Corn (Heilongjiang)' | 'Black Sea Wheat (Ukraine)';

interface Connection {
  id: string;
  name: string;
  type: string;
  provider: SourcePreset;
  status: 'online' | 'offline' | 'error' | 'auth_fail';
  httpStatus: number | string; 
  latency: number | null; 
  url: string;
  proxy?: string; 
  projectId?: string; // Google Cloud Project ID
  lastChecked: string;
  key?: string;
  lastPayload?: any; 
  lastHeaders?: Record<string, string>; 
}

interface LogEntry {
  timestamp: string;
  type: 'REQUEST' | 'SUCCESS' | 'ERROR' | 'INFO' | 'WARN' | 'DATA'; 
  message: string;
  payload?: string; 
}

interface ApiConsoleProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'api' | 'apiDocs' | 'apiLogs' | 'userMgmt' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets') => void;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({ onNavigate }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Connection | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'telemetry' | 'headers' | 'debug'>('telemetry');
  
  // Quick Token Update State
  const [refreshToken, setRefreshToken] = useState('');

  // Test Params State for "Proof of Life"
  const [testLat, setTestLat] = useState('');
  const [testLon, setTestLon] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    preset: 'Custom REST' as SourcePreset,
    datayesDomain: 'Futures Market' as DatayesDomain, // New sub-selector
    url: '',
    auth: 'API Key' as AuthMethod,
    secret: '',
    proxy: '',
    projectId: '',
    regionContext: 'US Corn Belt (Iowa)' as RegionContext 
  });

  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const, active: true }
  ];

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string, payload?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      payload
    };
    setLogs(prev => [...prev.slice(-99), entry]); 
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Strict Persistence Logic ---
  useEffect(() => {
    const savedConns = localStorage.getItem('quant_api_connections');
    const initDone = localStorage.getItem('quant_api_init_done');

    if (initDone === 'true') {
      setConnections(savedConns ? JSON.parse(savedConns) : []);
    } else {
      // First time ever
      const defaults: Connection[] = [
        {
            id: 'def-om-01',
            name: 'Global Agri-Weather (Open-Meteo)',
            type: 'No Auth',
            provider: 'Open-Meteo',
            status: 'offline',
            httpStatus: '---',
            latency: null,
            url: getOpenMeteoUrl('US Corn Belt (Iowa)'),
            lastChecked: 'Initializing...',
            lastPayload: null,
            lastHeaders: {}
        }
      ];
      setConnections(defaults);
      localStorage.setItem('quant_api_connections', JSON.stringify(defaults));
      localStorage.setItem('quant_api_init_done', 'true');
    }
  }, []);

  // Save on any change (add/remove/update)
  useEffect(() => {
    if (localStorage.getItem('quant_api_init_done') === 'true') {
       localStorage.setItem('quant_api_connections', JSON.stringify(connections));
    }
  }, [connections]);


  const getOpenMeteoUrl = (region: RegionContext | string, latOverride?: string, lonOverride?: string) => {
      let lat = '41.5868', lon = '-93.6250'; 
      if (region === 'Brazil Soy (Mato Grosso)') { lat = '-12.55'; lon = '-55.72'; }
      if (region === 'China Corn (Heilongjiang)') { lat = '45.75'; lon = '126.63'; }
      if (region === 'Black Sea Wheat (Ukraine)') { lat = '49.58'; lon = '34.55'; }
      
      // Override for testing
      if (latOverride) lat = latOverride;
      if (lonOverride) lon = lonOverride;

      return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,soil_temperature_18cm,soil_moisture_9_to_27cm,wind_speed_10m&hourly=temperature_2m,soil_temperature_6cm,soil_moisture_3_to_9cm&daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&timezone=auto`;
  };

  const getDatayesUrl = (domain: DatayesDomain) => {
      switch (domain) {
          case 'Futures Market':
              return 'https://api.wmcloud.com/data/v1/api/market/getMktFutd.json?ticker=ZC&secID=&tradeDate=&beginDate=&endDate=';
          case 'Spot Price':
              return 'https://api.wmcloud.com/data/v1/api/market/getMktSpotd.json?ticker=CORN_SPOT_AVG'; // Example ticker
          case 'News & Sentiment':
              return 'https://api.wmcloud.com/data/v1/api/news/getNews.json?limit=10&keywords=Agriculture';
          case 'Macro & Supply':
              return 'https://api.wmcloud.com/data/v1/api/macro/getMacroData.json?indicID=M0000001'; // Example Macro ID
          default:
              return 'https://api.wmcloud.com/data/v1/api/market/getMktFutd.json';
      }
  };

  const pingUrl = async (
      inputUrl: string, 
      authMethod: AuthMethod, 
      secret: string, 
      proxyUrl: string = '', 
      projectId: string = '',
      provider: SourcePreset
  ): Promise<{ success: boolean; status: number | string; latency: number; authFailed: boolean; data?: any; headers?: any }> => {
    const start = performance.now();
    const headers: HeadersInit = {};
    let targetUrl = inputUrl;
    
    if (secret) {
        if (authMethod === 'API Key') {
            headers['x-api-key'] = secret;
            const separator = targetUrl.includes('?') ? '&' : '?';
            if (!targetUrl.toLowerCase().includes('key=')) {
                 targetUrl = `${targetUrl}${separator}key=${encodeURIComponent(secret)}`;
            }
        } else if (authMethod === 'OAuth 2.0') {
            // Standard Bearer Token (GEE & Datayes)
            headers['Authorization'] = `Bearer ${secret}`;
            // GEE Specific Header
            if (projectId && inputUrl.includes('googleapis.com')) {
                headers['x-goog-user-project'] = projectId;
            }
        }
    }

    let finalFetchUrl = targetUrl;
    if (proxyUrl) {
        finalFetchUrl = `${proxyUrl}${targetUrl}`;
    }

    try {
      const response = await fetch(finalFetchUrl, { 
        method: 'GET', 
        headers: headers,
        cache: 'no-cache',
        credentials: 'omit' 
      });
      
      const end = performance.now();
      const latency = Math.round(end - start);

      // Extract real headers
      const resHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => { resHeaders[key] = val; });

      if (response.ok) {
        const jsonData = await response.json();
        
        // --- SEMANTIC VALIDATION LAYER ---
        // Just because HTTP is 200 doesn't mean Auth worked for these APIs.
        
        // 1. Check Datayes (通联数据)
        if (provider === 'Datayes (通联数据)') {
            // Datayes returns { code: -403, message: "..." } on auth fail even with HTTP 200
            // Success codes are usually 1 or 0 depending on the endpoint version.
            if (jsonData.code !== 1 && jsonData.retCode !== 1 && jsonData.code !== 0) {
                return { 
                    success: false, 
                    status: response.status, 
                    latency, 
                    authFailed: true, // Mark as Auth Fail specifically
                    data: jsonData, 
                    headers: resHeaders 
                };
            }
        }

        // 2. Check Google Earth Engine
        if (provider === 'Google Earth Engine') {
            if (jsonData.error) {
                return { 
                    success: false, 
                    status: response.status, 
                    latency, 
                    authFailed: true, 
                    data: jsonData, 
                    headers: resHeaders 
                };
            }
        }

        return { success: true, status: response.status, latency, authFailed: false, data: jsonData, headers: resHeaders };
      } else {
        return { 
            success: false, 
            status: response.status, 
            latency, 
            authFailed: response.status === 401 || response.status === 403,
            headers: resHeaders,
            data: { error: `HTTP ${response.status}: ${response.statusText}` } 
        };
      }
    } catch (error: any) {
      return { success: false, status: 'NET/CORS', latency: 0, authFailed: false };
    }
  };

  // Heartbeat Polling
  useEffect(() => {
    if (connections.length === 0) return;
    
    const poll = async () => {
      const updatedConnections = await Promise.all(connections.map(async (conn) => {
        const result = await pingUrl(conn.url, conn.type as AuthMethod, conn.key || '', conn.proxy, conn.projectId, conn.provider);
        const newStatus = result.success ? 'online' : (result.authFailed ? 'auth_fail' : 'error');
        
        // Log heartbeat only for active/selected node
        if (selectedNode && conn.id === selectedNode.id) {
             const logType = result.success ? 'INFO' : 'WARN';
             const logMsg = result.success 
                ? `Heartbeat: ${conn.name} | Latency: ${result.latency}ms` 
                : `Heartbeat Failed: ${conn.name} | Status: ${newStatus}`;
             
             // Only add log if status changed or every 3rd poll to avoid spam, or always if it's the active inspection
             if (conn.status !== newStatus || Math.random() > 0.7) {
                 addLog(logType, logMsg, result.data ? JSON.stringify(result.data).substring(0, 100) : undefined);
             }
        }

        return {
          ...conn,
          status: newStatus,
          httpStatus: result.status,
          latency: result.latency > 0 ? result.latency : null,
          lastChecked: new Date().toLocaleTimeString(),
          lastPayload: result.data || conn.lastPayload,
          lastHeaders: result.headers || conn.lastHeaders
        } as Connection;
      }));

      setConnections(updatedConnections);
      
      // Sync selected node with updated data if ID matches
      if (selectedNode) {
          const updatedSelected = updatedConnections.find(c => c.id === selectedNode.id);
          if (updatedSelected && inspectorTab === 'telemetry') { 
             setSelectedNode(prev => ({ ...prev!, ...updatedSelected }));
          }
      }
    };

    const intervalId = setInterval(poll, 10000); 
    return () => clearInterval(intervalId);
  }, [connections.length, selectedNode?.id, inspectorTab, addLog]);

  const executeConnection = async () => {
    if (!formData.url) return;
    setIsConnecting(true);
    addLog('REQUEST', `Dialing ${formData.url}...`);
    
    if (formData.preset === 'Google Earth Engine' && !formData.projectId) {
        addLog('WARN', 'GEE Connection typically requires a Project ID for quota.');
    }

    const result = await pingUrl(formData.url, formData.auth, formData.secret, formData.proxy, formData.projectId, formData.preset);
    
    const status = result.success ? 'online' : (result.authFailed ? 'auth_fail' : 'error');
    
    if (result.authFailed) {
        addLog('ERROR', `Authentication Rejected. Provider returned logical error.`);
        if (result.data) addLog('DATA', JSON.stringify(result.data));
    } else if (result.success) {
        addLog('SUCCESS', `Connection Established. Latency: ${result.latency}ms`);
    } else {
        addLog('ERROR', `Connection Failed. Status: ${result.status}`);
        if (result.status === 'NET/CORS') addLog('WARN', 'Browser blocked request. Check CORS or use a proxy.');
    }

    const newConn: Connection = {
        id: crypto.randomUUID(),
        name: formData.name || 'Untitled Node',
        type: formData.auth,
        provider: formData.preset,
        status: status,
        httpStatus: result.status,
        latency: result.latency > 0 ? result.latency : null,
        url: formData.url,
        proxy: formData.proxy,
        lastChecked: new Date().toLocaleTimeString(),
        key: formData.secret,
        projectId: formData.projectId, // Store Project ID
        lastPayload: result.data,
        lastHeaders: result.headers
    };
    setConnections(prev => [...prev, newConn]);
    setIsModalOpen(false);
    setIsConnecting(false);
  };

  const removeConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnections(prev => prev.filter(c => c.id !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
    addLog('WARN', 'Node removed from monitoring cluster.');
  };

  const handleForceRefresh = async () => {
      if(!selectedNode) return;
      addLog('REQUEST', `Manual ping: ${selectedNode.name}`);
      
      let targetUrl = selectedNode.url;
      if (selectedNode.provider === 'Open-Meteo' && testLat && testLon) {
          targetUrl = getOpenMeteoUrl('', testLat, testLon);
          addLog('INFO', `Injecting Test Coordinates: ${testLat}, ${testLon}`);
      }

      const result = await pingUrl(targetUrl, selectedNode.type as AuthMethod, selectedNode.key || '', selectedNode.proxy, selectedNode.projectId, selectedNode.provider);
      const newStatus: Connection['status'] = result.success ? 'online' : (result.authFailed ? 'auth_fail' : 'error');
      
      const updatedNode: Connection = {
          ...selectedNode,
          status: newStatus,
          httpStatus: result.status,
          latency: result.latency > 0 ? result.latency : null,
          lastChecked: new Date().toLocaleTimeString(),
          lastPayload: result.data || selectedNode.lastPayload,
          lastHeaders: result.headers || selectedNode.lastHeaders,
          url: targetUrl 
      };

      setSelectedNode(updatedNode);
      setConnections(prev => prev.map(c => c.id === selectedNode.id ? updatedNode : c));
      
      if(result.success) addLog('SUCCESS', `Reply from ${result.headers?.['server'] || 'server'} in ${result.latency}ms`);
      if(result.authFailed) addLog('ERROR', `Auth Failed (Logical). API rejected credentials.`);
  };

  const updateNodeToken = async () => {
      if (!selectedNode || !refreshToken) return;
      addLog('REQUEST', `Rotating Access Token for ${selectedNode.name}...`);
      
      const result = await pingUrl(selectedNode.url, selectedNode.type as AuthMethod, refreshToken, selectedNode.proxy, selectedNode.projectId, selectedNode.provider);
      const newStatus: Connection['status'] = result.success ? 'online' : (result.authFailed ? 'auth_fail' : 'error');

      const updatedNode: Connection = {
          ...selectedNode,
          key: refreshToken, 
          status: newStatus,
          httpStatus: result.status,
          latency: result.latency > 0 ? result.latency : null,
          lastChecked: new Date().toLocaleTimeString(),
          lastPayload: result.data || selectedNode.lastPayload,
          lastHeaders: result.headers || selectedNode.lastHeaders,
      };

      setSelectedNode(updatedNode);
      setConnections(prev => prev.map(c => c.id === selectedNode.id ? updatedNode : c));
      setRefreshToken(''); 
      
      if (result.success) {
          addLog('SUCCESS', 'Token Rotated Successfully. Connection Restored.');
      } else {
          addLog('WARN', 'Token Rotation Failed. Check token validity.');
      }
  };

  const handlePresetChange = (p: SourcePreset) => {
    let url = '';
    let auth: AuthMethod = 'API Key';
    
    if(p === 'Google Earth Engine') { 
        url = 'https://earthengine.googleapis.com/v1/projects/earthengine-public/assets/COPERNICUS/S2_SR'; 
        auth = 'OAuth 2.0'; 
    }
    if(p === 'Open-Meteo') { url = getOpenMeteoUrl(formData.regionContext); auth = 'No Auth'; }
    
    if(p === 'Datayes (通联数据)') {
        url = getDatayesUrl('Futures Market'); // Default
        auth = 'OAuth 2.0';
    }
    
    setFormData(prev => ({ ...prev, preset: p, url, auth }));
  };

  // Handle sub-domain change for Datayes
  const handleDatayesDomainChange = (d: DatayesDomain) => {
      setFormData(prev => ({
          ...prev,
          datayesDomain: d,
          url: getDatayesUrl(d)
      }));
  };

  const renderInspectorContent = () => {
      if (!selectedNode) return null;
      const data = selectedNode.lastPayload;

      // --- TAB: RAW DEBUG (JSON) ---
      if (inspectorTab === 'debug') {
          return (
            <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800 overflow-hidden animate-in fade-in h-full flex flex-col">
              <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                 <span className="text-[10px] text-slate-500 font-mono">JSON BODY</span>
                 <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))} className="text-[9px] text-[#0d59f2] hover:underline">COPY</button>
              </div>
              <pre className="text-[10px] text-emerald-400 font-mono overflow-auto flex-1 custom-scrollbar">
                  {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          );
      }

      // --- TAB: HEADERS (PROOF OF NETWORK) ---
      if (inspectorTab === 'headers') {
          return (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-[#182234] p-4 rounded-lg border border-slate-700">
                    <h4 className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest mb-3">Server Fingerprint</h4>
                    <div className="space-y-2">
                        {selectedNode.lastHeaders ? Object.entries(selectedNode.lastHeaders).map(([key, val]) => (
                            <div key={key} className="grid grid-cols-3 gap-2 text-[10px] border-b border-white/5 pb-1">
                                <span className="text-slate-400 font-mono truncate text-right pr-2">{key}:</span>
                                <span className="col-span-2 text-white font-mono break-all">{val}</span>
                            </div>
                        )) : <span className="text-xs text-slate-500 italic">No headers captured yet.</span>}
                    </div>
                </div>
            </div>
          );
      }

      // --- TAB: VISUAL TELEMETRY ---
      
      if (selectedNode.status === 'auth_fail') {
          return (
              <div className="p-6 bg-amber-900/10 border border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center animate-in fade-in">
                  <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">lock_clock</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Authentication Expired</h3>
                  <p className="text-[10px] text-amber-200/70 mb-4 max-w-[200px] leading-relaxed">
                      Provider rejected credentials despite network success.
                      {selectedNode.provider === 'Datayes (通联数据)' && (
                          <span className="block mt-2 font-mono bg-black/30 p-1 rounded">
                              Code: {data?.code || data?.retCode} <br/> 
                              Msg: {data?.msg || data?.message}
                          </span>
                      )}
                  </p>
                  <div className="w-full space-y-2">
                      <input 
                        type="password"
                        placeholder="Paste new token..." 
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-amber-500/30 rounded px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                      <button 
                        onClick={updateNodeToken}
                        disabled={!refreshToken}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-[#0a0c10] font-black uppercase text-[10px] rounded transition-all disabled:opacity-50"
                      >
                        Renew Session
                      </button>
                  </div>
              </div>
          );
      }

      if (!data) return <div className="text-slate-500 italic p-4">Waiting for heartbeat packet...</div>;

      // DATAYES SPECIFIC PARSER
      if (selectedNode.provider === 'Datayes (通联数据)') {
          const isSuccess = data.code === 1 || data.retCode === 1 || data.code === 0;
          return (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className={`p-3 rounded-lg border ${isSuccess ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="material-symbols-outlined text-sm">{isSuccess ? 'verified' : 'error'}</span>
                         <p className="text-[10px] font-bold uppercase">Datayes API Response</p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Message: <span className="text-white font-mono">{data.msg || data.message || 'OK'}</span>
                        <br/>Code: {data.code ?? data.retCode}
                      </p>
                  </div>
                  
                  {data.data && Array.isArray(data.data) && (
                      <div className="bg-[#182234] p-4 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-sm">Data Preview</h4>
                            <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{data.data.length} Records</span>
                          </div>
                          <div className="text-[10px] text-[#90a4cb] font-mono max-h-40 overflow-y-auto custom-scrollbar">
                              {/* Display first record keys as columns */}
                              {data.data.length > 0 && Object.keys(data.data[0]).slice(0, 3).map(k => (
                                  <span key={k} className="mr-2 uppercase text-slate-500">{k}</span>
                              ))}
                              {/* Display first 3 rows values */}
                              {data.data.slice(0, 3).map((row: any, i: number) => (
                                  <div key={i} className="mt-1 border-t border-white/5 pt-1 text-white truncate">
                                      {Object.values(row).slice(0, 3).join(' | ')}...
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          );
      }

      if (selectedNode.provider === 'Open-Meteo' && data.current) {
          const c = data.current;
          return (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Live Param Injector */}
                  <div className="bg-[#0d59f2]/10 border border-[#0d59f2]/30 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                          <h4 className="text-[10px] font-black text-[#0d59f2] uppercase tracking-widest">Live Coordinate Test</h4>
                          <span className="text-[9px] text-[#0d59f2] bg-[#0d59f2]/20 px-1.5 rounded">PROOF OF LIFE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                          <input placeholder="Lat" value={testLat} onChange={e => setTestLat(e.target.value)} className="bg-black/40 border border-[#0d59f2]/30 rounded px-2 py-1 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#0d59f2]" />
                          <input placeholder="Lon" value={testLon} onChange={e => setTestLon(e.target.value)} className="bg-black/40 border border-[#0d59f2]/30 rounded px-2 py-1 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#0d59f2]" />
                      </div>
                      <p className="text-[9px] text-[#90a4cb] mb-0">Try: <span className="font-mono text-white cursor-pointer hover:underline" onClick={() => { setTestLat('-90'); setTestLon('0'); }}>-90, 0 (Antarctica)</span> to see temp drop.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#182234] p-3 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-[#90a4cb] uppercase font-bold">Soil Moisture</p>
                          <p className="text-xl font-black text-[#0d59f2]">{c.soil_moisture_9_to_27cm} <span className="text-xs">m³/m³</span></p>
                      </div>
                      <div className="bg-[#182234] p-3 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-[#90a4cb] uppercase font-bold">Air Temp (2m)</p>
                          <p className="text-xl font-black text-white">{c.temperature_2m}°C</p>
                      </div>
                  </div>
              </div>
          );
      }

      // GEE V1 REST API Specific
      if (selectedNode.provider === 'Google Earth Engine' && (data.type === 'IMAGE_COLLECTION' || data.name || data.id)) {
          return (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="material-symbols-outlined text-emerald-400 text-sm">verified_user</span>
                         <p className="text-[10px] text-emerald-400 font-bold uppercase">Authenticated GEE Session</p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Successfully authenticated with Google Cloud using Project ID: <span className="text-white font-mono">{selectedNode.projectId}</span>.
                      </p>
                  </div>
                  
                  <div className="bg-[#182234] p-4 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white mb-1 text-sm">Target Asset</h4>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{data.type || 'UNKNOWN'}</span>
                      </div>
                      <p className="text-[10px] text-[#90a4cb] font-mono break-all mt-2">{data.name || data.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#101622] p-3 rounded-lg border border-slate-800">
                          <p className="text-[9px] text-slate-500 uppercase">Update Time</p>
                          <p className="text-xs font-mono text-emerald-400">{data.updateTime ? new Date(data.updateTime).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="bg-[#101622] p-3 rounded-lg border border-slate-800">
                          <p className="text-[9px] text-slate-500 uppercase">Project Quota</p>
                          <p className="text-xs font-mono text-white truncate" title={selectedNode.projectId}>{selectedNode.projectId}</p>
                      </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[9px] text-[#90a4cb] uppercase font-bold mb-2">Session Maintenance</p>
                      <input 
                        type="password"
                        placeholder="Paste new ya29... token to refresh" 
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        className="w-full bg-black/40 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#0d59f2] mb-2"
                      />
                      <button 
                        onClick={updateNodeToken}
                        disabled={!refreshToken}
                        className="w-full py-2 bg-[#182234] hover:bg-[#0d59f2] border border-slate-700 hover:border-[#0d59f2] text-white font-bold uppercase text-[10px] rounded transition-all disabled:opacity-50"
                      >
                        Update Active Token
                      </button>
                  </div>
              </div>
          );
      }

      return <div className="text-slate-500 text-xs p-4">Unknown Payload Format</div>;
  };

  return (
    <div className="bg-[#05070a] text-slate-100 font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* ... Navigation remains same ... */}
      <nav className="h-16 border-b border-[#222f49] bg-[#05070a] px-6 flex items-center justify-between shrink-0 z-50">
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

        <div className="flex items-center gap-4 w-80 justify-end">
          <div className="size-8 rounded-full bg-[#182234] border border-[#314368] flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* Sub Navigation */}
      <div className="w-full bg-[#0d1117] border-b border-white/5 py-4 shrink-0">
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={() => onNavigate('api')} className="text-[#0d59f2] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 relative group">
              <span className="material-symbols-outlined text-sm">sensors</span> 
              CONNECTION MONITOR
              <div className="absolute -bottom-[19px] left-0 w-full h-[2px] bg-[#0d59f2] shadow-[0_0_8px_#0d59f2]"></div>
            </button>
            <button onClick={() => onNavigate('apiDocs')} className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-sm">menu_book</span> 
              API DOCUMENTATION
            </button>
            <button onClick={() => onNavigate('apiLogs')} className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-sm">terminal</span> 
              LOGS CENTER
            </button>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-3">
               <span className="text-[8px] font-bold text-slate-500 uppercase">Gateway Status</span>
               <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                 {connections.length > 0 ? 'Active Monitoring' : 'Idle'}
               </span>
             </div>
             <div className={`size-2 rounded-full ${connections.length > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-10 py-8 flex gap-8 min-h-0 relative overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 gap-8 min-h-0 overflow-hidden">
            {/* Connections Grid */}
            <section className="flex-[3] min-h-0 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex items-center justify-between mb-8 text-left">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 italic">Network Nodes</h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Count: {connections.length}</span>
            </div>
            
            {connections.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <div className="size-8 border-2 border-white/20 border-t-[#0d59f2] rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No Active Nodes</p>
                <button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#0d59f2] text-xs font-bold hover:underline">Add New Connection</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-4">
                {connections.map((conn) => (
                    <div 
                        key={conn.id} 
                        onClick={() => { setSelectedNode(conn); setTestLat(''); setTestLon(''); setRefreshToken(''); }}
                        className={`relative group bg-[#101622] border p-6 rounded-[32px] transition-all duration-300 shadow-xl overflow-hidden cursor-pointer hover:-translate-y-1 ${
                        selectedNode?.id === conn.id ? 'ring-2 ring-[#0d59f2] border-transparent' : 
                        conn.status === 'online' ? 'border-emerald-500/30 hover:border-emerald-500/60' : 
                        conn.status === 'auth_fail' ? 'border-amber-500/50' :
                        'border-rose-900/50'
                    }`}
                    >
                    
                    <button 
                        onClick={(e) => removeConnection(conn.id, e)}
                        className="absolute top-4 right-4 z-20 size-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>

                    <div className="text-left relative z-10">
                        <div className="flex justify-between items-start mb-6">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${
                            conn.status === 'online' ? 'bg-emerald-500/10' : 
                            conn.status === 'auth_fail' ? 'bg-amber-500/10' :
                            conn.status === 'offline' ? 'bg-slate-700/30' :
                            'bg-rose-500/10'
                        }`}>
                            <div className={`size-2 rounded-full ${
                                conn.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                                conn.status === 'auth_fail' ? 'bg-amber-500' :
                                conn.status === 'offline' ? 'bg-slate-500' :
                                'bg-rose-500'
                            }`}></div>
                            <span className={`text-[8px] font-black uppercase ${
                                conn.status === 'online' ? 'text-emerald-500' : 
                                conn.status === 'auth_fail' ? 'text-amber-500' :
                                conn.status === 'offline' ? 'text-slate-500' :
                                'text-rose-500'
                            }`}>
                                {conn.status === 'auth_fail' ? 'AUTH ERR' : conn.status}
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase border border-white/10 px-2 py-0.5 rounded truncate max-w-[80px]" title={conn.provider}>{conn.type}</span>
                        </div>
                        
                        <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight truncate pr-8" title={conn.name}>{conn.name}</h3>
                        <p className="text-[10px] text-[#0d59f2] font-bold uppercase tracking-[0.1em] mb-6 truncate" title={conn.url}>{conn.url}</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.03] text-center">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">HTTP Code</p>
                            <p className={`text-xs font-mono font-black ${conn.status === 'online' ? 'text-emerald-500' : conn.status === 'auth_fail' ? 'text-amber-500' : 'text-slate-400'}`}>
                            {conn.httpStatus}
                            </p>
                        </div>
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.03] text-center">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Latency</p>
                            <p className="text-xs font-mono font-black text-slate-400">
                                {conn.latency ? `${conn.latency}ms` : '--'}
                            </p>
                        </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </section>

            {/* Bottom Section: Logs & Add Button */}
            <div className="flex-[2] flex gap-8 min-h-0 mb-6">
            <section className="flex-[2] bg-black/40 rounded-[40px] border border-white/5 flex flex-col overflow-hidden relative backdrop-blur-md">
                <div className="bg-white/5 px-8 py-4 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-[#0d59f2]">terminal</span> 
                    System Event Stream
                    </span>
                    <button onClick={() => setLogs([])} className="text-[9px] font-mono text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Clear</button>
                </div>
                <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar text-left bg-black/20">
                {logs.length === 0 && <div className="text-slate-700 italic opacity-50">Waiting for events...</div>}
                {logs.map((log, i) => (
                    <div key={i} className="mb-2 animate-in fade-in duration-200">
                    <div className="flex gap-3">
                        <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`font-bold shrink-0 w-16 ${
                            log.type === 'SUCCESS' ? 'text-emerald-500' :
                            log.type === 'ERROR' ? 'text-rose-500' :
                            log.type === 'WARN' ? 'text-amber-500' :
                            log.type === 'DATA' ? 'text-[#00f2ff]' :
                            log.type === 'REQUEST' ? 'text-[#0d59f2]' : 'text-slate-400'
                        }`}>{log.type}</span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                    {log.payload && (
                        <div className="ml-32 mt-1 p-3 bg-[#0d1117] border border-slate-800 rounded-lg text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar shadow-inner">
                            {log.payload}
                        </div>
                    )}
                    </div>
                ))}
                <div ref={logEndRef} />
                </div>
            </section>

            <section 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 bg-[#101622] border border-[#0d59f2]/30 rounded-[40px] p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-[#0d59f2]/10 transition-all shadow-2xl relative overflow-hidden"
            >
                <div className="size-16 rounded-2xl bg-[#0d59f2]/10 border border-[#0d59f2]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#0d59f2] text-3xl">add_link</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase italic mb-1 tracking-tight">New Connection</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure Endpoint</p>
            </section>
            </div>
        </div>

        {/* Node Inspector Side Panel */}
        <aside className={`w-[420px] border-l border-white/5 bg-[#0a0e17] flex flex-col shrink-0 transition-all duration-300 transform ${selectedNode ? 'translate-x-0' : 'translate-x-[440px] hidden'} absolute right-0 top-0 bottom-0 z-40 shadow-2xl`}>
            {selectedNode && (
                <>
                    <div className="p-6 border-b border-white/5 bg-[#101622] flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider truncate w-48" title={selectedNode.name}>{selectedNode.name}</h3>
                            <span className="text-[9px] text-[#90a4cb] font-mono">{selectedNode.id}</span>
                        </div>
                        <div className="flex gap-2">
                            <a 
                                href={selectedNode.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                title="Open Endpoint in Browser (Verification)"
                            >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                            <button onClick={() => setSelectedNode(null)} className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex border-b border-white/5 bg-[#0d1117]">
                        {[
                            { id: 'telemetry', icon: 'monitoring', label: 'Telemetry' },
                            { id: 'headers', icon: 'http', label: 'Headers' },
                            { id: 'debug', icon: 'code', label: 'Debug' },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setInspectorTab(tab.id as any)}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${inspectorTab === tab.id ? 'text-[#0d59f2] border-b-2 border-[#0d59f2] bg-[#0d59f2]/5' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {/* Content Area Based on Tab */}
                        {renderInspectorContent()}

                        {/* Common Connection Details (Only on Telemetry) */}
                        {inspectorTab === 'telemetry' && selectedNode.status !== 'auth_fail' && (
                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest mb-2">Node Details</h4>
                                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-slate-500 block mb-1">Target URL</span>
                                    <span className="text-[10px] text-[#0d59f2] font-mono break-all">{selectedNode.url}</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between">
                                    <div>
                                        <span className="text-[9px] text-slate-500 block mb-1">Last Update</span>
                                        <span className="text-xs text-white font-mono">{selectedNode.lastChecked}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-slate-500 block mb-1">Status Code</span>
                                        <span className={`text-xs font-mono font-bold ${selectedNode.httpStatus === 200 ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedNode.httpStatus}</span>
                                    </div>
                                </div>
                                {selectedNode.projectId && (
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                        <span className="text-[9px] text-slate-500 block mb-1">Cloud Project ID (Quota)</span>
                                        <span className="text-[10px] text-emerald-400 font-mono break-all">{selectedNode.projectId}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#101622]">
                        <button 
                            onClick={handleForceRefresh}
                            className="w-full bg-[#0d59f2] hover:bg-[#1a66ff] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#0d59f2]/20 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Ping / Refresh Data
                        </button>
                    </div>
                </>
            )}
        </aside>

      </main>

      {/* Config Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#05070a]/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#101622] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Configure Node</h2>
              <button onClick={() => !isConnecting && setIsModalOpen(false)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Name</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#0d59f2] transition-colors" 
                  placeholder="e.g. Production API" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Provider Template</label>
                  <select 
                    value={formData.preset} 
                    onChange={e => handlePresetChange(e.target.value as SourcePreset)} 
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none appearance-none cursor-pointer hover:border-white/20"
                  >
                    <option>Custom REST</option>
                    <option>Google Earth Engine</option>
                    <option>Google Maps API</option>
                    <option>Open-Meteo</option>
                    <option>USDA QuickStats</option>
                    <option>Datayes (通联数据)</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Auth Type</label>
                  <select 
                    value={formData.auth} 
                    onChange={e => setFormData(p => ({...p, auth: e.target.value as AuthMethod}))} 
                    disabled={formData.preset === 'Google Earth Engine' || formData.preset === 'Datayes (通联数据)'}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none appearance-none cursor-pointer hover:border-white/20 disabled:opacity-50"
                  >
                    <option>API Key</option>
                    <option>OAuth 2.0</option>
                    <option>No Auth</option>
                  </select>
                </div>
              </div>

              {/* NEW: Datayes Domain Sub-Selector */}
              {formData.preset === 'Datayes (通联数据)' && (
                  <div className="space-y-1.5 text-left animate-in fade-in">
                    <label className="text-[9px] font-black text-[#0d59f2] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">category</span>
                        Data Domain (Multi-endpoint)
                    </label>
                    <select 
                        value={formData.datayesDomain} 
                        onChange={e => handleDatayesDomainChange(e.target.value as DatayesDomain)} 
                        className="w-full bg-[#0d59f2]/10 border border-[#0d59f2]/50 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#0d59f2] cursor-pointer"
                    >
                        <option>Futures Market</option>
                        <option>Spot Price</option>
                        <option>News & Sentiment</option>
                        <option>Macro & Supply</option>
                    </select>
                  </div>
              )}

              {/* Project ID Field for GEE */}
              {formData.preset === 'Google Earth Engine' && (
                  <div className="space-y-1.5 text-left animate-in fade-in">
                    <label className="text-[9px] font-black text-[#0d59f2] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">cloud</span>
                        Google Cloud Project ID
                    </label>
                    <input 
                      value={formData.projectId} 
                      onChange={e => setFormData(p => ({...p, projectId: e.target.value}))} 
                      className="w-full bg-[#0d59f2]/10 border border-[#0d59f2]/50 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#0d59f2]" 
                      placeholder="e.g. my-agri-project-id" 
                    />
                    <p className="text-[9px] text-[#90a4cb] ml-1">Required for billing and quota attribution (x-goog-user-project).</p>
                  </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Endpoint URL <span className="text-rose-500">*</span></label>
                <input 
                  value={formData.url} 
                  onChange={e => setFormData(p => ({...p, url: e.target.value}))} 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[#0d59f2] outline-none focus:border-[#0d59f2]" 
                  placeholder="https://api.example.com/v1/health" 
                />
                {/* Dynamic Help Text based on Domain */}
                {formData.preset === 'Datayes (通联数据)' && (
                    <p className="text-[9px] text-[#90a4cb] ml-1 truncate">
                        {formData.datayesDomain === 'Futures Market' ? 'Params: ticker, beginDate, endDate' : 
                         formData.datayesDomain === 'Macro & Supply' ? 'Params: indicID (Indicator ID)' : 
                         'Auto-configured endpoint'}
                    </p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secret / Key (Optional)</label>
                <input 
                  type="password"
                  value={formData.secret} 
                  onChange={e => setFormData(p => ({...p, secret: e.target.value}))} 
                  disabled={formData.auth === 'No Auth'}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#0d59f2] disabled:opacity-30 disabled:cursor-not-allowed" 
                  placeholder={
                      formData.preset === 'Google Earth Engine' ? "Paste GEE Access Token (ya29...)" : 
                      formData.preset === 'Datayes (通联数据)' ? "Paste Datayes Bearer Token..." :
                      "Paste raw key here..."
                  }
                />
                {formData.preset === 'Google Earth Engine' && (
                    <p className="text-[9px] text-[#90a4cb] ml-1">Token expires in ~60m. Run <code>ee.data.getAuthToken()</code> in Code Editor.</p>
                )}
                {formData.preset === 'Datayes (通联数据)' && (
                    <p className="text-[9px] text-[#90a4cb] ml-1">Use the Access Token from Uqer/Datayes Developer Console.</p>
                )}
              </div>

              <button 
                disabled={isConnecting || !formData.url}
                onClick={executeConnection}
                className="w-full mt-4 py-4 bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0d59f2]/20 flex items-center justify-center gap-3"
              >
                {isConnecting ? (
                  <>
                    <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : 'Establish Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};