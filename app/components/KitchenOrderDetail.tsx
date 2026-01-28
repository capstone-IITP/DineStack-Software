import React from 'react';
import { KitchenOrder } from './kitchenTypes';
import UpdateOrderStatus from '@/app/components/UpdateOrderStatus';
import { X, Clock } from 'lucide-react';

interface KitchenOrderDetailProps {
    order: KitchenOrder;
    onClose: () => void;
    onUpdateStatus: (status: KitchenOrder['status']) => void;
}

export default function KitchenOrderDetail({ order, onClose, onUpdateStatus }: KitchenOrderDetailProps) {
    return (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm">
            {/* Click outside to close area */}
            <div className="flex-1" onClick={onClose} />

            {/* Main Panel */}
            <div className="w-full max-w-2xl bg-[#FFFFF0] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

                {/* Header */}
                <div className="bg-[#1F1F1F] text-white p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="text-5xl font-black tracking-tighter">{order.table}</div>
                        <div className="h-10 w-px bg-white/20"></div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase mb-1">
                                <Clock size={14} /> Time Elapsed
                            </div>
                            <div className="text-3xl font-mono font-bold text-[#8D0B41] leading-none">
                                {order.timeElapsed}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* Items List */}
                    <div className="space-y-6">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-6 border-b border-gray-200 pb-6 last:border-0">
                                <div className="w-12 h-12 bg-[#1F1F1F] text-white flex items-center justify-center text-3xl font-black rounded-lg shrink-0">
                                    {item.quantity}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-3xl font-bold text-[#1F1F1F] leading-tight mb-2">
                                        {item.name}
                                    </h3>
                                    {item.notes && (
                                        <div className="bg-pink-50 border-l-4 border-[#8D0B41] p-3 text-lg font-medium text-[#8D0B41] italic">
                                            "{item.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>


                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t border-gray-200 p-6">
                    <UpdateOrderStatus currentStatus={order.status} onStatusChange={onUpdateStatus} onClose={onClose} />
                </div>

            </div>
        </div>
    );
}
