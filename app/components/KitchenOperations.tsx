import React, { useState, useEffect } from 'react';
import KitchenLiveOrders from '@/app/components/KitchenLiveOrders';
import CompletedOrders from '@/app/components/CompletedOrders';
import KitchenOrderDetail from '@/app/components/KitchenOrderDetail';
import { ChefHat } from 'lucide-react';
import { KitchenOrder } from '@/app/components/kitchenTypes';

// Mock Data
const MOCK_ORDERS: KitchenOrder[] = [
    {
        id: '1001',
        table: 'T-04',
        timeElapsed: '04:12',
        status: 'Pending',
        timestamp: new Date(),
        items: [
            { name: 'Truffle Arancini', quantity: 1 },
            { name: 'Wagyu Burger', quantity: 2, notes: 'No pickles' }
        ]
    },
    {
        id: '1002',
        table: 'T-08',
        timeElapsed: '02:30',
        status: 'Preparing',
        timestamp: new Date(),
        items: [
            { name: 'Spicy Edamame', quantity: 1 }
        ]
    },
    {
        id: '1003',
        table: 'T-12',
        timeElapsed: '00:45',
        status: 'Pending', // New order
        timestamp: new Date(),
        items: [
            { name: 'Miso Glazed Cod', quantity: 1 },
            { name: 'Lemon Basil Tart', quantity: 1 }
        ]
    },
    // Completed/Served for history
    {
        id: '998',
        table: 'T-02',
        timeElapsed: '45:00',
        status: 'Served',
        timestamp: new Date(Date.now() - 3600000),
        items: [
            { name: 'Steak Frites', quantity: 2 }
        ]
    }
];

interface KitchenOperationsProps {
    onNavigateToMenu?: () => void;
    onLogout?: () => void;
}

export default function KitchenOperations({ onNavigateToMenu, onLogout }: KitchenOperationsProps) {
    const [view, setView] = useState<'LIVE' | 'HISTORY'>('LIVE');
    const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const savedOrders = localStorage.getItem('taptable_kitchen_orders');
        if (savedOrders) {
            try {
                const parsed = JSON.parse(savedOrders);
                // Hydrate Date objects from strings
                const hydrated = parsed.map((o: any) => ({
                    ...o,
                    timestamp: new Date(o.timestamp)
                }));
                setOrders(hydrated);
            } catch (e) {
                console.error('Failed to parse kitchen orders', e);
                setOrders(MOCK_ORDERS);
            }
        } else {
            setOrders(MOCK_ORDERS);
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage whenever orders change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('taptable_kitchen_orders', JSON.stringify(orders));
        }
    }, [orders, isLoaded]);

    const handleOrderClick = (order: KitchenOrder) => {
        setSelectedOrder(order);
    };

    const handleCloseDetail = () => {
        setSelectedOrder(null);
    };

    const handleStatusUpdate = (orderId: string, newStatus: KitchenOrder['status']) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        // If status is Served, we might move it to history or just keep it. 
        // For now, let's keep it simple.
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const liveOrders = orders.filter(o => o.status !== 'Served');
    const completedOrders = orders.filter(o => o.status === 'Served');

    return (
        <div className="min-h-screen bg-[#1F1F1F] text-white font-sans selection:bg-[#8D0B41]">

            {/* Top Navigation / Header */}
            <nav className="h-16 bg-[#181818] border-b border-white/10 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center font-black skew-x-[-10deg]">
                        <img src="/assets/TapTable-Bg.png" alt="TapTable" className="skew-x-[10deg] h-8 w-auto object-contain" />
                    </div>
                    <h1 className="text-xl font-bold tracking-widest uppercase text-white/90">Kitchen Ops</h1>
                </div>

                <div className="flex bg-black/20 rounded p-1">
                    <button
                        onClick={() => setView('LIVE')}
                        className={`px-6 py-2 rounded text-sm font-bold uppercase transition-all ${view === 'LIVE' ? 'bg-[#FFFFF0] text-[#1F1F1F]' : 'text-gray-500 hover:text-white'}`}
                    >
                        Live Orders
                    </button>
                    <button
                        onClick={() => setView('HISTORY')}
                        className={`px-6 py-2 rounded text-sm font-bold uppercase transition-all ${view === 'HISTORY' ? 'bg-[#FFFFF0] text-[#1F1F1F]' : 'text-gray-500 hover:text-white'}`}
                    >
                        History
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onNavigateToMenu}
                        className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white text-xs font-bold uppercase rounded transition-colors"
                    >
                        Menu Manager
                    </button>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 text-xs font-bold uppercase rounded transition-colors"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="p-4 h-[calc(100vh-64px)] overflow-hidden">
                {view === 'LIVE' ? (
                    <KitchenLiveOrders orders={liveOrders} onOrderClick={handleOrderClick} />
                ) : (
                    <CompletedOrders orders={completedOrders} />
                )}
            </main>

            {/* Order Detail Overlay */}
            {selectedOrder && (
                <KitchenOrderDetail
                    order={selectedOrder}
                    onClose={handleCloseDetail}
                    onUpdateStatus={(status: KitchenOrder['status']) => handleStatusUpdate(selectedOrder.id, status)}
                />
            )}

        </div>
    );
}
