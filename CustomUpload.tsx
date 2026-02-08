import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { DATA_LAYERS } from './GlobalState';
import { SystemClock } from './SystemClock';

interface CustomUploadProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'cockpit' | 'api') => void;
}

// --- Data Models ---

type FileType = 'DOC' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DATA' | 'GEO';
type ProcessingStatus = 'QUEUED' | 'UPLOADING' | 'ANALYZING' | 'READY' | 'ERROR';

interface KnowledgeAsset {
  id: string;
  name: string;
  size: number; // bytes
  type: FileType;
  uploadDate: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  // AI Generated Metadata
  category: string;
  tags: string[];
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactScore: number; // 0-100 Relevance to trading
  relatedAssets: string[]; // e.g. ['ZC', 'M']
}

// Knowledge Graph Visualization Models
interface GraphNode {
  id: string;
  x: number;
  y: number;
  r: number; // Radius
  label: string;
  type: 'ROOT' | 'FILE' | 'CONCEPT' | 'ASSET';
  color: string;
  connections: { targetId: string; strength: number }[]; 
  // Physics state
  vx: number;
  vy: number;
}

interface ViewState {
    x: number;
    y: number;
    scale: number;
}

// --- Configuration & Constants ---

const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1GB
const CATEGORIES = ['Supply Chain', 'Weather/Geo', 'Macro Policy', 'Field Research', 'Expert Call', 'Spot Price'];

const MOCK_FILES: KnowledgeAsset[] = [
    {
        id: 'f1', name: 'Heilongjiang_Crop_Tour_Oct.pdf', size: 4500000, type: 'DOC', uploadDate: '2023-10-25', status: 'READY', progress: 100,
        category: 'Field Research', tags: ['Yield', 'Moisture', 'Northeast'], summary: 'Field survey indicates corn yield in Heilongjiang may be 3% lower than USDA estimates due to late-season frost.',
        sentiment: 'BULLISH', impactScore: 85, relatedAssets: ['Corn (ZC)']
    },
    {
        id: 'f2', name: 'Port_Congestion_Santos.jpg', size: 2100000, type: 'IMAGE', uploadDate: '2023-10-26', status: 'READY', progress: 100,
        category: 'Supply Chain', tags: ['Logistics', 'Brazil', 'Delay'], summary: 'Satellite image analysis detects 14-day waiting queue at Santos port, delaying soybean shipments to China.',
        sentiment: 'BULLISH', impactScore: 72, relatedAssets: ['Soybeans (ZS)', 'Meal (M)']
    },
    {
        id: 'f3', name: 'Expert_Call_Pig_Cycle.mp3', size: 15000000, type: 'AUDIO', uploadDate: '2023-10-27', status: 'READY', progress: 100,
        category: 'Expert Call', tags: ['Feed Demand', 'Hog Cycle'], summary: 'Top analyst predicts pork price recovery in Q1 2024, driving demand for soybean meal feed.',
        sentiment: 'BULLISH', impactScore: 60, relatedAssets: ['Meal (M)', 'Hogs (LH)']
    }
];

