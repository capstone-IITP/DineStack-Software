import React, { useState, useEffect } from 'react';
import KitchenLiveOrders from '@/app/components/KitchenLiveOrders';
import CompletedOrders from '@/app/components/CompletedOrders';
import KitchenOrderDetail from '@/app/components/KitchenOrderDetail';
import { ChefHat } from 'lucide-react';
import { KitchenOrder } from '@/app/components/kitchenTypes';

// Mock Data
const MOCK_ORDERS: KitchenOrder[] = [];

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
    // Load from backend on mount
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('dinestack_token');
                const response = await fetch('http://localhost:5001/api/kitchen/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    // Map backend data to frontend KitchenOrder type
                    const mappedOrders: KitchenOrder[] = data.orders.map((o: any) => {
                        const createdAt = new Date(o.createdAt);
                        const elapsedMs = Date.now() - createdAt.getTime();
                        const mins = Math.floor(elapsedMs / 60000);
                        const secs = Math.floor((elapsedMs % 60000) / 1000);
                        const timeElapsed = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

                        return {
                            id: o.id,
                            table: o.table.label,
                            timeElapsed,
                            items: o.items.map((i: any) => ({
                                name: i.menuItem.name,
                                quantity: i.quantity,
                                notes: i.notes
                            })),
                            // Map backend status to frontend display status
                            status: o.status === 'RECEIVED' ? 'Pending' :
                                o.status === 'PREPARING' ? 'Preparing' :
                                    o.status === 'READY' ? 'Ready' : 'Served',
                            timestamp: createdAt
                        };
                    });
                    setOrders(mappedOrders);
                }
            } catch (error) {
                console.error('Fetch Orders Error:', error);
            }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);


    const handleOrderClick = (order: KitchenOrder) => {
        setSelectedOrder(order);
    };

    const handleCloseDetail = () => {
        setSelectedOrder(null);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: KitchenOrder['status']) => {
        try {
            const token = localStorage.getItem('dinestack_token');
            const backendStatus = newStatus === 'Pending' ? 'RECEIVED' :
                newStatus === 'Preparing' ? 'PREPARING' :
                    newStatus === 'Ready' ? 'READY' : 'SERVED';

            const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: backendStatus })
            });

            if (response.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
                }
            } else {
                const data = await response.json();
                alert(`Status update failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Update Status Error:', error);
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
                        <img src="./assets/DineStack-Bg.png" alt="DineStack" className="skew-x-[10deg] h-8 w-auto object-contain" />
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
