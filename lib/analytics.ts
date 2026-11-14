/**
 * Native build of lib/analytics — see analytics.web.ts for the real thing.
 * Firebase Analytics (the JS SDK) isn't available on iOS/Android, so this
 * stub resolves to null without importing `firebase/analytics` at all.
 */
export function getAnalyticsIfSupported(): Promise<null> {
  return Promise.resolve(null);
}
