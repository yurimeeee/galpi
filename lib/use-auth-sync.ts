import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { FirestoreError, Unsubscribe } from 'firebase/firestore';
import { auth } from './firebase';
import {
  subscribeBooks,
  subscribeSentences,
  subscribeReadingLog,
  subscribeReadingGoals,
  DEFAULT_READING_GOALS,
} from './data-service';
import { useAppStore } from './store';

const MAX_LISTENER_RETRIES = 3;

/**
 * Wraps one Firestore listener for `uid`. Firestore drops a listener for
 * good after its first error, so without this a transient permission-denied
 * — the request reaching the backend before the new user's token, right
 * after sign-in — left the library empty until relaunch. While the same user
 * is still signed in, resubscribe with backoff (1s, 2s, 3s). Errors after
 * sign-out (listeners racing the uid effect's cleanup) are expected and only
 * logged instead of surfacing as uncaught errors.
 */
function resilientListener(
  uid: string,
  subscribe: (onError: (error: FirestoreError) => void) => Unsubscribe,
): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let stopped = false;

  function onError(error: FirestoreError) {
    if (stopped) return;
    const sameUser = auth.currentUser?.uid === uid;
    if (error.code === 'permission-denied' && sameUser && attempts < MAX_LISTENER_RETRIES) {
      attempts += 1;
      retryTimer = setTimeout(start, attempts * 1000);
      return;
    }
    if (sameUser) console.warn(`[galpi] Firestore listener stopped (${error.code}): ${error.message}`);
  }

  function start() {
    retryTimer = null;
    if (!stopped) unsubscribe = subscribe(onError);
  }

  start();
  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    unsubscribe?.();
  };
}

/**
 * Bridges Firebase auth state and the user's Firestore library into the
 * zustand store. Mount once at the app root.
 */
export function useAuthSync(): { authResolved: boolean } {
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      useAppStore.getState().setUser(firebaseUser);

      if (!firebaseUser) {
        useAppStore.setState((state) => ({
          gate:
            state.gate === 'app' ? 'login' : state.gate === 'loading' ? 'onboarding' : state.gate,
        }));
        setAuthResolved(true);
        return;
      }

      useAppStore.setState({ gate: 'app' });
      setAuthResolved(true);
    });
    return unsubscribe;
  }, []);

  const uid = useAppStore((s) => s.user?.uid);

  // Clears the library only once auth has resolved to "signed out". Before
  // that, `uid` is also undefined on every cold start; clearing then (and
  // through the setters, which flag the data as loaded) wiped the warm cache
  // and made a deep link like /book/:id redirect to the library because the
  // book "finished loading" as missing.
  useEffect(() => {
    if (!authResolved || uid) return;
    useAppStore.setState({
      books: [],
      sentences: [],
      readingLog: {},
      readingGoals: DEFAULT_READING_GOALS,
      booksLoaded: false,
      sentencesLoaded: false,
      readingGoalsLoaded: false,
    });
  }, [authResolved, uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribeBooks = resilientListener(uid, (onError) =>
      subscribeBooks(uid, (books) => useAppStore.getState().setBooks(books), onError),
    );
    const unsubscribeSentences = resilientListener(uid, (onError) =>
      subscribeSentences(uid, (sentences) => useAppStore.getState().setSentences(sentences), onError),
    );
    const unsubscribeReadingLog = resilientListener(uid, (onError) =>
      subscribeReadingLog(uid, (log) => useAppStore.getState().setReadingLog(log), onError),
    );
    const unsubscribeReadingGoals = resilientListener(uid, (onError) =>
      subscribeReadingGoals(uid, (goals) => useAppStore.getState().setReadingGoals(goals), onError),
    );
    return () => {
      unsubscribeBooks();
      unsubscribeSentences();
      unsubscribeReadingLog();
      unsubscribeReadingGoals();
    };
  }, [uid]);

  return { authResolved };
}
