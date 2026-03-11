import { NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

// Only these keys are exposed publicly (no sensitive data like SMTP passwords)
const PUBLIC_SETTING_KEYS = [
  'site_name',
  'site_description',
  'contact_email',
  'support_phone',
];

// snake_case → camelCase mapping
const KEY_MAP: Record<string, string> = {
  site_name: 'siteName',
  site_description: 'siteDescription',
  contact_email: 'contactEmail',
  support_phone: 'supportPhone',
};

/**
 * GET /api/settings/public
 * Returns public site settings (no auth required)
 */
export async function GET() {
  try {
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: { in: PUBLIC_SETTING_KEYS },
      },
      select: {
        setting_key: true,
        setting_value: true,
      },
    });

    const data: Record<string, string> = {};
    for (const setting of settings) {
      const camelKey = KEY_MAP[setting.setting_key] || setting.setting_key;
      data[camelKey] = setting.setting_value || '';
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Public settings fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
