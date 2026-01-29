
import { prisma } from '../src/client';

async function main() {
    try {
        const categories = await prisma.categories.findMany({
            where: {
                parent_id: null, // Get root categories
            },
            include: {
                other_categories: { // Get subcategories (children)
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        console.log('--- CATEGORY STRUCTURE ---');
        for (const cat of categories) {
            console.log(`[${cat.id}] ${cat.name}`);
            if (cat.other_categories.length > 0) {
                for (const sub of cat.other_categories) {
                    console.log(`  - [${sub.id}] ${sub.name}`);
                }
            } else {
                console.log('  (No subcategories)');
            }
        }
        console.log('--------------------------');

    } catch (error) {
        console.error('Error listing categories:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
