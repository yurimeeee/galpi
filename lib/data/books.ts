export type ReadingStatus = 'reading' | 'done' | 'wish';

export type Book = {
  id: string;
  title: string;
  author: string;
  rating: number; // 0 ~ 5
  galpiCount: number; // 저장한 문장(갈피) 수
  status: ReadingStatus;
  progress: number; // 0 ~ 100
  accent: 'blue' | 'green' | 'yellow' | 'ink';
  quote?: string;
};

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: '읽는 중',
  done: '완독',
  wish: '읽고 싶은',
};

export const books: Book[] = [
  {
    id: '1',
    title: '달러구트 꿈 백화점',
    author: '이미예',
    rating: 4,
    galpiCount: 8,
    status: 'reading',
    progress: 62,
    accent: 'blue',
    quote: '잠들어야만 갈 수 있는, 꿈을 파는 백화점.',
  },
  {
    id: '2',
    title: '세이노의 가르침',
    author: '세이노',
    rating: 5,
    galpiCount: 23,
    status: 'reading',
    progress: 34,
    accent: 'yellow',
    quote: '기꺼이 스스로 고생을 사서 하라.',
  },
  {
    id: '3',
    title: '모순',
    author: '양귀자',
    rating: 5,
    galpiCount: 15,
    status: 'done',
    progress: 100,
    accent: 'green',
    quote: '삶은 언제나 예측을 벗어나는 방향으로 흐른다.',
  },
  {
    id: '4',
    title: '아몬드',
    author: '손원평',
    rating: 4,
    galpiCount: 11,
    status: 'done',
    progress: 100,
    accent: 'ink',
    quote: '내 머릿속의 아몬드는 조금 작았다.',
  },
  {
    id: '5',
    title: '불변의 법칙',
    author: '모건 하우절',
    rating: 0,
    galpiCount: 0,
    status: 'wish',
    progress: 0,
    accent: 'blue',
  },
  {
    id: '6',
    title: '급류',
    author: '정대건',
    rating: 0,
    galpiCount: 0,
    status: 'wish',
    progress: 0,
    accent: 'green',
  },
];
