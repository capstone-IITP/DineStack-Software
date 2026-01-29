import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.table.deleteMany({
        where: {
            label: 'Test Table'
        }
    });
    console.log(`Successfully deleted ${result.count} table(s) with label 'Test Table'.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
