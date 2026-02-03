'use client';

import React, { useState, useRef } from 'react';
import {
    ChevronLeft,
    GripVertical,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    UtensilsCrossed,
    ChefHat,
    Wine,
    IceCream,
    Coffee,
    Beer,
    Pizza
} from 'lucide-react';
import { MenuCategory } from '../page'; // Assuming shared type is available or redefined
import ConfirmationModal from './ConfirmationModal';

// Icon picker options
const ICON_OPTIONS = [
    { id: 'utensils', icon: UtensilsCrossed, label: 'Standard' },
    { id: 'chef', icon: ChefHat, label: 'Mains' },
    { id: 'wine', icon: Wine, label: 'Drinks' },
    { id: 'icecream', icon: IceCream, label: 'Dessert' },
    { id: 'coffee', icon: Coffee, label: 'Cafe' },
    { id: 'beer', icon: Beer, label: 'Bar' },
    { id: 'pizza', icon: Pizza, label: 'Pizza' },
];

interface CategoryManagerProps {
    categories: MenuCategory[];
    onBack: () => void;
    onUpdateCategories: (newCategories: MenuCategory[]) => void;
    onAddCategory: (category: { title: string; code: string }) => void;
    onDeleteCategory: (id: string) => void;
}

// Modal state type
interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    confirmLabel?: string;
    onConfirm: () => void;
}

