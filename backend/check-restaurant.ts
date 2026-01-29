import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const restaurant = await prisma.restaurant.findFirst();
    console.log('--- Restaurant Data ---');
    console.log(JSON.stringify(restaurant, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
