export type Notice = {
  id: string;
  date: string;
  title: string;
  body: string;
};

/** Newest first — add new entries to the top as the service evolves. */
export const NOTICES: Notice[] = [
  {
    id: 'welcome',
    date: '2026.08.09',
    title: '갈피를 시작합니다',
    body: '읽은 책과 마음에 담은 문장을 기록하는 갈피가 문을 열었어요. 책을 등록하고, 문장을 사진으로 남기거나 직접 입력하고, 독서 통계와 리포트로 나의 독서 습관을 돌아볼 수 있어요. 앞으로도 더 나은 갈피를 만들어갈게요.',
  },
];
