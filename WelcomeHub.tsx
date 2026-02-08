
import React, { useState, useEffect } from 'react';
import { SystemClock } from './SystemClock';
import { GLOBAL_MARKET_CONTEXT } from './GlobalState';

interface WelcomeHubProps {
  onNavigate: (view: 'dataSource' | 'algorithm' | 'cockpit' | 'api' | 'userMgmt' | 'login') => void;
}

// --- CONSTANTS: ASSET DEFINITIONS ---
const AVAILABLE_ASSETS = [
    { label: '--- Dalian (DCE) ---', options: [
        { code: 'C9999.XDCE', name: 'Corn (玉米)' },
        { code: 'A9999.XDCE', name: 'Soybean No.1 (黄大豆1号)' },
        { code: 'M9999.XDCE', name: 'Soybean Meal (豆粕)' },
        { code: 'Y9999.XDCE', name: 'Soybean Oil (豆油)' },
        { code: 'P9999.XDCE', name: 'Palm Oil (棕榈油)' },
        { code: 'JD9999.XDCE', name: 'Egg (鸡蛋)' },
        { code: 'CS9999.XDCE', name: 'Corn Starch (玉米淀粉)' },
    ]},
    { label: '--- Zhengzhou (ZCE) ---', options: [
        { code: 'CF9999.XZCE', name: 'Cotton (棉花)' },
        { code: 'SR9999.XZCE', name: 'Sugar (白糖)' },
        { code: 'OI9999.XZCE', name: 'Rapeseed Oil (菜油)' },
        { code: 'RM9999.XZCE', name: 'Rapeseed Meal (菜粕)' },
        { code: 'AP9999.XZCE', name: 'Apple (苹果)' },
        { code: 'PK9999.XZCE', name: 'Peanut (花生)' },
    ]},
    { label: '--- Shanghai (SHFE) ---', options: [
        { code: 'RU9999.XSGE', name: 'Rubber (橡胶)' },
        { code: 'SP9999.XSGE', name: 'Paper Pulp (纸浆)' },
    ]},
    { label: '--- Chicago (CBOT) ---', options: [
        { code: 'ZC1!.CBOT', name: 'Corn (美玉米)' },
        { code: 'ZS1!.CBOT', name: 'Soybeans (美大豆)' },
        { code: 'ZW1!.CBOT', name: 'Wheat (美小麦)' },
        { code: 'ZL1!.CBOT', name: 'Soybean Oil (美豆油)' },
        { code: 'ZM1!.CBOT', name: 'Soybean Meal (美豆粕)' },
    ]}
];

