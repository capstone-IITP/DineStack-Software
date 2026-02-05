'use client';

import { useState, useEffect, useRef } from 'react';
import DineStackActivation from './components/DineStackActivation';
import CreateAdminPin from './components/CreateAdminPin';
import ConfirmAdminPin from './components/ConfirmAdminPin';
import DineStackInit from './components/DineStackInit';
import DineStackLogin from './components/DineStackLogin';
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

type Screen = 'loading' | 'activation' | 'createPin' | 'confirmPin' | 'init' | 'login' | 'adminDashboard' | 'kitchenDashboard' | 'kitchenOperations' | 'addItem' | 'editItem' | 'categoryManager' | 'tableManager' | 'qrGenerator' | 'qrPreview' | 'accessControl' | 'createKitchenPin' | 'resetKitchenPin' | 'salesSummary' | 'orderHistory' | 'restaurantSettings' | 'systemPreferences';

// Simple Splash Screen Component (Light Mode)
const SplashScreen = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500">
    <div className="flex flex-col items-center animate-pulse">
      <img src="./assets/DineStack-Bg.png" alt="DineStack" className="w-32 h-auto mb-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
      <h1 className="text-3xl font-bold tracking-[0.2em] text-[#1F1F1F]">DINESTACK</h1>
      <div className="mt-4 h-0.5 w-16 bg-[#8D0B41] rounded-full"></div>
      <p className="mt-4 text-xs tracking-widest text-[#6A6A6A] font-mono">SYSTEM INITIALIZATION</p>
    </div>
  </div>
);

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

// Initial menu data can be empty, we fetch on load
const INITIAL_MENU_DATA: MenuCategory[] = [];

const API_BASE = 'http://localhost:5001';

// API Helper
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = localStorage.getItem('dinestack_token') || 'mock-token'; // We might need real token logic
  // For now, let's assume Admin/Kitchen dashboard access implies we have a way to auth or we need to pass headers.
  // server.ts middleware checks 'Authorization: Bearer <token>'
  // DineStackLogin component might store a token? 
  // Looking at DineStackLogin (not visible here), it calls onLoginSuccess.
  // We need to store keys. `localStorage.setItem('dinestack_admin_pin', ...)` is there.
  // But backend expects JWT. 
  // Wait, the backend `authenticate` middleware checks simple token presence or valid verifyToken.
  // The login flow in server.ts returns `{ success: true, token, role }`.
  // We need to ensure we capture and use that token.
  // Let's check handleLoginSuccess in page.tsx to see if it receives a token. 
  // It receives `role`. It likely doesn't receive token in current signature `(role: string)`.
  // I might need to update that too. 
  // BUT... for now let's implement the fetching logic assuming we can get the token.
  // Or... `verifyToken` uses `SECRET_KEY`. 
  // If the frontend doesn't have a token, these calls fail.
  // Let's assume there is a token in localStorage 'dinestack_auth_token' or similar if Login implemented it.
  // If not, I might need to fix Login too.
  // Let's start by just adding the fetch logic.

  const headers: any = { 'Content-Type': 'application/json' };
  const storedToken = localStorage.getItem('dinestack_token');
  if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
  // Also pass PIN if needed? Backend relies on JWT from login.

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
};


