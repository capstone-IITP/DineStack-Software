'use client';

import { useState } from 'react';
import TapTableActivation from './components/TapTableActivation';
import CreateAdminPin from './components/CreateAdminPin';
import ConfirmAdminPin from './components/ConfirmAdminPin';
import TapTableInit from './components/TapTableInit';
import TapTableLogin from './components/TapTableLogin';
import AdminDashboard from './components/AdminDashboard';
import KitchenDashboard from './components/KitchenDashboard';
import AddItemPage from './components/AddItemPage';
import EditItemPage, { MenuItem as EditMenuItem } from './components/EditItemPage';
import CategoryManager from './components/CategoryManager';
import TableManager, { TableItem } from './components/TableManager';

import QRGenerator from './components/QRGenerator';
import QRPreview from './components/QRPreview';

import AccessControl from './components/AccessControl';
import CreateKitchenPin from './components/CreateKitchenPin';
import ResetKitchenPin from './components/ResetKitchenPin';

import SalesSummary from './components/SalesSummary';
import OrderHistory from './components/OrderHistory';
import KitchenOperations from './components/KitchenOperations';

import RestaurantSettings from './components/RestaurantSettings';
import SystemPreferences from './components/SystemPreferences';

type Screen = 'activation' | 'createPin' | 'confirmPin' | 'init' | 'login' | 'adminDashboard' | 'kitchenDashboard' | 'kitchenOperations' | 'addItem' | 'editItem' | 'categoryManager' | 'tableManager' | 'qrGenerator' | 'qrPreview' | 'accessControl' | 'createKitchenPin' | 'resetKitchenPin' | 'salesSummary' | 'orderHistory' | 'restaurantSettings' | 'systemPreferences';

// Shared menu data type
export interface MenuItem {
  id: string;
  name: string;
  price: string;
  available: boolean;
  stock: number;
}

export interface MenuCategory {
  id: string;
  title: string;
  code: string;
  items: MenuItem[];
}

// Initial menu data
const INITIAL_MENU_DATA: MenuCategory[] = [
  {
    id: 'starters',
    title: 'Starters',
    code: 'STR',
    items: [
      { id: '101', name: 'Truffle Arancini', price: '14.00', available: true, stock: 3 },
      { id: '102', name: 'Burrata & Peach', price: '18.50', available: true, stock: 2 },
      { id: '103', name: 'Crispy Calamari', price: '16.00', available: false, stock: 0 },
      { id: '104', name: 'Spicy Edamame', price: '8.00', available: true, stock: 3 },
    ]
  },
  {
    id: 'mains',
    title: 'Mains',
    code: 'MN',
    items: [
      { id: '201', name: 'Pan-Seared Scallops', price: '32.00', available: true, stock: 2 },
      { id: '202', name: 'Wagyu Burger', price: '24.00', available: true, stock: 3 },
      { id: '203', name: 'Wild Mushroom Risotto', price: '26.00', available: false, stock: 0 },
      { id: '204', name: 'Miso Glazed Cod', price: '29.00', available: true, stock: 1 },
      { id: '205', name: 'Steak Frites', price: '34.00', available: true, stock: 2 },
    ]
  },
  {
    id: 'drinks',
    title: 'Cocktails',
    code: 'CKT',
    items: [
      { id: '301', name: 'Smoked Old Fashioned', price: '15.00', available: true, stock: 3 },
      { id: '302', name: 'Yuzu Spritz', price: '13.00', available: true, stock: 3 },
      { id: '303', name: 'Espresso Martini', price: '14.00', available: false, stock: 0 },
    ]
  },
  {
    id: 'desserts',
    title: 'Sweets',
    code: 'SWT',
    items: [
      { id: '401', name: 'Dark Chocolate Fondant', price: '12.00', available: true, stock: 2 },
      { id: '402', name: 'Lemon Basil Tart', price: '11.00', available: true, stock: 3 },
    ]
  }
];

