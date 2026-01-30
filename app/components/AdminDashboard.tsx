'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    ChefHat,
    DollarSign,
    Wifi,
    RefreshCw,
    Lock,
    FileText,
    ToggleLeft,
    ToggleRight,
    Search,
    Clock,
    LogOut,
    QrCode,
    BarChart3,
    History,
    Settings,
    Sliders
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

import OrderMonitor, { Order } from './OrderMonitor';
import OrderDetails from './OrderDetails';

// --- Theme Constants ---
const COLORS = {
    bg: 'bg-white',
    surface: 'bg-[#FFFFF0]',
    surfaceBorder: 'border-[#F5F5DC]',
    primary: 'text-[#8D0B41]',
    primaryBg: 'bg-[#8D0B41]',
    text: 'text-[#1F1F1F]',
    muted: 'text-[#6A6A6A]',
    border: 'border-gray-200'
};

// --- Mock Data ---
const INITIAL_STATS = {
    activeOrders: 0,
    completedOrders: 0,
    tableUtilization: '0%',
    todaySales: 0
};

const INITIAL_ORDERS: Order[] = [];

const INITIAL_MENU: { id: number; name: string; price: number; inStock: boolean; }[] = [];

// --- Sub-Components ---

function MetricBox({ label, value, icon: Icon, isText = false, highlight = false }: { label: string; value: string | number; icon: React.ElementType; isText?: boolean; highlight?: boolean }) {
    return (
        <div className={`p-4 bg-[#FFFFF0] border-l-4 ${highlight ? 'border-[#8D0B41]' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${highlight ? 'text-[#8D0B41]' : 'text-gray-400'}`} />
            </div>
            <div className={`text-2xl font-bold leading-none ${highlight ? 'text-[#8D0B41]' : 'text-[#1F1F1F]'}`}>
                {value}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'Cooking': 'bg-[#FFF0F5] text-[#8D0B41] border border-[#8D0B41]/20',
        'Ready': 'bg-green-50 text-green-700 border border-green-200',
        'Pending': 'bg-gray-100 text-gray-600 border border-gray-200',
        'Served': 'bg-gray-50 text-gray-400 border border-gray-100 decoration-slice line-through',
    };

    return (
        <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide ${styles[status] || styles['Pending']}`}>
            {status}
        </span>
    );
}

function SystemRow({ label, status, icon: Icon }: { label: string; status: boolean; icon: React.ElementType }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${status ? 'text-green-700' : 'text-red-600'}`}>
                    {status ? 'ONLINE' : 'OFFLINE'}
                </span>
                <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
        </div>
    );
}

