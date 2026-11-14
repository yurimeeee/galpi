/** Mirrors the server's `BookSearchResult` in api/yes24-book-search.ts. */
export type BookSearchResult = {
  itemId: number;
  title: string;
  author: string;
  publisher: string;
  thumbnail: string;
  isbn: string;
  contents: string;
  /** Category path with ">" separators, e.g. "국내도서>소설/시/희곡". */
  genre: string;
};

const API_BASE = process.env.EXPO_PUBLIC_BOOK_API_BASE ?? '';

/**
 * Keyword search over YES24's catalog via our serverless proxy (which holds
 * the API key). YES24's Open API exposes no page count, so unlike the old
 * Aladin flow there is no follow-up lookup — `totalPages` stays empty until
 * the user fills it in on the book detail screen.
 */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const res = await fetch(`${API_BASE}/api/yes24-book-search?query=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `검색에 실패했어요 (${res.status})`);
  }
  return (data?.books ?? []) as BookSearchResult[];
}
