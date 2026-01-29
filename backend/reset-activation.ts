import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CODES = [
    'TAP8-8842-SYSA-CT00',
    'TAP8-1111-SYSA-ABCD',
    'TAP8-2222-SYSA-EFGH'
];

async function main() {
    console.log('🚨 Starting full system reset...');

    // 1. Delete dependents first to avoid foreign key constraints
    console.log('🗑️ Deleting Order Items...');
    await prisma.orderItem.deleteMany();

    console.log('🗑️ Deleting Orders...');
    await prisma.order.deleteMany();

    console.log('🗑️ Deleting Sessions...');
    await prisma.session.deleteMany();

    console.log('🗑️ Deleting Tables...');
    await prisma.table.deleteMany();

    console.log('🗑️ Deleting Menu Items...');
    await prisma.menuItem.deleteMany();

    console.log('🗑️ Deleting Categories...');
    await prisma.category.deleteMany();

    console.log('🗑️ Deleting Devices...');
    await prisma.device.deleteMany();

    // 2. Delete main entities
    console.log('🗑️ Deleting Restaurants...');
    await prisma.restaurant.deleteMany();

    console.log('🗑️ Deleting Activation Codes...');
    await prisma.activationCode.deleteMany();

    console.log('✅ Data cleared.');

    // 3. Seed new codes
    console.log('🌱 Seeding new activation codes...');
    for (const code of CODES) {
        await prisma.activationCode.create({
            data: { code, isUsed: false }
        });
        console.log(`  + Code: ${code}`);
    }

    console.log('✨ System reset complete! Ready for new activation.');
}

main()
    .catch(e => {
        console.error('❌ Error during reset:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
