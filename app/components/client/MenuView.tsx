'use client';

import React, { useState } from 'react';
import { MenuCategory, MenuItem } from '@/app/lib/data';
import { ChevronRight } from 'lucide-react';

interface MenuViewProps {
    menu: MenuCategory[];
    onItemClick: (item: MenuItem) => void;
}

export default function MenuView({ menu, onItemClick }: MenuViewProps) {
    const [activeCategory, setActiveCategory] = useState(menu[0].id);

    return (
        <div className="animate-in fade-in duration-300">
            {/* Sticky Category Nav */}
            <div className="sticky top-0 z-40 bg-[#F9F9F9]/90 backdrop-blur-md pt-4 pb-2 px-4 shadow-sm border-b border-gray-100 overflow-x-auto">
                <div className="flex gap-2">
                    {menu.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`
                                px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300
                                ${activeCategory === cat.id
                                    ? 'bg-[#1F1F1F] text-white shadow-lg shadow-black/10'
                                    : 'bg-white text-gray-500 border border-gray-200'}
                            `}
                        >
                            {cat.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <div className="p-4 space-y-12">
                {menu.map(cat => (
                    <div key={cat.id} id={cat.id} className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            {cat.icon && React.createElement(cat.icon, { size: 24, className: "text-[#8D0B41]" })}
                            {cat.title}
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {cat.items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => item.available && onItemClick(item)}
                                    className={`
                                        bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center transition-all active:scale-[0.98]
                                        ${!item.available ? 'opacity-50 grayscale pointer-events-none' : 'active:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-lg text-[#1F1F1F]">{item.name}</h3>
                                            <span className="font-bold text-[#1F1F1F]">₹{item.price}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                            {item.description || 'Delicious item prepared fresh.'}
                                        </p>
                                    </div>
                                    <div className="ml-4 text-gray-300">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
