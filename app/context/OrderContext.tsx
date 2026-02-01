'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '@/app/lib/data';

export interface CartItem {
    item: MenuItem;
    quantity: number;
    notes: string;
}

interface OrderContextType {
    cart: CartItem[];
    addToCart: (item: MenuItem, quantity: number, notes: string) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    totalAmount: string;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
    // Initialize cart from localStorage if available
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('dinestack_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage whenever cart changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('dinestack_cart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    const addToCart = (item: MenuItem, quantity: number, notes: string) => {
        setCart(prev => {
            // Check if item already exists with same notes
            const existingIndex = prev.findIndex(
                i => i.item.id === item.id && i.notes === notes
            );

            if (existingIndex > -1) {
                const newCart = [...prev];
                newCart[existingIndex].quantity += quantity;
                return newCart;
            }

            return [...prev, { item, quantity, notes }];
        });
    };

    const removeFromCart = (itemId: string) => {
        // This relies on item ID, but technically we should respect notes too.
        // For simplicity assuming unique items for now or removing all instances.
        // A better approach is to pass index or unique instance ID.
        // Let's filter by finding the first match if we want to be specific, or just filter all with that ID?
        // Let's assume the UI passes a specific index or we add a unique ID to the cart item.
        // For now, let's filter out the item by ID.
        setCart(prev => prev.filter(i => i.item.id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(cartItem => {
            if (cartItem.item.id === itemId) {
                return { ...cartItem, quantity: Math.max(0, cartItem.quantity + delta) };
            }
            return cartItem;
        }).filter(item => item.quantity > 0));
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalAmount = cart.reduce((sum, cartItem) => {
        return sum + (parseFloat(cartItem.item.price) * cartItem.quantity);
    }, 0).toFixed(2);

    return (
        <OrderContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalAmount
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
