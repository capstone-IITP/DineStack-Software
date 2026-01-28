'use client';

import React, { useState } from 'react';
import { MENU_DATA, MenuItem } from '@/app/lib/data';
import QREntry from '@/app/components/client/QREntry';
import MenuView from '@/app/components/client/MenuView';
import ItemCustomizer from '@/app/components/client/ItemCustomizer';
import CartView from '@/app/components/client/CartView';
import OrderStatus from '@/app/components/client/OrderStatus';
import { ShoppingBag } from 'lucide-react';
import { useOrder } from '@/app/context/OrderContext';

export default function CustomerOrderClient({ tableId }: { tableId: string }) {
    const decodedTableId = decodeURIComponent(tableId);

    type ViewState = 'ENTRY' | 'MENU' | 'ITEM' | 'CART' | 'CONFIRMATION' | 'STATUS' | 'PAYMENT';

    const [view, setView] = useState<ViewState>('ENTRY');
    const { cart, addToCart } = useOrder();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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
    const handlePlaceOrder = () => setView('STATUS'); // Skip payment/confirm for now in basic flow

    // Render Logic
    return (
        <div className="min-h-screen bg-[#F9F9F9] text-[#1F1F1F] font-sans">

            {view === 'ENTRY' && (
                <QREntry tableId={decodedTableId} onConfirm={handleEntryConfirmed} />
            )}

            {view === 'MENU' && (
                <div className="pb-24">
                    <MenuView
                        menu={MENU_DATA}
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
                <OrderStatus tableId={decodedTableId} />
            )}

        </div>
    );
}
