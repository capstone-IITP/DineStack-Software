
import 'dotenv/config'; // Load env vars first!
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import http from 'http';

// Set VERCEL env var to suppress auto-listen in server.ts
process.env.VERCEL = '1';

const prisma = new PrismaClient();
const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
    console.log('🔒 Starting Security Verification...');

    // Import app dynamically
    const { default: app } = await import('./server');

    // Start Server
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(PORT, resolve));
    console.log(`Test Server running on port ${PORT}`);

    let passed = true;

    try {
        // TEST 1: Activation with Invalid Code
        console.log('\n[TEST 1] invalid activation code...');
        const res1 = await fetch(`${BASE_URL}/api/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activationCode: 'INVALID-CODE-XYZ' })
        });
        const data1: any = await res1.json();

        if (res1.status === 400 && data1.error && data1.error.includes('Activation code not found')) {
            console.log('✅ Correctly rejected invalid code.');
        } else {
            console.error('❌ FAILED: Unexpected response for invalid code:', data1);
            passed = false;
        }

        // TEST 2: Empty Request
        console.log('\n[TEST 2] Missing activation code...');
        const res2 = await fetch(`${BASE_URL}/api/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data2: any = await res2.json();

        if (res2.status === 400 && data2.error === 'Activation code required') {
            console.log('✅ Correctly rejected missing code.');
        } else {
            console.error('❌ FAILED: Unexpected response for missing code:', data2);
            passed = false;
        }

        // TEST 3: Database Audit for Unlinked Codes
        console.log('\n[TEST 3] Auditing Database for "Unlinked" Codes...');

        // Manual join strategy
        const restaurants = await prisma.restaurant.findMany({
            select: { activationCodeId: true },
            where: { activationCodeId: { not: null } }
        });

        const linkedIds = restaurants.map(r => r.activationCodeId).filter((id): id is string => id !== null);

        const unlinkedCount = await prisma.activationCode.count({
            where: {
                id: { notIn: linkedIds }
            }
        });

        if (unlinkedCount > 0) {
            console.warn(`⚠️ WARNING: Found ${unlinkedCount} unlinked activation codes in DB!`);
            console.warn('   These are likely from the previous insecure implementation. Please cleanup manually.');
        } else {
            console.log('✅ Database Audit Clean: No unlinked activation codes found.');
        }

    } catch (error) {
        console.log('❌ Test Error:', error);
        passed = false;
    } finally {
        server.close();
        await prisma.$disconnect();
    }

    if (passed) {
        console.log('\n✅✅✅ VERIFICATION PASSED: Activation Logic is Strict ✅✅✅');
        process.exit(0);
    } else {
        console.error('\n❌❌❌ VERIFICATION FAILED ❌❌❌');
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
