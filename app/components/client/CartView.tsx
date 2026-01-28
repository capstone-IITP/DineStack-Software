'use client';

import React from 'react';
import { MenuItem } from '@/app/lib/data';
import { ChevronLeft, Trash2 } from 'lucide-react';

interface CartItem {
    item: MenuItem;
    quantity: number;
    notes: string;
}

interface CartViewProps {
    cart: CartItem[];
    onBack: () => void;
    onPlaceOrder: () => void;
}

export default function CartView({ cart, onBack, onPlaceOrder }: CartViewProps) {
    const total = cart.reduce((sum, entry) => sum + (parseFloat(entry.item.price) * entry.quantity), 0);

    return (
        <div className="min-h-screen bg-white flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="px-6 py-6 flex items-center gap-4 bg-white sticky top-0 border-b border-gray-100 z-10">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-gray-600"
                >
                    <ChevronLeft size={28} />
                </button>
                <h1 className="text-2xl font-bold">Your Order</h1>
            </div>

            {/* List */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        Your cart is empty.
                    </div>
                ) : (
                    cart.map((entry, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 bg-[#FFFFF0] border border-gray-200 text-[#1F1F1F] font-bold flex items-center justify-center rounded text-sm shrink-0 mt-1">
                                {entry.quantity}x
                            </div>
                            <div className="flex-1 pb-6 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-[#1F1F1F] text-lg">{entry.item.name}</h3>
                                    <span className="font-bold text-gray-500">₹{(parseFloat(entry.item.price) * entry.quantity).toFixed(2)}</span>
                                </div>
                                {entry.notes && (
                                    <p className="text-sm text-gray-400 mt-1 italic">"{entry.notes}"</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-[#F9F9F9] border-t border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-medium">Total</span>
                    <span className="text-3xl font-black text-[#1F1F1F]">₹{total.toFixed(2)}</span>
                </div>

                <button
                    onClick={onPlaceOrder}
                    disabled={cart.length === 0}
                    className="w-full bg-[#1F1F1F] text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
                >
                    Place Order
                </button>
            </div>

        </div>
    );
}
