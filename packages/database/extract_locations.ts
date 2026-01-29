
import { prisma } from './src';
import fs from 'fs';
import path from 'path';

async function main() {
    const locations = await prisma.locations.findMany({
        select: {
            id: true,
            name: true,
            type: true,
            parent_id: true,
        }
    });
    fs.writeFileSync(path.join(process.cwd(), 'locations.json'), JSON.stringify(locations));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
