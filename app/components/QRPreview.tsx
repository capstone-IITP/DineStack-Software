'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, ScanLine, CheckCircle2, Smartphone } from 'lucide-react';
import { TableItem } from './TableManager';

interface QRPreviewProps {
    table: TableItem;
    onBack: () => void;
}

export default function QRPreview({ table, onBack }: QRPreviewProps) {
    const [scanState, setScanState] = useState<'scanning' | 'detected'>('scanning');

    // Simulate scan detection after a delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setScanState('detected');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#111] text-white font-mono selection:bg-[#8D0B41] selection:text-white flex flex-col">

            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/50 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span className="text-xs font-bold uppercase">Back to Generator</span>
                </button>
                <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Device Test Mode</span>
                </div>
            </div>

            {/* Main Test Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">

                {/* Background Radar Effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[500px] h-[500px] border border-white/10 rounded-full animate-[ping_3s_linear_infinite]"></div>
                    <div className="w-[300px] h-[300px] border border-white/10 rounded-full animate-[ping_3s_linear_infinite_delay-1000]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-8">

                    {/* QR Display Card */}
                    <div className="bg-white p-8 rounded-xl shadow-2xl relative overflow-hidden group">
                        <QRCodeSVG
                            value={`https://dinestack.app/table/${table.id}`}
                            size={250}
                            level="H"
                            fgColor="#1F1F1F"
                            bgColor="#FFFFFF"
                        />

                        {/* Scanning Line Animation */}
                        {scanState === 'scanning' && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#8D0B41] shadow-[0_0_20px_#8D0B41] animate-[scan_2s_ease-in-out_infinite]"></div>
                        )}

                        {/* Success Overlay */}
                        <div className={`
                            absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-4 transition-opacity duration-300
                            ${scanState === 'detected' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                         `}>
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-[bounce_0.5s_ease-out]">
                                <CheckCircle2 size={32} className="text-white" strokeWidth={3} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#1F1F1F] uppercase mb-1">Table Detected</h3>
                                <p className="text-sm font-bold text-gray-500">{table.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-center">
                        <h2 className="text-3xl font-black uppercase mb-2">{table.label}</h2>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest bg-white/10 px-3 py-1 rounded-full">
                                ID: {table.id}
                            </span>
                            <span className={`
                                text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full
                                ${scanState === 'detected' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}
                            `}>
                                {scanState === 'detected' ? 'Verified Valid' : 'Scanning...'}
                            </span>
                        </div>
                    </div>

                    <p className="max-w-md text-center text-gray-500 text-sm">
                        This screen simulates a mobile device scanning the printed QR code.
                        Ensure the URL resolves correctly to the customer menu.
                    </p>

                    {scanState === 'detected' && (
                        <button
                            onClick={() => setScanState('scanning')}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-wider rounded-sm transition-colors"
                        >
                            <ScanLine size={16} />
                            Rescan Code
                        </button>
                    )}

                </div>
            </main>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
