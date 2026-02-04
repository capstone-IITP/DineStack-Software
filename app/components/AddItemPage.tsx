'use client';

import React, { useState } from 'react';
import {
    ChevronLeft,
    UtensilsCrossed,
    Wine,
    IceCream,
    ChefHat,
    DollarSign,
    Package,
    Tag,
    Save,
    X
} from 'lucide-react';

interface Category {
    id: string;
    title: string;
    code: string;
}

interface AddItemPageProps {
    onBack: () => void;
    onSave?: (item: { name: string; price: string; category: string; stock: number }) => void;
    categories: Category[];
}

// Icon mapping helper
const getCategoryIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('starter') || t.includes('appetizer')) return UtensilsCrossed;
    if (t.includes('main') || t.includes('entree') || t.includes('pizza') || t.includes('burger')) return ChefHat;
    if (t.includes('drink') || t.includes('beverage') || t.includes('cocktail')) return Wine;
    if (t.includes('dessert') || t.includes('sweet')) return IceCream;
    return Package;
};

export default function AddItemPage({ onBack, onSave, categories = [] }: AddItemPageProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    // Default to first category if available
    const [category, setCategory] = useState(categories.length > 0 ? categories[0].id : '');
    const [stock, setStock] = useState(3);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !category) return;

        setIsSaving(true);

        // Simulate save
        setTimeout(() => {
            onSave?.({ name, price, category, stock });
            setIsSaving(false);
            onBack();
        }, 500);
    };

    const selectedCategory = categories.find(c => c.id === category);
    const CategoryIcon = selectedCategory ? getCategoryIcon(selectedCategory.title) : UtensilsCrossed;

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

            {/* Background Tech Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Top Bar */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-xs font-bold uppercase">Back</span>
                    </button>
                </div>

                <h1 className="text-lg font-bold tracking-widest uppercase">Add New Item</h1>

                <div className="w-24"></div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-20 max-w-2xl mx-auto px-4 md:px-8">

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Preview Card */}
                    <div className="bg-[#FFFFF0] border-l-4 border-[#8D0B41] p-6 shadow-lg"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <CategoryIcon className="text-[#8D0B41]" size={20} />
                            <span className="text-xs font-bold uppercase text-gray-500">Preview</span>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-[#1F1F1F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                #NEW
                            </span>
                            <span className="text-lg font-bold text-[#1F1F1F]">
                                {price ? `₹${price}` : '₹0.00'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">
                            {name || 'Item Name'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase font-bold text-gray-400">Inventory Lvl</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3].map(lvl => (
                                    <div key={lvl} className={`
                                        w-3 h-1.5 rounded-sm
                                        ${stock >= lvl
                                            ? (stock === 1 ? 'bg-red-500' : 'bg-[#1F1F1F]')
                                            : 'bg-gray-200'}
                                    `}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Item Name */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                            <Tag size={14} />
                            Item Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Truffle Arancini"
                            className="w-full bg-[#FFFFF0] border-2 border-transparent focus:border-[#8D0B41] px-4 py-3 text-lg font-bold outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Price */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                            <DollarSign size={14} />
                            Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">₹</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#FFFFF0] border-2 border-transparent focus:border-[#8D0B41] pl-10 pr-4 py-3 text-lg font-bold outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                            <Package size={14} />
                            Category
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categories.map((cat) => {
                                const Icon = getCategoryIcon(cat.title);
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`
                                            p-4 flex flex-col items-center gap-2 border-2 transition-all
                                            ${isSelected
                                                ? 'border-[#8D0B41] bg-[#8D0B41]/5'
                                                : 'border-gray-200 hover:border-gray-300'}
                                        `}
                                    >
                                        <Icon size={24} className={isSelected ? 'text-[#8D0B41]' : 'text-gray-400'} />
                                        <span className={`text-xs font-bold uppercase ${isSelected ? 'text-[#8D0B41]' : 'text-gray-500'}`}>
                                            {cat.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stock Level */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                            <Package size={14} />
                            Initial Stock Level
                        </label>
                        <div className="flex items-center gap-4">
                            {[1, 2, 3].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setStock(lvl)}
                                    className={`
                                        flex-1 py-4 flex flex-col items-center gap-2 border-2 transition-all
                                        ${stock === lvl
                                            ? 'border-[#8D0B41] bg-[#8D0B41]/5'
                                            : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(bar => (
                                            <div
                                                key={bar}
                                                className={`w-4 h-2 rounded-sm ${bar <= lvl
                                                    ? (lvl === 1 ? 'bg-red-500' : 'bg-[#1F1F1F]')
                                                    : 'bg-gray-200'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <span className={`text-xs font-bold ${stock === lvl ? 'text-[#8D0B41]' : 'text-gray-500'}`}>
                                        {lvl === 1 ? 'Low' : lvl === 2 ? 'Medium' : 'High'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-4 flex items-center justify-center gap-2 bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold uppercase text-sm tracking-wider transition-colors"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || !price || isSaving}
                            className={`
                                flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wider transition-all
                                ${name && price
                                    ? 'bg-[#8D0B41] text-white hover:bg-[#7a0a38]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>

                </form>

            </main>
        </div>
    );
}
