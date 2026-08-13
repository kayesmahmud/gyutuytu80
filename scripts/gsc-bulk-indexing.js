#!/usr/bin/env node

/**
 * Google Search Console Bulk URL Indexing Script
 *
 * This script automatically requests indexing for all URLs in Google Search Console
 * using the Google Indexing API.
 *
 * Setup:
 * 1. npm install google-auth-library axios
 * 2. Create Google Cloud Service Account (see instructions below)
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 4. Run: node scripts/gsc-bulk-indexing.js
 */

const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// All URLs to request indexing for
const URLS_TO_INDEX = [
  // Top 20 Categories - English
  'https://thulobazaar.com.np/en/ads/western-wear',
  'https://thulobazaar.com.np/en/ads/cars',
  'https://thulobazaar.com.np/en/ads/laptops',
  'https://thulobazaar.com.np/en/ads/mobile-phones',
  'https://thulobazaar.com.np/en/ads/houses-for-sale',
  'https://thulobazaar.com.np/en/ads/traditional-wear',
  'https://thulobazaar.com.np/en/ads/bags-accessories-women',
  'https://thulobazaar.com.np/en/ads/beauty-personal-care',
  'https://thulobazaar.com.np/en/ads/footwear-women',
  'https://thulobazaar.com.np/en/ads/baby-girls-fashion',
  'https://thulobazaar.com.np/en/ads/body-massage',
  'https://thulobazaar.com.np/en/ads/childrens-items',
  'https://thulobazaar.com.np/en/ads/house-rentals',
  'https://thulobazaar.com.np/en/ads/other-electronics',
  'https://thulobazaar.com.np/en/ads/shirts-tshirts',
  'https://thulobazaar.com.np/en/ads/winter-wear',
  'https://thulobazaar.com.np/en/ads/accountant',
  'https://thulobazaar.com.np/en/ads/acs-home-electronics',
  'https://thulobazaar.com.np/en/ads/apartment-rentals',
  'https://thulobazaar.com.np/en/ads/apartments-for-sale',

  // Provinces - English
  'https://thulobazaar.com.np/en/ads/bagmati-province',
  'https://thulobazaar.com.np/en/ads/gandaki-province',
  'https://thulobazaar.com.np/en/ads/karnali-province',
  'https://thulobazaar.com.np/en/ads/koshi-province',
  'https://thulobazaar.com.np/en/ads/lumbini-province',
  'https://thulobazaar.com.np/en/ads/madhesh-province',
  'https://thulobazaar.com.np/en/ads/sudurpashchim-province',

  // Top 20 Categories - Nepali
  'https://thulobazaar.com.np/ne/ads/western-wear',
  'https://thulobazaar.com.np/ne/ads/cars',
  'https://thulobazaar.com.np/ne/ads/laptops',
  'https://thulobazaar.com.np/ne/ads/mobile-phones',
  'https://thulobazaar.com.np/ne/ads/houses-for-sale',
  'https://thulobazaar.com.np/ne/ads/traditional-wear',
  'https://thulobazaar.com.np/ne/ads/bags-accessories-women',
  'https://thulobazaar.com.np/ne/ads/beauty-personal-care',
  'https://thulobazaar.com.np/ne/ads/footwear-women',
  'https://thulobazaar.com.np/ne/ads/baby-girls-fashion',
  'https://thulobazaar.com.np/ne/ads/body-massage',
  'https://thulobazaar.com.np/ne/ads/childrens-items',
  'https://thulobazaar.com.np/ne/ads/house-rentals',
  'https://thulobazaar.com.np/ne/ads/other-electronics',
  'https://thulobazaar.com.np/ne/ads/shirts-tshirts',
  'https://thulobazaar.com.np/ne/ads/winter-wear',
  'https://thulobazaar.com.np/ne/ads/accountant',
  'https://thulobazaar.com.np/ne/ads/acs-home-electronics',
  'https://thulobazaar.com.np/ne/ads/apartment-rentals',
  'https://thulobazaar.com.np/ne/ads/apartments-for-sale',

  // Provinces - Nepali
  'https://thulobazaar.com.np/ne/ads/bagmati-province',
  'https://thulobazaar.com.np/ne/ads/gandaki-province',
  'https://thulobazaar.com.np/ne/ads/karnali-province',
  'https://thulobazaar.com.np/ne/ads/koshi-province',
  'https://thulobazaar.com.np/ne/ads/lumbini-province',
  'https://thulobazaar.com.np/ne/ads/madhesh-province',
  'https://thulobazaar.com.np/ne/ads/sudurpashchim-province',
];

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

/**
 * Request indexing for a single URL
 */
async function requestIndexing(authClient, url) {
  try {
    const response = await authClient.request({
      url: INDEXING_API_URL,
      method: 'POST',
      data: {
        url: url,
        type: 'URL_UPDATED',
      },
    });

    console.log(`✅ ${url}`);
    return { url, status: 'success', code: response.status };
  } catch (error) {
    console.error(`❌ ${url}`);
    console.error(`   Error: ${error.message}`);
    return { url, status: 'error', error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Google Search Console Bulk Indexing Script');
  console.log(`📊 Total URLs to index: ${URLS_TO_INDEX.length}\n`);

  // Check for credentials
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    console.error('\nSetup instructions:');
    console.error('1. Go to: https://console.cloud.google.com/');
    console.error('2. Create a new project or select existing one');
    console.error('3. Enable "Indexing API" (https://console.cloud.google.com/apis/library/indexing.googleapis.com)');
    console.error('4. Create Service Account:');
    console.error('   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts');
    console.error('   - Click "Create Service Account"');
    console.error('   - Fill in name and description');
    console.error('   - Click "Create and Continue"');
    console.error('   - Grant role: "Editor" (or create custom with indexing.urlNotifications.publish)');
    console.error('5. Create and download JSON key:');
    console.error('   - Go to service account → Keys → Add Key → Create new key → JSON');
    console.error('6. Save as: ~/thulobazaar-gsc-key.json');
    console.error('7. Run: export GOOGLE_APPLICATION_CREDENTIALS=~/thulobazaar-gsc-key.json');
    console.error('8. Then run this script again\n');
    process.exit(1);
  }

  try {
    // Create auth client
    const authClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    console.log('✔️  Authentication configured\n');
    console.log('🔄 Submitting URLs for indexing...\n');

    // Submit URLs in batches (avoid rate limiting)
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < URLS_TO_INDEX.length; i += BATCH_SIZE) {
      const batch = URLS_TO_INDEX.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(URLS_TO_INDEX.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNumber}/${totalBatches}:`);

      const batchResults = await Promise.all(
        batch.map((url) => requestIndexing(authClient, url))
      );

      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < URLS_TO_INDEX.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'error').length;

    console.log(`✅ Successful: ${successful}/${URLS_TO_INDEX.length}`);
    console.log(`❌ Failed: ${failed}/${URLS_TO_INDEX.length}`);

    if (failed > 0) {
      console.log('\n⚠️  Failed URLs:');
      results
        .filter((r) => r.status === 'error')
        .forEach((r) => {
          console.log(`   - ${r.url}: ${r.error}`);
        });
    }

    console.log('\n✨ Indexing requests submitted!');
    console.log('💡 Tip: Check Google Search Console in 24-48 hours to see results');
    console.log('📈 Monitor: https://search.google.com/search-console/coverage');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
