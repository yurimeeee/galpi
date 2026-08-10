export type AladinBookResult = {
  itemId: number;
  title: string;
  author: string;
  publisher: string;
  thumbnail: string;
  isbn: string;
  contents: string;
  genre: string;
};

const API_BASE = process.env.EXPO_PUBLIC_ALADIN_API_BASE ?? '';

export async function searchAladinBooks(query: string): Promise<AladinBookResult[]> {
  const res = await fetch(`${API_BASE}/api/aladin-book-search?query=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `검색에 실패했어요 (${res.status})`);
  }
  return (data?.books ?? []) as AladinBookResult[];
}

/**
 * Total page count isn't in search results — only ItemLookUp returns it — so
 * this is called once, only for the book the user actually adds. Best-effort:
 * returns null instead of throwing, since a missing page count shouldn't
 * block adding the book.
 */
export async function lookupAladinTotalPages(itemId: number): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/aladin-book-lookup?itemId=${itemId}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return typeof data?.totalPages === 'number' ? data.totalPages : null;
  } catch {
    return null;
  }
}
