import type { Book } from '../data/books';
import type { Sentence } from '../data/sentences';

let seq = 0;

export function book(overrides: Partial<Book> = {}): Book {
  seq += 1;
  return {
    id: `b${seq}`,
    title: `책 ${seq}`,
    author: '저자',
    rating: 0,
    galpiCount: 0,
    status: 'reading',
    progress: 0,
    accent: 'blue',
    ...overrides,
  };
}

export function sentence(date: string, overrides: Partial<Sentence> = {}): Sentence {
  seq += 1;
  return { id: `s${seq}`, bookId: 'b0', page: 1, quote: `문장 ${seq}`, type: 'text', date, ...overrides };
}
