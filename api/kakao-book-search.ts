import { config } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// `vercel dev` deliberately ignores .env.local for Serverless Functions
// (it expects .env + dashboard-pulled vars instead), so load it explicitly
// here for local dev. No-ops in production, where the file doesn't exist
// and the real KAKAO_REST_API_KEY is already set by the platform — dotenv
// never overwrites an env var that's already present.
config({ path: '.env.local' });

export type KakaoBookResult = {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  isbn: string;
  contents: string;
};

type KakaoDocument = {
  title?: string;
  authors?: string[];
  publisher?: string;
  thumbnail?: string;
  isbn?: string;
  contents?: string;
};

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

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY is not set');
    res.status(500).json({ error: '서버 설정 오류예요.' });
    return;
  }

  let kakaoRes: Response;
  try {
    kakaoRes = await fetch(
      `https://dapi.kakao.com/v3/search/book?target=title&size=15&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } },
    );
  } catch (err) {
    console.error('Kakao book search request failed', err);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  if (!kakaoRes.ok) {
    console.error('Kakao book search returned an error', kakaoRes.status, await kakaoRes.text());
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  const data = (await kakaoRes.json()) as { documents?: KakaoDocument[] };
  const books: KakaoBookResult[] = (data.documents ?? []).map((doc) => ({
    title: doc.title ?? '',
    authors: doc.authors ?? [],
    publisher: doc.publisher ?? '',
    thumbnail: doc.thumbnail ?? '',
    isbn: doc.isbn ?? '',
    contents: doc.contents ?? '',
  }));

  res.status(200).json({ books });
}
