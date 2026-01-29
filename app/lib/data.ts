import { UtensilsCrossed, ChefHat, Wine, IceCream } from 'lucide-react';
import React from 'react';

export interface MenuItem {
    id: string;
    name: string;
    price: string;
    available: boolean;
    stock: number;
    description?: string; // Added for customer view
}

export interface MenuCategory {
    id: string;
    title: string;
    code: string;
    icon?: React.ElementType; // Optional for data object, can be mapped in UI
    items: MenuItem[];
}

export const MENU_DATA: MenuCategory[] = [];
