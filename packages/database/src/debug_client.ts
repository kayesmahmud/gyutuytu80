import { prisma } from './index';

async function main() {
    console.log('Checking Prisma Client models...');
    // Inspect the prisma instance to see available delegates
    // Note: runtime properties are often hidden or defined as getters, but we can check if property access works

    if ((prisma as any).refresh_tokens) {
        console.log('SUCCESS: prisma.refresh_tokens exists');
    } else if ((prisma as any).refreshTokens) {
        console.log('SUCCESS: prisma.refreshTokens exists (camelCase)');
    } else {
        console.log('FAILURE: prisma.refresh_tokens is undefined');
        console.log('Available keys on prisma:', Object.keys(prisma));

        // Check known models to compare
        if ((prisma as any).users) console.log('users model exists');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
