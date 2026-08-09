export type KakaoBookResult = {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  isbn: string;
  contents: string;
};

const SEARCH_ENDPOINT = process.env.EXPO_PUBLIC_KAKAO_SEARCH_URL ?? '/api/kakao-book-search';

export async function searchKakaoBooks(query: string): Promise<KakaoBookResult[]> {
  const res = await fetch(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `검색에 실패했어요 (${res.status})`);
  }
  return (data?.books ?? []) as KakaoBookResult[];
}