export const WelcomeHub: React.FC<WelcomeHubProps> = ({ onNavigate }) => {
  const navItems = [
    { id: 'dataSource', label: 'Data Source', icon: 'database', cardIcon: 'database_off', desc: 'Unified stream management for multispectral imagery, weather grids, and historical series.' },
    { id: 'algorithm', label: 'Algorithm', icon: 'precision_manufacturing', cardIcon: 'precision_manufacturing', desc: 'Orchestrate hybrid intelligence pipelines using Bayesian inference and XGBoost ensembles.' },
    { id: 'cockpit', label: 'Cockpit', icon: 'monitoring', cardIcon: 'monitoring', desc: 'Real-time multi-asset oversight with proprietary signal alerts and precision backtesting.' },
    { id: 'api', label: 'API Console', icon: 'terminal', cardIcon: 'terminal', desc: 'Secure programmatic infrastructure for large-scale data harvesting and third-party delivery.' }
  ];

  // Local state for the Global Context inputs
  const [selectedAssetCode, setSelectedAssetCode] = useState(GLOBAL_MARKET_CONTEXT.asset.code);
  const [startDate, setStartDate] = useState(GLOBAL_MARKET_CONTEXT.startDate);
  const [endDate, setEndDate] = useState(GLOBAL_MARKET_CONTEXT.endDate);

  // Update Global State on change
  const handleContextUpdate = (key: 'code' | 'start' | 'end', value: string) => {
      if (key === 'code') {
          setSelectedAssetCode(value);
          // Find Name
          let name = 'Unknown';
          for (const grp of AVAILABLE_ASSETS) {
              const found = grp.options.find(o => o.code === value);
              if (found) { name = found.name; break; }
          }
          GLOBAL_MARKET_CONTEXT.asset = { code: value, name };
      } else if (key === 'start') {
          setStartDate(value);
          GLOBAL_MARKET_CONTEXT.startDate = value;
      } else if (key === 'end') {
          setEndDate(value);
          GLOBAL_MARKET_CONTEXT.endDate = value;
      }
      GLOBAL_MARKET_CONTEXT.isContextSet = true;
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-['Space_Grotesk'] overflow-hidden flex flex-col relative selection:bg-[#0d59f2]/30">
      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ 
             backgroundImage: 'linear-gradient(#0d59f2 0.5px, transparent 0.5px), linear-gradient(90deg, #0d59f2 0.5px, transparent 0.5px)',
             backgroundSize: '40px 40px'
           }}></div>

      {/* Navigation Bar - Refined and Centered */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0e17]/80 backdrop-blur-2xl px-6 flex items-center justify-between z-[100] relative">
        {/* Left Side: Standardized Logo */}
        <div className="flex items-center gap-3 w-80 cursor-pointer group" onClick={() => onNavigate('hub' as any)}>
          <div className="bg-[#0d59f2] p-1.5 rounded-lg shadow-lg shadow-[#0d59f2]/20 group-hover:scale-105 transition-transform flex items-center justify-center size-10">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-white tracking-tight">QuantAgrify</span>
            <span className="text-[9px] font-bold text-white tracking-[0.2em] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        {/* Center: Centered Menu Items */}
        <div className="flex-1 flex justify-center items-center gap-8 h-full">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id as any)}
              className="flex items-center gap-2 text-sm font-medium text-[#90a4cb] hover:text-white transition-all group relative h-16"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#0d59f2]">{item.icon}</span>
              {item.label}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#0d59f2] transition-all group-hover:w-full"></div>
            </button>
          ))}
        </div>
        
        {/* Right Side: Standardized Clock and User Profile */}
        <div className="flex items-center justify-end gap-4 w-80">
          <SystemClock />
          <div className="h-8 w-px bg-[#222f49] mx-2"></div>
          <div className="size-8 rounded-full bg-[#222f49] border border-slate-700 flex items-center justify-center overflow-hidden cursor-default">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden pb-32">
        {/* Abstract Data Visualization Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0d59f2]/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Dynamic Workflow Map */}
        <div className="w-full max-w-5xl mb-24 relative px-12 pt-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center z-50 mb-12">
            <h3 className="text-xs font-black text-[#00f2ff] tracking-[0.8em] uppercase mb-1 drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">Platform Pipeline</h3>
            <p className="text-[9px] text-[#94a3b8] font-mono opacity-60 uppercase tracking-[0.4em]">End-to-End Processing Engine Ready</p>
          </div>

          <div className="flex items-center justify-between relative mt-8">
            {[
              { label: 'Multisource Ingest', icon: 'cyclone' },
              { label: 'Neural Fusion', icon: 'psychology' },
              { label: 'Actionable Alpha', icon: 'trending_up' },
              { label: 'Global Endpoint', icon: 'hub' }
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-5 z-10 group cursor-default">
                  <div className="w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center bg-[#111827]/60 backdrop-blur-xl group-hover:border-[#0d59f2] transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(13,89,242,0.2)]">
                    <span className="material-symbols-outlined text-[#0d59f2] text-4xl glow-text">{step.icon}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94a3b8] group-hover:text-white transition-colors">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-[2px] w-full bg-gradient-to-r from-[#0d59f2]/30 via-[#0d59f2] to-[#0d59f2]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/40 animate-[shimmer_2s_infinite] -translate-x-full"></div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Functional Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1280px]">
          {navItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onNavigate(item.id as any)}
              className="group glass-panel rounded-3xl p-10 flex flex-col justify-between transition-all duration-500 hover:border-[#0d59f2]/50 hover:-translate-y-2 cursor-pointer shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[#0d59f2] text-sm">open_in_new</span>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#0d59f2]/10 flex items-center justify-center mb-8 border border-[#0d59f2]/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#0d59f2] text-3xl glow-text">{item.cardIcon}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase">{item.label}</h2>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-10 opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
              <div className="w-full py-4 bg-[#0d59f2]/10 group-hover:bg-[#0d59f2] text-[#0d59f2] group-hover:text-white border border-[#0d59f2]/30 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3">
                Configure Module <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

        {/* --- GLOBAL MARKET CONTEXT FOOTER --- */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#0d59f2]/30 bg-[#0a0e17]/95 backdrop-blur-xl p-0 flex justify-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {/* Widen container for better spacing on large screens */}
            <div className="w-full max-w-[1600px] px-8 py-5 flex items-center justify-between gap-6">
                
                <div className="flex items-center gap-4 shrink-0">
                    <div className="size-10 rounded-lg bg-[#0d59f2] flex items-center justify-center shadow-lg shadow-[#0d59f2]/20">
                        <span className="material-symbols-outlined text-white text-2xl">public</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#0d59f2] uppercase tracking-[0.2em]">Global Analysis Context</span>
                        <span className="text-xs text-[#90a4cb] font-medium">Define your target asset and time horizon for the session.</span>
                    </div>
                </div>

                {/* Central Control Block - Widened */}
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-8 bg-[#101622] border border-[#314368] rounded-2xl px-8 py-3 shadow-inner">
                        
                        {/* Asset Select */}
                        <div className="flex flex-col">
                            <label className="text-[8px] font-bold text-[#90a4cb] uppercase tracking-widest mb-1">Target Asset</label>
                            <div className="relative group">
                                <select 
                                    value={selectedAssetCode}
                                    onChange={(e) => handleContextUpdate('code', e.target.value)}
                                    // Increased width to 240px
                                    className="appearance-none bg-transparent text-white text-sm font-bold uppercase tracking-wide outline-none cursor-pointer w-[240px] border-b border-transparent group-hover:border-[#0d59f2] transition-colors pb-0.5 truncate"
                                >
                                    {AVAILABLE_ASSETS.map((group) => (
                                        <optgroup key={group.label} label={group.label} className="bg-[#101622] text-[#90a4cb]">
                                            {group.options.map(opt => (
                                                <option key={opt.code} value={opt.code} className="text-white">{opt.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-0 top-0 text-[#0d59f2] text-sm pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        <div className="w-px h-10 bg-[#314368]"></div>

                        {/* Start Date */}
                        <div className="flex flex-col">
                            <label className="text-[8px] font-bold text-[#90a4cb] uppercase tracking-widest mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => handleContextUpdate('start', e.target.value)}
                                // Increased width to 160px for full date visibility
                                className="bg-transparent text-white text-sm font-mono font-bold outline-none cursor-pointer hover:text-[#0d59f2] transition-colors w-[160px]"
                            />
                        </div>

                        <div className="text-[#314368] font-bold text-xl">→</div>

                        {/* End Date */}
                        <div className="flex flex-col">
                            <label className="text-[8px] font-bold text-[#90a4cb] uppercase tracking-widest mb-1">End Date</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => handleContextUpdate('end', e.target.value)}
                                // Increased width to 160px for full date visibility
                                className="bg-transparent text-white text-sm font-mono font-bold outline-none cursor-pointer hover:text-[#0d59f2] transition-colors w-[160px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] font-bold text-[#0bda5e] uppercase tracking-widest animate-pulse flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#0bda5e]"></span>
                        Context Active
                    </span>
                </div>

            </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
};
