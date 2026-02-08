
import React from 'react';

interface UserManagementProps {
  onNavigate: (view: 'hub' | 'login' | 'dataSource' | 'algorithm' | 'cockpit' | 'api') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onNavigate }) => {
  const navItems = [
    { label: 'Data Source', icon: 'database', view: 'dataSource' as const },
    { label: 'Algorithm', icon: 'precision_manufacturing', view: 'algorithm' as const },
    { label: 'Cockpit', icon: 'monitoring', view: 'cockpit' as const },
    { label: 'API Console', icon: 'terminal', view: 'api' as const }
  ];

  return (
    <div className="bg-[#05070a] text-white font-['Space_Grotesk'] h-screen flex flex-col overflow-hidden selection:bg-[#0d59f2]/30">
      {/* Precision Navigation Bar */}
      <nav className="h-16 border-b border-[#222f49] bg-[#0a0e17]/80 backdrop-blur-2xl px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-3 w-80 cursor-pointer" onClick={() => onNavigate('hub' as any)}>
          <div className="bg-[#0d59f2] p-1.5 rounded-lg shadow-lg shadow-[#0d59f2]/20 flex items-center justify-center size-10">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-white tracking-tight">QuantAgrify</span>
            <span className="text-[9px] font-bold text-white tracking-[0.2em] uppercase mt-1">WEALTH FROM AGRI</span>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center items-center gap-10 h-full">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className="h-full flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider text-[#90a4cb] hover:text-white transition-all border-b-2 border-transparent hover:border-white/20"
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-80 justify-end">
           <div className="text-right">
             <p className="text-[11px] font-bold text-white uppercase tracking-tighter">System Admin</p>
             <p className="text-[9px] text-emerald-500 font-black uppercase font-mono tracking-widest">Auth: Superuser</p>
           </div>
           <div className="size-10 rounded-full bg-[#1e293b] border border-[#0d59f2]/30 flex items-center justify-center">
             <span className="material-symbols-outlined text-[#0d59f2]">verified_user</span>
           </div>
        </div>
      </nav>
      {/* Rest of User Management logic */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-[#05070a] border-r border-[#314368] flex flex-col shrink-0 shadow-2xl">
          <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-black text-[#90a4cb]/50 uppercase tracking-[0.25em] mb-4">User Management</p>
          </nav>
        </aside>
        <main className="flex-1 flex flex-col h-full bg-[#05070a] relative overflow-hidden">
           <header className="z-10 bg-[#05070a]/60 backdrop-blur-md border-b border-[#314368] flex items-center justify-between px-8 py-6">
              <h2 className="text-white text-2xl font-black uppercase tracking-tighter italic">Admin User Management</h2>
           </header>
        </main>
      </div>
    </div>
  );
};
