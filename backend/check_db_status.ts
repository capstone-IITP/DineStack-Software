import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const codes = await prisma.activationCode.findMany();
        console.log('Activation Codes:', JSON.stringify(codes, null, 2));

        const restaurant = await prisma.restaurant.findFirst();
        console.log('Restaurant:', JSON.stringify(restaurant, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
