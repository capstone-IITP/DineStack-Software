// @ts-nocheck
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from './utils/auth';
import path from 'path';

const app = express();
console.log(`Initializing Prisma in Direct Cloud Mode`);

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// --- Rate Limiting Logic ---
const FAILED_ATTEMPTS = new Map<string, { count: number, lockedUntil: Date | null }>();

function checkRateLimit(id: string): { locked: boolean, waitTime?: number } {
    const record = FAILED_ATTEMPTS.get(id);
    if (!record) return { locked: false };

    if (record.lockedUntil && record.lockedUntil > new Date()) {
        const waitTime = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000 / 60);
        return { locked: true, waitTime };
    }

    if (record.lockedUntil && record.lockedUntil <= new Date()) {
        FAILED_ATTEMPTS.delete(id);
        return { locked: false };
    }

    return { locked: false };
}

function registerFailure(id: string) {
    const record = FAILED_ATTEMPTS.get(id) || { count: 0, lockedUntil: null };
    record.count += 1;

    if (record.count >= 10) {
        record.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    } else if (record.count >= 3) {
        record.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    }

    FAILED_ATTEMPTS.set(id, record);
}

function registerSuccess(id: string) {
    FAILED_ATTEMPTS.delete(id);
}

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
// Direct Cloud DB access implies we just check the DB. No local caching needed for "sync" in this mode.

