'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Printer, RefreshCw } from 'lucide-react';
import { TableItem } from './TableManager';

interface QRGeneratorProps {
    tables: TableItem[];
    onBack: () => void;
    onPreview: (tableId: string) => void;
}

export default function QRGenerator({ tables, onBack, onPreview }: QRGeneratorProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white print:bg-white">

            {/* Background Tech Grid (Hide on print) */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] print:hidden"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Top Bar (Hide on print) */}
            <nav className="sticky top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41] print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-xs font-bold uppercase">Back</span>
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-widest uppercase">System Utility</h1>
                    <span className="text-[10px] text-gray-500 font-bold">QR GENERATOR</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-[#1F1F1F] text-xs font-bold uppercase rounded-sm hover:bg-gray-200 transition-colors"
                    >
                        <Printer size={16} />
                        <span className="hidden md:inline">Print All</span>
                    </button>
                </div>
            </nav>

            <main className="pt-24 pb-20 max-w-6xl mx-auto px-4 md:px-8 print:pt-0 print:max-w-none">

                <div className="mb-8 print:hidden">
                    <h2 className="text-4xl font-black text-[#1F1F1F] mb-2 uppercase tracking-tight">Table QR Codes</h2>
                    <p className="text-gray-500 font-bold text-sm">Generated unique identifiers for table ordering.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:gap-8">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => onPreview(table.id)}
                            className={`
                                flex flex-col items-center gap-4 p-6 bg-[#FFFFF0] border-2 border-gray-200 rounded-lg shadow-sm
                                hover:border-[#8D0B41] hover:shadow-lg transition-all cursor-pointer group
                                print:border-black print:shadow-none print:break-inside-avoid
                                ${!table.active ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            <div className="relative">
                                <div className="p-2 bg-white rounded-md border border-gray-100 group-hover:border-[#8D0B41]/20 transition-colors">
                                    <QRCodeSVG
                                        value={`https://dinestack.app/table/${table.id}`}
                                        size={120}
                                        level="H"
                                        fgColor="#1F1F1F"
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 print:hidden">
                                    <span className="text-xs font-bold uppercase text-[#8D0B41] border border-[#8D0B41] px-2 py-1 bg-white">
                                        Test
                                    </span>
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#1F1F1F] uppercase">{table.label}</h3>
                                <div className="w-8 h-1 bg-[#8D0B41] mx-auto mt-1 mb-2"></div>
                                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                    ID: {table.id}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