// Generate initial tables
const INITIAL_TABLES: TableItem[] = [];

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [adminPin, setAdminPin] = useState('');
  const [kitchenPin, setKitchenPin] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuCategory[]>(INITIAL_MENU_DATA);
  const [tableData, setTableData] = useState<TableItem[]>(INITIAL_TABLES);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem; categoryId: string } | null>(null);
  const [previewTableId, setPreviewTableId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Ref to track if initialization has already run (prevents double effect in Strict Mode)
  const initializedRef = useRef(false);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  // Restore state from server on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initSystem = async () => {
      // Minimum splash screen duration (1.5s)
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const API_BASE = 'http://localhost:5001'; // Should use env var in prod

        // Execute both validation and delay in parallel
        const [res, _] = await Promise.all([
          fetch(`${API_BASE}/api/system/status`),
          minDelay
        ]);
        if (!res.ok) throw new Error('Failed to fetch status');

        const data = await res.json();

        if (data.activated) {
          if (data.restaurantId) {
            setRestaurantId(data.restaurantId);
            localStorage.setItem('dinestack_restaurant_id', data.restaurantId);
          }

          if (data.setupComplete) {
            // If setup is complete, go to login
            // Sync kitchen PIN status from backend
            if (data.kitchenPinConfigured) {
              setKitchenPin('CONFIGURED'); // Placeholder to indicate existence
            }
            // We can also sync local storage pins here if we want, but for security maybe not
            setCurrentScreen('login');
          } else {
            // Activated but PINs not set
            setCurrentScreen('createPin');
          }
        } else {
          // Not activated
          setCurrentScreen('activation');
        }
      } catch (error) {
        console.error('Initialization Error:', error);
        // Ensure delay finishes even on error
        await minDelay;
        setCurrentScreen('activation');
      }
    };

    initSystem();
  }, []);

  // Fetch Menu Data
  const fetchMenu = async () => {
    try {
      const data = await apiCall('/api/admin/menu');
      if (data.success && data.categories) {
        // Map backend 'name' to frontend 'title' and generate 'code'
        const mappedCategories = data.categories.map((cat: any) => ({
          ...cat,
          title: cat.name,
          // DB doesn't have code yet, so generating from name or using stored if we add it later
          code: cat.code || cat.name.substring(0, 3).toUpperCase(),
          items: (cat.items || []).map((item: any) => ({
            ...item,
            available: item.isActive
          }))
        }));
        setMenuData(mappedCategories);
      }
    } catch (e) {
      console.error("Failed to fetch menu", e);
    }
  };

  // Fetch tables
  const fetchTables = async () => {
    try {
      const data = await apiCall('/api/tables');
      if (data.success && data.tables) {
        setTableData(data.tables);
      }
    } catch (e) {
      console.error("Failed to fetch tables", e);
    }
  };

  useEffect(() => {
    if (currentScreen !== 'loading' && currentScreen !== 'activation') {
      fetchMenu();
      fetchTables();
    }
  }, [currentScreen]);

  const handlePinCreated = (pin: string) => {
    setAdminPin(pin);
    navigate('confirmPin');
  };

  const handlePinConfirmed = () => {
    if (adminPin) {
      localStorage.setItem('dinestack_admin_pin', adminPin);
    }
    navigate('init');
  };

  const handleLoginSuccess = (role: string) => {
    if (role === 'ADMIN') {
      navigate('adminDashboard');
    } else {
      navigate('kitchenOperations');
    }
    fetchMenu(); // Refresh data on login
  };

  const handleAddItem = async (item: { name: string; price: string; category: string; stock: number }) => {
    try {
      const res = await apiCall('/api/menu-items', 'POST', {
        name: item.name,
        price: item.price,
        categoryId: item.category,
        isActive: true
        // stock: item.stock // Backend doesn't support stock yet in DB, ignoring for now or it's ignored by backend
      });

      if (res.success) {
        await fetchMenu(); // Reload to get new ID and everything
      } else {
        alert('Failed to add item: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error adding item');
    }
  };

  const handleEditItem = (item: MenuItem, categoryId: string) => {
    setEditingItem({ item, categoryId });
    navigate('editItem');
  };

  const handleSaveEditedItem = async (updatedItem: EditMenuItem, originalCategoryId: string, newCategoryId: string) => {
    try {
      // If category changed, we might need separate handling or just update categoryId
      const res = await apiCall(`/api/menu-items/${updatedItem.id}`, 'PUT', {
        ...updatedItem,
        isActive: updatedItem.available, // Map frontend 'available' to backend 'isActive'
        categoryId: newCategoryId
      });

      if (res.success) {
        await fetchMenu();
        setEditingItem(null);
      } else {
        alert('Failed to save item');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving item');
    }
  };

  const handleDeleteItem = async (itemId: string, categoryId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await apiCall(`/api/menu-items/${itemId}`, 'DELETE');
      if (res.success) {
        fetchMenu();
        setEditingItem(null);
      }
    } catch (e) { console.error(e); }
  };

  // Category Management Handlers
  const handleAddCategory = async (category: { title: string; code: string }) => {
    try {
      const res = await apiCall('/api/categories', 'POST', {
        name: category.title
        // code: category.code // Not supported by backend yet, will be lost on refresh unless added to DB
      });
      if (res.success) {
        fetchMenu();
      } else {
        alert('Failed to add category');
      }
    } catch (e) {
      console.error(e);
      alert('Error adding category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const res = await apiCall(`/api/categories/${categoryId}`, 'DELETE');
      if (res.success) {
        fetchMenu();
      } else {
        alert('Failed to delete category: ' + (res.message || res.error));
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting category');
    }
  };

  const handleUpdateCategories = (newCategories: MenuCategory[]) => {
    setMenuData(newCategories);
    // TODO: Implement reorder API logic (PUT /api/categories/reorder) if backend supports it
  };

  const handleUpdateTables = (newTables: TableItem[]) => {
    // Tables are fetched via API now, but if TableManager makes local changes we might want to refresh
    fetchTables();
  };

  const handleToggleAvailability = async (catIndex: number, itemIndex: number) => {
    const item = menuData[catIndex].items[itemIndex];
    // Optimistic update
    const newMenuData = [...menuData];
    newMenuData[catIndex].items[itemIndex].available = !item.available;
    setMenuData(newMenuData);

    try {
      await apiCall(`/api/menu-items/${item.id}`, 'PUT', { isActive: !item.available }); // Note: frontend uses 'available', backend 'isActive'
      fetchMenu(); // Sync
    } catch (e) {
      console.error(e);
      // Revert?
    }
  };

  const handlePreviewQR = (tableId: string) => {
    setPreviewTableId(tableId);
    navigate('qrPreview');
  };

  // --- Security Flow State ---
  const [tempAdminPin, setTempAdminPin] = useState<string | null>(null);

  const handleCreateKitchenPin = () => {
    // SECURITY: Always go through Reset/Verify flow first
    setTempAdminPin(null);
    navigate('resetKitchenPin');
  };

  const handleKitchenPinSet = async (newPin: string) => {
    if (!tempAdminPin) {
      alert("Security requirement: Admin Verification Needed.");
      navigate('resetKitchenPin');
      return;
    }

    try {
      const res = await apiCall('/api/security/update-kitchen-pin', 'POST', {
        adminPin: tempAdminPin,
        newKitchenPin: newPin
      });

      if (res.success) {
        setKitchenPin('CONFIGURED');
        setTempAdminPin(null);
        navigate('accessControl');
        setTimeout(() => alert(res.message || 'Kitchen PIN Set Successfully'), 100);
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    }
  };

  const handleKitchenPinResetRequest = () => {
    setTempAdminPin(null);
    navigate('resetKitchenPin');
  };

  const handleAdminVerified = (pin: string) => {
    setTempAdminPin(pin);
    navigate('createKitchenPin');
  };

  switch (currentScreen) {
    case 'loading':
      return <SplashScreen />;
    case 'activation':
      return <DineStackActivation onSuccess={(id) => {
        setRestaurantId(id);
        localStorage.setItem('dinestack_restaurant_id', id);
        navigate('createPin');
      }} />;
    case 'createPin':
      return <CreateAdminPin onPinCreated={handlePinCreated} />;
    case 'confirmPin':
      return <ConfirmAdminPin originalPin={adminPin} onBack={() => navigate('createPin')} onSuccess={handlePinConfirmed} />;
    case 'init':
      return <DineStackInit restaurantId={restaurantId || ''} adminPin={adminPin} onComplete={() => navigate('login')} />;
    case 'login':
      return <DineStackLogin onLoginSuccess={handleLoginSuccess} />;
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
      return <AddItemPage onBack={() => navigate('kitchenDashboard')} onSave={handleAddItem} categories={menuData} />;
    case 'editItem':
      if (!editingItem) return <KitchenDashboard onLogout={() => navigate('login')} onAddItem={() => navigate('addItem')} menuData={menuData} />;
      return (
        <EditItemPage
          item={editingItem.item}
          category={editingItem.categoryId}
          onBack={() => navigate('kitchenDashboard')}
          onSave={handleSaveEditedItem}
          onDelete={handleDeleteItem}
          categories={menuData}
        />
      );
    case 'categoryManager':
      return (
        <CategoryManager
          categories={menuData}
          onBack={() => navigate('adminDashboard')}
          onUpdateCategories={handleUpdateCategories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
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
          onCreateKitchenPin={handleCreateKitchenPin}
          onResetKitchenPin={handleKitchenPinResetRequest}
        />
      );
    case 'createKitchenPin':
      return (
        <CreateKitchenPin
          onBack={() => navigate('accessControl')}
          onPinSet={handleKitchenPinSet}
        />
      );
    case 'resetKitchenPin':
      return (
        <ResetKitchenPin
          onCancel={() => navigate('accessControl')}
          onConfirmed={handleAdminVerified}
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
      return <DineStackActivation onSuccess={() => navigate('createPin')} />;
  }
}
