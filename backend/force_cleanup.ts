import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Force Cleaning Active Restaurants...');

    // 1. Find all ACTIVE restaurants
    const activeRestaurants = await prisma.restaurant.findMany({
        where: { status: 'ACTIVE' }
    });

    console.log(`Found ${activeRestaurants.length} active restaurants.`);

    if (activeRestaurants.length > 0) {
        // 2. Revoke them
        await prisma.restaurant.updateMany({
            where: { status: 'ACTIVE' },
            data: {
                status: 'REVOKED',
                isActive: false,
                adminPin: null,
                kitchenPin: null
            }
        });
        console.log('All active restaurants have been REVOKED.');
    }

    // 3. Clear sessions just in case
    await prisma.session.deleteMany({});
    console.log('Sessions cleared.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
