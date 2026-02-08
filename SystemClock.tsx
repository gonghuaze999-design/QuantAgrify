
import React, { useState, useEffect, useRef } from 'react';
import { ALARM_STATE } from './GlobalState';

// Beep Sound (Data URI for portability)
const ALARM_SOUND_URI = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated for brevity in example, actual impl would use a real short beep or AudioContext

export const SystemClock: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alarms, setAlarms] = useState(ALARM_STATE.alarms);
    const [showDropdown, setShowDropdown] = useState(false);
    const [newAlarmTime, setNewAlarmTime] = useState('');
    const [activeTrigger, setActiveTrigger] = useState<string | null>(null);

    // Audio Context for Alarm
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playAlarmSound = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    };

    // 1. Clock Engine
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Check Alarms (Simple Minute Matching)
            const currentHM = now.toLocaleTimeString('en-GB', { 
                timeZone: 'Asia/Shanghai', 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Avoid re-triggering in the same minute
            if (ALARM_STATE.lastTriggered !== currentHM) {
                const match = alarms.find(a => a.active && a.time === currentHM);
                if (match) {
                    setActiveTrigger(match.time);
                    ALARM_STATE.lastTriggered = currentHM;
                    playAlarmSound();
                    // Optional: Browser Notification could go here
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [alarms]);

    // 2. Formatting
    const timeString = currentTime.toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Shanghai', 
        hour12: false 
    });

    const hasActiveAlarms = alarms.some(a => a.active);

    // 3. Handlers
    const addAlarm = () => {
        if (!newAlarmTime) return;
        const newAlarm = {
            id: Date.now().toString(),
            time: newAlarmTime,
            active: true
        };
        const updated = [...alarms, newAlarm];
        setAlarms(updated);
        ALARM_STATE.alarms = updated;
        setNewAlarmTime('');
    };

    const deleteAlarm = (id: string) => {
        const updated = alarms.filter(a => a.id !== id);
        setAlarms(updated);
        ALARM_STATE.alarms = updated;
    };

    return (
        <div className="flex items-center gap-4 relative">
            {/* Alarm Trigger Overlay */}
            {activeTrigger && (
                <div className="fixed top-20 right-6 z-[200] bg-[#182234] border-2 border-[#fa6238] rounded-xl p-4 shadow-2xl animate-bounce flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#fa6238] text-3xl animate-pulse">alarm_on</span>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm">Alarm Triggered</h4>
                        <p className="text-[#fa6238] font-mono text-xl font-bold">{activeTrigger}</p>
                    </div>
                    <button 
                        onClick={() => setActiveTrigger(null)}
                        className="ml-2 bg-[#fa6238] hover:bg-[#ffb347] text-black font-bold px-3 py-1 rounded text-xs uppercase"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Bell Icon */}
            <div className="relative">
                <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`p-1.5 rounded-lg transition-all ${showDropdown ? 'bg-[#182234] text-white' : 'hover:bg-[#182234]'}`}
                >
                    <span className={`material-symbols-outlined text-xl ${hasActiveAlarms ? 'text-[#ffb347] animate-pulse-slow' : 'text-[#90a4cb]'}`}>
                        {hasActiveAlarms ? 'notifications_active' : 'notifications'}
                    </span>
                    {hasActiveAlarms && (
                        <span className="absolute top-1 right-1.5 w-2 h-2 bg-[#ffb347] rounded-full border border-[#101622]"></span>
                    )}
                </button>

                {/* Dropdown Panel */}
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                        <div className="absolute right-0 top-12 w-64 bg-[#0a0e17]/95 backdrop-blur-xl border border-[#314368] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-3 border-b border-[#314368] bg-[#101622] flex justify-between items-center">
                                <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">System Alarms</span>
                                <span className="text-[9px] text-[#0d59f2] font-bold">Beijing Time</span>
                            </div>
                            
                            <div className="p-3 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                {alarms.length === 0 && (
                                    <p className="text-center text-[10px] text-[#90a4cb] italic py-2">No active alarms</p>
                                )}
                                {alarms.map(alarm => (
                                    <div key={alarm.id} className="flex justify-between items-center bg-[#182234] p-2 rounded border border-[#314368]">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xs text-[#ffb347]">schedule</span>
                                            <span className="text-sm font-mono font-bold text-white">{alarm.time}</span>
                                        </div>
                                        <button 
                                            onClick={() => deleteAlarm(alarm.id)}
                                            className="text-[#90a4cb] hover:text-[#fa6238] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-[#314368] bg-[#101622] flex gap-2">
                                <input 
                                    type="time" 
                                    value={newAlarmTime}
                                    onChange={(e) => setNewAlarmTime(e.target.value)}
                                    className="flex-1 bg-[#182234] border border-[#314368] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#0d59f2]" 
                                />
                                <button 
                                    onClick={addAlarm}
                                    disabled={!newAlarmTime}
                                    className="px-3 py-1 bg-[#0d59f2] hover:bg-[#1a66ff] text-white text-[10px] font-bold uppercase rounded disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Time Display */}
            <div className="flex flex-col items-end leading-none select-none">
                <span className="font-mono text-lg font-bold text-white tabular-nums tracking-tight text-shadow-glow">
                    {timeString}
                </span>
                <span className="text-[9px] font-bold text-[#90a4cb] uppercase tracking-[0.1em]">Beijing (GMT+8)</span>
            </div>

            <style>{`
                .text-shadow-glow {
                    text-shadow: 0 0 10px rgba(13, 89, 242, 0.5);
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};
