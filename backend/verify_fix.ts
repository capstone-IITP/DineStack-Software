import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        if (prisma.table) {
            console.log('SUCCESS: prisma.table exists');
        } else {
            console.error('FAILURE: prisma.table is undefined');
            process.exit(1);
        }

        // Optional: Try a count (might fail if DB not migrated, but we just check the model definition)
        // console.log('Checking connection...');
        // await prisma.table.count(); 
    } catch (e) {
        // Ignore DB connection errors, we care about the property existing on the client instance
        console.log('Client property check passed, but DB might need migration:', e instanceof Error ? e.message : String(e));
    } finally {
        await prisma.$disconnect();
    }
}

check();
