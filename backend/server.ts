import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from './utils/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const VALID_CODE = 'TAP8-8842-SYSA-CT00'; // Hardcoded for now

app.use(cors());
app.use(express.json());

// --- Middleware ---
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    (req as any).user = decoded;
    next();
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

// --- Module 1: Activation ---
app.post('/api/activate', async (req, res) => {
    const { activationCode } = req.body;

    if (activationCode !== VALID_CODE) {
        res.status(400).json({ error: 'Invalid activation code' });
        return
    }

    try {
        // Check if already activated
        const existing = await prisma.restaurant.findFirst();
        if (existing) {
            res.json({ success: true, restaurantId: existing.id, isRegistered: existing.isRegistered });
            return
        }

        const restaurant = await prisma.restaurant.create({
            data: {
                name: 'TapTable Restaurant',
                isActivated: true,
                isRegistered: false, // Explicitly false
            }
        });

        console.log(`✅ Restaurant Activated: ${restaurant.id}`);
        res.json({ success: true, restaurantId: restaurant.id, isRegistered: false });
    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 2 & 3: PIN Registration (First-Time Setup) ---
app.post('/api/setup-pin', async (req, res) => {
    const { restaurantId, pin } = req.body;

    if (!pin || pin.length < 4) {
        res.status(400).json({ error: 'PIN must be at least 4 digits' });
        return
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return
        }

        if (restaurant.isRegistered) {
            res.status(400).json({ error: 'Restaurant already registered. Use login.' });
            return
        }

        const pinHash = await bcrypt.hash(pin, 10);

        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                pinHash,
                isRegistered: true
            }
        });

        console.log(`🔐 Master PIN Set for: ${restaurant.id}`);
        res.json({ success: true, token: 'valid-session' }); // Auto-login on setup
    } catch (error) {
        console.error('Setup PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 4 & 6: Authentication (Single PIN Access & Device JWT) ---
app.post('/api/auth/login', async (req, res) => {
    const { pin, deviceId, role } = req.body; // deviceId and role are optional for legacy or provided for new flow

    try {
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant || !restaurant.isRegistered || !restaurant.pinHash) {
            res.status(400).json({ error: 'System not setup' });
            return
        }

        const isValid = await bcrypt.compare(pin, restaurant.pinHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return
        }

        // If device info provided, register/update device and issue long-lived JWT
        if (deviceId && role) {
            await (prisma as any).device.upsert({
                where: { deviceId },
                update: { lastUsed: new Date(), role },
                create: { deviceId, role, restaurantId: restaurant.id }
            });

            const token = generateToken({ deviceId, role, restaurantId: restaurant.id });
            res.json({ success: true, token, role });
            return;
        }

        // Fallback for generic login (legacy)
        res.json({ success: true, token: 'valid-session' });
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
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            res.status(400).json({ error: 'Restaurant not initialized' });
            return;
        }

        const table = await (prisma as any).table.create({
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
        const tables = await (prisma as any).table.findMany({
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
        const table = await (prisma as any).table.update({
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
        const table = await (prisma as any).table.update({
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
        // Check for historical orders
        const orderCount = await (prisma as any).order.count({
            where: { tableId: id }
        });

        if (orderCount > 0) {
            res.status(400).json({ error: 'Cannot delete table with historical orders' });
            return;
        }

        await (prisma as any).table.delete({
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
        const table = await (prisma as any).table.findUnique({
            where: { id },
            include: { restaurant: true }
        });

        if (!table) {
            res.status(404).json({ error: 'Table not found' });
            return;
        }

        // Return a deterministic URL that encodes restaurant and table identifiers
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
        const activeOrders = await (prisma as any).order.findMany({
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
        const order = await (prisma as any).order.findUnique({ where: { id } });
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

        const updatedOrder = await (prisma as any).order.update({
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
        const categories = await (prisma as any).category.findMany({
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
        const restaurant = await prisma.restaurant.findFirst();
        const category = await (prisma as any).category.create({
            data: { name, restaurantId: restaurant?.id }
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
        const restaurant = await prisma.restaurant.findFirst();
        const item = await (prisma as any).menuItem.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId,
                image,
                restaurantId: restaurant?.id
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
        const activeOrdersCount = await (prisma as any).order.count({
            where: {
                status: { in: ['RECEIVED', 'PREPARING', 'READY', 'SERVED'] }
            }
        });

        const completedOrdersCount = await (prisma as any).order.count({
            where: { status: 'COMPLETED' }
        });

        const totalTables = await (prisma as any).table.count();
        const activeTables = await (prisma as any).table.count({ where: { isActive: true } });

        // Table utilization (very basic: active tables / total tables)
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

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Activation Endpoint: http://localhost:${PORT}/api/activate`);
});
