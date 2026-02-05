
import 'dotenv/config';
import process from 'process';

// Mock Vercel to avoid server auto-start inside the import if dynamic import is used
process.env.VERCEL = '1';

import http from 'http';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}`;
const prisma = new PrismaClient();

async function runTests() {
    console.log('🍔 Starting Menu Toggle Verification...');

    // Import app
    const { default: app } = await import('./server');
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on port ${PORT}`);

    // Create a dummy user/admin token if needed?
    //server.ts middleware: authenticate, authorize(['ADMIN', 'KITCHEN'])
    // I need a token.
    // I'll cheat and use the `generateToken` util if available or just mock the middleware if I could (hard in integration).
    // Better: Login as admin first?
    // Or just look at the code: `authenticate` verifies token.

    // Let's assume I can get a token or temporary disable auth for the test?
    // No, I should use valid auth.
    // server.ts exports `generateToken`? No it imports it.
    // I can stick a quick backdoor or just use the secret to sign one.

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({
        role: 'ADMIN',
        restaurantId: 'test-restaurant-id', // Need a real ID?
        // Middleware checks:
        // const restaurant = await prisma.restaurant.findUnique({ where: { id: decoded.restaurantId } });
        // if (!restaurant) ...
    }, secret);

    // I need a real restaurant in the DB.
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
        console.error('❌ No restaurant found in DB. Please create one first.');
        process.exit(1);
    }

    const validToken = jwt.sign({
        role: 'ADMIN',
        restaurantId: restaurant.id
    }, secret);

    try {
        // 1. Create Category
        console.log('\n[Step 1] Creating Test Category...');
        const catRes = await fetch(`${BASE_URL}/api/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({ name: 'Test Category ' + Date.now() })
        });
        const catData: any = await catRes.json();
        if (!catData.success) throw new Error('Failed to create category: ' + JSON.stringify(catData));
        const categoryId = catData.category.id;

        // 2. Create Item (Default Active?)
        console.log('\n[Step 2] Creating Menu Item...');
        const itemRes = await fetch(`${BASE_URL}/api/menu-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({
                name: 'Test Item',
                description: 'Tasty test',
                price: 100,
                categoryId: categoryId,
                image: 'test.png'
            })
        });
        const itemData: any = await itemRes.json();
        const itemId = itemData.item.id;
        console.log(`Item Created. isActive: ${itemData.item.isActive}`);

        if (itemData.item.isActive !== true) {
            console.error('❌ Default creation failed. Expected isActive=true');
        }

        // 3. Toggle OFF (Boolean)
        console.log('\n[Step 3] Toggling OFF (Boolean false)...');
        const offRes = await fetch(`${BASE_URL}/api/menu-items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({ isActive: false })
        });
        const offData: any = await offRes.json();
        console.log(`Status after FALSE update: ${offData.item.isActive}`);

        if (offData.item.isActive !== false) console.error('❌ Failed to toggle OFF');

        // 4. Toggle ON (Boolean)
        console.log('\n[Step 4] Toggling ON (Boolean true)...');
        const onRes = await fetch(`${BASE_URL}/api/menu-items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({ isActive: true })
        });
        const onData: any = await onRes.json();
        console.log(`Status after TRUE update: ${onData.item.isActive}`);

        if (onData.item.isActive !== true) console.error('❌ Failed to toggle ON');

        // 5. Test String "false" (Simulate Frontend quirks)
        console.log('\n[Step 5] Testing String "false"...');
        const strFalseRes = await fetch(`${BASE_URL}/api/menu-items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({ isActive: "false" })
        });
        // If the backend blindly assigns "false", Prisma might coerce it to true (non-empty string)?
        const strFalseData: any = await strFalseRes.json();
        console.log(`Status after "false" string update: ${strFalseData.item.isActive}`);

        // Cleanup
        await prisma.menuItem.delete({ where: { id: itemId } });
        await prisma.category.delete({ where: { id: categoryId } });

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        server.close();
        await prisma.$disconnect();
    }
}

runTests();
