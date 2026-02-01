'use client';

import React from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';

interface QREntryProps {
    tableId: string;
    onConfirm: () => void;
}

export default function QREntry({ tableId, onConfirm }: QREntryProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center animate-in fade-in duration-500">

            <div className="w-20 h-20 bg-[#FFFFF0] rounded-full flex items-center justify-center mb-8 shadow-sm">
                <MapPin size={32} className="text-[#8D0B41]" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to DineStack</h1>
            <p className="text-gray-500 mb-8">Please confirm your location.</p>

            <div className="w-full max-w-sm bg-[#F8F8F8] p-6 rounded-2xl border border-gray-100 mb-8">
                <div className="uppercase text-xs font-bold text-gray-400 mb-2 tracking-widest">You are seated at</div>
                <div className="text-4xl font-black text-[#1F1F1F]">{tableId}</div>
            </div>

            <button
                onClick={onConfirm}
                className="w-full max-w-sm bg-[#8D0B41] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8D0B41]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <CheckCircle2 size={20} />
                <span>Start Ordering</span>
            </button>

        </div>
    );
}
