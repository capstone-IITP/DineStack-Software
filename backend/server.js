"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
const VALID_CODE = process.env.VALID_ACTIVATION_CODE || 'TAP8-8842-SYSA-CT00'; // Default backup
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Middleware ---
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    // TODO: Implement real session/token verification
    // For now, we assume if you have a token 'valid-session', you are good.
    if (authHeader !== 'Bearer valid-session') {
        res.status(403).json({ error: 'Forbidden: Invalid token' });
        return;
    }
    next();
};
// --- Module 1: Activation ---
app.post('/api/activate', async (req, res) => {
    const { activationCode } = req.body;
    if (activationCode !== VALID_CODE) {
        res.status(400).json({ error: 'Invalid activation code' });
        return;
    }
    try {
        // Check if already activated
        const existing = await prisma.restaurant.findFirst();
        if (existing) {
            res.json({ success: true, restaurantId: existing.id, isRegistered: existing.isRegistered });
            return;
        }
        const restaurant = await prisma.restaurant.create({
            data: {
                name: 'DineStack Restaurant',
                isActivated: true,
                isRegistered: false, // Explicitly false
            }
        });
        console.log(`✅ Restaurant Activated: ${restaurant.id}`);
        res.json({ success: true, restaurantId: restaurant.id, isRegistered: false });
    }
    catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// --- Module 2 & 3: PIN Registration (First-Time Setup) ---
app.post('/api/setup-pin', async (req, res) => {
    const { restaurantId, pin } = req.body;
    if (!pin || pin.length < 4) {
        res.status(400).json({ error: 'PIN must be at least 4 digits' });
        return;
    }
    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.isRegistered) {
            res.status(400).json({ error: 'Restaurant already registered. Use login.' });
            return;
        }
        const pinHash = await bcryptjs_1.default.hash(pin, 10);
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                pinHash,
                isRegistered: true
            }
        });
        console.log(`🔐 Master PIN Set for: ${restaurant.id}`);
        res.json({ success: true, token: 'valid-session' }); // Auto-login on setup
    }
    catch (error) {
        console.error('Setup PIN Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// --- Module 4 & 6: Authentication (Single PIN Access) ---
app.post('/api/auth/login', async (req, res) => {
    const { pin } = req.body;
    try {
        // Find the single restaurant
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant || !restaurant.isRegistered || !restaurant.pinHash) {
            res.status(400).json({ error: 'System not setup' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(pin, restaurant.pinHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return;
        }
        res.json({ success: true, token: 'valid-session' });
    }
    catch (error) {
        console.error('Login Error:', error);
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
//# sourceMappingURL=server.js.map