import { useEffect } from 'react';
import { useReadingTimerStore } from './reading-timer-store';

/**
 * Advances the reading timer's phase(s) once a second, independent of
 * whichever screen happens to be mounted. Mount once at the app root (see
 * app/_layout.tsx) — reading-timer-screen.tsx and the floating widget both
 * just *display* the store's state, but this is what actually drives it
 * forward, so a focus→rest transition (or session completion) still happens
 * while the user has navigated elsewhere in the app.
 */
export function useReadingTimerAutoAdvance() {
  useEffect(() => {
    const id = setInterval(() => {
      useReadingTimerStore.getState().advanceIfDue();
    }, 1000);
    return () => clearInterval(id);
  }, []);
}
