import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { type Auth, getAuth, initializeAuth, GoogleAuthProvider } from 'firebase/auth';
// `getReactNativePersistence` exists at runtime (Metro resolves the SDK's
// react-native build) but the firebase package's `exports` map only types
// the web build, so tsc can't see it here — hence the standalone import.
// @ts-expect-error — see comment above.
import { getReactNativePersistence } from 'firebase/auth';
import {
  type Firestore,
  clearIndexedDbPersistence,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

/**
 * Web keeps Firestore's cache in IndexedDB so a reload resumes the books /
 * sentences listeners from cached documents and only reads what changed,
 * instead of re-reading the whole library. The multi-tab manager lets two
 * open tabs share that cache. Native stays on the default memory cache — the
 * JS SDK's persistent cache needs IndexedDB. initializeFirestore() throws if
 * called twice (Fast Refresh), so fall back like createAuth() does.
 */
function createDb(): Firestore {
  if (Platform.OS !== 'web') {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}

export const auth = createAuth();
export const db = createDb();
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Web only: wipes the signed-out user's documents from the IndexedDB cache
 * so the next person on this browser can't read them from disk. Clearing
 * requires a terminated instance, and `db` can't be revived afterwards, so
 * this ends with a full page load of /login. If another tab still holds the
 * cache, clearing fails with `failed-precondition`; the reload still happens
 * and the cache is cleared on a later sign-out.
 */
export async function clearWebFirestoreCache(): Promise<void> {
  if (Platform.OS !== 'web') return;
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    // See above — another tab has the cache open.
  }
  window.location.replace('/login');
}

// Analytics lives in lib/analytics(.web).ts so `firebase/analytics` is only
// bundled for web.
