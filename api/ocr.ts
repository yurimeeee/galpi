import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';

export const config = {
  maxDuration: 30,
};

const SYSTEM_PROMPT =
  '너는 책 페이지 사진에서 문장을 읽어내는 OCR 도우미야. 사용자가 보내는 사진은 종이책의 한 페이지를 촬영한 것이고, ' +
  '사진 중앙의 밑줄/하이라이트 영역이나 가장 두드러지는 한 문단의 문장을 최대한 정확하게 그대로 옮겨 적어. ' +
  '따옴표, 설명, 페이지 번호, 서론 문구 없이 인식된 문장만 출력해. 문장을 전혀 읽을 수 없으면 빈 문자열만 출력해.';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image } = (req.body ?? {}) as { image?: unknown };
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    res.status(400).json({ error: 'image must be a data URL string' });
    return;
  }

  try {
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '이 책 페이지 사진에서 문장을 인식해줘.' },
            { type: 'image', image },
          ],
        },
      ],
    });

    const sentence = text.trim().replace(/^["'“”]|["'“”]$/g, '');
    res.status(200).json({
      sentence,
      tokens: sentence.length ? sentence.split(/\s+/) : [],
    });
  } catch (error) {
    console.error('[api/ocr] failed', error);
    res.status(502).json({ error: '문장 인식에 실패했어요. 다시 시도해주세요.' });
  }
}
