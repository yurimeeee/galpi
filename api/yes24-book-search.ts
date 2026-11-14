import { config } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// `vercel dev` deliberately ignores .env.local for Serverless Functions
// (it expects .env + dashboard-pulled vars instead), so load it explicitly
// here for local dev. No-ops in production, where the file doesn't exist
// and the real YES24_API_KEY is already set by the platform — dotenv
// never overwrites an env var that's already present.
config({ path: '.env.local' });

/** Shape the client consumes — see lib/book-search.ts (kept in sync by hand). */
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

type Yes24Item = {
  itemId?: number;
  title?: string;
  author?: string;
  goodsType?: string;
  /** e.g. "국내도서-소설/시/희곡" — "-" separated. */
  goodsSortNm?: string;
  publisher?: string;
  isbn13?: string;
  isbn10?: string;
  cover?: string;
  contentDetail?: { bookIntroduction?: string | null } | null;
};

type Yes24Response = {
  success?: boolean;
  message?: string;
  errorCode?: string | null;
  data?: { items?: Yes24Item[] } | null;
};

/**
 * YES24 separates category levels with "-" ("국내도서-소설/시/희곡"); the
 * app has always stored and filtered genres as ">"-separated paths (the
 * format Aladin used before its Open API shut down), so normalize here to
 * keep new books consistent with the ones already in users' libraries.
 */
function toGenrePath(goodsSortNm: string | undefined): string {
  if (!goodsSortNm) return '';
  return goodsSortNm
    .split('-')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('>');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET만 지원해요.' });
    return;
  }

  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  if (!query) {
    res.status(400).json({ error: '검색어를 입력해주세요.' });
    return;
  }

  const apiKey = process.env.YES24_API_KEY;
  if (!apiKey) {
    console.error('YES24_API_KEY is not set');
    res.status(500).json({ error: '서버 설정 오류예요.' });
    return;
  }

  // category=BOOK restricts to printed books; without it the results mix in
  // eBooks, stationery and gifts that match the keyword.
  const searchUrl =
    'https://apis.yes24.com/v1/goods/itemList' +
    `?query=${encodeURIComponent(query)}` +
    '&page=1' +
    '&pageSize=20' +
    '&category=BOOK';

  let yes24Res: Response;
  try {
    yes24Res = await fetch(searchUrl, { headers: { 'X-Api-Key': apiKey } });
  } catch (err) {
    console.error('YES24 book search request failed', err);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  let data: Yes24Response;
  try {
    data = (await yes24Res.json()) as Yes24Response;
  } catch (err) {
    console.error('YES24 book search returned invalid JSON', yes24Res.status);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  // YES24 reports failures both via HTTP status and a `success: false` body
  // with an errorCode (AUTH_002 bad key, PARAM_00x bad params, ...).
  if (!yes24Res.ok || data.success === false) {
    console.error('YES24 book search API error', yes24Res.status, data.errorCode, data.message);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  const books: BookSearchResult[] = (data.data?.items ?? [])
    .filter((item) => !item.goodsType || item.goodsType === '도서')
    .map((item) => ({
      itemId: item.itemId ?? 0,
      title: item.title ?? '',
      author: item.author ?? '',
      publisher: item.publisher ?? '',
      thumbnail: item.cover ?? '',
      isbn: item.isbn13 || item.isbn10 || '',
      contents: item.contentDetail?.bookIntroduction ?? '',
      genre: toGenrePath(item.goodsSortNm),
    }));

  res.status(200).json({ books });
}
