
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'node_modules/.prisma/client/index.js'));

try {
    const prisma = new PrismaClient();
    console.log('✅ Prisma Client loaded successfully');
    process.exit(0);
} catch (e) {
    console.error('❌ Failed to load Prisma Client:', e);
    process.exit(1);
}
