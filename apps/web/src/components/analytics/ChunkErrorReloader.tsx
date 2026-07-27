'use client';

import { useEffect } from 'react';

/**
 * Recovers sessions broken by a deploy.
 *
 * Next.js emits content-hashed JS chunks and fetches them lazily on navigation.
 * A deploy replaces the container wholesale, so the previous build's chunks stop
 * existing — anyone who had the site open when we shipped gets a 404 on their
 * next route change and lands on a blank screen or dead buttons until they
 * manually hard-refresh. These are mid-session users: the ones least worth
 * losing.
 *
 * `deploymentId` does not help here. It is designed for hosts that keep several
 * builds addressable at once; with a single container swap the old assets are
 * simply gone, so recovering means reloading into the new build.
 *
 * The reload is rate-limited rather than fired once per session: a hard loop
 * would be worse than the bug, but a user who hits this on Monday should still
 * be recoverable on Tuesday.
 */

const LAST_RELOAD_KEY = 'tb-chunk-reload-at';
const MIN_MS_BETWEEN_RELOADS = 10_000;

/**
 * Chunk failures surface with different wording per browser and per loader
 * (webpack's ChunkLoadError vs. a native dynamic-import rejection), so match
 * on all of them.
 */
function isChunkLoadError(message: string): boolean {
  return /ChunkLoadError|Loading chunk \S+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    message
  );
}

export function ChunkErrorReloader() {
  useEffect(() => {
    const recover = (message: string) => {
      if (!isChunkLoadError(message)) return;

      const lastReload = Number(sessionStorage.getItem(LAST_RELOAD_KEY) ?? 0);
      // Already reloaded moments ago — reloading again would spin.
      if (Date.now() - lastReload < MIN_MS_BETWEEN_RELOADS) return;

      sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => recover(event.message || '');
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string } | string | undefined;
      recover(typeof reason === 'string' ? reason : reason?.message || '');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
