'use client';

import React, { useState, useEffect } from 'react';
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
    Trash2,
    Power,
    AlertTriangle,
    Undo,
    X
} from 'lucide-react';

interface Category {
    id: string;
    title: string;
    code: string;
}

export interface MenuItem {
    id: string;
    name: string;
    price: string;
    available: boolean;
    stock: number;
    category?: string; // Optional for compatibility
}

interface EditItemPageProps {
    item: MenuItem;
    category: string;
    onBack: () => void;
    onSave: (updatedItem: MenuItem, originalCategory: string, newCategory: string) => void;
    onDelete: (itemId: string, categoryId: string) => void;
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

export default function EditItemPage({ item, category: initialCategory, onBack, onSave, onDelete, categories = [] }: EditItemPageProps) {
    // Form State
    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(item.price);
    const [category, setCategory] = useState(initialCategory);
    const [stock, setStock] = useState(item.stock);
    const [available, setAvailable] = useState(item.available);

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        const isModified =
            name !== item.name ||
            price !== item.price ||
            category !== initialCategory ||
            stock !== item.stock ||
            available !== item.available;
        setHasChanges(isModified);
    }, [name, price, category, stock, available, item, initialCategory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;

        setIsSaving(true);

        // Simulate network delay for effect
        setTimeout(() => {
            onSave(
                { ...item, name, price, stock, available },
                initialCategory,
                category
            );
            setIsSaving(false);
            onBack();
        }, 500);
    };

    const handleDelete = () => {
        setIsSaving(true);
        setTimeout(() => {
            onDelete(item.id, initialCategory);
            setIsSaving(false); // Likely redundant as we navigate away, but safe
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

                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-widest uppercase">Edit Item</h1>
                    <span className="text-[10px] text-gray-500 font-bold">#{item.id}</span>
                </div>

                <div className="w-20 flex justify-end">
                    {hasChanges && (
                        <span className="text-[10px] font-bold text-[#8D0B41] uppercase animate-pulse">Unsaved</span>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-20 max-w-2xl mx-auto px-4 md:px-8">

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Live Preview Card */}
                    <div className="relative group overflow-hidden transition-all duration-300 bg-[#FFFFF0] border-l-4 shadow-lg p-6"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)',
                            borderColor: available ? '#8D0B41' : '#9CA3AF',
                            opacity: available ? 1 : 0.8
                        }}>

                        {!available && (
                            <div className="absolute inset-0 pointer-events-none opacity-10 z-0"
                                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}>
                            </div>
                        )}

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <CategoryIcon className={available ? "text-[#8D0B41]" : "text-gray-400"} size={20} />
                                <span className="text-xs font-bold uppercase text-gray-500">Live Preview</span>
                                <div className="flex-1"></div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${available ? 'text-[#8D0B41]' : 'text-gray-400'}`}>
                                    {available ? 'LIVE ON MENU' : 'OFFLINE'}
                                </span>
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-[#1F1F1F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                    #{item.id}
                                </span>
                                <span className="text-lg font-bold text-[#1F1F1F]">
                                    {price ? `₹${price}` : '₹0.00'}
                                </span>
                            </div>

                            <h3 className={`text-xl font-bold mb-2 ${available ? 'text-[#1F1F1F]' : 'text-gray-500 line-through'}`}>
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
                    </div>

                    {/* Availability Toggle */}
                    <div className={`p-6 rounded-sm shadow-sm transition-colors ${available ? 'bg-white' : 'bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase text-gray-500 mb-1">Availability Status</span>
                                <h3 className={`text-lg font-bold ${available ? 'text-[#8D0B41]' : 'text-gray-500'}`}>
                                    {available ? 'Available' : 'Unavailable'}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAvailable(!available)}
                                className={`
                                    relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none
                                    ${available ? 'bg-[#8D0B41]' : 'bg-gray-300'}
                                `}
                            >
                                <div className={`
                                    absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300
                                    ${available ? 'translate-x-8' : 'translate-x-0'}
                                `}>
                                    <Power size={12} className={available ? 'text-[#8D0B41]' : 'text-gray-400'} />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Name */}
                        <div className="bg-white p-6 rounded-sm shadow-sm md:col-span-2">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                                <Tag size={14} />
                                Item Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                    className="w-full bg-[#FFFFF0] border-2 border-transparent focus:border-[#8D0B41] pl-10 pr-4 py-3 text-lg font-bold outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="bg-white p-6 rounded-sm shadow-sm">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
                                <Package size={14} />
                                Stock Level
                            </label>
                            <div className="flex items-center gap-2 h-[52px]">
                                {[1, 2, 3].map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setStock(lvl)}
                                        className={`
                                            flex-1 h-full flex flex-col items-center justify-center gap-1 border-2 transition-all rounded-sm
                                            ${stock === lvl
                                                ? 'border-[#8D0B41] bg-[#8D0B41]/5'
                                                : 'border-gray-200 hover:border-gray-300'}
                                        `}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${stock === lvl ? 'bg-[#8D0B41]' : 'bg-gray-300'}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-white p-6 rounded-sm shadow-sm md:col-span-2">
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
                                                p-3 flex flex-col items-center gap-2 border-2 transition-all rounded-sm
                                                ${isSelected
                                                    ? 'border-[#8D0B41] bg-[#8D0B41]/5'
                                                    : 'border-gray-200 hover:border-gray-300'}
                                            `}
                                        >
                                            <Icon size={20} className={isSelected ? 'text-[#8D0B41]' : 'text-gray-400'} />
                                            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-[#8D0B41]' : 'text-gray-500'}`}>
                                                {cat.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 border border-red-100 p-6 rounded-sm">
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-red-800 mb-4">
                            <AlertTriangle size={14} />
                            Danger Zone
                        </h4>

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold uppercase text-xs tracking-wider transition-colors rounded-sm"
                            >
                                <Trash2 size={16} />
                                Delete Item
                            </button>
                        ) : (
                            <div className="text-center animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="text-sm font-bold text-red-800 mb-3">Are you sure? This action cannot be undone.</p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 font-bold uppercase text-xs tracking-wider rounded-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-xs tracking-wider rounded-sm shadow-md"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer Actions */}
                    <div className="sticky bottom-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-4 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold uppercase text-sm tracking-wider transition-colors shadow-lg"
                        >
                            <Undo size={18} />
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={!hasChanges || isSaving}
                            className={`
                                flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wider transition-all shadow-lg
                                ${hasChanges
                                    ? 'bg-[#8D0B41] text-white hover:bg-[#7a0a38] translate-y-0'
                                    : 'bg-gray-300 text-white cursor-not-allowed'}
                            `}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>

            </main>
        </div>
    );
}