export const CustomUpload: React.FC<CustomUploadProps> = ({ onNavigate }) => {
  // --- State ---
  const [library, setLibrary] = useState<KnowledgeAsset[]>(MOCK_FILES);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(MOCK_FILES[0].id);
  const [storageUsed, setStorageUsed] = useState<number>(MOCK_FILES.reduce((acc, f) => acc + f.size, 0));
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Graph State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'NAVIGATE' | 'SELECT'>('NAVIGATE');
  const [modelingQueue, setModelingQueue] = useState<Set<string>>(new Set());
  
  // Push & AI State
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isPushed, setIsPushed] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Navigation config
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const, active: true },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  const categories = [
    { name: 'Satellite Remote Sensing', icon: 'satellite_alt', id: 'dataSource' },
    { name: 'Weather', icon: 'cloud', id: 'weatherAnalysis' },
    { name: 'Futures Trading', icon: 'query_stats', id: 'futuresTrading' },
    { name: 'Supply/Demand', icon: 'inventory_2', id: 'supplyDemand' },
    { name: 'Policy/Public Sentiment', icon: 'newspaper', id: 'policySentiment' },
    { name: 'Spot/Industry', icon: 'factory', id: 'spotIndustry' },
    { name: 'Custom Upload', icon: 'upload', id: 'customUpload', active: true }
  ];

  // --- Helpers ---
  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIconForType = (type: FileType) => {
      switch (type) {
          case 'DOC': return 'description';
          case 'IMAGE': return 'image';
          case 'AUDIO': return 'headphones';
          case 'VIDEO': return 'movie';
          case 'GEO': return 'public';
          case 'DATA': return 'table_chart';
          default: return 'insert_drive_file';
      }
  };

  const toggleModelingQueue = (id: string) => {
      const newSet = new Set(modelingQueue);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setModelingQueue(newSet);
  };

  // --- Upload Simulation ---
  const handleFileUpload = (files: FileList | null) => {
      if (!files) return;
      
      const newAssets: KnowledgeAsset[] = [];
      let addedSize = 0;

      Array.from(files).forEach(file => {
          if (storageUsed + addedSize + file.size > MAX_STORAGE_BYTES) {
              alert(`Storage Limit Exceeded! Cannot upload ${file.name}`);
              return;
          }

          let fType: FileType = 'DOC';
          if (file.type.includes('image')) fType = 'IMAGE';
          else if (file.type.includes('audio')) fType = 'AUDIO';
          else if (file.type.includes('video')) fType = 'VIDEO';
          else if (file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.xlsx')) fType = 'DATA';
          else if (file.name.endsWith('.geojson') || file.name.endsWith('.kml')) fType = 'GEO';

          addedSize += file.size;

          newAssets.push({
              id: `new_${Date.now()}_${Math.random()}`,
              name: file.name,
              size: file.size,
              type: fType,
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'QUEUED',
              progress: 0,
              category: 'Unclassified',
              tags: ['Processing...'],
              summary: 'Waiting for Neural Analysis...',
              sentiment: 'NEUTRAL',
              impactScore: 0,
              relatedAssets: []
          });
      });

      setLibrary(prev => [...newAssets, ...prev]);
      setStorageUsed(prev => prev + addedSize);

      newAssets.forEach(asset => simulateProcessing(asset.id));
  };

  const simulateProcessing = (id: string) => {
      setLibrary(prev => prev.map(f => f.id === id ? { ...f, status: 'UPLOADING' } : f));
      let p = 0;
      const interval = setInterval(() => {
          p += Math.random() * 20;
          if (p >= 100) {
              clearInterval(interval);
              setLibrary(prev => prev.map(f => f.id === id ? { ...f, status: 'ANALYZING', progress: 100 } : f));
              setTimeout(() => completeAIAnalysis(id), 2000);
          } else {
              setLibrary(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          }
      }, 500);
  };

  const completeAIAnalysis = (id: string) => {
      setLibrary(prev => prev.map(f => {
          if (f.id !== id) return f;
          const assets = ['Corn (ZC)', 'Soybeans (ZS)', 'Cotton (CF)', 'Sugar (SR)'];
          const pickedAsset = assets[Math.floor(Math.random() * assets.length)];
          const sentiments: any[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];
          
          return {
              ...f,
              status: 'READY',
              category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
              tags: ['AI-Detected', 'Quant-Ready'],
              summary: `Gemini Analysis: Extracted critical data regarding ${pickedAsset}. High correlation with spot volatility.`,
              sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
              impactScore: 50 + Math.floor(Math.random() * 40),
              relatedAssets: [pickedAsset]
          };
      }));
      setSelectedFileId(id);
  };

  const handleDelete = (id: string) => {
      const file = library.find(f => f.id === id);
      if (file) {
          setStorageUsed(prev => prev - file.size);
          setLibrary(prev => prev.filter(f => f.id !== id));
          if (selectedFileId === id) setSelectedFileId(null);
          // Remove from modeling queue if present
          const newSet = new Set(modelingQueue);
          if (newSet.has(id)) {
              newSet.delete(id);
              setModelingQueue(newSet);
          }
      }
      setShowDeleteConfirm(null);
  };

  // --- Push Logic ---
  const handlePushSignal = async () => {
      setIsProcessingAI(true);
      setIsPushed(false);

      // 1. Filter Eligible Files based on Selection (modelingQueue)
      // Only process files that are explicitly selected by the user in the graph/list
      const eligibleFiles = library.filter(f => 
          modelingQueue.has(f.id) && 
          f.status === 'READY' && 
          (f.type === 'DOC' || f.type === 'DATA' || f.type === 'IMAGE')
      );
      
      if (eligibleFiles.length === 0) {
          alert("No suitable files selected. Please select files in the Knowledge Graph or List using 'Select' mode or Shift+Click.");
          setIsProcessingAI(false);
          return;
      }

      // 2. Prepare Context for Gemini
      const fileContexts = eligibleFiles.map(f => 
          `File: ${f.name} (Type: ${f.type}) | Summary: ${f.summary} | Sentiment: ${f.sentiment} (${f.impactScore})`
      ).join('\n');

      const prompt = `
        Role: Quantitative Analyst Assistant.
        Task: Synthesize the following unstructured document summaries into a structured time-series dataset for algorithmic trading backtesting.
        
        Input Data (Selected subset for scenario analysis):
        ${fileContexts}
        
        Output Requirement:
        Generate a strictly valid JSON array of objects representing a synthetic daily impact signal based on the upload dates and sentiments.
        Format:
        [
            { "date": "YYYY-MM-DD", "impact_score": number (-100 to 100) },
            ...
        ]
        Create at least 5 data points leading up to the current date to represent the "Knowledge Flow".
      `;

      try {
          if (!process.env.API_KEY) throw new Error("No API Key");
          
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
          });

          const text = response.text;
          if (text) {
              const cleaned = text.replace(/```json|```/g, '').trim();
              const json = JSON.parse(cleaned); // Array of { date, impact_score }
              
              if (Array.isArray(json)) {
                  // 3. Push to Data Layer
                  DATA_LAYERS.set('knowledge', {
                      sourceId: 'knowledge',
                      name: 'Knowledge Base Signal',
                      metricName: 'Unstructured Alpha',
                      data: json.map((d: any) => ({
                          date: d.date,
                          value: d.impact_score,
                          meta: { sourceCount: eligibleFiles.length }
                      })),
                      knowledgePackage: {
                          quantifiedSeries: json,
                          sourceFiles: eligibleFiles.map(f => f.name),
                          metadata: { generatedAt: Date.now() }
                      },
                      timestamp: Date.now()
                  });
                  setIsPushed(true);
              }
          }
      } catch (e) {
          console.error("Knowledge Push Error", e);
          alert("Failed to generate quantified signal from documents.");
      } finally {
          setIsProcessingAI(false);
      }
  };

  // --- Graph Physics Engine Initialization ---
  useEffect(() => {
      // Initialize Graph Nodes based on Library
      const width = 800; // Virtual width
      const height = 600; // Virtual height
      const cx = width / 2;
      const cy = height / 2;

      const newNodes: GraphNode[] = [];
      const assetMap: Record<string, string> = {}; // Asset Name -> Node ID

      // 1. Central Quant Brain
      const rootId = 'root_brain';
      newNodes.push({ 
          id: rootId, x: cx, y: cy, r: 40, label: 'Quant Brain', type: 'ROOT', color: '#0d59f2', 
          connections: [], vx: 0, vy: 0 
      });

      // 2. Generate Nodes from Files
      library.forEach((file, i) => {
          // Add File Node
          const angle = (i / library.length) * Math.PI * 2;
          const dist = 200 + Math.random() * 50;
          
          const fileNode: GraphNode = {
              id: file.id,
              x: cx + Math.cos(angle) * dist,
              y: cy + Math.sin(angle) * dist,
              r: 12 + (file.impactScore / 15),
              label: file.name.substring(0, 8) + '...',
              type: 'FILE',
              color: file.sentiment === 'BULLISH' ? '#0bda5e' : file.sentiment === 'BEARISH' ? '#fa6238' : '#90a4cb',
              connections: [{ targetId: rootId, strength: 1 }],
              vx: 0, vy: 0
          };
          newNodes.push(fileNode);

          // Add Asset/Concept Nodes
          file.relatedAssets.forEach(assetName => {
              if (!assetMap[assetName]) {
                  const aid = `asset_${assetName}`;
                  assetMap[assetName] = aid;
                  // Place asset nodes in inner ring
                  const aAngle = Math.random() * Math.PI * 2;
                  const aDist = 100;
                  newNodes.push({
                      id: aid,
                      x: cx + Math.cos(aAngle) * aDist,
                      y: cy + Math.sin(aAngle) * aDist,
                      r: 20,
                      label: assetName,
                      type: 'ASSET',
                      color: '#ffffff',
                      connections: [{ targetId: rootId, strength: 2 }],
                      vx: 0, vy: 0
                  });
              }
              // Connect File to Asset
              fileNode.connections.push({ targetId: assetMap[assetName], strength: 1 });
          });
      });

      setNodes(newNodes);
      // Reset View to center
      if(svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          setViewState({ x: rect.width/2 - cx, y: rect.height/2 - cy, scale: 1 });
      }

  }, [library]);

  // --- Interactive Graph Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, nodeId?: string) => {
      e.stopPropagation();
      // Normalize event coordinates
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      setLastMousePos({ x: clientX, y: clientY });

      if (nodeId) {
          // If in Select Mode or holding Shift/Ctrl, toggle selection
          const isMulti = interactionMode === 'SELECT' || (e as React.MouseEvent).shiftKey || (e as React.MouseEvent).ctrlKey;
          
          if (isMulti) {
              toggleModelingQueue(nodeId);
          } else {
              setIsDraggingNode(nodeId);
              if (nodeId.startsWith('f') || nodeId.startsWith('new_')) setSelectedFileId(nodeId);
          }
      } else {
          setIsPanning(true);
      }
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = clientX - lastMousePos.x;
      const dy = clientY - lastMousePos.y;

      setLastMousePos({ x: clientX, y: clientY });

      if (isDraggingNode) {
          setNodes(prev => prev.map(n => {
              if (n.id === isDraggingNode) {
                  return { ...n, x: n.x + dx / viewState.scale, y: n.y + dy / viewState.scale, vx: 0, vy: 0 };
              }
              return n;
          }));
      } else if (isPanning) {
          setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      }
  }, [isDraggingNode, isPanning, lastMousePos, viewState.scale]);

  const handleMouseUp = () => {
      setIsDraggingNode(null);
      setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const scaleSpeed = 0.001;
      const newScale = Math.max(0.2, Math.min(3, viewState.scale - e.deltaY * scaleSpeed));
      setViewState(prev => ({ ...prev, scale: newScale }));
  };

  // Add/Remove global listeners for drag
  useEffect(() => {
      if (isDraggingNode || isPanning) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          window.addEventListener('touchmove', handleMouseMove);
          window.addEventListener('touchend', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          window.removeEventListener('touchmove', handleMouseMove);
          window.removeEventListener('touchend', handleMouseUp);
      };
  }, [isDraggingNode, isPanning, handleMouseMove]);

  const activeFile = useMemo(() => library.find(f => f.id === selectedFileId), [library, selectedFileId]);

  return (
    <div className="bg-[#101622] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col h-screen selection:bg-[#0d59f2]/30">
      {/* Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#101622] px-6 flex items-center justify-between z-[60] shrink-0">
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
              onClick={() => item.view !== 'dataSource' && onNavigate(item.view)}
              className={`h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${item.active ? 'border-[#0d59f2] text-[#0d59f2]' : 'border-transparent text-[#90a4cb] hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
          <SystemClock />
          <div className="h-8 w-px bg-[#314368] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d59f2] transition-colors">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-72 bg-[#101622] border-r border-[#314368] flex flex-col shrink-0">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-[#90a4cb]/50 uppercase tracking-widest mb-4">Data Categories</p>
            {categories.map((cat) => (
              <div 
                key={cat.name}
                onClick={() => cat.id && onNavigate(cat.id as any)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 transition-all group cursor-pointer ${
                  cat.active 
                  ? 'bg-[#0d59f2]/10 border-[#0d59f2] text-white' 
                  : 'border-transparent text-[#90a4cb] hover:bg-[#182234] hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined ${cat.active ? 'text-[#0d59f2]' : 'group-hover:text-[#0d59f2]'}`}>{cat.icon}</span>
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-[#314368]">
            {/* Storage Quota Widget */}
            <div className="bg-[#182234] rounded-xl p-4 border border-[#314368] mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-[#90a4cb] uppercase">Knowledge Base Storage</span>
                    <span className="text-[10px] font-bold text-white">{formatBytes(storageUsed)} / 1 GB</span>
                </div>
                <div className="w-full bg-[#101622] h-2 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${storageUsed/MAX_STORAGE_BYTES > 0.9 ? 'bg-[#fa6238]' : 'bg-[#0d59f2]'}`} 
                        style={{ width: `${(storageUsed / MAX_STORAGE_BYTES) * 100}%` }}
                    ></div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#182234]/50 border border-[#314368]/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0d59f2] to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">JD</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">Analyst 04</p>
                <p className="text-[10px] text-[#90a4cb] uppercase font-semibold">Quant Ops Team</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area - 3 Column Layout */}
        <main className="flex-1 flex flex-col h-full bg-[#101622] relative overflow-hidden">
          <header className="z-10 bg-[#101622]/80 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d59f2]">upload_file</span>
                Knowledge Base Ingestion
              </h2>
              <p className="text-[#90a4cb] text-xs mt-1">Multi-modal data parsing • AI-Driven Classification • Neural Indexing</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-[#0d59f2] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#1a66ff] transition-all shadow-lg shadow-[#0d59f2]/20"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span> Upload Files
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={(e) => handleFileUpload(e.target.files)} 
              />
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            
            {/* COLUMN 1: UPLOAD QUEUE & FILE LIST */}
            <div className="w-80 bg-[#0a0c10]/50 border-r border-[#314368] flex flex-col">
                <div 
                    className={`p-6 border-b border-[#314368] transition-all ${isDragOver ? 'bg-[#0d59f2]/20' : 'bg-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { 
                        e.preventDefault(); 
                        setIsDragOver(false); 
                        handleFileUpload(e.dataTransfer.files); 
                    }}
                >
                    <div className="border-2 border-dashed border-[#314368] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#0d59f2] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <span className="material-symbols-outlined text-[#90a4cb] text-3xl mb-2">cloud_upload</span>
                        <p className="text-xs font-bold text-white uppercase">Drop Files Here</p>
                        <p className="text-[9px] text-[#90a4cb] mt-1">PDF, Excel, IMG, Audio, Video</p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    <p className="px-4 py-2 text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">Processing Queue</p>
                    {library.length === 0 && (
                        <div className="text-center py-10 text-[#90a4cb] text-xs italic">No files in knowledge base.</div>
                    )}
                    {library.map(file => (
                        <div 
                            key={file.id} 
                            onClick={() => setSelectedFileId(file.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border flex items-center gap-3 relative overflow-hidden group ${
                                selectedFileId === file.id 
                                ? 'bg-[#182234] border-[#0d59f2]' 
                                : 'bg-transparent border-transparent hover:bg-[#182234] hover:border-[#314368]'
                            }`}
                        >
                            {/* Progress Bar Background */}
                            {file.status !== 'READY' && file.status !== 'ERROR' && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-[#0d59f2] transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                            )}

                            <div className={`size-8 rounded flex items-center justify-center shrink-0 ${
                                file.status === 'READY' ? 'bg-[#0d59f2]/10 text-[#0d59f2]' : 'bg-[#314368]/30 text-[#90a4cb]'
                            }`}>
                                {file.status === 'UPLOADING' || file.status === 'ANALYZING' ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">{getIconForType(file.type)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${selectedFileId === file.id ? 'text-white' : 'text-slate-300'}`}>{file.name}</p>
                                <div className="flex justify-between items-center mt-0.5">
                                    <span className="text-[9px] text-[#90a4cb]">{formatBytes(file.size)}</span>
                                    <span className={`text-[8px] font-bold uppercase px-1.5 rounded ${
                                        file.status === 'READY' ? 'bg-[#0bda5e]/10 text-[#0bda5e]' : 
                                        file.status === 'ANALYZING' ? 'bg-[#ffb347]/10 text-[#ffb347]' : 
                                        'bg-slate-700 text-slate-400'
                                    }`}>{file.status}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(file.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded text-[#90a4cb] hover:text-rose-500 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUMN 2: AI ANALYSIS & EDITOR (The "Archive") */}
            <div className="flex-[4] bg-[#101622] border-r border-[#314368] flex flex-col min-w-0">
                {activeFile ? (
                    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="p-6 border-b border-[#314368] bg-[#101622] sticky top-0 z-10">
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-lg bg-[#182234] border border-[#314368] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-[#0d59f2]">{getIconForType(activeFile.type)}</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-white break-all">{activeFile.name}</h2>
                                    <div className="flex gap-3 mt-2 text-[10px] text-[#90a4cb] uppercase font-bold">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> {activeFile.uploadDate}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">category</span> {activeFile.category}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* AI Insight Card */}
                            <div className="bg-[#182234]/50 border border-[#314368] rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0d59f2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-[#0d59f2]/10 text-[#0d59f2] px-2 py-0.5 rounded border border-[#0d59f2]/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">psychology</span> Gemini Parsing
                                    </span>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest block mb-1">Executive Summary</span>
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                            {activeFile.status === 'READY' ? activeFile.summary : <span className="animate-pulse">Analyzing content structure and extracting entities...</span>}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#101622] p-3 rounded-lg border border-[#314368]">
                                            <span className="text-[9px] text-[#90a4cb] uppercase font-bold block mb-1">Trade Sentiment</span>
                                            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                                                activeFile.sentiment === 'BULLISH' ? 'bg-[#0bda5e]/20 text-[#0bda5e]' : 
                                                activeFile.sentiment === 'BEARISH' ? 'bg-[#fa6238]/20 text-[#fa6238]' : 
                                                'bg-slate-700 text-slate-300'
                                            }`}>{activeFile.sentiment}</span>
                                        </div>
                                        <div className="bg-[#101622] p-3 rounded-lg border border-[#314368]">
                                            <span className="text-[9px] text-[#90a4cb] uppercase font-bold block mb-1">Market Impact</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-[#314368] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#0d59f2]" style={{ width: `${activeFile.impactScore}%` }}></div>
                                                </div>
                                                <span className="text-xs font-mono text-white">{activeFile.impactScore}/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tags & Metadata Editor */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#314368] pb-2">Knowledge Graph Metadata</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Category Classification</label>
                                    <select 
                                        value={activeFile.category}
                                        onChange={(e) => {
                                            setLibrary(prev => prev.map(f => f.id === activeFile.id ? { ...f, category: e.target.value } : f));
                                        }}
                                        className="w-full bg-[#182234] border border-[#314368] text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-[#0d59f2]"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Detected Entities (Tags)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {activeFile.tags.map((tag, i) => (
                                            <span key={i} className="text-[10px] bg-[#182234] border border-[#314368] px-2 py-1 rounded-full text-slate-300 flex items-center gap-1 group">
                                                {tag}
                                                <button className="hover:text-rose-500"><span className="material-symbols-outlined text-[10px]">close</span></button>
                                            </span>
                                        ))}
                                        <button className="text-[10px] bg-[#0d59f2]/10 border border-[#0d59f2]/30 text-[#0d59f2] px-2 py-1 rounded-full hover:bg-[#0d59f2] hover:text-white transition-colors">
                                            + Add Entity
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#90a4cb] uppercase">Linked Futures Assets</label>
                                    <div className="flex flex-wrap gap-2">
                                        {activeFile.relatedAssets.map((asset, i) => (
                                            <span key={i} className="text-[10px] font-mono font-bold bg-[#182234] border border-[#314368] px-2 py-1 rounded text-[#0d59f2]">
                                                {asset}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-between">
                                <button onClick={() => setShowDeleteConfirm(activeFile.id)} className="text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">delete</span> Delete Asset
                                </button>
                                <button className="px-6 py-2 bg-[#0d59f2] hover:bg-[#1a66ff] text-white text-xs font-bold uppercase rounded-lg shadow-lg shadow-[#0d59f2]/20 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">save</span> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#90a4cb] opacity-50 p-10 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4 text-slate-700">folder_open</span>
                        <p className="text-sm font-bold uppercase tracking-widest">Select a file to inspect</p>
                    </div>
                )}
            </div>

            {/* COLUMN 3: NEURAL KNOWLEDGE GRAPH (Interactive Visualization) */}
            <div className="flex-[5] bg-[#05070a] relative overflow-hidden flex flex-col">
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0bda5e]">hub</span>
                        Neural Knowledge Graph
                    </h3>
                    <p className="text-[10px] text-[#90a4cb] mt-1">
                        {library.length} Nodes | Interaction Mode: <span className="text-[#00f2ff] font-bold">{interactionMode}</span>
                    </p>
                </div>

                {/* Interaction Mode Toggle */}
                <div className="absolute top-4 right-4 z-20 flex bg-[#182234] border border-[#314368] rounded-lg p-1">
                    <button 
                        onClick={() => setInteractionMode('NAVIGATE')}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${interactionMode === 'NAVIGATE' ? 'bg-[#0d59f2] text-white' : 'text-[#90a4cb] hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-xs">pan_tool</span> Navigate
                    </button>
                    <button 
                        onClick={() => setInteractionMode('SELECT')}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${interactionMode === 'SELECT' ? 'bg-[#00f2ff] text-[#0a0c10]' : 'text-[#90a4cb] hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-xs">checklist</span> Select
                    </button>
                </div>

                {/* Legend/Controls */}
                <div className="absolute bottom-36 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
                    <div className="bg-black/50 backdrop-blur p-2 rounded border border-[#314368] text-[9px] text-[#90a4cb]">
                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#0d59f2]"></div> Quant Brain</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#0bda5e]"></div> Bullish File</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#fa6238]"></div> Bearish File</div>
                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff]"></div> Selected</div>
                    </div>
                    <button onClick={() => setViewState({ x: 0, y: 0, scale: 1 })} className="p-2 bg-[#182234] border border-[#314368] rounded hover:text-white text-[#90a4cb] transition-colors shadow-lg" title="Reset View">
                        <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                    </button>
                </div>

                <div 
                    className={`flex-1 relative overflow-hidden bg-[#05070a] ${interactionMode === 'NAVIGATE' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                    onMouseDown={(e) => handleMouseDown(e)}
                    onWheel={handleWheel}
                    onTouchStart={(e) => handleMouseDown(e)}
                >
                    {/* Simplified SVG Graph Visualization */}
                    <svg 
                        ref={svgRef}
                        className="w-full h-full block"
                    >
                        {/* Define Glow Filter */}
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <filter id="selectGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Apply Pan/Zoom Transform */}
                        <g transform={`translate(${viewState.x},${viewState.y}) scale(${viewState.scale})`}>
                            
                            {/* Connections */}
                            {nodes.map(node => 
                                node.connections.map((conn, i) => {
                                    const target = nodes.find(n => n.id === conn.targetId);
                                    if (!target) return null;
                                    // Check if both nodes are selected to highlight connection
                                    const isHighlight = modelingQueue.has(node.id) && modelingQueue.has(target.id);
                                    
                                    return (
                                        <g key={`${node.id}-${target.id}-${i}`}>
                                            <line 
                                                x1={node.x} y1={node.y}
                                                x2={target.x} y2={target.y}
                                                stroke={isHighlight ? '#00f2ff' : '#314368'}
                                                strokeWidth={isHighlight ? 2 : Math.max(1, conn.strength / 2)}
                                                opacity={isHighlight ? 0.8 : 0.4}
                                            />
                                            {/* Pulse Animation */}
                                            <circle r="2" fill={isHighlight ? '#00f2ff' : '#0d59f2'}>
                                                <animateMotion 
                                                    dur={`${2 + Math.random()}s`} 
                                                    repeatCount="indefinite"
                                                    path={`M${node.x},${node.y} L${target.x},${target.y}`}
                                                />
                                            </circle>
                                        </g>
                                    );
                                })
                            )}

                            {/* Nodes */}
                            {nodes.map(node => {
                                const isSelectedForModel = modelingQueue.has(node.id);
                                return (
                                    <g 
                                        key={node.id} 
                                        onMouseDown={(e) => { handleMouseDown(e, node.id); }}
                                        onTouchStart={(e) => { handleMouseDown(e, node.id); }}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                    >
                                        {/* Selection Halo (Modeling Queue) */}
                                        {isSelectedForModel && (
                                            <circle 
                                                cx={node.x} cy={node.y} r={node.r * 2.2} 
                                                fill="none" stroke="#00f2ff" strokeWidth="2" strokeDasharray="2 2"
                                                className="animate-spin-slow"
                                                opacity="0.8"
                                            />
                                        )}
                                        {/* Actual Node Body (FIXED) */}
                                        <circle 
                                            cx={node.x} 
                                            cy={node.y} 
                                            r={node.r} 
                                            fill={node.color} 
                                            stroke={isSelectedForModel ? '#00f2ff' : 'transparent'}
                                            strokeWidth={2}
                                            filter={node.type === 'ROOT' ? "url(#glow)" : undefined}
                                        />
                                        {/* Node Label */}
                                        <text 
                                            x={node.x} 
                                            y={node.y + node.r + 12} 
                                            textAnchor="middle" 
                                            fill={isSelectedForModel ? '#00f2ff' : '#90a4cb'}
                                            fontSize={node.type === 'ROOT' ? 12 : 9}
                                            fontWeight="bold"
                                            className="uppercase tracking-wide pointer-events-none select-none"
                                        >
                                            {node.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 border-t border-[#314368] bg-[#101622] flex justify-between items-center z-30">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#90a4cb] uppercase font-bold tracking-widest">Selected for Fusion:</span>
                        <div className="flex gap-1">
                            {Array.from(modelingQueue).slice(0, 3).map(id => (
                                <div key={id} className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff]"></div>
                            ))}
                            {modelingQueue.size > 3 && <span className="text-[9px] text-[#00f2ff]">+{modelingQueue.size - 3}</span>}
                            {modelingQueue.size === 0 && <span className="text-[9px] text-[#90a4cb] italic">None</span>}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handlePushSignal}
                        disabled={isProcessingAI || isPushed || modelingQueue.size === 0}
                        className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all ${
                            isPushed 
                            ? 'bg-[#0bda5e] text-[#0a0c10] cursor-not-allowed shadow-[#0bda5e]/20' 
                            : (modelingQueue.size === 0 && !isProcessingAI)
                                ? 'bg-[#1a2333] text-[#90a4cb] cursor-not-allowed border border-[#314368]'
                                : 'bg-[#0d59f2] hover:bg-[#1a66ff] text-white shadow-[#0d59f2]/20'
                        }`}
                    >
                        {isProcessingAI ? (
                            <><span className="material-symbols-outlined text-sm animate-spin">smart_toy</span> QUANTIFYING...</>
                        ) : isPushed ? (
                            <><span className="material-symbols-outlined text-sm">check_circle</span> LAYER ADDED</>
                        ) : (
                            <><span className="material-symbols-outlined text-sm">cloud_upload</span> PUSH KNOWLEDGE SIGNAL</>
                        )}
                    </button>
                </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #101622; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #314368; border-radius: 10px; }
        @keyframes spin-slow {
            from { transform: rotate(0deg); transform-origin: center; }
            to { transform: rotate(360deg); transform-origin: center; }
        }
        .animate-spin-slow {
            animation: spin-slow 10s linear infinite;
            transform-box: fill-box;
            transform-origin: center;
        }
      `}</style>
    </div>
  );
};
