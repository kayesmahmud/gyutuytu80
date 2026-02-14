import { NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/ad-config
 * Public endpoint — returns Google Ads configuration for web and mobile.
 * No auth required. Cached for 5 minutes.
 */
export async function GET() {
  try {
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: [
            'google_ads_enabled',
            'adsense_client_id',
            // Home page
            'ad_slot_home_hero_banner',
            'ad_slot_home_hero_banner_mobile',
            'ad_slot_home_left',
            'ad_slot_home_right',
            'ad_slot_home_in_feed',
            'ad_slot_home_bottom',
            // Ad detail
            'ad_slot_ad_detail_top',
            'ad_slot_ad_detail_top_mobile',
            'ad_slot_ad_detail_left',
            'ad_slot_ad_detail_right',
            'ad_slot_ad_detail_bottom',
            // Browse / listing
            'ad_slot_ads_listing_top',
            'ad_slot_ads_listing_top_mobile',
            'ad_slot_ads_listing_sidebar',
            'ad_slot_ads_listing_in_feed',
            'ad_slot_ads_listing_bottom',
            // Search
            'ad_slot_search_top',
            'ad_slot_search_top_mobile',
            'ad_slot_search_sidebar',
            'ad_slot_search_in_results',
            'ad_slot_search_bottom',
            // Other
            'ad_slot_dashboard_sidebar',
            'ad_slot_profile_sidebar',
            // Mobile AdMob
            'admob_app_id_android',
            'admob_app_id_ios',
            'admob_banner_android',
            'admob_banner_ios',
          ],
        },
      },
    });

    // Build key-value map
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.setting_key] = s.setting_value || '';
    }

    const enabled = map.google_ads_enabled === 'true';

    const response = {
      enabled,
      web: {
        clientId: map.adsense_client_id || '',
        slots: {
          homeHeroBanner: map.ad_slot_home_hero_banner || '',
          homeHeroBannerMobile: map.ad_slot_home_hero_banner_mobile || '',
          homeLeft: map.ad_slot_home_left || '',
          homeRight: map.ad_slot_home_right || '',
          homeInFeed: map.ad_slot_home_in_feed || '',
          homeBottom: map.ad_slot_home_bottom || '',
          adDetailTop: map.ad_slot_ad_detail_top || '',
          adDetailTopMobile: map.ad_slot_ad_detail_top_mobile || '',
          adDetailLeft: map.ad_slot_ad_detail_left || '',
          adDetailRight: map.ad_slot_ad_detail_right || '',
          adDetailBottom: map.ad_slot_ad_detail_bottom || '',
          adsListingTop: map.ad_slot_ads_listing_top || '',
          adsListingTopMobile: map.ad_slot_ads_listing_top_mobile || '',
          adsListingSidebar: map.ad_slot_ads_listing_sidebar || '',
          adsListingInFeed: map.ad_slot_ads_listing_in_feed || '',
          adsListingBottom: map.ad_slot_ads_listing_bottom || '',
          searchTop: map.ad_slot_search_top || '',
          searchTopMobile: map.ad_slot_search_top_mobile || '',
          searchSidebar: map.ad_slot_search_sidebar || '',
          searchInResults: map.ad_slot_search_in_results || '',
          searchBottom: map.ad_slot_search_bottom || '',
          dashboardSidebar: map.ad_slot_dashboard_sidebar || '',
          profileSidebar: map.ad_slot_profile_sidebar || '',
        },
      },
      mobile: {
        android: {
          appId: map.admob_app_id_android || '',
          bannerUnitId: map.admob_banner_android || '',
        },
        ios: {
          appId: map.admob_app_id_ios || '',
          bannerUnitId: map.admob_banner_ios || '',
        },
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Ad config fetch error:', error);
    return NextResponse.json(
      { enabled: false, web: { clientId: '', slots: {} }, mobile: { android: {}, ios: {} } },
      { status: 500 }
    );
  }
}
