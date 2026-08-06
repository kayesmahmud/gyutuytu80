'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ShareShopButtonProps {
  shopUrl: string;
}

/** Clipboard API first; hidden-textarea execCommand fallback for older
 *  Safari / non-HTTPS contexts where the API is unavailable. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/**
 * Share button for the shop header. Mobile browsers get the native share
 * sheet (navigator.share); desktop copies the URL and shows "Link copied!"
 * for a couple of seconds.
 */
export default function ShareShopButton({ shopUrl }: ShareShopButtonProps) {
  const t = useTranslations('shop');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // URL only — no shop name — so it pastes cleanly into social link fields.
    // Native share sheet ONLY on touch devices: desktop Chrome/Safari also
    // implement navigator.share, but the product decision is copy-on-desktop.
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice && typeof navigator.share === 'function') {
      try {
        await navigator.share({ url: shopUrl });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    if (await copyToClipboard(shopUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      title={t('shareShop')}
      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
        copied
          ? 'border-green-300 bg-green-50 text-green-700'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
      }`}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      <span>{copied ? t('linkCopied') : t('shareShop')}</span>
    </button>
  );
}
