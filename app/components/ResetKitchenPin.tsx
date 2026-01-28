'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetKitchenPinProps {
    onCancel: () => void;
    onConfirmed: () => void;
}

export default function ResetKitchenPin({ onCancel, onConfirmed }: ResetKitchenPinProps) {
    return (
        <div className="min-h-screen bg-[#1F1F1F] text-white font-mono flex items-center justify-center p-6 relative overflow-hidden">

            {/* Background Warning Stripes */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 20px, #ffffff 20px, #ffffff 40px)' }}>
            </div>

            <div className="max-w-md w-full relative z-10 bg-[#2A2A2A] border border-red-900/50 p-10 rounded-lg shadow-2xl">

                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-4">
                        Revoke Access?
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        This action will <span className="text-white font-bold">immediately invalidate</span> the current Kitchen PIN.
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-2">
                        All kitchen terminals will be logged out until a new PIN is set.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onConfirmed}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm rounded-sm transition-all shadow-lg hover:shadow-red-900/20"
                    >
                        Yes, Revoke & Reset
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-4 bg-transparent border border-gray-600 hover:border-white text-gray-400 hover:text-white font-bold uppercase tracking-widest text-sm rounded-sm transition-all"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
}
