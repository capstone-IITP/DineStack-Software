// Reset activation code for testing
// Run with: npx ts-node reset_code.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCode() {
    const activationCode = 'TAPF-LRXX-39U7-QYXL';

    console.log('Resetting activation code:', activationCode);

    // Find and reset the activation code
    const code = await prisma.activationCode.findUnique({
        where: { code: activationCode },
        include: { restaurant: true }
    });

    if (!code) {
        console.error('❌ Code not found');
        return;
    }

    console.log('Current state:', {
        isUsed: code.isUsed,
        status: code.status,
        linkedRestaurant: code.restaurant?.name || 'NONE'
    });

    // Reset the code
    await prisma.activationCode.update({
        where: { code: activationCode },
        data: {
            isUsed: false,
            usedAt: null,
            status: 'ACTIVE'
        }
    });

    console.log('✅ Code reset to ACTIVE and unused');

    // Delete any linked restaurant (to test fresh activation)
    if (code.restaurant) {
        try {
            await prisma.restaurant.delete({
                where: { id: code.restaurant.id }
            });
            console.log('✅ Deleted linked restaurant for fresh test');
        } catch (e) {
            console.log('Could not delete restaurant (may have dependencies)');
        }
    }
}

resetCode()
    .then(() => console.log('Done!'))
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
