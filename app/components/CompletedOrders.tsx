import React from 'react';
import { KitchenOrder } from './kitchenTypes';
import { CheckCircle2 } from 'lucide-react';

interface CompletedOrdersProps {
    orders: KitchenOrder[];
}

export default function CompletedOrders({ orders }: CompletedOrdersProps) {
    // Sort by most recent
    const sortedOrders = [...orders].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h2 className="text-2xl font-bold uppercase text-gray-500 mb-6 flex items-center gap-3">
                <CheckCircle2 /> Executed Orders
            </h2>

            <div className="space-y-2">
                {sortedOrders.map((order) => (
                    <div key={order.id} className="bg-[#2A2A2A] rounded p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-8">
                            <span className="text-gray-500 font-mono text-sm">#{order.id}</span>
                            <span className="text-xl font-bold text-white w-16">{order.table}</span>

                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-300">
                                    {order.items.map(i => i.name).join(', ')}
                                </span>
                                <span className="text-[10px] uppercase text-gray-600">
                                    {order.items.length} Items • Took {order.timeElapsed}
                                </span>
                            </div>
                        </div>

                        <div className="px-3 py-1 bg-[#1F1F1F] rounded text-xs font-bold uppercase text-green-700">
                            Completed
                        </div>
                    </div>
                ))}

                {sortedOrders.length === 0 && (
                    <div className="text-center py-20 text-gray-600 font-bold uppercase">
                        No history available yet.
                    </div>
                )}
            </div>
        </div>
    );
}
