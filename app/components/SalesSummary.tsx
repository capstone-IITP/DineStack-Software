'use client';

import React from 'react';
import { ChevronLeft, DollarSign, ShoppingBag, TrendingUp, Clock, Award, BarChart3 } from 'lucide-react';

interface SalesSummaryProps {
    onBack: () => void;
}

export default function SalesSummary({ onBack }: SalesSummaryProps) {
    // Mock Data
    const summary = {
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        peakTime: '--:--',
        topItems: [] as { name: string; count: number; revenue: number; }[]
    };

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

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
                    <span className="text-[10px] text-gray-500 font-bold">SALES SUMMARY</span>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="pt-24 pb-20 max-w-6xl mx-auto px-4 md:px-8">

                {/* Header Section */}
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-widest mb-1 block">Performance Overview</span>
                        <h2 className="text-4xl font-black uppercase tracking-tight text-[#1F1F1F]">Today's Insight</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold uppercase text-gray-400 block">System Date</span>
                        <span className="text-xl font-bold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                    {/* Total Sales */}
                    <div className="bg-[#FFFFF0] p-8 rounded-sm shadow-sm border-l-4 border-[#8D0B41] group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Revenue</span>
                            <div className="w-10 h-10 bg-[#8D0B41]/10 rounded-full flex items-center justify-center">
                                <DollarSign size={20} className="text-[#8D0B41]" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-[#8D0B41] mb-2">
                            ₹{summary.totalSales.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                            <TrendingUp size={14} />
                            <span>+12.5% vs Yesterday</span>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white p-8 rounded-sm shadow-sm border-l-4 border-gray-200 group hover:border-[#8D0B41] transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Orders</span>
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#8D0B41]/10 transition-colors">
                                <ShoppingBag size={20} className="text-gray-400 group-hover:text-[#8D0B41] transition-colors" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-[#1F1F1F] mb-2">
                            {summary.totalOrders}
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                            Avg Order: <span className="text-[#1F1F1F]">₹{summary.avgOrderValue.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Peak Time */}
                    <div className="bg-white p-8 rounded-sm shadow-sm border-l-4 border-gray-200 group hover:border-[#8D0B41] transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Peak Hours</span>
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#8D0B41]/10 transition-colors">
                                <Clock size={20} className="text-gray-400 group-hover:text-[#8D0B41] transition-colors" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-[#1F1F1F] mb-2">
                            {summary.peakTime}
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                            Highest Traffic Volume
                        </div>
                    </div>
                </div>

                {/* Top Items Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <Award className="text-[#8D0B41]" size={20} />
                                Top Performers
                            </h3>
                            <span className="text-xs font-bold uppercase text-gray-400">By Volume</span>
                        </div>

                        <div className="space-y-6">
                            {summary.topItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <span className="text-4xl font-black text-[#E5E5E5] w-12 text-center">0{index + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-[#1F1F1F]">{item.name}</h4>
                                            <span className="text-xs font-bold text-gray-400">{item.count} Sold</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#8D0B41]"
                                                style={{ width: `${(item.count / 50) * 100}%` }} // Mock max of 50
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-right w-20">
                                        <span className="text-sm font-bold block">₹{item.revenue}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Insights (Mock Text) */}
                    <div className="bg-[#1F1F1F] text-white p-8 rounded-sm shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <BarChart3 size={150} />
                        </div>

                        <h3 className="text-lg font-black uppercase tracking-tight mb-6 relative z-10">
                            Operational Insights
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex gap-4">
                                <div className="w-1 h-full bg-[#8D0B41]"></div>
                                <div>
                                    <h4 className="font-bold uppercase text-xs text-gray-400 mb-1">Recommendation</h4>
                                    <p className="text-sm font-medium leading-relaxed">
                                        Dinner service traffic is peaking 15 minutes earlier than average. Consider prepping starters by 18:45.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1 h-full bg-yellow-500"></div>
                                <div>
                                    <h4 className="font-bold uppercase text-xs text-gray-400 mb-1">Stock Alert</h4>
                                    <p className="text-sm font-medium leading-relaxed">
                                        <span className="text-white font-bold">Ribeye Steak</span> is selling faster than projected. Current stock may deplete before close.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    );
}