export default function CategoryManager({ categories: initialCategories, onBack, onUpdateCategories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
    const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);

    // Sync local state when props change (fetching complete)
    React.useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // New category state
    const [newCatTitle, setNewCatTitle] = useState('');
    const [newCatCode, setNewCatCode] = useState('');

    // Edit state
    const [editTitle, setEditTitle] = useState('');
    const [editCode, setEditCode] = useState('');

    // Modal state
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Drag & Drop Handlers
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent, position: number, id: string) => {
        dragItem.current = position;
        setDraggingId(id);
        // Make ghost image invisible or custom if needed, default is okay for now
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e: React.DragEvent, position: number) => {
        dragOverItem.current = position;
        e.preventDefault();
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const copyListItems = [...categories];
            const dragItemContent = copyListItems[dragItem.current];
            copyListItems.splice(dragItem.current, 1);
            copyListItems.splice(dragOverItem.current, 0, dragItemContent);
            setCategories(copyListItems);
            // Auto-save reorder? or wait for explicit save?
            // "Avoid list-edit-save patterns" suggests auto-saving structure or direct changes.
            // But we have an onUpdateCategories prop. Let's call it.
            onUpdateCategories(copyListItems);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDraggingId(null);
    };

    // Actions
    const handleStartEdit = (cat: MenuCategory) => {
        setEditingId(cat.id);
        setEditTitle(cat.title);
        setEditCode(cat.code);
    };

    const handleSaveEdit = (id: string) => {
        const updatedCats = categories.map(cat =>
            cat.id === id ? { ...cat, title: editTitle, code: editCode } : cat
        );
        setCategories(updatedCats);
        onUpdateCategories(updatedCats); // Persist
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        setModal({
            isOpen: true,
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category? All items within it will be hidden or lost.',
            confirmLabel: 'Delete Forever',
            isDestructive: true,
            onConfirm: () => {
                onDeleteCategory(id); // Use prop to delete from DB
                // Local state update will happen via prop sync
                closeModal();
            }
        });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleAddCategory = () => {
        if (!newCatTitle || !newCatCode) return;

        onAddCategory({ title: newCatTitle, code: newCatCode });

        // Reset
        setIsAdding(false);
        setNewCatTitle('');
        setNewCatCode('');
    };

    return (
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white">

            {/* Background Tech Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                isDestructive={modal.isDestructive}
                confirmLabel={modal.confirmLabel}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />

            {/* Top Bar */}
            <nav className="sticky top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white z-50 shadow-2xl flex items-center justify-between px-6 border-b-4 border-[#8D0B41]">
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
                    <h1 className="text-lg font-bold tracking-widest uppercase">Menu Structure</h1>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="pt-24 pb-20 max-w-4xl mx-auto px-4 md:px-8">

                <div className="mb-8">
                    <h2 className="text-4xl font-black text-[#1F1F1F] mb-2 uppercase tracking-tight">Categories</h2>
                    <p className="text-gray-500 font-bold text-sm">Drag to reorder. Changes apply immediately.</p>
                </div>

                <div className="space-y-4">
                    {categories.map((category, index) => {
                        const isEditing = editingId === category.id;
                        const isDragging = draggingId === category.id;

                        return (
                            <div
                                key={category.id}
                                draggable={!isEditing}
                                onDragStart={(e) => handleDragStart(e, index, category.id)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={`
                                    relative group transition-all duration-300
                                    ${isDragging ? 'rotate-2 scale-105 z-50 opacity-90' : 'rotate-0 scale-100'}
                                `}
                            >
                                <div className={`
                                    bg-[#FFFFF0] border-l-4 shadow-sm p-6 flex items-center gap-6
                                    ${isEditing ? 'border-[#8D0B41] ring-2 ring-[#8D0B41]/10' : 'border-gray-300 hover:border-[#8D0B41] hover:shadow-md'}
                                `}>
                                    {/* Drag Handle */}
                                    <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-[#8D0B41] transition-colors p-2 -ml-2">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <div className="flex gap-4 items-center animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1">Title</label>
                                                    <input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 px-3 py-2 font-bold text-lg focus:border-[#8D0B41] outline-none"
                                                        placeholder="Category Title"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1">Code</label>
                                                    <input
                                                        value={editCode}
                                                        onChange={(e) => setEditCode(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 px-3 py-2 font-bold text-lg focus:border-[#8D0B41] outline-none uppercase"
                                                        placeholder="XYZ"
                                                        maxLength={3}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#1F1F1F] text-white flex items-center justify-center font-bold text-sm">
                                                    {category.code}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-[#1F1F1F]">{category.title}</h3>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                        {category.items.length} Items
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(category.id)}
                                                    className="w-10 h-10 bg-[#8D0B41] text-white flex items-center justify-center hover:bg-[#7a0a38] transition-colors"
                                                    title="Save"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="w-10 h-10 bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStartEdit(category)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#8D0B41] hover:bg-[#8D0B41]/5 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Category Block */}
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-8 border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#8D0B41] hover:text-[#8D0B41] hover:bg-[#8D0B41]/5 transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            <span className="text-xl font-bold uppercase tracking-wider">Add New Category System</span>
                        </button>
                    ) : (
                        <div className="bg-[#FFFFF0] border-l-4 border-[#8D0B41] shadow-lg p-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-lg font-bold text-[#1F1F1F] mb-6 flex items-center gap-2">
                                <Plus size={20} className="text-[#8D0B41]" />
                                New Category
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Category Title</label>
                                    <input
                                        value={newCatTitle}
                                        onChange={(e) => setNewCatTitle(e.target.value)}
                                        className="w-full bg-white border-2 border-transparent focus:border-[#8D0B41] p-4 text-xl font-bold outline-none"
                                        placeholder="e.g. Seasonal Specials"
                                        autoFocus
                                    />
                                </div>
                                <div className="">
                                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Code (3 Chars)</label>
                                    <input
                                        value={newCatCode}
                                        onChange={(e) => setNewCatCode(e.target.value)}
                                        className="w-full bg-white border-2 border-transparent focus:border-[#8D0B41] p-4 text-xl font-bold outline-none uppercase"
                                        placeholder="SPL"
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-8 py-4 bg-gray-200 text-gray-600 font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCatTitle || !newCatCode}
                                    className={`
                                        flex-1 px-8 py-4 bg-[#8D0B41] text-white font-bold uppercase tracking-wider transition-colors
                                        ${(!newCatTitle || !newCatCode) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#7a0a38]'}
                                    `}
                                >
                                    Confirm Addition
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
