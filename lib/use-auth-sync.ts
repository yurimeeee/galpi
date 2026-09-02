import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import {
  subscribeBooks,
  subscribeSentences,
  subscribeReadingLog,
  subscribeReadingGoals,
  DEFAULT_READING_GOALS,
} from './data-service';
import { useAppStore } from './store';

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

  useEffect(() => {
    if (!uid) {
      useAppStore.getState().setBooks([]);
      useAppStore.getState().setSentences([]);
      useAppStore.getState().setReadingLog({});
      useAppStore.getState().setReadingGoals(DEFAULT_READING_GOALS);
      return;
    }
    const unsubscribeBooks = subscribeBooks(uid, (books) => useAppStore.getState().setBooks(books));
    const unsubscribeSentences = subscribeSentences(uid, (sentences) =>
      useAppStore.getState().setSentences(sentences),
    );
    const unsubscribeReadingLog = subscribeReadingLog(uid, (log) => useAppStore.getState().setReadingLog(log));
    const unsubscribeReadingGoals = subscribeReadingGoals(uid, (goals) =>
      useAppStore.getState().setReadingGoals(goals),
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
