'use client';

import React from 'react';
import { ScanLine, Clock, ShieldAlert, Lock, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. INVALID QR STATE
// ----------------------------------------------------------------------
export function InvalidQRState({ onScanAgain }: { onScanAgain?: () => void }) {
    return (
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                <ScanLine size={32} />
            </div>

            <h1 className="text-2xl font-bold text-[#1F1F1F] mb-3">QR Code Invalid</h1>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
                This code is no longer active or could not be recognized. Please ask a staff member for assistance.
            </p>

            {onScanAgain && (
                <button
                    onClick={onScanAgain}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-[#1F1F1F] hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCw size={16} />
                    <span>Try Scanning Again</span>
                </button>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// 2. RESTAURANT CLOSED STATE
// ----------------------------------------------------------------------
export function RestaurantClosedState() {
    return (
        <div className="min-h-screen bg-[#1F1F1F] text-white flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
                <Clock size={40} className="text-white/40" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-4">We Are Currently Closed</h1>
            <p className="text-white/40 max-w-sm mx-auto leading-relaxed mb-12">
                Ordering is currently unavailable. We look forward to serving you during our operating hours.
            </p>

            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                System Offline
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 3. ACCESS DENIED STATE
// ----------------------------------------------------------------------
export function AccessDeniedState() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 text-gray-300">
                <ShieldAlert size={48} />
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">Access Restricted</h1>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
                This area is limited to authorized personnel only.
            </p>

            <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 4. SESSION LOCKED STATE
// ----------------------------------------------------------------------
export function SessionLockedState({ onUnlock }: { onUnlock: () => void }) {
    return (
        <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Lock size={24} className="text-white/80" />
                </div>

                <h1 className="text-xl font-medium tracking-widest uppercase mb-8">Session Paused</h1>

                <button
                    onClick={onUnlock}
                    className="group flex items-center gap-3 pl-6 pr-4 py-3 bg-[#8D0B41] rounded-full font-bold text-sm shadow-[0_0_30px_-5px_rgba(141,11,65,0.5)] hover:shadow-[0_0_40px_-5px_rgba(141,11,65,0.7)] transition-all active:scale-95"
                >
                    <span>Resume Session</span>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={14} />
                    </div>
                </button>
            </div>
        </div>
    );
}
