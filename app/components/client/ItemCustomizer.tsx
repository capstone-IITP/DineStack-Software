'use client';

import React, { useState } from 'react';
import { MenuItem } from '@/app/lib/data';
import { X, Minus, Plus } from 'lucide-react';

interface ItemCustomizerProps {
    item: MenuItem;
    onBack: () => void;
    onAdd: (item: MenuItem, quantity: number, notes: string) => void;
}

export default function ItemCustomizer({ item, onBack, onAdd }: ItemCustomizerProps) {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, Math.min(10, quantity + delta)));
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="relative h-64 bg-[#F0F0F0] flex items-center justify-center">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 z-10"
                >
                    <X size={20} />
                </button>
                <div className="text-6xl opacity-10">🍽️</div>
                {/* Image would go here */}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col -mt-8 bg-white rounded-t-3xl shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">

                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-3xl font-black text-[#1F1F1F] leading-tight flex-1 mr-4">{item.name}</h1>
                    <span className="text-2xl font-bold text-[#8D0B41]">₹{item.price}</span>
                </div>

                <p className="text-gray-500 mb-8 leading-relaxed">
                    {item.description || 'Prepared fresh to order with premium ingredients.'}
                </p>

                <div className="space-y-6 flex-1">
                    {/* Notes Field */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Special Instructions</label>
                        <textarea
                            className="w-full bg-[#F9F9F9] border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#8D0B41] outline-none resize-none"
                            placeholder="Allergies, removal of ingredients, extra spicy..."
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-6">

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-4 bg-[#F5F5F5] rounded-full px-2 py-2">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="text-xl font-bold w-4 text-center">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => onAdd(item, quantity, notes)}
                            className="flex-1 bg-[#8D0B41] text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#8D0B41]/20 active:scale-95 transition-transform text-center"
                        >
                            Add  •  ₹{(parseFloat(item.price) * quantity).toFixed(2)}
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
}
