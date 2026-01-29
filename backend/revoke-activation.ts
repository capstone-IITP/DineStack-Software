import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛑 Revoking current activation...');

    const restaurant = await prisma.restaurant.findFirst();

    if (!restaurant) {
        console.log('⚠️ No active restaurant found to revoke.');
        return;
    }

    // Update status to REVOKED
    const updated = await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
            status: 'REVOKED'
        }
    });

    console.log(`✅ Activation Revoked for Restaurant ID: ${updated.id}`);
    console.log(`new Status: ${updated.status}`);
}

main()
    .catch(e => {
        console.error('❌ Error revoking activation:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
