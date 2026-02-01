'use client';

import React, { useState } from 'react';
import {
    Search,
    Power,
    UtensilsCrossed,
    Wine,
    IceCream,
    ChefHat,
    Menu,
    LogOut,
    Plus
} from 'lucide-react';

import { MENU_DATA, MenuCategory, MenuItem } from '../lib/data';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'starters': UtensilsCrossed,
    'mains': ChefHat,
    'drinks': Wine,
    'desserts': IceCream,
};

interface KitchenDashboardProps {
    onLogout?: () => void;
    onAddItem?: () => void;
    onEditItem?: (item: MenuItem, categoryId: string) => void;
    menuData?: MenuCategory[];
    onToggleAvailability?: (catIndex: number, itemIndex: number) => void;
    onNavigateToLiveOps?: () => void;
}

export default function KitchenDashboard({ onLogout, onAddItem, onEditItem, menuData, onToggleAvailability, onNavigateToLiveOps }: KitchenDashboardProps) {
    // Use props if provided, otherwise fall back to local data
    const categories = menuData || MENU_DATA;
    const [searchQuery, setSearchQuery] = useState('');

    const toggleAvailability = (e: React.MouseEvent, catIndex: number, itemIndex: number) => {
        e.stopPropagation();
        if (onToggleAvailability) {
            onToggleAvailability(catIndex, itemIndex);
        }
    };

    const handleItemClick = (item: MenuItem, categoryId: string) => {
        if (onEditItem) {
            onEditItem(item, categoryId);
        }
    };

    const getStats = () => {
        let active = 0;
        let total = 0;
        categories.forEach(cat => {
            cat.items.forEach(item => {
                total++;
                if (item.available) active++;
            });
        });
        return { active, total };
    };

    const stats = getStats();

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white overflow-x-hidden">

            {/* Background Tech Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Top HUD Bar */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center p-1 bg-white/10 rounded-sm">
                        <img src="/assets/DineStack-Bg.png" alt="DineStack" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            KITCHEN TERMINAL
                        </div>
                    </div>
                </div>

                {/* Central HUD Stats */}
                <div className="flex items-center gap-1 md:gap-8 bg-black/30 px-6 py-2 rounded skew-x-[-10deg] border border-white/10">
                    <div className="skew-x-[10deg] flex flex-col items-center">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Live Items</span>
                        <span className="text-lg font-bold text-white leading-none">{stats.active}</span>
                    </div>
                    <div className="skew-x-[10deg] w-px h-8 bg-white/20 mx-2"></div>
                    <div className="skew-x-[10deg] flex flex-col items-center">
                        <span className="text-[9px] text-[#8D0B41] font-bold uppercase">Offline</span>
                        <span className="text-lg font-bold text-gray-400 leading-none">{stats.total - stats.active}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onAddItem}
                        className="flex items-center gap-2 px-3 py-2 bg-[#8D0B41] text-white hover:bg-[#7a0a38] rounded transition-colors"
                    >
                        <Plus size={16} />
                        <span className="hidden md:inline text-xs font-bold uppercase">Add Item</span>
                    </button>

                    <button
                        onClick={onNavigateToLiveOps}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-[#333] text-white hover:bg-[#333] rounded transition-colors"
                    >
                        <ChefHat size={16} />
                        <span className="hidden md:inline text-xs font-bold uppercase">Live Ops</span>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="SEARCH ID/NAME"
                            className="bg-[#333] border border-[#444] text-white text-xs px-3 py-2 w-32 md:w-48 focus:border-[#8D0B41] focus:w-64 transition-all outline-none uppercase placeholder-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={14} className="absolute right-2 top-2.5 text-gray-500" />
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="hidden md:inline text-xs font-bold uppercase">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Main Control Deck */}
            <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 md:px-8">

                {/* Rail System Container */}
                <div className="relative border-l-2 border-dashed border-gray-300 ml-4 md:ml-10 space-y-12">

                    {categories.map((category, catIndex) => {
                        const filteredItems = category.items.filter(item =>
                            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.includes(searchQuery)
                        );

                        if (searchQuery && filteredItems.length === 0) return null;

                        const CategoryIcon = CATEGORY_ICONS[category.id] || UtensilsCrossed;

                        return (
                            <div key={category.id} className="relative pl-8 md:pl-12">

                                {/* Category Anchor Point */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-[#1F1F1F] rounded-full border-4 border-[#8D0B41] z-10"></div>

                                {/* Section Header */}
                                <div className="flex items-baseline gap-4 mb-6">
                                    <h2 className="text-4xl md:text-5xl font-black text-[#1F1F1F]/10 absolute -z-10 -top-8 -left-4 select-none">
                                        {category.code}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <CategoryIcon className="text-[#8D0B41]" size={24} />
                                        <h2 className="text-2xl font-bold uppercase tracking-tight text-[#1F1F1F]">{category.title}</h2>
                                    </div>
                                    <div className="h-1 flex-1 bg-[#1F1F1F] opacity-10 mt-4"></div>
                                </div>

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                                    {filteredItems.map((item) => {
                                        const realIndex = category.items.findIndex(i => i.id === item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleItemClick(item, category.id)}
                                                className={`
                          relative group overflow-hidden cursor-pointer transition-all duration-300
                          bg-[#FFFFF0] border-l-4 shadow-sm hover:shadow-lg hover:-translate-y-1
                          ${item.available
                                                        ? 'border-[#8D0B41] opacity-100'
                                                        : 'border-gray-400 opacity-60 grayscale'}
                        `}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' }}
                                            >
                                                {/* Hazard Stripe Overlay for Offline items */}
                                                {!item.available && (
                                                    <div className="absolute inset-0 pointer-events-none opacity-10"
                                                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}>
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row h-full">

                                                    {/* Left: Info Block */}
                                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="bg-[#1F1F1F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                                                #{item.id}
                                                            </span>
                                                            <span className="text-lg font-bold text-[#1F1F1F]">₹{item.price}</span>
                                                        </div>

                                                        <div>
                                                            <h3 className={`text-lg md:text-xl font-bold leading-tight mb-2 ${item.available ? 'text-[#1F1F1F]' : 'text-gray-500 line-through'}`}>
                                                                {item.name}
                                                            </h3>

                                                            {/* Stock Indicator (Technical Bars) */}
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] uppercase font-bold text-gray-400">Inventory Lvl</span>
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3].map(lvl => (
                                                                        <div key={lvl} className={`
                                       w-3 h-1.5 rounded-sm
                                       ${item.stock >= lvl
                                                                                ? (item.stock === 1 ? 'bg-red-500' : 'bg-[#1F1F1F]')
                                                                                : 'bg-gray-200'}
                                     `}></div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Control Plate */}
                                                    <div className={`
                             w-full sm:w-24 p-4 flex sm:flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-[#1F1F1F]/5 transition-colors duration-300
                             ${item.available ? 'bg-white' : 'bg-gray-100'}
                          `}
                                                        onClick={(e) => toggleAvailability(e, catIndex, realIndex)}
                                                    >

                                                        {/* The "Switch" */}
                                                        <div className="relative w-12 h-12 flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                                                            {/* Outer Ring */}
                                                            <div className={`
                                   absolute inset-0 rounded-full border-2 transition-all duration-300
                                   ${item.available ? 'border-[#8D0B41] scale-100' : 'border-gray-300 scale-90'}
                                `}></div>

                                                            {/* Inner Indicator */}
                                                            <div className={`
                                   w-8 h-8 rounded-full shadow-inner flex items-center justify-center transition-all duration-300
                                   ${item.available ? 'bg-[#8D0B41] text-white rotate-0' : 'bg-gray-300 text-gray-400 -rotate-90'}
                                `}>
                                                                <Power size={16} strokeWidth={3} />
                                                            </div>
                                                        </div>

                                                        <span className={`
                               text-[10px] font-black uppercase tracking-widest
                               ${item.available ? 'text-[#8D0B41]' : 'text-gray-400'}
                             `}>
                                                            {item.available ? 'LIVE' : 'OFF'}
                                                        </span>

                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </main>

            {/* Floating Action Button (Mobile) */}
            <div className="fixed bottom-6 right-6 md:hidden">
                <button
                    onClick={onAddItem}
                    className="w-14 h-14 bg-[#8D0B41] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-[#1f1f1f]"
                >
                    <Plus size={24} />
                </button>
            </div>

        </div>
    );
}
