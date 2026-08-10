import { config } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// `vercel dev` deliberately ignores .env.local for Serverless Functions
// (it expects .env + dashboard-pulled vars instead), so load it explicitly
// here for local dev. No-ops in production, where the file doesn't exist
// and the real ALADIN_TTB_KEY is already set by the platform — dotenv
// never overwrites an env var that's already present.
config({ path: '.env.local' });

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

type AladinItem = {
  itemId?: number;
  title?: string;
  author?: string;
  publisher?: string;
  cover?: string;
  isbn13?: string;
  isbn?: string;
  description?: string;
  categoryName?: string;
};

type AladinResponse = {
  item?: AladinItem[];
  errorCode?: string;
  errorMessage?: string;
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

  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    console.error('ALADIN_TTB_KEY is not set');
    res.status(500).json({ error: '서버 설정 오류예요.' });
    return;
  }

  const searchUrl =
    'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx' +
    `?ttbkey=${encodeURIComponent(ttbKey)}` +
    `&Query=${encodeURIComponent(query)}` +
    '&QueryType=Keyword' +
    '&SearchTarget=Book' +
    '&MaxResults=20' +
    '&Cover=Big' +
    '&Output=JS' +
    '&Version=20131101';

  let aladinRes: Response;
  try {
    aladinRes = await fetch(searchUrl);
  } catch (err) {
    console.error('Aladin book search request failed', err);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  if (!aladinRes.ok) {
    console.error('Aladin book search returned an error', aladinRes.status, await aladinRes.text());
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  // Output=JS is JSON, but Aladin occasionally trails a stray ";" after the
  // closing brace — strip it before parsing rather than trusting res.json().
  const rawBody = (await aladinRes.text()).trim().replace(/;$/, '');
  let data: AladinResponse;
  try {
    data = JSON.parse(rawBody);
  } catch (err) {
    console.error('Aladin book search returned invalid JSON', rawBody.slice(0, 300));
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  if (data.errorCode) {
    console.error('Aladin book search API error', data.errorCode, data.errorMessage);
    res.status(502).json({ error: '책 검색에 실패했어요.' });
    return;
  }

  const books: AladinBookResult[] = (data.item ?? []).map((item) => ({
    itemId: item.itemId ?? 0,
    title: item.title ?? '',
    author: item.author ?? '',
    publisher: item.publisher ?? '',
    thumbnail: item.cover ?? '',
    isbn: item.isbn13 || item.isbn || '',
    contents: item.description ?? '',
    genre: item.categoryName ?? '',
  }));

  res.status(200).json({ books });
}
