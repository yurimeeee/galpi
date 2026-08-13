import { useEffect, useState } from 'react';

/**
 * Re-renders the calling component roughly once a second while `active`,
 * so time-derived values (e.g. a countdown computed from an epoch-ms
 * deadline) repaint smoothly without themselves living in component state.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return now;
}
