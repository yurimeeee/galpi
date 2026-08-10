import { config } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// `vercel dev` deliberately ignores .env.local for Serverless Functions
// (it expects .env + dashboard-pulled vars instead), so load it explicitly
// here for local dev. No-ops in production, where the file doesn't exist
// and the real ALADIN_TTB_KEY is already set by the platform — dotenv
// never overwrites an env var that's already present.
config({ path: '.env.local' });

type AladinLookupResponse = {
  item?: { subInfo?: { itemPage?: number } }[];
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

  const itemId = typeof req.query.itemId === 'string' ? req.query.itemId.trim() : '';
  if (!itemId || !/^\d+$/.test(itemId)) {
    res.status(400).json({ error: 'itemId가 필요해요.' });
    return;
  }

  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    console.error('ALADIN_TTB_KEY is not set');
    res.status(500).json({ error: '서버 설정 오류예요.' });
    return;
  }

  // ItemSearch's results don't include page count — only ItemLookUp's
  // subInfo.itemPage does, so this is a second, per-book request made only
  // when a search result is actually added (not for every search result).
  const lookupUrl =
    'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx' +
    `?ttbkey=${encodeURIComponent(ttbKey)}` +
    `&ItemId=${encodeURIComponent(itemId)}` +
    '&ItemIdType=ItemId' +
    '&Output=JS' +
    '&Version=20131101';

  let aladinRes: Response;
  try {
    aladinRes = await fetch(lookupUrl);
  } catch (err) {
    console.error('Aladin item lookup request failed', err);
    res.status(502).json({ error: '책 정보를 가져오지 못했어요.' });
    return;
  }

  if (!aladinRes.ok) {
    console.error('Aladin item lookup returned an error', aladinRes.status, await aladinRes.text());
    res.status(502).json({ error: '책 정보를 가져오지 못했어요.' });
    return;
  }

  // Output=JS is JSON, but Aladin occasionally trails a stray ";" after the
  // closing brace — strip it before parsing rather than trusting res.json().
  const rawBody = (await aladinRes.text()).trim().replace(/;$/, '');
  let data: AladinLookupResponse;
  try {
    data = JSON.parse(rawBody);
  } catch (err) {
    console.error('Aladin item lookup returned invalid JSON', rawBody.slice(0, 300));
    res.status(502).json({ error: '책 정보를 가져오지 못했어요.' });
    return;
  }

  if (data.errorCode) {
    console.error('Aladin item lookup API error', data.errorCode, data.errorMessage);
    res.status(502).json({ error: '책 정보를 가져오지 못했어요.' });
    return;
  }

  const totalPages = data.item?.[0]?.subInfo?.itemPage;
  res.status(200).json({ totalPages: typeof totalPages === 'number' ? totalPages : null });
}