// Generate initial tables
const INITIAL_TABLES: TableItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `T-${String(i + 1).padStart(2, '0')}`,
  label: `Table ${i + 1}`,
  active: true
}));

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('activation');
  const [adminPin, setAdminPin] = useState('');
  const [kitchenPin, setKitchenPin] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuCategory[]>(INITIAL_MENU_DATA);
  const [tableData, setTableData] = useState<TableItem[]>(INITIAL_TABLES);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem; categoryId: string } | null>(null);
  const [previewTableId, setPreviewTableId] = useState<string | null>(null);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handlePinCreated = (pin: string) => {
    setAdminPin(pin);
    navigate('confirmPin');
  };

  const handlePinConfirmed = () => {
    navigate('init');
  };

  const handleLoginSuccess = (role: string) => {
    if (role === 'ADMIN') {
      navigate('adminDashboard');
    } else {
      navigate('kitchenOperations');
    }
  };

  const handleAddItem = (item: { name: string; price: string; category: string; stock: number }) => {
    // Generate new ID based on category
    const categoryIndex = menuData.findIndex(cat => cat.id === item.category);
    if (categoryIndex === -1) return;

    const category = menuData[categoryIndex];
    const categoryPrefix = category.code === 'STR' ? '1' : category.code === 'MN' ? '2' : category.code === 'CKT' ? '3' : '4';
    const newId = categoryPrefix + String(category.items.length + 1).padStart(2, '0');

    const newItem: MenuItem = {
      id: newId,
      name: item.name,
      price: item.price,
      available: true,
      stock: item.stock
    };

    // Add item to the correct category
    const newMenuData = [...menuData];
    newMenuData[categoryIndex] = {
      ...category,
      items: [...category.items, newItem]
    };
    setMenuData(newMenuData);
  };

  const handleEditItem = (item: MenuItem, categoryId: string) => {
    setEditingItem({ item, categoryId });
    navigate('editItem');
  };

  const handleSaveEditedItem = (updatedItem: EditMenuItem, originalCategoryId: string, newCategoryId: string) => {
    const newMenuData = [...menuData];

    // Remove from original category
    const originCatIndex = newMenuData.findIndex(c => c.id === originalCategoryId);
    if (originCatIndex === -1) return; // Should not happen

    // If category didn't change, just update in place
    if (originalCategoryId === newCategoryId) {
      const itemIndex = newMenuData[originCatIndex].items.findIndex(i => i.id === updatedItem.id);
      if (itemIndex !== -1) {
        newMenuData[originCatIndex].items[itemIndex] = updatedItem;
      }
    } else {
      // Category changed: Remove from old, add to new
      // 1. Remove
      newMenuData[originCatIndex].items = newMenuData[originCatIndex].items.filter(i => i.id !== updatedItem.id);

      // 2. Add to new
      const targetCatIndex = newMenuData.findIndex(c => c.id === newCategoryId);
      if (targetCatIndex !== -1) {
        // Optionally regenerate ID if strict prefixes are required, but for meaningful edits retaining ID is often preferred 
        // unless it strictly violates coding schema. Here we'll keep ID to be simple for now, or user might get confused why ID changed.
        newMenuData[targetCatIndex].items.push(updatedItem);
      }
    }

    setMenuData(newMenuData);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string, categoryId: string) => {
    const newMenuData = [...menuData];
    const catIndex = newMenuData.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      newMenuData[catIndex].items = newMenuData[catIndex].items.filter(i => i.id !== itemId);
      setMenuData(newMenuData);
    }
    setEditingItem(null);
  };

  const handleUpdateCategories = (newCategories: MenuCategory[]) => {
    setMenuData(newCategories);
  };

  const handleUpdateTables = (newTables: TableItem[]) => {
    setTableData(newTables);
  };

  const handleToggleAvailability = (catIndex: number, itemIndex: number) => {
    const newMenuData = [...menuData];
    newMenuData[catIndex].items[itemIndex].available = !newMenuData[catIndex].items[itemIndex].available;
    setMenuData(newMenuData);
  };

  const handlePreviewQR = (tableId: string) => {
    setPreviewTableId(tableId);
    navigate('qrPreview');
  };

  const handleKitchenPinSet = (pin: string) => {
    setKitchenPin(pin);
    navigate('accessControl'); // Return to Hub
  };

  const handleKitchenPinReset = () => {
    setKitchenPin(null);
    navigate('createKitchenPin'); // Force immediate reconfiguration or we could go back to Hub? 
    // Plan said: Reset -> Create. Let's redirect to Create to enforce flow.
  };

  switch (currentScreen) {
    case 'activation':
      return <TapTableActivation onSuccess={() => navigate('createPin')} />;
    case 'createPin':
      return <CreateAdminPin onPinCreated={handlePinCreated} />;
    case 'confirmPin':
      return <ConfirmAdminPin originalPin={adminPin} onBack={() => navigate('createPin')} onSuccess={handlePinConfirmed} />;
    case 'init':
      return <TapTableInit onComplete={() => navigate('login')} />;
    case 'login':
      return <TapTableLogin onLoginSuccess={handleLoginSuccess} />;
    case 'adminDashboard':
      return <AdminDashboard
        onLogout={() => navigate('login')}
        onManageMenu={() => navigate('categoryManager')}
        onManageTables={() => navigate('tableManager')}
        onAccessQR={() => navigate('qrGenerator')}
        onAccessControl={() => navigate('accessControl')}
        onSalesSummary={() => navigate('salesSummary')}
        onOrderHistory={() => navigate('orderHistory')}
        onRestaurantSettings={() => navigate('restaurantSettings')}
        onSystemPreferences={() => navigate('systemPreferences')}
      />;
    case 'kitchenDashboard':
      return (
        <KitchenDashboard
          onLogout={() => navigate('login')}
          onAddItem={() => navigate('addItem')}
          onEditItem={handleEditItem}
          menuData={menuData}
          onToggleAvailability={handleToggleAvailability}
          onNavigateToLiveOps={() => navigate('kitchenOperations')}
        />
      );
    case 'kitchenOperations':
      return (
        <KitchenOperations
          onNavigateToMenu={() => navigate('kitchenDashboard')}
          onLogout={() => navigate('login')}
        />
      );
    case 'addItem':
      return <AddItemPage onBack={() => navigate('kitchenDashboard')} onSave={handleAddItem} />;
    case 'editItem':
      if (!editingItem) return <KitchenDashboard onLogout={() => navigate('login')} onAddItem={() => navigate('addItem')} menuData={menuData} />;
      return (
        <EditItemPage
          item={editingItem.item}
          category={editingItem.categoryId}
          onBack={() => navigate('kitchenDashboard')}
          onSave={handleSaveEditedItem}
          onDelete={handleDeleteItem}
        />
      );
    case 'categoryManager':
      return (
        <CategoryManager
          categories={menuData}
          onBack={() => navigate('adminDashboard')}
          onUpdateCategories={handleUpdateCategories}
        />
      );
    case 'tableManager':
      return (
        <TableManager
          tables={tableData}
          onBack={() => navigate('adminDashboard')}
          onUpdateTables={handleUpdateTables}
        />
      );
    case 'qrGenerator':
      return (
        <QRGenerator
          tables={tableData}
          onBack={() => navigate('adminDashboard')}
          onPreview={handlePreviewQR}
        />
      );
    case 'qrPreview':
      const selectedTable = tableData.find(t => t.id === previewTableId) || tableData[0];
      return (
        <QRPreview
          table={selectedTable}
          onBack={() => navigate('qrGenerator')}
        />
      );
    case 'accessControl':
      return (
        <AccessControl
          isKitchenPinSet={!!kitchenPin}
          onBack={() => navigate('adminDashboard')}
          onCreateKitchenPin={() => navigate('createKitchenPin')}
          onResetKitchenPin={() => navigate('resetKitchenPin')}
        />
      );
    case 'createKitchenPin':
      return (
        <CreateKitchenPin
          onBack={() => navigate('accessControl')} // Or dashboard if first time? AccessControl is safer anchor.
          onPinSet={handleKitchenPinSet}
        />
      );
    case 'resetKitchenPin':
      return (
        <ResetKitchenPin
          onCancel={() => navigate('accessControl')}
          onConfirmed={handleKitchenPinReset}
        />
      );
    case 'salesSummary':
      return <SalesSummary onBack={() => navigate('adminDashboard')} />;
    case 'orderHistory':
      return <OrderHistory onBack={() => navigate('adminDashboard')} />;
    case 'restaurantSettings':
      return <RestaurantSettings onBack={() => navigate('adminDashboard')} />;
    case 'systemPreferences':
      return <SystemPreferences onBack={() => navigate('adminDashboard')} />;
    default:
      return <TapTableActivation onSuccess={() => navigate('createPin')} />;
  }
}
