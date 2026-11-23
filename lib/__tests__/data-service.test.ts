import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('firebase/firestore', () => require('./fake-firestore').firestoreMock);
jest.mock('firebase/storage', () => ({}));
jest.mock('../firebase', () => ({ db: {}, storage: {} }));

import {
  addBookDoc,
  addSentenceDoc,
  deleteBookDoc,
  deleteSentenceDoc,
  importBackupData,
  parseBackupPayload,
  reorderBooksDoc,
  restoreBookDoc,
  restoreSentenceDoc,
  updateBookDoc,
  updateSentenceDoc,
} from '../data-service';
import type { Book } from '../data/books';
import type { Sentence } from '../data/sentences';
import { docsIn, resetStore, store } from './fake-firestore';

const UID = 'u1';
const BOOKS = `users/${UID}/books`;
const SENTENCES = `users/${UID}/sentences`;

function seedBook(id: string, fields: Partial<Book> & { order?: number } = {}) {
  store.set(`${BOOKS}/${id}`, {
    title: '데미안',
    author: '헤세',
    rating: 0,
    galpiCount: 0,
    status: 'reading',
    progress: 0,
    accent: 'blue',
    order: 0,
    ...fields,
  });
}

const book = (id: string) => store.get(`${BOOKS}/${id}`)!;
const newSentence = (page: number) => ({ bookId: 'b1', page, quote: `p.${page}`, type: 'text' as const });

beforeEach(() => {
  resetStore();
  jest.useFakeTimers({ now: new Date(2026, 10, 23, 21, 15) });
});
afterEach(() => {
  jest.useRealTimers();
});

describe('addBookDoc', () => {
  it('always writes `order` (the library query sorts on it) and drops undefined fields', async () => {
    await addBookDoc(UID, { title: 'A', author: 'B', rating: 0, galpiCount: 0, status: 'wish', progress: 0, accent: 'green', coverUrl: undefined }, 4);
    const [created] = docsIn(BOOKS);
    expect(created.order).toBe(4);
    expect('coverUrl' in created).toBe(false);
  });
});

describe('addSentenceDoc', () => {
  it('stamps date/hour and bumps the book’s galpiCount', async () => {
    seedBook('b1');
    await addSentenceDoc(UID, newSentence(10));
    const [saved] = docsIn(SENTENCES);
    expect(saved).toMatchObject({ date: '2026.11.23', hour: 21, page: 10 });
    expect(book('b1').galpiCount).toBe(1);
  });

  it('leaves progress alone when the page count is unknown', async () => {
    seedBook('b1');
    await addSentenceDoc(UID, newSentence(120));
    expect(book('b1').progress).toBe(0);
    expect(book('b1').furthestPage).toBeUndefined();
  });

  it('derives progress from the furthest page, never moving backwards, capped at 100', async () => {
    seedBook('b1', { totalPages: 200 });
    await addSentenceDoc(UID, newSentence(50));
    expect(book('b1')).toMatchObject({ furthestPage: 50, progress: 25 });

    await addSentenceDoc(UID, newSentence(20));
    expect(book('b1')).toMatchObject({ furthestPage: 50, progress: 25, galpiCount: 2 });

    await addSentenceDoc(UID, newSentence(260));
    expect(book('b1')).toMatchObject({ furthestPage: 260, progress: 100 });
  });
});

describe('updateSentenceDoc', () => {
  it('clears an emptied memo/tags and only moves progress forward', async () => {
    seedBook('b1', { totalPages: 100, furthestPage: 40, progress: 40 });
    store.set(`${SENTENCES}/s1`, { bookId: 'b1', page: 40, quote: 'q', memo: 'm', tags: ['t'], type: 'text', date: '2026.11.01' });

    await updateSentenceDoc(UID, 's1', { page: 10, quote: 'q2', memo: undefined, tags: [] });
    const saved = store.get(`${SENTENCES}/s1`)!;
    expect(saved).toMatchObject({ page: 10, quote: 'q2' });
    expect('memo' in saved || 'tags' in saved).toBe(false);
    expect(book('b1')).toMatchObject({ furthestPage: 40, progress: 40 });

    await updateSentenceDoc(UID, 's1', { page: 90, quote: 'q2' });
    expect(book('b1')).toMatchObject({ furthestPage: 90, progress: 90 });
  });
});

describe('updateBookDoc', () => {
  it('stamps completedAt when finished and clears it when moved back', async () => {
    seedBook('b1');
    await updateBookDoc(UID, 'b1', { status: 'done' });
    expect(book('b1').completedAt).toBe('2026.11.23');

    await updateBookDoc(UID, 'b1', { status: 'reading' });
    expect(book('b1').completedAt).toBeUndefined();
  });

  it('keeps completedAt on unrelated edits', async () => {
    seedBook('b1', { status: 'done', completedAt: '2026.01.02' });
    await updateBookDoc(UID, 'b1', { rating: 4 });
    expect(book('b1')).toMatchObject({ completedAt: '2026.01.02', rating: 4 });
  });
});

