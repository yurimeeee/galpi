export type EntryType = 'text' | 'scan' | 'photo';

export const ENTRY_LABEL: Record<EntryType, string> = {
  text: '직접 입력',
  scan: '카메라 스캔',
  photo: '페이지 사진',
};

export type Sentence = {
  id: string;
  bookId: string;
  page: number;
  quote: string;
  memo?: string;
  type: EntryType;
  date: string;
};

export const sentences: Sentence[] = [
  {
    id: 's1',
    bookId: '1',
    page: 124,
    quote: '잠들어야만 갈 수 있는, 꿈을 파는 백화점. 그곳에서는 누구나 하룻밤의 손님이 된다.',
    memo: '표지를 다시 보게 만든 문장. 꿈이라는 소재를 이렇게 다정하게 풀어낼 수 있다니.',
    type: 'text',
    date: '2026.08.02',
  },
  {
    id: 's2',
    bookId: '1',
    page: 88,
    quote: '오늘 하루도 무사히 잠든 당신에게, 좋은 꿈을 배달합니다.',
    memo: '자기 전에 곱씹고 싶은 말.',
    type: 'scan',
    date: '2026.07.29',
  },
  {
    id: 's3',
    bookId: '1',
    page: 201,
    quote: '가장 평범한 하루가 누군가에게는 간절히 되찾고 싶은 어제였다.',
    type: 'photo',
    date: '2026.07.25',
  },
  {
    id: 's4',
    bookId: '1',
    page: 46,
    quote: '행복은 멀리 있지 않고, 늘 잠 속 어딘가에 접혀 있었다.',
    memo: '갈피라는 앱 이름과 잘 어울리는 문장.',
    type: 'text',
    date: '2026.07.20',
  },
];

export function sentencesByBook(
  allSentences: Sentence[],
  bookId: string,
): Sentence[] {
  return allSentences.filter((s) => s.bookId === bookId);
}