app.get('/api/system/status', async (req, res) => {
    try {
        // In Direct Cloud Mode, we check if there is an active restaurant linked to this "Context"
        // But since this is a generic backend endpoint, it might be ambiguous WHICH restaurant if multiple exist in DB.
        // However, usually Desktop App is single-tenant perception.
        // Priority: 1. Find ACTIVE restaurant, 2. Fall back to newest

        let restaurant = await prisma.restaurant.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            include: { activationCode: true }
        });

        // Fallback to newest if no ACTIVE restaurant
        if (!restaurant) {
            restaurant = await prisma.restaurant.findFirst({
                orderBy: { createdAt: 'desc' },
                include: { activationCode: true }
            });
        }

        if (restaurant) {
            console.log(`[SystemStatus] Found Restaurant: ${restaurant.id}, Status: ${restaurant.status}, AdminPIN: ${restaurant.adminPin ? 'SET' : 'NULL'}`);

            // If the restaurant is revoked, we effectively treat it as a fresh state for the "System Status" check
            // so the frontend goes to the Activation screen.
            const isRevoked = restaurant.status === 'REVOKED';

            if (!isRevoked) {
                return res.json({
                    activated: true,
                    setupComplete: !!restaurant.adminPin,
                    kitchenPinConfigured: !!restaurant.kitchenPin,
                    restaurantId: restaurant.id,
                    status: restaurant.status,
                    forceActivation: restaurant.status !== 'ACTIVE',
                    resetReason: restaurant.status !== 'ACTIVE' ? `License is ${restaurant.status}` : null,
                    message: 'System status retrieved (Cloud Direct)'
                });
            }
        }

        return res.json({
            activated: false,
            setupComplete: false,
            message: 'System not activated'
        });

    } catch (error) {
        console.error('System Status Check Failed:', error);
        res.status(500).json({ error: 'System Error' });
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

// --- Module 1: Activation (SaaS-Style Self-Validating) ---
app.post('/api/activate', async (req, res) => {
    const { activationCode } = req.body;

    if (!activationCode) {
        return res.status(400).json({ error: 'ACTIVATION_CODE_REQUIRED' });
    }

    try {
        console.log(`[SaaS Activation] Validating code: ${activationCode}`);

        // Step 1: Find activation code in cloud database
        const codeRecord = await prisma.activationCode.findUnique({
            where: { code: activationCode },
            include: { restaurant: true }
        });

        // Validation: Code must exist
        if (!codeRecord) {
            console.log(`[SaaS Activation] Code not found: ${activationCode}`);
            return res.status(400).json({ error: 'INVALID_CODE' });
        }

        // Validation: Check if revoked/invalidated
        if (codeRecord.status === 'INVALIDATED' || codeRecord.status === 'REVOKED') {
            console.log(`[SaaS Activation] Code revoked: ${activationCode}`);
            return res.status(400).json({ error: 'LICENSE_REVOKED' });
        }

        // Validation: Check expiration
        if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
            console.log(`[SaaS Activation] Code expired: ${activationCode}`);
            return res.status(400).json({ error: 'LICENSE_EXPIRED' });
        }

        // Get or create the restaurant (SaaS-style: auto-provision on first activation)
        let restaurant = codeRecord.restaurant;

        if (!restaurant) {
            // First-time activation: Create restaurant from activation code details
            console.log(`[SaaS Activation] First activation - creating restaurant: ${codeRecord.entityName}`);

            restaurant = await prisma.restaurant.create({
                data: {
                    name: codeRecord.entityName || 'My Restaurant',
                    status: 'ACTIVE',
                    isActive: true,
                    subscriptionEndsAt: codeRecord.expiresAt,
                    activationCodeId: codeRecord.id
                }
            });

            console.log(`[SaaS Activation] Created restaurant: ${restaurant.id} (${restaurant.name})`);
        } else {
            console.log(`[SaaS Activation] Existing restaurant: ${restaurant.id} (${restaurant.name})`);

            // Check restaurant status
            if (restaurant.status === 'REVOKED') {
                return res.status(400).json({ error: 'LICENSE_REVOKED' });
            }
            if (restaurant.status === 'SUSPENDED') {
                return res.status(400).json({ error: 'LICENSE_SUSPENDED' });
            }
        }

        // Mark code as used (only if not already used)
        if (!codeRecord.isUsed) {
            await prisma.activationCode.update({
                where: { id: codeRecord.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    status: 'USED'
                }
            });
        }

        console.log(`[SaaS Activation] ✅ Success - Restaurant: ${restaurant.name}`);

        // Return success with restaurant details
        return res.json({
            success: true,
            isActivated: true,
            restaurantId: restaurant.id,
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                status: restaurant.status,
                tier: codeRecord.plan || 'BASIC'
            },
            isRegistered: !!restaurant.adminPin,
            tier: codeRecord.plan || 'BASIC'
        });

    } catch (error: any) {
        console.error('[SaaS Activation] Error:', error);
        // Return detailed error for debugging
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.code || 'UNKNOWN';
        console.error(`[SaaS Activation] Details: ${errorCode} - ${errorMessage}`);
        return res.status(500).json({
            error: 'ACTIVATION_FAILED',
            details: errorMessage // Desktop app can show details
        });
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

// --- Module: Security Verification (Admin PIN) ---
app.post('/api/security/verify-admin-pin', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { adminPin } = req.body;
    const { restaurantId, deviceId } = (req as any).user;
    const userIdentifier = restaurantId;

    if (!adminPin) {
        return res.status(400).json({ error: 'Admin PIN is required' });
    }

    // 1. Check Rate Limit
    const { locked, waitTime } = checkRateLimit(userIdentifier);
    if (locked) {
        return res.status(429).json({
            error: `Too many failed attempts. Try again in ${waitTime} minutes.`
        });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant || !restaurant.adminPin) {
            return res.status(400).json({ error: 'System not configured' });
        }

        const isValid = await bcrypt.compare(adminPin, restaurant.adminPin);

        if (!isValid) {
            registerFailure(userIdentifier);
            // Log Attempt
            return res.status(401).json({ error: 'Invalid Admin PIN' });
        }

        registerSuccess(userIdentifier);
        res.json({ success: true, verified: true });

    } catch (error) {
        console.error('Verify Admin PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module: Secure Kitchen PIN Update ---
app.post('/api/security/update-kitchen-pin', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { adminPin, newKitchenPin } = req.body;
    const { restaurantId, deviceId } = (req as any).user;
    const userIdentifier = restaurantId;

    if (!adminPin || !newKitchenPin || newKitchenPin.length < 4) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    // 1. Check Rate Limit
    const { locked, waitTime } = checkRateLimit(userIdentifier);
    if (locked) {
        return res.status(429).json({
            error: `Too many failed attempts. Try again in ${waitTime} minutes.`
        });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant || !restaurant.adminPin) {
            return res.status(400).json({ error: 'Restaurant not found' });
        }

        // 2. Verify Admin PIN (Double Check)
        const isValid = await bcrypt.compare(adminPin, restaurant.adminPin);
        if (!isValid) {
            registerFailure(userIdentifier);

            // Log Failure
            await prisma.auditLog.create({
                data: {
                    action: 'KITCHEN_PIN_RESET_FAILED',
                    user: deviceId || 'admin',
                    target: 'kitchen',
                    details: JSON.stringify({ reason: 'Invalid Admin PIN' })
                }
            });

            return res.status(401).json({ error: 'Invalid Admin PIN' });
        }

        // 3. Update Kitchen PIN
        const kitchenPinHash = await bcrypt.hash(newKitchenPin, 10);
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { kitchenPin: kitchenPinHash }
        });

        registerSuccess(userIdentifier);

        // 4. Audit Log Success
        await prisma.auditLog.create({
            data: {
                action: 'KITCHEN_PIN_RESET',
                user: deviceId || 'admin',
                target: 'kitchen',
                details: JSON.stringify({ success: true, timestamp: new Date() })
            }
        });

        res.json({ success: true, message: 'Kitchen PIN updated successfully' });

    } catch (error) {
        console.error('Secure Update Kitchen PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module: Revoke Activation (Destructive) ---
app.post('/api/security/revoke-activation', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { adminPin } = req.body;
    const { restaurantId, deviceId } = (req as any).user;
    const userIdentifier = restaurantId;

    if (!adminPin) {
        return res.status(400).json({ error: 'Admin PIN is required' });
    }

    // 1. Check Rate Limit
    const { locked, waitTime } = checkRateLimit(userIdentifier);
    if (locked) {
        return res.status(429).json({
            error: `Too many failed attempts. Try again in ${waitTime} minutes.`
        });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant || !restaurant.adminPin) {
            return res.status(400).json({ error: 'Restaurant not found or not configured' });
        }

        // 2. Verify Admin PIN
        const isValid = await bcrypt.compare(adminPin, restaurant.adminPin);

        if (!isValid) {
            registerFailure(userIdentifier);
            await prisma.auditLog.create({
                data: {
                    action: 'REVOKE_ACTIVATION_FAILED',
                    user: deviceId || 'admin',
                    target: 'system',
                    details: JSON.stringify({ reason: 'Invalid Admin PIN' })
                }
            });
            return res.status(401).json({ error: 'Invalid Admin PIN' });
        }

        registerSuccess(userIdentifier);
        console.log(`⚠️ REVOKING ACTIVATION for Restaurant: ${restaurant.id} (${restaurant.name})`);

        // 3. Perform Cascading Deletion / Reset
        await prisma.$transaction(async (tx) => {
            // Perform global cleanup for this desktop instance
            // 1. Delete all dependencies for ALL restaurants (Clean Slate)
            await tx.orderItem.deleteMany({});
            await tx.order.deleteMany({});
            await tx.menuItem.deleteMany({});
            await tx.category.deleteMany({});
            await tx.session.deleteMany({});
            await tx.table.deleteMany({});
            await tx.device.deleteMany({});

            // 2. Revoke ALL Restaurant records to ensure no 'Ghost' active records remain
            await tx.restaurant.updateMany({
                data: {
                    status: 'REVOKED',
                    adminPin: null,
                    kitchenPin: null,
                    isActive: false
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'REVOKE_ACTIVATION_SUCCESS_GLOBAL',
                    user: deviceId || 'admin',
                    target: 'system',
                    details: JSON.stringify({ timestamp: new Date(), note: 'Global Reset' })
                }
            });
        });

        console.log(`✅ Activation Revoked Successfully`);
        res.json({ success: true, message: 'Activation revoked and data cleared.' });

    } catch (error) {
        console.error('Revoke Activation Error:', error);
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
            // FIX 4: Log device for analytics but don't enforce uniqueness
            // Simply create a new device record each time (or update if exists)
            try {
                await prisma.device.create({
                    data: { deviceId, role, restaurantId: restaurant.id }
                });
            } catch (e) {
                // Device already exists, update lastUsed
                await prisma.device.updateMany({
                    where: { deviceId, restaurantId: restaurant.id },
                    data: { lastUsed: new Date(), role }
                });
            }

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

app.delete('/api/menu-items/:id', authenticate, authorize(['ADMIN', 'KITCHEN']), async (req, res) => {
    const { id } = req.params;

    try {
        // Check if there are any active orders containing this menu item
        const orderItemCount = await prisma.orderItem.count({
            where: { menuItemId: id }
        });

        if (orderItemCount > 0) {
            // Soft delete if items exist in orders
            await prisma.menuItem.update({
                where: { id },
                data: { isActive: false }
            });
            return res.json({ success: true, message: 'Menu item archived (contained in orders)' });
        }

        // Hard delete if not in any orders
        await prisma.menuItem.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Menu Item Error:', error);
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
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Get Menu Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Menu Fetch (Includes inactive/off items)
app.get('/api/admin/menu', authenticate, authorize(['ADMIN', 'KITCHEN']), async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            include: {
                items: {
                    // Show ALL items, even inactive ones so they can be managed/toggled back on
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Get Admin Menu Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/categories/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    try {
        // Check for items in this category
        const itemCount = await prisma.menuItem.count({
            where: { categoryId: id, isActive: true }
        });

        if (itemCount > 0) {
            // Soft delete if items exist
            await prisma.category.update({
                where: { id },
                data: { isActive: false }
            });
            return res.json({ success: true, message: 'Category archived (contained items)' });
        }

        // Hard delete if empty
        await prisma.category.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/menu-items/:id', authenticate, authorize(['ADMIN', 'KITCHEN']), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, categoryId, image, isActive } = req.body;

    try {
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = parseFloat(price);
        if (categoryId !== undefined) data.categoryId = categoryId;
        if (image !== undefined) data.image = image;
        if (isActive !== undefined) {
            if (typeof isActive === 'boolean') {
                data.isActive = isActive;
            } else if (typeof isActive === 'string') {
                data.isActive = isActive.toLowerCase() === 'true';
            }
        }

        const item = await prisma.menuItem.update({
            where: { id },
            data
        });
        res.json({ success: true, item });
    } catch (error) {
        console.error('Update Menu Item Error:', error);
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

// --- Module X: Restaurant Settings ---
app.put('/api/restaurant/settings', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const { name, address, city, phone, email } = req.body;
    const user = (req as any).user;

    try {
        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: user.restaurantId },
            data: {
                name,
                address,
                city,
                phone,
                email
            }
        });

        res.json({
            success: true,
            restaurant: updatedRestaurant,
            message: 'Restaurant settings updated successfully'
        });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.get('/api/restaurant/settings', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'KITCHEN', 'WAITER']), async (req, res) => {
    const user = (req as any).user;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: user.restaurantId }
        });

        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        res.json({
            success: true,
            settings: {
                name: restaurant.name,
                address: restaurant.address,
                city: restaurant.city,
                phone: restaurant.phone,
                email: restaurant.email || restaurant.ownerEmail
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// --- Background Service Removed (Direct Cloud Access) ---

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`DineStack Desktop API Server running on port ${PORT} (SQLite Mode)`);
    // startLicenseValidationService();
    console.log('Direct Cloud Mode Enabled.');
});

export default app;

