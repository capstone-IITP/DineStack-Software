import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from './utils/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
// 11: Remove hardcoded code


app.use(cors());
app.use(express.json());

// --- Root Route ---
app.get(['/', '/api'], (req, res) => {
    res.json({
        message: 'DineStack API is running',
        version: '1.0.0',
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
        // We take the most recent one to be safe
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

        if ((restaurant as any).status !== 'ACTIVE') {
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

// --- Activation Status Constants (matching Admin Panel schema) ---
const ACTIVATION_STATUS = {
    ACTIVE: 'ACTIVE',       // Code is valid and can be used
    USED: 'USED',           // Code has been used to activate a restaurant
    INVALIDATED: 'INVALIDATED', // Code was revoked by admin
    EXPIRED: 'EXPIRED'      // Code has expired (time-based)
} as const;

// --- Single Source of Truth for Activation Code Eligibility ---
interface CodeEligibilityInput {
    status: string;
    isUsed: boolean;
    expiresAt: Date | null;
    usedAt: Date | null;
    hasRestaurant: boolean; // true if bound to a restaurant via relation
}

interface CodeEligibilityResult {
    eligible: boolean;
    reason: 'VALID' | 'USED' | 'REVOKED' | 'EXPIRED';
}

function getCodeEligibility(code: CodeEligibilityInput): CodeEligibilityResult {
    // Check revocation first (explicit admin action)
    if (code.status === ACTIVATION_STATUS.INVALIDATED) {
        return { eligible: false, reason: 'REVOKED' };
    }

    // Check expiration (time-based)
    if (code.expiresAt && code.expiresAt < new Date()) {
        return { eligible: false, reason: 'EXPIRED' };
    }

    // Check if already used (any of these indicate prior use)
    if (code.status === ACTIVATION_STATUS.USED || code.isUsed || code.usedAt || code.hasRestaurant) {
        return { eligible: false, reason: 'USED' };
    }

    // All checks passed - code is valid for activation
    return { eligible: true, reason: 'VALID' };
}

// --- Module 1: Activation (Atomic Transaction) ---
app.post('/api/activate', async (req, res) => {
    const { activationCode } = req.body;

    if (!activationCode) {
        return res.status(400).json({ error: 'ACTIVATION_CODE_REQUIRED' });
    }

    try {
        // 1∩╕ÅΓâú Find activation code with restaurant relation to check binding
        const codeEntry = await prisma.activationCode.findUnique({
            where: { code: activationCode },
            include: { restaurant: true }
        });

        if (!codeEntry) {
            return res.status(400).json({ error: 'ACTIVATION_CODE_INVALID' });
        }

        // 2∩╕ÅΓâú Use single source of truth for eligibility check
        const eligibility = getCodeEligibility({
            status: codeEntry.status,
            isUsed: codeEntry.isUsed,
            expiresAt: codeEntry.expiresAt,
            usedAt: codeEntry.usedAt,
            hasRestaurant: !!codeEntry.restaurant // Check if bound via relation
        });

        if (!eligibility.eligible) {
            // Update status to EXPIRED if it was detected as expired
            if (eligibility.reason === 'EXPIRED' && codeEntry.status !== ACTIVATION_STATUS.EXPIRED) {
                await prisma.activationCode.update({
                    where: { id: codeEntry.id },
                    data: { status: ACTIVATION_STATUS.EXPIRED }
                });
            }
            // Return specific error based on reason
            return res.status(400).json({ error: `ACTIVATION_CODE_${eligibility.reason}` });
        }

        // 3∩╕ÅΓâú Create restaurant and link to activation code via activationCodeId
        const restaurant = await prisma.restaurant.create({
            data: {
                name: codeEntry.entityName || 'DineStack Restaurant',
                status: 'ACTIVE',
                isActive: true,
                activationCodeId: codeEntry.id // Link to activation code
            }
        });

        // 4∩╕ÅΓâú Mark activation code as used
        await prisma.activationCode.update({
            where: { id: codeEntry.id },
            data: {
                status: ACTIVATION_STATUS.USED,
                usedAt: new Date(),
                isUsed: true
            }
        });

        return res.json({
            success: true,
            isActivated: true,
            restaurantId: restaurant.id,
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                status: restaurant.status
            },
            isRegistered: false // New restaurant, needs PIN setup
        });

    } catch (error) {
        console.error('Activation Error:', error);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
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

        await (prisma as any).restaurant.update({
            where: { id: restaurantId },
            data: {
                adminPin: pinHash,     // Storing hash in the adminPin column
                kitchenPin: kitchenPinHash
                // isRegistered is implied by adminPin existence
            }
        });

        console.log(`≡ƒöÉ System PINs Set for: ${restaurant.id}`);
        res.json({ success: true, token: 'valid-session' });
    } catch (error) {
        console.error('Setup PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Module 4 & 6: Authentication (Single PIN Access & Device JWT) ---
app.post('/api/auth/login', async (req, res) => {
    const { pin, deviceId, role } = req.body; // deviceId and role are optional for legacy or provided for new flow

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });

        // Check if restaurant exists and has adminPin (registered)
        const isRegistered = !!restaurant?.adminPin;

        if (!restaurant || !isRegistered) {
            res.status(400).json({ error: 'System not activated or fully setup' });
            return
        }

        // Check restaurant status - single source of truth
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

// --- Module: Activation Codes (Admin) ---

app.get('/api/admin/activation-codes', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const codes = await prisma.activationCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Add computed eligibility for each code (single source of truth)
        const codesWithEligibility = codes.map(code => {
            const eligibility = getCodeEligibility({
                status: code.status,
                isUsed: code.isUsed,
                expiresAt: code.expiresAt,
                usedAt: code.usedAt,
                hasRestaurant: !!code.restaurant
            });
            return {
                ...code,
                eligibility: eligibility.reason,
                canActivate: eligibility.eligible
            };
        });

        res.json({ success: true, codes: codesWithEligibility });
    } catch (error) {
        console.error('Get Activation Codes Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Force Reset Activation Code (Admin Only) ---
app.post('/api/admin/activation-codes/:id/force-reset', authenticate, authorize(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const user = (req as any).user;

    try {
        // Find the code with its linked restaurant
        const existingCode = await prisma.activationCode.findUnique({
            where: { id },
            include: { restaurant: true }
        });

        if (!existingCode) {
            res.status(404).json({ error: 'Activation code not found' });
            return;
        }

        // If there's a linked restaurant, break the link first
        if (existingCode.restaurant) {
            await prisma.restaurant.update({
                where: { id: existingCode.restaurant.id },
                data: { activationCodeId: null }
            });
        }

        // Reset the activation code to ACTIVE status
        const updatedCode = await prisma.activationCode.update({
            where: { id },
            data: {
                status: ACTIVATION_STATUS.ACTIVE, // Back to valid state
                usedAt: null,
                isUsed: false
            }
        });

        // Log the action for audit purposes
        await prisma.auditLog.create({
            data: {
                action: 'ACTIVATION_CODE_FORCE_RESET',
                user: user.deviceId || 'admin',
                target: existingCode.code,
                details: JSON.stringify({
                    codeId: id,
                    previousStatus: existingCode.status,
                    previousRestaurantId: existingCode.restaurant?.id,
                    previousRestaurantName: existingCode.restaurant?.name,
                    resetAt: new Date().toISOString()
                })
            }
        });

        console.log(`≡ƒöä Activation code ${existingCode.code} force-reset by ${user.deviceId || 'admin'}`);

        res.json({
            success: true,
            message: 'Activation code has been reset and is now available for use',
            code: {
                id: updatedCode.id,
                code: updatedCode.code,
                status: updatedCode.status,
                eligibility: 'VALID',
                canActivate: true
            }
        });
    } catch (error) {
        console.error('Force Reset Error:', error);
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
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });
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
        const restaurant = await prisma.restaurant.findFirst({
            where: { adminPin: { not: null } }
        });
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
        // Defensive: Check if models exist before querying
        let activeOrdersCount = 0;
        let completedOrdersCount = 0;
        let totalTables = 0;
        let activeTables = 0;

        // Try to count orders if the model exists
        if ((prisma as any).order) {
            try {
                activeOrdersCount = await (prisma as any).order.count({
                    where: {
                        status: { in: ['RECEIVED', 'PREPARING', 'READY', 'SERVED'] }
                    }
                });
                completedOrdersCount = await (prisma as any).order.count({
                    where: { status: 'COMPLETED' }
                });
            } catch { /* Model may not exist in DB */ }
        }

        // Try to count tables if the model exists
        if ((prisma as any).table) {
            try {
                totalTables = await (prisma as any).table.count();
                activeTables = await (prisma as any).table.count({ where: { isActive: true } });
            } catch { /* Model may not exist in DB */ }
        }

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

// --- Module 13: Customer QR Session & Ordering ---

// 1∩╕ÅΓâú QR Validation & Session Creation
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

        // STRICT CHECK: Restaurant Status must be ACTIVE
        if (restaurant.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        const table = await (prisma as any).table.findUnique({
            where: { id: tableId }
        });

        if (!table || !table.isActive || table.restaurantId !== restaurantId) {
            res.status(400).json({ error: 'Table is not available or does not belong to this restaurant' });
            return;
        }

        // Create a temporary session token
        const token = generateToken({
            role: 'CUSTOMER',
            restaurantId,
            tableId
        });

        // Optional: Persist session if needed (the schema has a Session model)
        await (prisma as any).session.create({
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

// 2∩╕ÅΓâú Fetch Menu for Customer
app.get('/api/customer/menu/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;

    try {
        // STRICT CHECK: Ensure restaurant is ACTIVE before returning menu
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant || (restaurant as any).status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        const categories = await (prisma as any).category.findMany({
            where: {
                restaurantId,
                isActive: true
            },
            include: {
                items: {
                    where: {
                        isActive: true,
                        isAvailable: true
                    }
                }
            }
        });

        res.json({ success: true, categories });
    } catch (error) {
        console.error('Customer Menu Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3∩╕ÅΓâú Create Order (Customer)
app.post('/api/customer/orders', authenticate, authorize(['CUSTOMER']), async (req, res) => {
    const { items, totalAmount, idempotencyKey } = req.body;
    const { restaurantId, tableId } = (req as any).user;

    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'No items provided' });
        return;
    }

    try {
        // STRICT CHECK: Validate Restaurant Status Live
        // We do this inside the try block to catch any DB errors
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant || (restaurant as any).status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        // Prevent duplicates - basic check if order with same idempotencyKey (id) exists
        // Since we don't have idempotencyKey in schema, we'll use order items + table check 
        // OR we can check for recent orders within 30 seconds for the same table.
        // Better: encourage client to send a unique ID and check if we can use it.

        // For now, let's use a simple recent order check to prevent double taps
        const recentOrder = await (prisma as any).order.findFirst({
            where: {
                tableId,
                createdAt: {
                    gt: new Date(Date.now() - 10 * 1000) // 10 seconds
                }
            }
        });

        if (recentOrder) {
            // Check if items are identical (simplified check)
            res.status(409).json({ error: 'Duplicate order detected. Please wait a moment.' });
            return;
        }

        // Generate a simple order number (since @autoincrement was removed)
        const lastOrder = await (prisma as any).order.findFirst({
            orderBy: { orderNumber: 'desc' }
        });
        const orderNumber = (lastOrder?.orderNumber || 0) + 1;

        const order = await (prisma as any).order.create({
            data: {
                orderNumber,
                restaurantId,
                tableId,
                totalAmount,
                status: 'RECEIVED',
                items: {
                    create: items.map((item: any) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: { items: true }
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4∩╕ÅΓâú Customer Order Status Tracking
app.get('/api/customer/orders/:orderId', authenticate, authorize(['CUSTOMER']), async (req, res) => {
    const { orderId } = req.params;
    const { tableId } = (req as any).user;

    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                tableId: true,
                createdAt: true
            }
        });

        if (!order || order.tableId !== tableId) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // STRICT CHECK: Validate Restaurant Status Live
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: (req as any).user.restaurantId } // Using session info
        });

        if (!restaurant || (restaurant as any).status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        // Map internal statuses to customer-friendly statuses if needed
        // For now, we return the internal status but filtered via 'select'
        res.json({ success: true, order });
    } catch (error) {
        console.error('Order Status Tracking Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5∩╕ÅΓâú Add More Items
app.post('/api/customer/orders/:orderId/add-items', authenticate, authorize(['CUSTOMER']), async (req, res) => {
    const { orderId } = req.params;
    const { items, additionalAmount } = req.body;
    const { tableId } = (req as any).user;

    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order || order.tableId !== tableId) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // STRICT CHECK: Validate Restaurant Status Live
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: (req as any).user.restaurantId }
        });

        if (!restaurant || (restaurant as any).status !== 'ACTIVE') {
            res.status(403).json({ error: 'Restaurant is currently unavailable' });
            return;
        }

        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
            res.status(400).json({ error: 'Cannot add items to a completed or cancelled order' });
            return;
        }

        // In a real app, we'd probably want to create a sub-order or just append items
        // Kitchen clarity is maintained by the OrderItem structure
        const updatedOrder = await (prisma as any).order.update({
            where: { id: orderId },
            data: {
                totalAmount: order.totalAmount + additionalAmount,
                items: {
                    create: items.map((item: any) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: { items: true }
        });

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Add Items Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- DEBUG: Toggle Status ---
app.get('/api/debug/restaurant-id', async (req, res) => {
    try {
        const r = await (prisma as any).restaurant.findFirst();
        res.json({ id: r?.id, status: r?.status });
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

// =============================================================================
// MODULE 14: System Status Check (App Boot)
// =============================================================================
app.get('/api/device/status', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const restaurant = await prisma.restaurant.findFirst({
            select: {
                id: true,
                name: true,
                isActive: true,
                status: true
            }
        });

        if (!restaurant) {
            res.json({
                isActivated: false,
                restaurantStatus: null,
                forceActivation: true,
                resetReason: 'NOT_FOUND'
            });
            return;
        }

        // STRICT CHECK: If client thinks it's Restaurant A, but we are Restaurant B, force reset.
        if (restaurantId && restaurantId !== restaurant.id) {
            res.json({
                isActivated: false,
                restaurantStatus: 'MISMATCH',
                forceActivation: true,
                resetReason: 'MISMATCH'
            });
            return;
        }

        const isRevoked = restaurant.status === 'REVOKED' || restaurant.status === 'SUSPENDED';
        const forceActivation = !restaurant.isActive || isRevoked;

        res.json({
            isActivated: restaurant.isActive,
            restaurantStatus: restaurant.status,
            forceActivation,
            resetReason: isRevoked ? restaurant.status : null
        });

    } catch (error) {
        console.error('System Status Check Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- Catch-All 404 Handler (Debug) ---
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        method: req.method,
        timestamp: new Date()
    });
});

// --- Export for Vercel Serverless ---
export default app;

// --- Start Server (only when not in Vercel) ---
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`≡ƒÜÇ Server running on http://localhost:${PORT}`);
    });
}
