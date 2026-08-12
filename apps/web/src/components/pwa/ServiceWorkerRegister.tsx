'use client';

import { useEffect } from 'react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !('serviceWorker' in navigator) ||
            process.env.NODE_ENV !== 'production'
        ) {
            return;
        }

        // Whether this page load started under an existing worker. On a first-ever
        // install there is no controller, and clients.claim() would otherwise
        // trigger a pointless reload on the visitor's very first page view.
        const hadController = Boolean(navigator.serviceWorker.controller);
        let reloading = false;

        const onControllerChange = () => {
            if (!hadController || reloading) return;
            reloading = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        let updateTimer: ReturnType<typeof setInterval> | undefined;

        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                // The worker calls skipWaiting() on install and clients.claim() on
                // activate, so an update applies itself and controllerchange above
                // does the single reload. No confirm() prompt — it interrupted
                // users mid-task and the reload happened regardless of the answer.
                updateTimer = setInterval(() => {
                    registration.update();
                }, UPDATE_CHECK_INTERVAL_MS);
            })
            .catch((error) => {
                console.error('[SW] Service Worker registration failed:', error);
            });

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            if (updateTimer) clearInterval(updateTimer);
        };
    }, []);

    return null;
}
