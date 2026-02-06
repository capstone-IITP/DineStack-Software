// Script to link an activation code to a restaurant
// Run with: npx ts-node fix_activation_code.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixActivationCode() {
    const activationCode = 'TAPF-LRXX-39U7-QYXL';

    console.log('Looking for activation code:', activationCode);

    const code = await prisma.activationCode.findUnique({
        where: { code: activationCode },
        include: { restaurant: true }
    });

    if (!code) {
        console.error('❌ Activation code not found');
        return;
    }

    console.log('Found code:', {
        id: code.id,
        code: code.code,
        entityName: code.entityName,
        status: code.status,
        isUsed: code.isUsed,
        linkedRestaurant: code.restaurant ? code.restaurant.name : 'NONE'
    });

    if (code.restaurant) {
        console.log('✅ Code is already linked to restaurant:', code.restaurant.name);
        return;
    }

    // Create a new restaurant and link it
    console.log('Creating restaurant and linking to activation code...');

    const restaurant = await prisma.restaurant.create({
        data: {
            name: code.entityName || 'Restaurant',
            status: 'ACTIVE',
            isActive: true,
            activationCodeId: code.id
        }
    });

    console.log('✅ Created and linked restaurant:', restaurant.id, restaurant.name);

    // Reset the code if it was marked as used
    if (code.isUsed) {
        await prisma.activationCode.update({
            where: { id: code.id },
            data: {
                isUsed: false,
                usedAt: null,
                status: 'ACTIVE'
            }
        });
        console.log('✅ Reset activation code status to ACTIVE');
    }
}

fixActivationCode()
    .then(() => console.log('Done!'))
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
