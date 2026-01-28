'use client';

import React from 'react';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export interface Order {
    id: string;
    table: string;
    items: string;
    status: 'Cooking' | 'Ready' | 'Pending' | 'Served';
    time: string;
    total: number;
    notes?: string;
}

interface OrderMonitorProps {
    orders: Order[];
    onOrderClick: (order: Order) => void;
}

const STATUS_CONFIG = {
    'Pending': { color: 'text-gray-500', icon: Circle, bg: 'bg-gray-100' },
    'Cooking': { color: 'text-[#8D0B41]', icon: Clock, bg: 'bg-[#FFF0F5]' },
    'Ready': { color: 'text-green-600', icon: AlertCircle, bg: 'bg-green-50' }, // AlertCircle used as "Action Needed" metaphor
    'Served': { color: 'text-gray-400', icon: CheckCircle2, bg: 'bg-gray-50' },
};

export default function OrderMonitor({ orders, onOrderClick }: OrderMonitorProps) {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Order Stream</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Realtime</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <Clock size={48} strokeWidth={1} />
                        <span className="mt-4 text-sm font-bold uppercase">No Active Orders</span>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {orders.map((order) => {
                            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                            const StatusIcon = config.icon;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => onOrderClick(order)}
                                    className="group flex items-center py-4 px-6 hover:bg-[#FFFFF0] transition-colors cursor-pointer"
                                >
                                    {/* Table & Time */}
                                    <div className="w-24 flex flex-col gap-1">
                                        <span className="text-lg font-black text-[#1F1F1F]">{order.table}</span>
                                        <span className="text-[10px] font-bold text-gray-400">{order.time}</span>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="flex-1 px-6">
                                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-[#1F1F1F] transition-colors">
                                            {order.items}
                                        </p>
                                        <span className="text-[10px] uppercase text-gray-400 tracking-wide">
                                            #{order.id}
                                        </span>
                                    </div>

                                    {/* Status & Price */}
                                    <div className="flex items-center gap-6">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                                            <StatusIcon size={14} className={config.color} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${config.color}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="w-20 text-right font-bold text-[#1F1F1F]">
                                            ₹{order.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
