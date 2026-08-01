/**
 * Seed data for the owner-edit-live-ads E2E spec.
 * Creates a normal user, a verified business user, and one APPROVED ad each.
 * Run: npx tsx e2e/setup/seed-owner-edit-tests.ts
 */

// Relative import: the package's exports map only exposes TS source for
// bundlers; plain tsx resolution fails on it (same as seed-test-user.ts).
import { prisma } from '../../../../packages/database/src/index.js';
import bcrypt from 'bcrypt';

const PASSWORD = 'testpassword123';

const NORMAL = {
  phone: '9800000001',
  email: 'e2e-test@thulobazaar.local',
  fullName: 'E2E Test User',
  adSlug: 'e2e-live-ad-normal',
  adTitle: 'E2E Live Ad Normal',
};

const BIZ = {
  phone: '9800000002',
  email: 'e2e-biz@thulobazaar.local',
  fullName: 'E2E Biz User',
  adSlug: 'e2e-live-ad-biz',
  adTitle: 'E2E Live Ad Biz',
};

async function upsertUser(u: typeof NORMAL, business: boolean) {
  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const existing = await prisma.users.findFirst({
    where: { OR: [{ phone: u.phone }, { email: u.email }] },
  });

  const data = {
    password_hash,
    full_name: u.fullName,
    phone: u.phone,
    phone_verified: true,
    is_active: true,
    is_suspended: false,
    ...(business
      ? {
          account_type: 'business',
          business_name: 'E2E Test Business',
          business_verification_status: 'approved',
          business_verification_expires_at: null,
          direct_edit_revoked: false,
        }
      : { account_type: 'individual' }),
  };

  if (existing) {
    return prisma.users.update({ where: { id: existing.id }, data });
  }
  return prisma.users.create({ data: { email: u.email, ...data } });
}

async function upsertApprovedAd(userId: number, slug: string, title: string) {
  const category = await prisma.categories.findFirst({ where: { parent_id: { not: null } } });
  const location = await prisma.locations.findFirst();
  if (!category || !location) throw new Error('Need at least one category and location');

  const existing = await prisma.ads.findUnique({ where: { slug } });
  const data = {
    title,
    description: 'E2E test ad for owner-edit flows',
    price: 1234,
    condition: 'Used',
    category_id: category.id,
    location_id: location.id,
    user_id: userId,
    status: 'approved',
    deleted_at: null,
  };

  if (existing) {
    return prisma.ads.update({ where: { id: existing.id }, data });
  }
  return prisma.ads.create({ data: { slug, ...data } });
}

async function main() {
  const normal = await upsertUser(NORMAL, false);
  const biz = await upsertUser(BIZ, true);
  const normalAd = await upsertApprovedAd(normal.id, NORMAL.adSlug, NORMAL.adTitle);
  const bizAd = await upsertApprovedAd(biz.id, BIZ.adSlug, BIZ.adTitle);

  console.log(JSON.stringify({
    normal: { userId: normal.id, adId: normalAd.id, slug: normalAd.slug },
    biz: { userId: biz.id, adId: bizAd.id, slug: bizAd.slug },
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
