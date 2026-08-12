import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /app — smart store link (used in QR codes and marketing).
 * iPhone/iPad → App Store, Android → Play Store, everything else → homepage.
 */
const APP_STORE_URL = 'https://apps.apple.com/np/app/thulo-bazaar/id6774762315';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thulobazaar.mobile';

export function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return NextResponse.redirect(APP_STORE_URL, 302);
  }
  if (/Android/i.test(userAgent)) {
    return NextResponse.redirect(PLAY_STORE_URL, 302);
  }
  // Desktop / unknown devices → homepage. Hardcoded canonical origin:
  // request.url is the container-internal address (0.0.0.0:3333) behind the
  // proxy, and forwarded headers are attacker-controlled (open redirect).
  return NextResponse.redirect('https://thulobazaar.com.np/en', 302);
}
