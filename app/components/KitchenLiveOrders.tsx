import React from 'react';
import { KitchenOrder } from './kitchenTypes';
import { Clock } from 'lucide-react';

interface KitchenLiveOrdersProps {
    orders: KitchenOrder[];
    onOrderClick: (order: KitchenOrder) => void;
}

export default function KitchenLiveOrders({ orders, onOrderClick }: KitchenLiveOrdersProps) {
    return (
        <div className="h-full overflow-y-auto pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map((order) => {
                    const isNew = order.timeElapsed.startsWith('00:'); // Mock "New" logic

                    return (
                        <div
                            key={order.id}
                            onClick={() => onOrderClick(order)}
                            className={`
                                relative p-0 overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 active:scale-95
                                bg-[#FFFFF0] text-[#1F1F1F] min-h-[220px] flex flex-col
                                ${isNew ? 'ring-4 ring-[#8D0B41]' : ''}
                            `}
                        >
                            {/* Header Strip */}
                            <div className={`
                                px-4 py-3 flex items-center justify-between
                                ${order.status === 'Preparing' ? 'bg-blue-100' :
                                    order.status === 'Ready' ? 'bg-green-100' : 'bg-[#EAEAEA]'}
                            `}>
                                <span className="text-2xl font-black">{order.table}</span>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-500" />
                                    <span className={`text-xl font-bold font-mono ${isNew ? 'text-[#8D0B41] animate-pulse' : 'text-gray-800'}`}>
                                        {order.timeElapsed}
                                    </span>
                                </div>
                            </div>

                            {/* Items Area */}
                            <div className="p-4 flex-1">
                                <ul className="space-y-3">
                                    {order.items.slice(0, 4).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="font-bold text-lg w-6 shrink-0 text-right">{item.quantity}</span>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg leading-tight">{item.name}</span>
                                                {item.notes && (
                                                    <span className="text-sm font-medium text-[#8D0B41] italic bg-pink-50 px-1 rounded inline-block mt-1">
                                                        "{item.notes}"
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {order.items.length > 4 && (
                                        <li className="text-sm font-bold text-gray-400 uppercase pt-2">
                                            + {order.items.length - 4} more items...
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Status Footer */}
                            <div className="px-4 py-2 bg-black/5 text-xs font-bold uppercase text-gray-500 flex justify-between">
                                <span>#{order.id}</span>
                                <span className={`${order.status === 'Preparing' ? 'text-blue-600' : order.status === 'Ready' ? 'text-green-600' : ''}`}>
                                    {order.status}
                                </span>
                            </div>

                            {/* New Indicator Badge */}
                            {isNew && (
                                <div className="absolute top-0 right-0 bg-[#8D0B41] text-white text-[10px] uppercase font-bold px-2 py-0.5 shadow-md">
                                    New
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <div className="text-6xl mb-4 opacity-20">☕️</div>
                    <h2 className="text-2xl font-bold uppercase opacity-40">No Live Orders</h2>
                    <p className="opacity-30 uppercase text-sm mt-2">Kitchen is clear</p>
                </div>
            )}
        </div>
    );
}
