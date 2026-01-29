import React, { useState } from 'react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [bootStage, setBootStage] = useState(0);
  const [formData] = useState({
    terminalId: 'admin@quantagrify.io',
    accessKey: 'password123'
  });

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    
    // Simulate complex engine boot stages
    setTimeout(() => setBootStage(1), 800);
    setTimeout(() => setBootStage(2), 1600);
    setTimeout(() => setBootStage(3), 2400);
    setTimeout(() => onLoginSuccess(), 3200);
  };

  const bootMessages = [
    "INITIATING NEURAL SYNAPSES",
    "INGESTING GLOBAL YIELD ARRAYS",
    "MCFLY AGRIBRAIN ACTIVE",
    "OPENING QUANTUM TERMINAL"
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#05070a]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#0d59f2]/40 to-transparent animate-[scan_6s_linear_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#0d59f2]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className={`relative z-10 w-full max-w-[480px] px-6 transition-all duration-700 ${isInitializing ? 'scale-90 opacity-0 blur-2xl' : 'scale-100 opacity-100'}`}>
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center bg-[#0d59f2]/10 rounded-2xl border border-[#0d59f2]/30 backdrop-blur-xl shadow-[0_0_40px_rgba(13,89,242,0.15)]">
              <span className="material-symbols-outlined text-6xl text-[#0d59f2] glow-text">agriculture</span>
              <div className="absolute -bottom-2 -right-2 bg-[#0d59f2] text-white p-1 rounded-lg text-[10px] font-bold tracking-widest uppercase px-2 shadow-lg">PRO</div>
            </div>
            <div className="mt-4">
              <h1 className="text-5xl font-bold tracking-tighter text-white">QuantAgrify</h1>
              <p className="text-[#90a4cb] text-[10px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">INTELLIGENCE FOR AGRICULTURE</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#0d59f2] to-transparent opacity-30 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Terminal Secure Access</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0bda5e] animate-pulse"></span>
              <p className="text-[#90a4cb] text-xs font-medium uppercase tracking-widest opacity-80 font-mono">System Ready // AES-256</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleInitialize}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest ml-1">Terminal UID</label>
              <div className="relative group/input">
                <input className="w-full bg-[#05070a]/60 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:border-[#0d59f2] transition-all outline-none font-mono tracking-tight" type="text" value={formData.terminalId} readOnly />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#90a4cb] text-sm opacity-40">fingerprint</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#90a4cb] uppercase tracking-widest ml-1">Access Token</label>
              <input className="w-full bg-[#05070a]/60 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:border-[#0d59f2] transition-all outline-none font-mono" type="password" value={formData.accessKey} readOnly />
            </div>
            <button type="submit" className="w-full bg-[#0d59f2] hover:bg-[#1a66ff] text-white font-bold py-5 rounded-xl transition-all shadow-lg shadow-[#0d59f2]/20 flex items-center justify-center gap-3 group/btn relative overflow-hidden">
              <span className="relative z-10 tracking-[0.2em] uppercase text-xs">Authorize Link</span>
              <span className="material-symbols-outlined relative z-10 group-hover/btn:translate-x-1 transition-transform">bolt</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-[#90a4cb] font-bold uppercase tracking-widest opacity-40">POWERED by MCFLY AgriBrain. ALL RIGHTS RESERVED</p>
      </div>

      {/* Advanced Knowledge Engine Boot Animation */}
      {isInitializing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05070a] animate-in fade-in duration-700">
          <div className="relative w-80 h-80 mb-16">
            {/* Multi-layered Rotating Rings */}
            <div className="absolute inset-0 border border-[#0d59f2]/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-[#0d59f2]/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed"></div>
            <div className="absolute inset-10 border-2 border-t-[#0d59f2] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_2s_linear_infinite]"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <div className="mb-4 relative">
                  <span className="material-symbols-outlined text-7xl text-[#0d59f2] animate-pulse glow-text">agriculture</span>
                  <div className="absolute inset-0 bg-[#0d59f2] blur-2xl opacity-20 animate-pulse"></div>
               </div>
               <div className="text-center overflow-hidden">
                  <div className="text-[#0d59f2] text-xs font-black uppercase tracking-[0.5em] mb-1 animate-[fade-in_0.5s_ease-out]">MCFLY</div>
                  <div className="text-white text-2xl font-black uppercase tracking-[0.2em] shadow-[#0d59f2]/50 drop-shadow-2xl">AgriBrain</div>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1.5 h-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-12 h-full rounded-full transition-all duration-500 ${bootStage >= i ? 'bg-[#0d59f2] shadow-[0_0_10px_#0d59f2]' : 'bg-white/10'}`}></div>
              ))}
            </div>
            <div className="h-6 flex items-center justify-center">
               <span key={bootStage} className="text-[#90a4cb] text-[10px] font-mono font-black uppercase tracking-[0.4em] animate-[slide-up_0.3s_ease-out]">
                {bootMessages[bootStage]}
               </span>
            </div>
          </div>

          {/* Flash Expansion Effect for Final Stage */}
          {bootStage === 3 && (
            <div className="absolute inset-0 bg-white animate-[flash_0.8s_ease-out_forwards] pointer-events-none z-[110]"></div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { transform: translateY(-100px); } 100% { transform: translateY(110vh); } }
        @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes flash { 
          0% { opacity: 0; transform: scale(0.1); border-radius: 50%; } 
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(3); border-radius: 0%; } 
        }
      `}</style>
    </div>
  );
};