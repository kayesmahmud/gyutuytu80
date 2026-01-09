/**
 * Social Media URL Utilities
 * Helper functions for extracting and building social media URLs
 */

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok';

/**
 * Helper to ensure URL has proper protocol
 */
export const ensureHttps = (url: string): string => {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

/**
 * Helper to extract username from social media URLs
 */
export const extractSocialUsername = (url: string | null, platform: SocialPlatform): string => {
  if (!url) return '';
  const patterns: Record<SocialPlatform, RegExp> = {
    facebook: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/(.+?)\/?$/i,
    instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(.+?)\/?$/i,
    tiktok: /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?(.+?)\/?$/i,
  };
  const pattern = patterns[platform];
  const match = url.match(pattern);
  if (match && match[1]) {
    return match[1].replace(/^@/, ''); // Remove @ if present
  }
  // If no match, return as-is (might be just the username)
  return url.replace(/^@/, '');
};

/**
 * Helper to build full social media URL from username
 */
export const buildSocialUrl = (username: string, platform: SocialPlatform): string => {
  if (!username) return '';
  const cleanUsername = username.replace(/^@/, '').trim();
  if (!cleanUsername) return '';
  const bases: Record<string, string> = {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/@',
  };
  return bases[platform] + cleanUsername;
};

