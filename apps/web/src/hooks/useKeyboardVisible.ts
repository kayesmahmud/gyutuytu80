'use client';

import { useState, useEffect } from 'react';

/**
 * Detects if the mobile keyboard is visible
 * Uses visualViewport API for accurate detection
 *
 * @returns boolean - true if keyboard is visible, false otherwise
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return; // Not supported (older browsers)

    // Minimum height difference to consider keyboard open
    // Typical mobile keyboards are 250-350px tall
    const KEYBOARD_THRESHOLD = 150;

    const handleResize = () => {
      const heightDiff = window.innerHeight - viewport.height;
      setIsKeyboardVisible(heightDiff > KEYBOARD_THRESHOLD);
    };

    // Listen to both resize and scroll events on visualViewport
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    // Initial check
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return isKeyboardVisible;
}
