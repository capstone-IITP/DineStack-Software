'use client';

import React, { useState } from 'react';
import { ChevronLeft, Calendar, Search, Filter, ArrowDownUp } from 'lucide-react';

interface OrderHistoryProps {
    onBack: () => void;
}

// Mock History Data
const HISTORY_DATA: { id: string; date: string; time: string; table: string; items: string; total: number; status: string; }[] = [];

export default function OrderHistory({ onBack }: OrderHistoryProps) {
    const [filter, setFilter] = useState('');
    const [dateRange, setDateRange] = useState('Today');

    const filteredData = HISTORY_DATA.filter(order =>
        order.id.includes(filter) ||
        order.table.toLowerCase().includes(filter.toLowerCase()) ||
        order.items.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="h-screen overflow-y-auto no-scrollbar bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

            {/* Background Tech Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Top Bar */}
            <nav className="sticky top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41]">
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
                    <h1 className="text-lg font-bold tracking-widest uppercase">Admin Reports</h1>
                    <span className="text-[10px] text-gray-500 font-bold">ORDER HISTORY</span>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="pt-24 pb-20 max-w-6xl mx-auto px-4 md:px-8">

                {/* Controls Bar */}
                <div className="bg-white p-2 rounded-sm shadow-sm border-l-4 border-[#8D0B41] flex flex-col md:flex-row items-center justify-between gap-4 mb-6">

                    {/* Left: Search Bar */}
                    <div className="flex-1 w-full relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="SEARCH ORDER ID, TABLE, ITEMS..."
                            className="w-full h-12 pl-12 pr-4 bg-transparent text-sm font-bold uppercase placeholder-gray-400 outline-none focus:bg-gray-50 transition-colors tracking-wide text-[#1F1F1F]"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    {/* Right: Date & Filters */}
                    <div className="flex items-center border-l border-gray-100 pl-4 space-x-2 mr-2">
                        <button className="h-10 px-4 flex items-center gap-3 border border-gray-100 hover:border-gray-300 transition-colors uppercase text-[10px] font-bold tracking-wider text-gray-600 bg-white">
                            <Calendar size={14} className="text-gray-400" />
                            <span>Date Range</span>
                            <span className="text-black font-black">Today</span>
                        </button>

                        <button className="h-10 w-10 flex items-center justify-center border border-gray-100 hover:border-[#8D0B41] hover:text-[#8D0B41] transition-colors text-gray-400 bg-white">
                            <Filter size={14} />
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#1F1F1F] rounded-t-sm overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1F1F1F] text-white text-[10px] font-bold uppercase tracking-widest leading-normal">
                                    <th className="p-4 pl-6 py-5">Order ID</th>
                                    <th className="p-4 py-5">Date & Time</th>
                                    <th className="p-4 py-5">Table</th>
                                    <th className="p-4 py-5 w-1/3">Items Summary</th>
                                    <th className="p-4 py-5 text-right">Total</th>
                                    <th className="p-4 py-5 text-center pr-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-xs">
                                {filteredData.map((order, index) => (
                                    <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-[#FFFFF0] transition-colors group text-[#1F1F1F]">
                                        <td className="p-4 pl-6 font-bold text-[#1F1F1F]">#{order.id}</td>
                                        <td className="p-4 text-gray-500 font-bold font-mono tracking-tight">
                                            {order.date} <span className="opacity-30 mx-1">|</span> {order.time}
                                        </td>
                                        <td className="p-4 font-black">{order.table}</td>
                                        <td className="p-4 text-gray-600 font-bold uppercase truncate max-w-xs">{order.items}</td>
                                        <td className="p-4 font-black text-right font-mono">₹{order.total.toFixed(2)}</td>
                                        <td className="p-4 text-center pr-6">
                                            <span className={`
                                                inline-block px-2 py-1 rounded-[2px] text-[9px] font-black uppercase tracking-wider
                                                ${order.status === 'Completed' ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            No orders found matching criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-[#8D0B41] p-1"></div>

                <div className="mt-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Displaying latest 50 records • Archive Access Required for older data
                </div>

            </main>
        </div>
    );
}
