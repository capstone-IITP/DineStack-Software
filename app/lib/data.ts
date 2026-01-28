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

export const MENU_DATA: MenuCategory[] = [
    {
        id: 'starters',
        title: 'Starters',
        code: 'STR',
        items: [
            { id: '101', name: 'Truffle Arancini', price: '14.00', available: true, stock: 3, description: 'Crispy risotto balls with black truffle and mozzarella.' },
            { id: '102', name: 'Burrata & Peach', price: '18.50', available: true, stock: 2, description: 'Fresh burrata with grilled peaches and basil oil.' },
            { id: '103', name: 'Crispy Calamari', price: '16.00', available: false, stock: 0, description: 'Served with lemon aioli.' },
            { id: '104', name: 'Spicy Edamame', price: '8.00', available: true, stock: 3, description: 'Steamed edamame with chili garlic salt.' },
        ]
    },
    {
        id: 'mains',
        title: 'Mains',
        code: 'MN',
        items: [
            { id: '201', name: 'Pan-Seared Scallops', price: '32.00', available: true, stock: 2, description: 'With cauliflower purée and pancetta crisps.' },
            { id: '202', name: 'Wagyu Burger', price: '24.00', available: true, stock: 3, description: 'Brioche bun, aged cheddar, caramelized onions.' },
            { id: '203', name: 'Wild Mushroom Risotto', price: '26.00', available: false, stock: 0, description: 'Arborio rice with porcini and parmesan.' },
            { id: '204', name: 'Miso Glazed Cod', price: '29.00', available: true, stock: 1, description: 'Sustainably sourced cod with bok choy.' },
            { id: '205', name: 'Steak Frites', price: '34.00', available: true, stock: 2, description: 'Grass-fed ribeye with shoestring fries.' },
        ]
    },
    {
        id: 'drinks',
        title: 'Cocktails',
        code: 'CKT',
        items: [
            { id: '301', name: 'Smoked Old Fashioned', price: '15.00', available: true, stock: 3, description: 'Bourbon, maple syrup, angostura bitters, smoke.' },
            { id: '302', name: 'Yuzu Spritz', price: '13.00', available: true, stock: 3, description: 'Yuzu sake, prosecco, soda water.' },
            { id: '303', name: 'Espresso Martini', price: '14.00', available: false, stock: 0, description: 'Vodka, coffee liqueur, fresh espresso.' },
        ]
    },
    {
        id: 'desserts',
        title: 'Sweets',
        code: 'SWT',
        items: [
            { id: '401', name: 'Dark Chocolate Fondant', price: '12.00', available: true, stock: 2, description: 'Molten center, served with vanilla bean ice cream.' },
            { id: '402', name: 'Lemon Basil Tart', price: '11.00', available: true, stock: 3, description: 'Zesty lemon curd with a hint of fresh basil.' },
        ]
    }
];