describe('reorderBooksDoc', () => {
  it('rewrites sequential order values in the given order', async () => {
    seedBook('a', { order: 0 });
    seedBook('b', { order: 1 });
    seedBook('c', { order: 2 });
    await reorderBooksDoc(UID, ['c', 'a', 'b']);
    expect(['a', 'b', 'c'].map((id) => book(id).order)).toEqual([1, 2, 0]);
  });
});

describe('delete + undo', () => {
  it('deleteBookDoc removes the book and only its 갈피; restoreBookDoc brings both back intact', async () => {
    seedBook('b1', { galpiCount: 2 });
    seedBook('b2');
    store.set(`${SENTENCES}/s1`, { bookId: 'b1', page: 1, quote: 'a', type: 'text', date: '2026.11.01', favorite: true });
    store.set(`${SENTENCES}/s2`, { bookId: 'b1', page: 2, quote: 'b', type: 'text', date: '2026.11.02' });
    store.set(`${SENTENCES}/s3`, { bookId: 'b2', page: 3, quote: 'c', type: 'text', date: '2026.11.03' });
    const before = new Map(store);

    const deletedBook = { id: 'b1', ...book('b1') } as unknown as Book;
    const deletedSentences = docsIn(SENTENCES).filter((s) => s.bookId === 'b1') as unknown as Sentence[];

    await deleteBookDoc(UID, 'b1');
    expect(docsIn(BOOKS).map((b) => b.id)).toEqual(['b2']);
    expect(docsIn(SENTENCES).map((s) => s.id)).toEqual(['s3']);

    await restoreBookDoc(UID, deletedBook, deletedSentences);
    expect(store).toEqual(before);
  });

  it('deleteSentenceDoc / restoreSentenceDoc keep galpiCount in step', async () => {
    seedBook('b1', { galpiCount: 1 });
    const sentence: Sentence = { id: 's1', bookId: 'b1', page: 5, quote: 'q', type: 'text', date: '2026.11.01' };
    const { id: _id, ...data } = sentence;
    store.set(`${SENTENCES}/s1`, data);

    await deleteSentenceDoc(UID, sentence);
    expect(store.has(`${SENTENCES}/s1`)).toBe(false);
    expect(book('b1').galpiCount).toBe(0);

    await restoreSentenceDoc(UID, sentence);
    expect(store.get(`${SENTENCES}/s1`)).toEqual(data);
    expect(book('b1').galpiCount).toBe(1);
  });
});

describe('backup import', () => {
  const payloadBook = (id: string, title: string): Book => ({
    id, title, author: '저자', rating: 0, galpiCount: 0, status: 'reading', progress: 0, accent: 'blue',
  });

  it('skips duplicates, remaps 갈피 onto existing books and appends new books after the library', async () => {
    seedBook('existing', { title: ' 데미안 ', author: '저자' });
    const existing = {
      books: [{ id: 'existing', ...book('existing') } as unknown as Book],
      sentences: [{ id: 'e1', bookId: 'existing', page: 1, quote: '새는 알에서', type: 'text', date: '2026.01.01' } as Sentence],
    };
    const payload = {
      version: 1 as const,
      exportedAt: '',
      books: [payloadBook('old-1', '데미안'), payloadBook('old-2', '수레바퀴 아래서')],
      sentences: [
        { id: 'x', bookId: 'old-1', page: 1, quote: '새는 알에서 ', type: 'text', date: '2026.01.01' } as Sentence,
        { id: 'y', bookId: 'old-1', page: 2, quote: '새 문장', type: 'text', date: '2026.01.02' } as Sentence,
        { id: 'z', bookId: 'old-2', page: 3, quote: '다른 책', type: 'text', date: '2026.01.03' } as Sentence,
        { id: 'w', bookId: 'gone', page: 4, quote: '고아', type: 'text', date: '2026.01.04' } as Sentence,
      ],
    };

    const result = await importBackupData(UID, payload, existing);
    expect(result).toEqual({ books: 1, sentences: 2, skippedBooks: 1, skippedSentences: 1 });

    const created = docsIn(BOOKS).find((b) => b.title === '수레바퀴 아래서')!;
    expect(created.order).toBe(1);
    const imported = docsIn(SENTENCES);
    expect(imported.find((s) => s.quote === '새 문장')?.bookId).toBe('existing');
    expect(imported.find((s) => s.quote === '다른 책')?.bookId).toBe(created.id);
  });

  it('rejects text that is not a 갈피 backup', () => {
    expect(() => parseBackupPayload('nope')).toThrow('올바른 백업 데이터가 아니에요');
    expect(() => parseBackupPayload('{"version":2,"books":[],"sentences":[]}')).toThrow('올바른 갈피 백업 데이터가 아니에요');
    expect(parseBackupPayload('{"version":1,"exportedAt":"","books":[],"sentences":[]}').books).toEqual([]);
  });
});
