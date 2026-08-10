import { useEffect, useState } from 'react';

/**
 * Cover thumbnails (Aladin search results, uploaded covers) sometimes fail
 * to load — expired links, network hiccups, broken images. Rendering used
 * to key off `coverUrl` truthiness alone, so a failed load left a blank gap
 * instead of falling back to the accent-color placeholder. This tracks load
 * failure via the Image's onError so callers can fall back cleanly.
 */
export function useCoverFallback(coverUrl?: string) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [coverUrl]);

  return {
    showCover: Boolean(coverUrl) && !failed,
    onCoverError: () => setFailed(true),
  };
}
