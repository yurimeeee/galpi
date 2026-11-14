import { type Analytics, getAnalytics, isSupported } from 'firebase/analytics';
import { app } from './firebase';

/**
 * Web build of lib/analytics. `firebase/analytics` relies on browser-only
 * APIs (window, IndexedDB), so this file is the only place it's imported —
 * Metro picks `.web.ts` for web and the plain `.ts` stub for native, which
 * keeps the module out of the native bundle entirely. Initializes once,
 * and only after confirming the runtime actually supports it.
 */
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getAnalyticsIfSupported(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));
  }
  return analyticsPromise;
}
