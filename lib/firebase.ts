import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { type Auth, getAuth, initializeAuth, GoogleAuthProvider } from 'firebase/auth';
// `getReactNativePersistence` exists at runtime (Metro resolves the SDK's
// react-native build) but the firebase package's `exports` map only types
// the web build, so tsc can't see it here — hence the standalone import.
// @ts-expect-error — see comment above.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { type Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Web uses IndexedDB persistence out of the box via getAuth(). Native has no
 * DOM storage, so it needs an explicit AsyncStorage-backed persistence layer.
 * initializeAuth() throws if called twice (e.g. Fast Refresh), so fall back
 * to the already-initialized instance in that case.
 */
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * `firebase/analytics` relies on browser-only APIs (window, IndexedDB) and
 * isn't available on native iOS/Android — only initialize it on web, and
 * only after confirming the runtime actually supports it.
 */
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getAnalyticsIfSupported(): Promise<Analytics | null> {
  if (Platform.OS !== 'web') {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = isAnalyticsSupported().then((supported) => {
      if (!supported) return null;
      const { getAnalytics } = require('firebase/analytics');
      return getAnalytics(app);
    });
  }
  return analyticsPromise;
}
