// @ts-nocheck
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from './utils/auth';
import path from 'path';

const app = express();
// Hardcode path specifically for the desktop app's SQLite DB
// In production (Electron), this should point to userData or adjacent to binary
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "file:./dinestack.db"
        }
    }
});
const PORT = process.env.PORT || 5001;

// Cloud API URL for activation validation
const CLOUD_API_BASE = 'https://software.dinestack.in/api';

app.use(cors());
app.use(express.json());

// --- Root Route ---
app.get(['/', '/api'], (req, res) => {
    res.json({
        message: 'DineStack Desktop API is running',
        version: '1.0.0',
        mode: 'DESKTOP_SQLITE',
        endpoints: {
            health: '/health',
            tables: '/api/tables',
            orders: '/api/orders',
            status: '/api/system/status'
        }
    });
});

// --- Module 0: System Status ---
app.get('/api/system/status', async (req, res) => {
    try {
        // Find the single active restaurant for this installation
        const restaurant = await prisma.restaurant.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!restaurant) {
            return res.json({
                activated: false,
                setupComplete: false,
                message: 'System not activated'
            });
        }

        // Check if setup is complete (Admin PIN set)
        const setupComplete = !!restaurant.adminPin;

        res.json({
            activated: true,
            setupComplete,
            restaurantId: restaurant.id,
            status: restaurant.status,
            // Strict enforcement: if not ACTIVE, command frontend to force activation
            forceActivation: restaurant.status !== 'ACTIVE',
            resetReason: restaurant.status !== 'ACTIVE' ? `License is ${restaurant.status}` : null,
            message: 'System status retrieved'
        });
    } catch (error) {
        console.error('System Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Middleware ---
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        return;
    }

    try {
        // Global Restaurant Status Check
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: decoded.restaurantId }
        });

        if (!restaurant) {
            res.status(401).json({ error: 'Unauthorized: Restaurant not found' });
            return;
        }

        if (restaurant.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Access Denied: Restaurant is not active' });
            return;
        }

        (req as any).user = decoded;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const authorize = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }
        next();
    };
};

