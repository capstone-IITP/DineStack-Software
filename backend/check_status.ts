
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const restaurant = await prisma.restaurant.findFirst();
    if (restaurant) {
        console.log('Restaurant Found:');
        console.log('ID:', restaurant.id);
        console.log('Name:', restaurant.name);
        console.log('Status:', restaurant.status);
        console.log('Is Active:', restaurant.isActive);
        console.log('Admin PIN Set:', restaurant.adminPin ? 'YES (Hashed)' : 'NO');
        console.log('Kitchen PIN Set:', restaurant.kitchenPin ? 'YES (Hashed)' : 'NO');
    } else {
        console.log('No restaurant found in the database.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
