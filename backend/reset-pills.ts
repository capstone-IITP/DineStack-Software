import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
        console.error('No restaurant found. Please activate first.');
        process.exit(1);
    }

    const adminPin = '111111'; // Using 111111 as a simple reset
    const kitchenPin = '1111';

    const pinHash = await bcrypt.hash(adminPin, 10);
    const kitchenPinHash = await bcrypt.hash(kitchenPin, 10);

    await (prisma as any).restaurant.update({
        where: { id: restaurant.id },
        data: {
            pinHash,
            kitchenPinHash,
            isRegistered: true
        }
    });

    console.log('✅ Master PINs reset successfully!');
    console.log('Admin PIN: 111111');
    console.log('Kitchen PIN: 1111');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