// --- Module 1: Activation (Hybrid Online/Offline) ---
app.post('/api/activate', async (req, res) => {
    const { activationCode } = req.body;

    if (!activationCode) {
        return res.status(400).json({ error: 'ACTIVATION_CODE_REQUIRED' });
    }

    try {
        console.log(`Checking activation code against cloud: ${activationCode}`);

        // 1. Validate code against Cloud API
        const cloudResponse = await fetch(`${CLOUD_API_BASE}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activationCode })
        });

        if (!cloudResponse.ok) {
            const error = await cloudResponse.json();
            console.error('Cloud validation failed:', error);
            return res.status(cloudResponse.status).json(error);
        }

        const cloudData = await cloudResponse.json();

        if (!cloudData.success) {
            return res.status(400).json({ error: cloudData.error || 'ACTIVATION_CODE_INVALID' });
        }

        const { name } = cloudData.restaurant;

        // 2. Local Activation: UPSERT Logic
        // We do NOT want to create a new restaurant if one exists (e.g. re-activation or recovery)

        const existingRestaurant = await prisma.restaurant.findFirst();

        let restaurant;

        if (existingRestaurant) {
            console.log(`Updating existing local restaurant: ${existingRestaurant.id}`);
            restaurant = await prisma.restaurant.update({
                where: { id: existingRestaurant.id },
                data: {
                    name: name, // Sync name from Cloud
                    status: 'ACTIVE',
                    isActive: true,
                    activationCode: activationCode
                }
            });
        } else {
            console.log('Creating new local restaurant');
            restaurant = await prisma.restaurant.create({
                data: {
                    name: name || 'DineStack Restaurant',
                    status: 'ACTIVE',
                    isActive: true,
                    activationCode: activationCode,
                }
            });
        }

        console.log(`Local restaurant activated: ${restaurant.id}`);

        return res.json({
            success: true,
            isActivated: true,
            restaurantId: restaurant.id,
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                status: restaurant.status
            },
            // Determine registration status:
            // If we recovered a restaurant that already had a PIN, they are registered.
            // If it's new, they are not.
            isRegistered: !!restaurant.adminPin
        });

    } catch (error) {
        console.error('Activation Error:', error);
        // Fallback or detailed error
        return res.status(500).json({ error: 'ACTIVATION_FAILED_NETWORK' });
    }
});

// --- Module 2 & 3: PIN Registration (First-Time Setup) ---
app.post('/api/setup-pin', async (req, res) => {
    const { restaurantId, adminPin, kitchenPin } = req.body;

    if (!adminPin || adminPin.length < 6) {
        res.status(400).json({ error: 'Admin PIN must be at least 6 digits' });
        return;
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant || !restaurant.isActive) {
            res.status(400).json({ error: 'Restaurant not active' });
            return;
        }

        const pinHash = await bcrypt.hash(adminPin, 10);
        const kitchenPinHash = kitchenPin ? await bcrypt.hash(kitchenPin, 10) : null;

        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                adminPin: pinHash,     // Storing hash in the adminPin column
                kitchenPin: kitchenPinHash
                // isRegistered is implied by adminPin existence
            }
        });

        console.log(`🔐 System PINs Set for: ${restaurant.id}`);
        res.json({ success: true, token: 'valid-session' });
    } catch (error) {
        console.error('Setup PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 4 & 6: Authentication (Single PIN Access & Device JWT) ---
app.post('/api/auth/login', async (req, res) => {
    const { pin, deviceId, role } = req.body;

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });

        const isRegistered = !!restaurant?.adminPin;

        if (!restaurant || !isRegistered) {
            res.status(400).json({ error: 'System not activated or fully setup' });
            return
        }

        if (restaurant.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Access Denied: System is disabled' });
            return;
        }

        const isKitchen = role === 'KITCHEN';
        const targetHash = isKitchen ? restaurant.kitchenPin : restaurant.adminPin;

        if (!targetHash) {
            res.status(400).json({ error: `${role} access not configured` });
            return;
        }

        const isValid = await bcrypt.compare(pin, targetHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return;
        }

        if (deviceId && role) {
            await prisma.device.upsert({
                where: { deviceId },
                update: { lastUsed: new Date(), role },
                create: { deviceId, role, restaurantId: restaurant.id }
            });

            const token = generateToken({ deviceId, role, restaurantId: restaurant.id });
            res.json({ success: true, token, role });
            return;
        }

        res.status(400).json({ error: 'Missing device info or role for registration' });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 5 & 7: Table Management ---
app.post('/api/tables', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { label, capacity } = req.body;

    if (!label) {
        res.status(400).json({ error: 'Label is required' });
        return;
    }

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });
        if (!restaurant) {
            res.status(400).json({ error: 'Restaurant not initialized' });
            return;
        }

        const table = await prisma.table.create({
            data: {
                label,
                capacity: capacity || 4,
                restaurantId: restaurant.id
            }
        });

        res.json({ success: true, table });
    } catch (error) {
        console.error('Create Table Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/tables', async (req, res) => {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { createdAt: 'asc' }
        });
        res.json({ success: true, tables });
    } catch (error) {
        console.error('Get Tables Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/tables/:id/status', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const table = await prisma.table.update({
            where: { id },
            data: { isActive }
        });
        res.json({ success: true, table });
    } catch (error) {
        console.error('Update Table Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/tables/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { label, capacity } = req.body;

    try {
        const table = await prisma.table.update({
            where: { id },
            data: {
                label,
                capacity: capacity ? parseInt(capacity) : undefined
            }
        });
        res.json({ success: true, table });
    } catch (error) {
        console.error('Update Table Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/tables/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;

    try {
        const orderCount = await prisma.order.count({
            where: { tableId: id }
        });

        if (orderCount > 0) {
            res.status(400).json({ error: 'Cannot delete table with historical orders' });
            return;
        }

        await prisma.table.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Table Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 8: QR Code Data Generation (Admin) ---
app.get('/api/tables/:id/qr-data', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;

    try {
        const table = await prisma.table.findUnique({
            where: { id },
            include: { restaurant: true }
        });

        if (!table) {
            res.status(404).json({ error: 'Table not found' });
            return;
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const qrUrl = `${baseUrl}/order?r=${table.restaurantId}&t=${table.id}`;

        res.json({ success: true, qrUrl });
    } catch (error) {
        console.error('QR Data Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 9: Kitchen Order Feed ---
app.get('/api/kitchen/orders', authenticate, authorize(['KITCHEN', 'ADMIN']), async (req, res) => {
    try {
        const activeOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['RECEIVED', 'PREPARING', 'READY', 'SERVED']
                }
            },
            include: {
                items: {
                    include: { menuItem: true }
                },
                table: true
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ success: true, orders: activeOrders });
    } catch (error) {
        console.error('Kitchen Feed Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 10: Update Order Status (Kitchen) ---
const VALID_TRANSITIONS: Record<string, string[]> = {
    'RECEIVED': ['PREPARING', 'CANCELLED'],
    'PREPARING': ['READY', 'CANCELLED'],
    'READY': ['SERVED', 'CANCELLED'],
    'SERVED': ['COMPLETED']
};

app.patch('/api/orders/:id/status', authenticate, authorize(['KITCHEN', 'ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
        if (!allowedNextStatuses.includes(status)) {
            res.status(400).json({
                error: `Invalid transition from ${order.status} to ${status}. Allowed: ${allowedNextStatuses.join(', ')}`
            });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 11: Menu Management (Admin) ---
app.get('/api/menu', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            include: {
                items: {
                    where: { isActive: true }
                }
            }
        });
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Get Menu Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/categories', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { name } = req.body;
    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });
        const category = await prisma.category.create({
            data: { name, restaurantId: restaurant?.id! }
        });
        res.json({ success: true, category });
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/menu-items', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { name, description, price, categoryId, image } = req.body;
    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });
        const item = await prisma.menuItem.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId,
                image,
                restaurantId: restaurant?.id!
            }
        });
        res.json({ success: true, item });
    } catch (error) {
        console.error('Create Menu Item Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 12: Dashboard & Analytics (Admin) ---
app.get('/api/admin/stats', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const activeOrdersCount = await prisma.order.count({
            where: {
                status: { in: ['RECEIVED', 'PREPARING', 'READY', 'SERVED'] }
            }
        });
        const completedOrdersCount = await prisma.order.count({
            where: { status: 'COMPLETED' }
        });
        const totalTables = await prisma.table.count();
        const activeTables = await prisma.table.count({ where: { isActive: true } });

        const utilization = totalTables > 0 ? (activeTables / totalTables) * 100 : 0;

        res.json({
            success: true,
            stats: {
                activeOrders: activeOrdersCount,
                completedOrders: completedOrdersCount,
                tableUtilization: `${utilization.toFixed(1)}%`
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 13: Customer QR Session & Ordering ---
app.post('/api/customer/session/init', async (req, res) => {
    const { restaurantId, tableId } = req.body;

    if (!restaurantId || !tableId) {
        res.status(400).json({ error: 'Restaurant and Table identifiers are required' });
        return;
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant || !restaurant.isActive) {
            res.status(400).json({ error: 'Restaurant is not active or does not exist' });
            return;
        }

        if (restaurant.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table || !table.isActive || table.restaurantId !== restaurantId) {
            res.status(400).json({ error: 'Table is not available or does not belong to this restaurant' });
            return;
        }

        const token = generateToken({
            role: 'CUSTOMER',
            restaurantId,
            tableId
        });

        await prisma.session.create({
            data: {
                token,
                tableId,
                restaurantId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });

        res.json({ success: true, token, restaurantName: restaurant.name });
    } catch (error) {
        console.error('Session Init Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/customer/menu/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const categories = await prisma.category.findMany({
            where: { restaurantId, isActive: true },
            include: {
                items: { where: { isActive: true } }
            }
        });

        res.json({ success: true, categories });
    } catch (error) {
        console.error('Customer Menu Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/customer/order', async (req, res) => {
    const { restaurantId, tableId, items } = req.body; // items: [{menuItemId, quantity, notes}]

    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'No items in order' });
        return;
    }

    try {
        // Calculate total amount
        let totalAmount = 0;
        const validItems = [];

        for (const item of items) {
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId }
            });
            if (menuItem) {
                totalAmount += menuItem.price * item.quantity;
                validItems.push({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    notes: item.notes
                });
            }
        }

        const order = await prisma.order.create({
            data: {
                restaurantId,
                tableId,
                totalAmount,
                status: 'RECEIVED',
                items: {
                    create: validItems
                }
            },
            include: { items: true }
        });

        res.json({ success: true, orderId: order.id, message: 'Order placed successfully' });
    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Background Service: License Validation ---
const validateLicense = async () => {
    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!restaurant || !restaurant.activationCode) return;

        console.log(`🔍 Validating license against cloud: ${restaurant.activationCode}`);

        const response = await fetch(`${CLOUD_API_BASE}/validate-license`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activationCode: restaurant.activationCode,
                restaurantId: restaurant.id
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status && data.status !== restaurant.status) {
                console.log(`⚠️ Updating local status from ${restaurant.status} to ${data.status}`);
                await prisma.restaurant.update({
                    where: { id: restaurant.id },
                    data: { status: data.status }
                });
            }
        } else {
            // Optional: Handle network failure logic (grace period?)
            // For STRICT mode, we might warn, but usually we don't revoke on simple network fail 
            // unless it persists for X days. keeping simple for now.
            console.warn('License validation network check failed');
        }
    } catch (error) {
        console.warn('License validation skipped (offline/error)', error);
    }
};

const startLicenseValidationService = () => {
    // Run immediately on start
    validateLicense();
    // Then run every 5 minutes
    setInterval(validateLicense, 5 * 60 * 1000);
    console.log('🛡️ License Validation Service Started (Polling every 5m)');
};

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`DineStack Desktop API Server running on port ${PORT} (SQLite Mode)`);
    startLicenseValidationService();
});

export default app;

