
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Delete restaurants with NO Admin PIN (Zombies/Incomplete setups)
    const result = await prisma.restaurant.deleteMany({
        where: {
            adminPin: null
        }
    });

    console.log(`Deleted ${result.count} incomplete restaurant setups.`);

    // 2. Determine if any valid restaurant remains
    const validRestaurant = await prisma.restaurant.findFirst({
        where: { NOT: { adminPin: null } }
    });

    if (validRestaurant) {
        console.log('Found valid configured restaurant:', validRestaurant.id);
    } else {
        console.log('No configured restaurants remain.');
    }

    // 3. Reset any used activation codes that are now orphaned (no restaurant linked)
    // Find codes that are USED but have no restaurant relation
    // Since we deleted the restaurants, the foreign key might be SetNull (based on schema)
    // Schema: activationCode ActivationCode? @relation(... onDelete: SetNull)
    // So the restaurant side is gone. The activation code side has `restaurant` virtual field... 
    // Wait, ActivationCode has `restaurant Restaurant?`. DB Side: Restaurant has `activationCodeId`.
    // If Restaurant is deleted, `activationCodeId` on Restaurant is gone.
    // The ActivationCode table doesn't have a generic `restaurantId` column unless `Restaurant` has the FK?
    // Schema: 
    // model ActivationCode { ... restaurant Restaurant? }
    // model Restaurant { ... activationCodeId String? @unique ... activationCode ActivationCode? @relation(...) }
    // References are on Restaurant.

    // So if Restaurant is deleted, the link is broken.
    // We need to find ActivationCodes that have `status: USED` but no referencing Restaurant.
    // Prisma doesn't easily support "where relation is null" for one-to-one reverse relation in deleteMany/updateMany without check.

    // Let's just find all activation codes and check JS side or use raw query.
    // Easier: Find all codes where status is USED, check if they have a restaurant.

    const codes = await prisma.activationCode.findMany({
        where: { status: 'USED' },
        include: { restaurant: true }
    });

    for (const code of codes) {
        if (!code.restaurant) {
            console.log(`Resetting orphaned code ${code.code} to ACTIVE`);
            await prisma.activationCode.update({
                where: { id: code.id },
                data: {
                    status: 'ACTIVE',
                    isUsed: false,
                    usedAt: null
                }
            });
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
