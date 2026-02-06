'use client';

import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '@/app/lib/data';
import QREntry from '@/app/components/client/QREntry';
import MenuView from '@/app/components/client/MenuView';
import ItemCustomizer from '@/app/components/client/ItemCustomizer';
import CartView from '@/app/components/client/CartView';
import OrderStatus from '@/app/components/client/OrderStatus';
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { useOrder } from '@/app/context/OrderContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ApiMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    isActive: boolean;
}

interface ApiCategory {
    id: string;
    name: string;
    code?: string;
    items: ApiMenuItem[];
}

interface ApiResponse {
    success: boolean;
    restaurant?: { id: string; name: string };
    table?: { id: string; label: string };
    categories?: ApiCategory[];
    error?: string;
}

export default function CustomerOrderClient({ tableId }: { tableId: string }) {
    const decodedTableId = decodeURIComponent(tableId);

    type ViewState = 'LOADING' | 'ERROR' | 'ENTRY' | 'MENU' | 'ITEM' | 'CART' | 'CONFIRMATION' | 'STATUS' | 'PAYMENT';

    const [view, setView] = useState<ViewState>('LOADING');
    const [menuData, setMenuData] = useState<MenuCategory[]>([]);
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [tableLabel, setTableLabel] = useState<string>(decodedTableId);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const { cart, addToCart } = useOrder();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    // Fetch menu data on mount
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/customer/table/${decodedTableId}/menu`);
                const data: ApiResponse = await res.json();

                if (data.success && data.categories) {
                    // Map API response to frontend MenuCategory format
                    const mappedCategories: MenuCategory[] = data.categories.map(cat => ({
                        id: cat.id,
                        title: cat.name,
                        code: cat.code || cat.name.substring(0, 3).toUpperCase(),
                        items: cat.items.map(item => ({
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            price: String(item.price),
                            available: item.isActive,
                            stock: 999 // Not tracked in this version
                        }))
                    }));

                    setMenuData(mappedCategories);
                    if (data.restaurant) setRestaurantName(data.restaurant.name);
                    if (data.table) setTableLabel(data.table.label);
                    setView('ENTRY');
                } else {
                    setErrorMessage(data.error || 'Failed to load menu');
                    setView('ERROR');
                }
            } catch (error) {
                console.error('Menu fetch error:', error);
                setErrorMessage('Unable to connect to restaurant. Please try again.');
                setView('ERROR');
            }
        };

        fetchMenu();
    }, [decodedTableId]);

    // Navigation Handlers
    const handleEntryConfirmed = () => setView('MENU');
    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setView('ITEM');
    };
    const handleAddToCart = (item: MenuItem, quantity: number, notes: string) => {
        addToCart(item, quantity, notes);
        setView('MENU');
    };
    const handleViewCart = () => setView('CART');
    const handlePlaceOrder = () => setView('STATUS');

    // Render Logic
    return (
        <div className="min-h-screen bg-[#F9F9F9] text-[#1F1F1F] font-sans">

            {view === 'LOADING' && (
                <div className="min-h-screen flex flex-col items-center justify-center p-8">
                    <Loader2 size={48} className="animate-spin text-[#8D0B41] mb-4" />
                    <p className="text-gray-500 font-medium">Loading menu...</p>
                </div>
            )}

            {view === 'ERROR' && (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <h1 className="text-xl font-bold mb-2">Oops!</h1>
                    <p className="text-gray-500 mb-6">{errorMessage}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#8D0B41] text-white rounded-lg font-bold"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {view === 'ENTRY' && (
                <QREntry tableId={tableLabel} onConfirm={handleEntryConfirmed} />
            )}

            {view === 'MENU' && menuData.length > 0 && (
                <div className="pb-24">
                    <MenuView
                        menu={menuData}
                        onItemClick={handleItemClick}
                    />
                    {/* Floating Cart Button */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-6 left-6 right-6 z-50">
                            <button
                                onClick={handleViewCart}
                                className="w-full bg-[#1F1F1F] text-white py-4 rounded-full shadow-2xl flex items-center justify-between px-8 font-bold text-lg active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={20} />
                                    <span>{cart.length} items</span>
                                </div>
                                <span>View Cart</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'ITEM' && selectedItem && (
                <ItemCustomizer
                    item={selectedItem}
                    onBack={() => setView('MENU')}
                    onAdd={handleAddToCart}
                />
            )}

            {view === 'CART' && (
                <CartView
                    cart={cart}
                    onBack={() => setView('MENU')}
                    onPlaceOrder={handlePlaceOrder}
                />
            )}

            {view === 'STATUS' && (
                <OrderStatus tableId={tableLabel} />
            )}

        </div>
    );
}