function ReportButton({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 hover:border-[#8D0B41] hover:text-[#8D0B41] group transition-all rounded-sm"
        >
            <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#8D0B41] mb-2" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-[#8D0B41] text-center">{label}</span>
        </button>
    );
}

export default function AdminDashboard({ onLogout, onManageMenu, onManageTables, onAccessQR, onAccessControl, onSalesSummary, onOrderHistory, onRestaurantSettings, onSystemPreferences }: { onLogout?: () => void; onManageMenu?: () => void; onManageTables?: () => void; onAccessQR?: () => void; onAccessControl?: () => void; onSalesSummary?: () => void; onOrderHistory?: () => void; onRestaurantSettings?: () => void; onSystemPreferences?: () => void }) {
    const [currentTime, setCurrentTime] = useState('');
    const [stats, setStats] = useState(INITIAL_STATS);
    const [menuItems, setMenuItems] = useState(INITIAL_MENU);
    const [activeOrders] = useState<Order[]>(INITIAL_ORDERS);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [systemHealth] = useState({
        kitchen: true,
        network: true,
        sync: true
    });

    // Fetch Stats from Backend
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('taptable_token');
                const response = await fetch('http://localhost:5001/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Fetch Stats Error:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    // Clock tick - client side only
    useEffect(() => {
        const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Toggle Menu Stock
    const toggleStock = (id: number) => {
        setMenuItems(prev => prev.map(item =>
            item.id === id ? { ...item, inStock: !item.inStock } : item
        ));
    };

    return (
        <div className={`min-h-screen ${COLORS.bg} ${COLORS.text} font-sans selection:bg-[#8D0B41] selection:text-white overflow-hidden flex flex-col`}>

            {/* --- Header / Top Bar --- */}

            <OrderDetails
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />

            <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <img src="/assets/TapTable-Bg.png" alt="TapTable" className="h-10 object-contain" />
                    <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F]"><span className="font-normal text-gray-400">| ADMIN</span></h1>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="tabular-nums font-medium">{currentTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${systemHealth.network ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-gray-600 font-medium">System Operational</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-[#8D0B41] hover:bg-gray-100 rounded transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </header>

            {/* --- Main Dashboard Content --- */}
            <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

                {/* --- LEFT COLUMN: LIVE OPS (Orders & Metrics) --- */}
                <div className="col-span-8 flex flex-col border-r border-gray-100 p-8 gap-8 overflow-y-auto">

                    {/* A. LIVE OVERVIEW */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xs font-bold uppercase tracking-wider ${COLORS.muted}`}>Live Status</h2>
                            <div className="h-px bg-gray-100 flex-1 ml-4"></div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <MetricBox label="Active Orders" value={stats.activeOrders} icon={Activity} />
                            <MetricBox label="Completed Orders" value={stats.completedOrders} icon={BarChart3} />
                            <MetricBox label="Table Utilization" value={stats.tableUtilization} icon={Users} />
                            <MetricBox label="Today's Sales" value={`₹${INITIAL_STATS.todaySales.toLocaleString()}`} icon={DollarSign} highlight />
                        </div>
                    </section>

                    {/* B. ORDERS MONITOR */}
                    <section className="flex-1 flex flex-col">
                        <div className={`flex-1 border ${COLORS.surfaceBorder} rounded-sm overflow-hidden flex flex-col shadow-sm`}>
                            <OrderMonitor
                                orders={activeOrders}
                                onOrderClick={setSelectedOrder}
                            />
                        </div>
                    </section>
                </div>

                {/* --- RIGHT COLUMN: CONTROLS & SYSTEM --- */}
                <div className={`col-span-4 ${COLORS.surface} flex flex-col border-l border-gray-100`}>

                    {/* C. QUICK MENU CONTROL */}
                    <div className="flex-1 p-8 border-b border-[#F0EAD6]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-xs font-bold uppercase tracking-wider ${COLORS.primary}`}>Quick Menu Control</h2>
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-3 px-2 border-b border-[#EAE4D0] last:border-0 hover:bg-white/50 rounded transition-colors">
                                    <div>
                                        <div className={`font-medium ${item.inStock ? 'text-[#1F1F1F]' : 'text-gray-400 line-through'}`}>{item.name}</div>
                                        <div className="text-xs text-gray-500">₹{item.price.toFixed(2)}</div>
                                    </div>
                                    <button
                                        onClick={() => toggleStock(item.id)}
                                        className="focus:outline-none group flex items-center gap-2"
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${item.inStock ? 'text-green-700' : 'text-red-700'}`}>
                                            {item.inStock ? 'In Stock' : 'Sold Out'}
                                        </span>
                                        {item.inStock ? (
                                            <ToggleRight className={`w-6 h-6 ${COLORS.primary}`} />
                                        ) : (
                                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={onManageMenu}
                            className={`mt-4 w-full py-2 text-xs font-bold uppercase tracking-wider border border-[#8D0B41] ${COLORS.primary} hover:bg-[#8D0B41] hover:text-white transition-colors rounded-sm`}
                        >
                            Manage Full Menu
                        </button>
                        <button
                            onClick={onManageTables}
                            className="mt-2 w-full py-2 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-500 hover:border-[#1F1F1F] hover:text-[#1F1F1F] transition-colors rounded-sm"
                        >
                            Manage Tables
                        </button>
                        <button
                            onClick={onAccessQR}
                            className="mt-2 w-full py-2 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-500 hover:border-[#1F1F1F] hover:text-[#1F1F1F] transition-colors rounded-sm flex items-center justify-center gap-2"
                        >
                            <QrCode size={14} />
                            QR Generator
                        </button>
                    </div>

                    {/* D. ACCESS & SYSTEM STATUS */}
                    <div className="p-8 border-b border-[#F0EAD6] bg-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-xs font-bold uppercase tracking-wider ${COLORS.muted}`}>System Health</h2>
                        </div>

                        <div className="space-y-4">
                            <SystemRow label="Kitchen Display System" status={systemHealth.kitchen} icon={ChefHat} />
                            <SystemRow label="Cloud Sync" status={systemHealth.sync} icon={RefreshCw} />
                            <SystemRow label="Network Connectivity" status={systemHealth.network} icon={Wifi} />
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${COLORS.muted} mb-4`}>Security</h3>
                            <button
                                onClick={onAccessControl}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors"
                            >
                                <Lock className="w-3 h-3" />
                                Access Control
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 pb-20">
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${COLORS.muted} mb-4`}>Configuration</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={onRestaurantSettings}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-[#8D0B41] hover:bg-gray-50 rounded-sm transition-colors group"
                                >
                                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-[#8D0B41]" />
                                    <span className="text-xs font-bold">Restaurant Profile</span>
                                </button>
                                <button
                                    onClick={onSystemPreferences}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-[#8D0B41] hover:bg-gray-50 rounded-sm transition-colors group"
                                >
                                    <Sliders className="w-4 h-4 text-gray-400 group-hover:text-[#8D0B41]" />
                                    <span className="text-xs font-bold">System Preferences</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* E. REPORTS ENTRY */}
                    <div className={`p-8 ${COLORS.surface}`}>
                        <h2 className={`text-xs font-bold uppercase tracking-wider ${COLORS.muted} mb-4`}>Reports</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ReportButton label="Sales Summary" icon={FileText} onClick={onSalesSummary} />
                            <ReportButton label="Order History" icon={History} onClick={onOrderHistory} />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
