import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CODES = [
    'TAP8-8842-SYSA-CT00',
    'TAP8-1111-SYSA-ABCD',
    'TAP8-2222-SYSA-EFGH'
];

async function main() {
    console.log('🌱 Seeding activation codes...');

    for (const code of CODES) {
        await prisma.activationCode.upsert({
            where: { code },
            update: {},
            create: { code, isUsed: false }
        });
        console.log(`✅ Code added: ${code}`);
    }

    console.log('✨ Seeding complete.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
