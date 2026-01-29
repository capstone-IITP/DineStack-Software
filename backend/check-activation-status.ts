import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const codes = await prisma.activationCode.findMany();
    console.log('Activation Codes:', codes);

    const restaurants = await prisma.restaurant.findMany();
    console.log('Restaurants:', restaurants);
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
