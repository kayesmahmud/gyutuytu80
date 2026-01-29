
import { prisma } from '@thulobazaar/database';

async function main() {
    const ad = await prisma.ads.findFirst({
        where: { title: { contains: 'iphone 17', mode: 'insensitive' } },
        include: {
            categories: { select: { name: true } },
            locations: { select: { name: true } },
            users_ads_user_idTousers: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    account_type: true,
                    business_verification_status: true,
                    individual_verified: true,
                },
            },
            ad_images: { take: 1 },
        },
    });

    if (!ad) {
        console.log('Ad not found');
        return;
    }

    // Simulate mapping logic from apps/api/src/routes/editor/ads.routes.ts
    const mappedAd = {
        id: ad.id,
        title: ad.title,
        condition: ad.condition,
        slug: ad.slug,
        locationId: ad.location_id,

        // Explicitly check logical truthiness
        conditionRaw: ad.condition,
        conditionIsString: typeof ad.condition === 'string',
        conditionLength: ad.condition?.length
    };

    console.log('Mapped Ad for Editor:', mappedAd);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
