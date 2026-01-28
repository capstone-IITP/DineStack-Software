'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Zap, Activity } from 'lucide-react';

// --- COLOR PALETTE & CONSTANTS ---
const THEME = {
    accent: '#8D0B41',    // Brand / Alert
    surface: '#FFFFF0',   // Paper / Warm Base
    ink: '#1F1F1F',       // Primary Text / Grid Lines
    dim: '#6A6A6A',       // Secondary Text
};

// --- COMPONENTS ---

// 1. GRID KEY: A single cell in the control grid
const GridKey = ({ value, label, onClick, accent = false, tall = false }: { value: string; label?: string; onClick: (value: string) => void; accent?: boolean; tall?: boolean }) => (
    <button
        onClick={() => onClick(value)}
        className={`
      relative group overflow-hidden
      flex flex-col items-center justify-center
      border-r border-b border-[#1F1F1F]
      ${tall ? 'row-span-2' : ''}
      transition-colors duration-75
      bg-[#FFFFF0]
      active:bg-[#1F1F1F]
      w-full h-full
    `}
    >
        <span className={`
      text-3xl sm:text-4xl font-bold font-mono z-10
      transition-colors duration-75
      ${accent ? 'text-[#8D0B41]' : 'text-[#1F1F1F]'}
      group-active:text-[#FFFFF0]
    `}>
            {label || value}
        </span>
        {/* Corner marker for tech feel */}
        <span className="absolute top-2 left-2 text-[8px] font-mono text-[#6A6A6A] group-active:text-[#8D0B41]">
            KEY_{value}
        </span>
    </button>
);

