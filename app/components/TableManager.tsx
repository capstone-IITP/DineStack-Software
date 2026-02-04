'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Monitor,
    Power,
    CheckCircle2,
    XCircle,
    Plus,
    QrCode,
    Loader2,
    Trash2,
    Pencil
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { QRCodeSVG } from 'qrcode.react';

export interface TableItem {
    id: string;
    label: string;
    capacity: number;
    active: boolean; // mapped from isActive
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
    content?: React.ReactNode;
}

export default function TableManager({ tables: initialTables, onBack, onUpdateTables }: TableManagerProps) {
    const [localTables, setLocalTables] = useState<TableItem[]>(initialTables);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTableLabel, setNewTableLabel] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState('4');
    const [editingTable, setEditingTable] = useState<TableItem | null>(null);
    const [qrPreviewId, setQrPreviewId] = useState<string | null>(null);

    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Fetch tables on mount
    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/tables');
            const data = await res.json();
            if (data.success) {
                const mappedTables = data.tables.map((t: any) => ({
                    id: t.id,
                    label: t.label,
                    capacity: t.capacity,
                    active: t.isActive
                }));
                setLocalTables(mappedTables);
                onUpdateTables(mappedTables);
            }
        } catch (error) {
            console.error('Failed to fetch tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async () => {
        if (!newTableLabel.trim()) return;

        try {
            const token = localStorage.getItem('dinestack_token');
            const res = await fetch('http://localhost:5001/api/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    label: newTableLabel,
                    capacity: parseInt(newTableCapacity) || 4
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsAddModalOpen(false);
                setNewTableLabel('');
                setNewTableCapacity('4');
                fetchTables(); // Refresh list
            } else {
                alert('Failed to create table: ' + data.error);
            }
        } catch (error) {
            console.error('Error adding table:', error);
            alert('Error adding table');
        }
    };

    const toggleTable = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            const updated = localTables.map(t =>
                t.id === id ? { ...t, active: !t.active } : t
            );
            setLocalTables(updated);

            const token = localStorage.getItem('dinestack_token');
            const res = await fetch(`http://localhost:5001/api/tables/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!res.ok) {
                // Revert if failed
                fetchTables();
            } else {
                onUpdateTables(updated); // Sync parent
            }
        } catch (error) {
            console.error('Error toggling table:', error);
            fetchTables();
        }
    };

    const handleDeleteTable = (id: string, label: string) => {
        setModal({
            isOpen: true,
            title: 'Delete Table',
            message: `Are you sure you want to delete ${label}? This action cannot be undone.`,
            confirmLabel: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                closeModal();
                setLoading(true);
                try {
                    const token = localStorage.getItem('dinestack_token');
                    const res = await fetch(`http://localhost:5001/api/tables/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        fetchTables();
                    } else {
                        alert('Failed to delete table');
                    }
                } catch (error) {
                    console.error('Error deleting table:', error);
                    alert('Error deleting table');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleUpdateTable = async () => {
        if (!editingTable || !editingTable.label.trim()) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('dinestack_token');
            const res = await fetch(`http://localhost:5001/api/tables/${editingTable.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    label: editingTable.label,
                    capacity: editingTable.capacity
                })
            });
            const data = await res.json();
            if (data.success) {
                setEditingTable(null);
                fetchTables();
            } else {
                alert('Failed to update table: ' + data.error);
            }
        } catch (error) {
            console.error('Error updating table:', error);
            alert('Error updating table');
        } finally {
            setLoading(false);
        }
    };

    const enableAll = () => {
        setModal({
            isOpen: true,
            title: 'Enable All Tables',
            message: 'This will make all tables active. Are you sure?',
            confirmLabel: 'Enable All',
            isDestructive: false,
            onConfirm: async () => {
                // Determine logic for bulk update? API doesn't have bulk.
                // For now, loop or implement bulk endpoint. looping is inefficient but works for small numbers.
                // Or just do nothing for now as requirement didn't specify bulk endpoint.
                // Let's iterate.
                closeModal();
                setLoading(true);
                await Promise.all(localTables.map(t =>
                    !t.active ? fetch(`http://localhost:5001/api/tables/${t.id}/status`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true })
                    }) : Promise.resolve()
                ));
                fetchTables();
            }
        });
    };

    const disableAll = () => {
        setModal({
            isOpen: true,
            title: 'Disable All Tables',
            message: 'This will disable all tables.',
            confirmLabel: 'Disable All',
            isDestructive: true,
            onConfirm: async () => {
                closeModal();
                setLoading(true);
                await Promise.all(localTables.map(t =>
                    t.active ? fetch(`http://localhost:5001/api/tables/${t.id}/status`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false })
                    }) : Promise.resolve()
                ));
                fetchTables();
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
        <div className="min-h-screen bg-[#E5E5E5] text-[#1F1F1F] font-mono selection:bg-[#8D0B41] selection:text-white relative">

            {/* QR Preview Modal */}
            {qrPreviewId && (() => {
                const table = localTables.find(t => t.id === qrPreviewId);
                return (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setQrPreviewId(null)}>
                        <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-[#1F1F1F] uppercase">{table?.label}</h3>
                                <p className="text-gray-500 text-sm font-bold mt-1">Scan to Order</p>
                            </div>
                            <div className="p-4 bg-white border-4 border-[#1F1F1F] rounded-lg">
                                <QRCodeSVG
                                    value={`https://order.dinestack.in/order/${table?.id}`}
                                    size={200}
                                    level="H"
                                    includeMargin
                                />
                            </div>
                            <div className="text-center space-y-2 w-full">
                                <div className="text-xs font-mono text-gray-400 break-all">{table?.id}</div>
                                <button onClick={() => setQrPreviewId(null)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-sm font-bold uppercase text-xs transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Add Table Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl animate-in slide-in-from-bottom-4 duration-200">
                        <h2 className="text-xl font-bold mb-4 uppercase text-[#8D0B41]">Add New Table</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Table Label / Number</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#8D0B41] outline-none font-bold"
                                    placeholder="e.g. Table 1, VIP 2"
                                    value={newTableLabel}
                                    onChange={e => setNewTableLabel(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Capacity</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#8D0B41] outline-none font-bold"
                                    value={newTableCapacity}
                                    onChange={e => setNewTableCapacity(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-bold uppercase text-sm hover:bg-gray-50 rounded-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddTable}
                                    disabled={!newTableLabel}
                                    className="flex-1 py-3 bg-[#8D0B41] text-white font-bold uppercase text-sm hover:bg-[#700935] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {editingTable && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl animate-in slide-in-from-bottom-4 duration-200">
                        <h2 className="text-xl font-bold mb-4 uppercase text-[#8D0B41]">Edit Table</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Table Label / Number</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#8D0B41] outline-none font-bold"
                                    value={editingTable.label}
                                    onChange={e => setEditingTable({ ...editingTable, label: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Capacity</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#8D0B41] outline-none font-bold"
                                    value={editingTable.capacity}
                                    onChange={e => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) || 1 })}
                                    min="1"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingTable(null)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-bold uppercase text-sm hover:bg-gray-50 rounded-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTable}
                                    disabled={!editingTable.label}
                                    className="flex-1 py-3 bg-[#8D0B41] text-white font-bold uppercase text-sm hover:bg-[#700935] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-[#8D0B41]" />}
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
                    <div className="flex-1"></div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1F1F1F] text-white hover:bg-[#333] transition-colors rounded-sm text-xs font-bold uppercase shadow-lg shadow-black/20"
                    >
                        <Plus size={16} />
                        Add Table
                    </button>
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {localTables.map((table) => (
                        <div
                            key={table.id}
                            className={`
                                relative group transition-all duration-300
                                aspect-square flex flex-col items-center justify-center gap-2
                                border-2 rounded-md shadow-sm select-none overflow-hidden
                                ${table.active
                                    ? 'bg-[#FFFFF0] border-[#8D0B41]'
                                    : 'bg-white border-gray-200 opacity-60 hover:opacity-100'}
                            `}
                        >
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setQrPreviewId(table.id); }}
                                    className="p-1.5 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-[#1F1F1F] transition-colors"
                                >
                                    <QrCode size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingTable(table); }}
                                    className="p-1.5 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-[#8D0B41] transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.label); }}
                                    className="p-1.5 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div
                                onClick={() => toggleTable(table.id, table.active)}
                                className="flex flex-col items-center cursor-pointer w-full h-full justify-center"
                            >
                                <div className={`
                                    w-3 h-3 rounded-full mb-2 transition-colors
                                    ${table.active ? 'bg-[#8D0B41] animate-pulse' : 'bg-gray-300'}
                                `}></div>

                                <h3 className={`text-xl font-black text-center px-2 truncate w-full ${table.active ? 'text-[#1F1F1F]' : 'text-gray-400'}`}>
                                    {table.label}
                                </h3>

                                <span className={`
                                    text-[10px] font-bold uppercase tracking-widest mt-1
                                    ${table.active ? 'text-[#8D0B41]' : 'text-gray-400'}
                                `}>
                                    {table.active ? 'Active' : 'Disabled'}
                                </span>
                            </div>

                            {/* Hover Overlay */}
                            <div
                                onClick={() => toggleTable(table.id, table.active)}
                                className="absolute inset-0 bg-[#8D0B41]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none group-hover:pointer-events-auto"
                            >
                                <Power className="text-[#8D0B41]" size={32} />
                            </div>
                        </div>
                    ))}

                    {/* Add Table Quick Button (at end of grid) */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md hover:border-[#8D0B41] hover:bg-[#8D0B41]/5 text-gray-400 hover:text-[#8D0B41] transition-all group"
                    >
                        <Plus size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase">Add New</span>
                    </button>

                </div>

            </main>
        </div>
    );
}
