'use client';

import React from 'react';
import {
    X,
    Clock,
    CheckCircle2,
    AlertCircle,
    Circle,
    Receipt,
    ChefHat,
    User
} from 'lucide-react';
import { Order } from './OrderMonitor';

interface OrderDetailsProps {
    order: Order | null;
    onClose: () => void;
}

const STATUS_CONFIG = {
    'Pending': { color: 'text-gray-500', icon: Circle, bg: 'bg-gray-100', label: 'Waiting for Cooking' },
    'Cooking': { color: 'text-[#8D0B41]', icon: ChefHat, bg: 'bg-[#FFF0F5]', label: 'Cooking in Progress' },
    'Ready': { color: 'text-green-600', icon: AlertCircle, bg: 'bg-green-50', label: 'Ready to Serve' },
    'Served': { color: 'text-gray-400', icon: CheckCircle2, bg: 'bg-gray-50', label: 'Completed' },
};

export default function OrderDetails({ order, onClose }: OrderDetailsProps) {
    if (!order) return null;

    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
    const StatusIcon = config.icon;

    // Mock parsing items string into list (for this verified UI demo, we assume format "Item, Item")
    // In real app, order would have structured item array.
    const itemList = order.items.split(',').map(s => s.trim());

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end pointer-events-none">
            {/* Backdrop (clickable) */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            ></div>

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-md h-full bg-[#E5E5E5] shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="h-16 bg-[#1F1F1F] text-white flex items-center justify-between px-6 border-b-4 border-[#8D0B41] shrink-0">
                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-widest">Order Details</h2>
                        <span className="text-[10px] text-gray-500 font-bold">READ ONLY VIEW</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-[#8D0B41]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-gray-400">Current Status</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm ${config.bg} ${config.color}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
                                <StatusIcon size={24} className={config.color} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black uppercase ${config.color}`}>{config.label}</h3>
                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    Updated at {order.time}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FFFFF0] p-4 rounded-sm border border-gray-200">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 mb-1">
                                <Receipt size={12} /> Order ID
                            </span>
                            <span className="text-lg font-bold text-[#1F1F1F]">#{order.id}</span>
                        </div>
                        <div className="bg-[#FFFFF0] p-4 rounded-sm border border-gray-200">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 mb-1">
                                <User size={12} /> Table
                            </span>
                            <span className="text-lg font-bold text-[#1F1F1F]">{order.table}</span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white p-6 rounded-sm shadow-sm space-y-4">
                        <h4 className="text-xs font-bold uppercase text-gray-400 flex items-center justify-between border-b border-gray-100 pb-2">
                            <span>Order Items</span>
                            <span>{itemList.length} Items</span>
                        </h4>

                        <div className="space-y-3">
                            {itemList.map((item, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center text-xs font-bold text-gray-500">1x</div>
                                        <span className="text-sm font-bold text-[#1F1F1F]">{item}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-400">--</span>
                                    {/* Price per item would go here if we had detailed structure */}
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-gray-200 pt-4 mt-4 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500 uppercase">Total Amount</span>
                            <span className="text-xl font-black text-[#8D0B41]">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Notes (Mock) */}
                    {order.notes && (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-sm">
                            <h4 className="text-[10px] font-bold uppercase text-yellow-700 mb-2">Kitchen Notes</h4>
                            <p className="text-sm font-medium text-yellow-900 italic">"{order.notes}"</p>
                        </div>
                    )}

                </div>

                {/* Footer (Read Only Warning) */}
                <div className="p-4 bg-gray-100 text-center border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <AlertCircle size={12} />
                        Admin Read-Only Mode
                    </p>
                </div>
            </div>
        </div>
    );
}