// 2. MODE TOGGLE: Massive typographic switch
const ModeToggle = ({ role, onToggle }: { role: string; onToggle: () => void }) => (
    <div
        onClick={onToggle}
        className="
      relative w-full h-full flex flex-col justify-between p-6 sm:p-8 cursor-pointer select-none
      bg-[#FFFFF0] hover:bg-[#fafaf0] active:bg-[#f0f0e0]
      transition-colors duration-200 overflow-visible
    "
    >
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-[#6A6A6A] font-mono mb-1">
                    Current Terminal Mode
                </span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-[#8D0B41]' : 'bg-[#1F1F1F]'}`} />
                    <span className="text-xs font-bold text-[#1F1F1F] font-mono">
                        {role === 'ADMIN' ? 'PRIVILEGED' : 'OPERATOR'}
                    </span>
                </div>
            </div>
            <Activity size={20} className="text-[#8D0B41]" />
        </div>

        {/* The "Switch" Visual */}
        <div className="mt-4 sm:mt-8 relative">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-16 bg-[#8D0B41]" />
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-[#1F1F1F] leading-[0.9]">
                {role === 'ADMIN' ? 'ADMIN' : 'KITCHEN'}
                <br />
                <span className="text-[#6A6A6A] opacity-30">
                    {role === 'ADMIN' ? 'ACCESS' : 'UNIT 01'}
                </span>
            </h1>
        </div>

        <span className="text-[10px] font-mono text-[#8D0B41] -mt-2 uppercase tracking-widest pt-4">
            [TAP TO SWITCH]
        </span>
    </div>
);

// 3. MAIN COMPONENT
export default function TapTableLogin({ onLoginSuccess }: { onLoginSuccess?: (role: string) => void }) {
    const [role, setRole] = useState('ADMIN');
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, VERIFYING, GRANTED, DENIED
    const [flash, setFlash] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    // Set time on client-side only to avoid hydration mismatch
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Reset PIN on role switch
    useEffect(() => {
        setPin('');
        setStatus('IDLE');
    }, [role]);

    const handlePress = (key: string) => {
        if (status === 'GRANTED' || status === 'VERIFYING') return;

        // Admin PIN is 6 digits, Kitchen PIN is 4 digits
        const PIN_LENGTH = role === 'ADMIN' ? 6 : 4;

        if (key === 'CLEAR') {
            setPin('');
            setStatus('IDLE');
            return;
        }

        if (key === 'BACK') {
            setPin(prev => prev.slice(0, -1));
            setStatus('IDLE');
            return;
        }

        if (pin.length < PIN_LENGTH) {
            const newPin = pin + key;
            setPin(newPin);
            if (newPin.length === PIN_LENGTH) {
                verify(newPin);
            }
        }
    };

    const verify = (code: string) => {
        setStatus('VERIFYING');

        // Admin PIN: 123456 (6 digits), Kitchen PIN: 1234 (4 digits)
        const validPin = role === 'ADMIN' ? '123456' : '1234';

        setTimeout(() => {
            if (code === validPin) {
                setStatus('GRANTED');
                // Navigate to dashboard after showing UNLOCKED state
                setTimeout(() => {
                    onLoginSuccess?.(role);
                }, 800);
            } else {
                setStatus('DENIED');
                setFlash(true);
                setTimeout(() => {
                    setPin('');
                    setStatus('IDLE');
                    setFlash(false);
                }, 800);
            }
        }, 400);
    };

    return (
        <div className="h-screen w-full bg-[#1F1F1F] flex flex-col font-sans overflow-hidden">

            {/* 4. MAIN DEVICE CHASSIS (Full Screen) */}
            <div className={`
        w-full h-full bg-[#FFFFF0] 
        flex flex-col
        relative
        ${flash ? 'animate-pulse bg-[#8D0B41]' : ''}
      `}>

                {/* --- SECTION A: STATUS HEADER --- */}
                <div className="h-14 flex-none border-b border-[#1F1F1F] flex items-center justify-between px-6 bg-[#FFFFF0]">
                    <div className="flex items-center gap-2">
                        <img src="/assets/TapTable-Bg.png" alt="TapTable" className="h-8 object-contain" />
                        <span className="text-xs font-mono font-bold tracking-widest text-[#1F1F1F]">
                            OS <span className="text-[#8D0B41]">v2.4</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#6A6A6A]">{currentTime}</span>
                        {status === 'GRANTED' ? <Unlock size={16} color="#1F1F1F" /> : <Lock size={16} color="#6A6A6A" />}
                    </div>
                </div>

                {/* --- SECTION B: SPLIT VIEW (Info + Display) --- */}
                {/* Adjusted flex to take up about 40% of height, leaving 60% for keypad */}
                <div className="flex-[0.8] flex flex-col sm:flex-row border-b border-[#1F1F1F] min-h-[250px]">

                    {/* LEFT: Mode Toggle */}
                    <div className="flex-1 border-b sm:border-b-0 sm:border-r border-[#1F1F1F] overflow-visible">
                        <ModeToggle
                            role={role}
                            onToggle={() => setRole(r => r === 'ADMIN' ? 'KITCHEN' : 'ADMIN')}
                        />
                    </div>

                    {/* RIGHT: PIN Visualizer */}
                    <div className="h-32 sm:h-auto sm:w-1/3 bg-[#FAFAFA] flex flex-col items-center justify-center relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#1F1F1F_1px,transparent_1px)] [background-size:8px_8px]" />

                        <span className="text-[9px] font-mono text-[#6A6A6A] absolute top-3 left-3">
                            INPUT_BUFFER
                        </span>

                        <div className="flex gap-2 z-10">
                            {Array.from({ length: role === 'ADMIN' ? 6 : 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`
                                w-4 h-16 transition-all duration-200
                                ${i < pin.length ? 'bg-[#1F1F1F]' : 'bg-[#E5E5E5]'}
                                ${status === 'DENIED' ? 'bg-[#8D0B41]' : ''}
                                ${status === 'GRANTED' ? 'bg-[#1F1F1F] !h-10' : ''}
                            `}
                                />
                            ))}
                        </div>

                        {/* Status Text Output */}
                        <div className="h-6 mt-6 flex items-center">
                            {status === 'VERIFYING' && <span className="text-xs font-mono animate-pulse">VERIFYING...</span>}
                            {status === 'DENIED' && <span className="text-xs font-mono font-bold text-[#8D0B41]">ACCESS DENIED</span>}
                            {status === 'GRANTED' && <span className="text-xs font-mono font-bold text-[#1F1F1F]">UNLOCKED</span>}
                        </div>
                    </div>
                </div>

                {/* --- SECTION C: THE GRID KEYPAD --- */}
                {/* Flex-grow ensures it fills the rest of the screen */}
                <div className="flex-[1.2] grid grid-cols-4 auto-rows-fr bg-[#1F1F1F] gap-[1px]">
                    {/* Row 1 */}
                    <GridKey value="1" onClick={handlePress} />
                    <GridKey value="2" onClick={handlePress} />
                    <GridKey value="3" onClick={handlePress} />
                    <button
                        onClick={() => handlePress('CLEAR')}
                        className="bg-[#FFFFF0] border-b border-[#1F1F1F] flex flex-col items-center justify-center active:bg-[#8D0B41] active:text-white group"
                    >
                        <span className="text-sm font-bold tracking-widest">CLR</span>
                    </button>

                    {/* Row 2 */}
                    <GridKey value="4" onClick={handlePress} />
                    <GridKey value="5" onClick={handlePress} />
                    <GridKey value="6" onClick={handlePress} />
                    <button
                        onClick={() => handlePress('BACK')}
                        className="bg-[#FFFFF0] border-b border-[#1F1F1F] flex flex-col items-center justify-center active:bg-[#8D0B41] active:text-white"
                    >
                        <span className="text-sm font-bold tracking-widest">DEL</span>
                    </button>

                    {/* Row 3 */}
                    <GridKey value="7" onClick={handlePress} />
                    <GridKey value="8" onClick={handlePress} />
                    <GridKey value="9" onClick={handlePress} />

                    {/* Enter / Submit Button (Spans 2 rows visually or acts as big trigger) */}
                    <button
                        className={`
                    row-span-2 bg-[#1F1F1F] text-[#FFFFF0]
                    flex flex-col items-center justify-center
                    transition-all duration-200
                    active:bg-[#8D0B41]
                `}
                    >
                        <Zap size={32} fill={status === 'VERIFYING' ? "#FFFFF0" : "none"} />
                    </button>

                    {/* Row 4 */}
                    <div className="bg-[#EAEAEA] border-r border-[#1F1F1F] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#1F1F1F] rounded-full" />
                    </div>
                    <GridKey value="0" onClick={handlePress} />
                    <div className="bg-[#EAEAEA] border-r border-[#1F1F1F] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#1F1F1F] rounded-full" />
                    </div>
                </div>

                {/* Footer Accent */}
                <div className="h-3 w-full bg-[#8D0B41] flex-none" />

            </div>

        </div>
    );
}