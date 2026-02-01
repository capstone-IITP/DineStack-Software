
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const codes = await prisma.activationCode.findMany({
        include: { restaurant: true }
    });

    const restaurant = await prisma.restaurant.findFirst();

    const output = {
        codes,
        restaurant
    };

    fs.writeFileSync('codes.json', JSON.stringify(output, null, 2));
    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
