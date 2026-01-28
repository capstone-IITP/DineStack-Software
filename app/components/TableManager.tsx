'use client';

import React, { useState } from 'react';
import {
    ChevronLeft,
    Monitor,
    Power,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export interface TableItem {
    id: string;
    label: string;
    active: boolean;
}

interface TableManagerProps {
    tables: TableItem[];
    onBack: () => void;
    onUpdateTables: (updatedTables: TableItem[]) => void;
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

export default function TableManager({ tables, onBack, onUpdateTables }: TableManagerProps) {
    const [localTables, setLocalTables] = useState<TableItem[]>(tables);
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const toggleTable = (id: string) => {
        const updated = localTables.map(t =>
            t.id === id ? { ...t, active: !t.active } : t
        );
        setLocalTables(updated);
        onUpdateTables(updated);
    };

    const enableAll = () => {
        setModal({
            isOpen: true,
            title: 'Enable All Tables',
            message: 'This will make all tables active and ready for service. Are you sure?',
            confirmLabel: 'Enable All',
            isDestructive: false,
            onConfirm: () => {
                const updated = localTables.map(t => ({ ...t, active: true }));
                setLocalTables(updated);
                onUpdateTables(updated);
                closeModal();
            }
        });
    };

    const disableAll = () => {
        setModal({
            isOpen: true,
            title: 'Disable All Tables',
            message: 'Warning: This will stop all new orders from being placed at any table. Active orders will continue.',
            confirmLabel: 'Disable All',
            isDestructive: true,
            onConfirm: () => {
                const updated = localTables.map(t => ({ ...t, active: false }));
                setLocalTables(updated);
                onUpdateTables(updated);
                closeModal();
            }
        });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const stats = {
        total: localTables.length,
        active: localTables.filter(t => t.active).length,
        inactive: localTables.filter(t => !t.active).length
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
                    <h1 className="text-lg font-bold tracking-widest uppercase">Table Management</h1>
                </div>

                <div className="w-20"></div>
            </nav>

            <main className="pt-24 pb-20 max-w-6xl mx-auto px-4 md:px-8">

                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-[#1F1F1F] mb-2 uppercase tracking-tight">Floor Plan Control</h2>
                        <p className="text-gray-500 font-bold text-sm">Manage availability of dining tables.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center bg-white px-4 py-2 rounded-sm border-l-4 border-[#8D0B41] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Total Active</span>
                            <span className="text-2xl font-bold text-[#8D0B41]">{stats.active}</span>
                        </div>
                        <div className="flex flex-col items-center bg-white px-4 py-2 rounded-sm border-l-4 border-gray-300 shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Offline</span>
                            <span className="text-2xl font-bold text-gray-400">{stats.inactive}</span>
                        </div>
                    </div>
                </div>

                {/* Bulk Controls */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={enableAll}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 hover:border-[#8D0B41] hover:text-[#8D0B41] transition-colors rounded-sm text-xs font-bold uppercase shadow-sm"
                    >
                        <CheckCircle2 size={16} />
                        Enable All
                    </button>
                    <button
                        onClick={disableAll}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors rounded-sm text-xs font-bold uppercase shadow-sm"
                    >
                        <XCircle size={16} />
                        Disable All
                    </button>
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {localTables.map((table) => (
                        <div
                            key={table.id}
                            onClick={() => toggleTable(table.id)}
                            className={`
                                relative group cursor-pointer transition-all duration-300
                                aspect-square flex flex-col items-center justify-center gap-2
                                border-2 rounded-md shadow-sm select-none
                                ${table.active
                                    ? 'bg-[#FFFFF0] border-[#8D0B41]'
                                    : 'bg-white border-gray-200 opacity-60 hover:opacity-100'}
                            `}
                        >
                            <div className={`
                                w-3 h-3 rounded-full mb-2 transition-colors
                                ${table.active ? 'bg-[#8D0B41] animate-pulse' : 'bg-gray-300'}
                            `}></div>

                            <h3 className={`text-2xl font-black ${table.active ? 'text-[#1F1F1F]' : 'text-gray-400'}`}>
                                {table.id}
                            </h3>

                            <span className={`
                                text-[10px] font-bold uppercase tracking-widest
                                ${table.active ? 'text-[#8D0B41]' : 'text-gray-400'}
                            `}>
                                {table.active ? 'Active' : 'Disabled'}
                            </span>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-[#8D0B41]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Power className="text-[#8D0B41]" size={32} />
                            </div>
                        </div>
                    ))}

                    {/* Add Table Placeholder (Disabled for now as per minimal scope, but good visual filler) */}
                    <div className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md opacity-30">
                        <Monitor size={32} />
                        <span className="text-[10px] font-bold uppercase">System Limit</span>
                    </div>

                </div>

            </main>
        </div>
    );
}
