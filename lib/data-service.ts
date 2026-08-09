import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { books as sampleBooks, type Book } from './data/books';
import { sentences as sampleSentences, type Sentence } from './data/sentences';

function booksCol(uid: string) {
  return collection(db, 'users', uid, 'books');
}

function sentencesCol(uid: string) {
  return collection(db, 'users', uid, 'sentences');
}

/**
 * Firestore's set()/update() reject explicit `undefined` field values (unlike
 * a plain omitted key), and the add-sentence form produces `memo: undefined`
 * when left blank — strip those before writing.
 */
function withoutUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function todayLabel(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/**
 * First-login bootstrap: gives every new account the same sample library the
 * app used to ship as hardcoded mock data, so the library isn't empty on day
 * one. No-ops for returning users (checked via the books collection being
 * non-empty) so it never overwrites real edits.
 */
export async function ensureInitialLibrary(uid: string): Promise<void> {
  const existing = await getDocs(booksCol(uid));
  if (!existing.empty) return;

  const batch = writeBatch(db);
  sampleBooks.forEach(({ id, ...book }, index) => {
    batch.set(doc(booksCol(uid), id), { ...book, order: index });
  });
  sampleSentences.forEach(({ id, ...sentence }) => {
    batch.set(doc(sentencesCol(uid), id), sentence);
  });
  await batch.commit();
}

export function subscribeBooks(uid: string, onChange: (books: Book[]) => void): Unsubscribe {
  return onSnapshot(query(booksCol(uid), orderBy('order', 'asc')), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Book, 'id'>) })));
  });
}

export function subscribeSentences(
  uid: string,
  onChange: (sentences: Sentence[]) => void,
): Unsubscribe {
  return onSnapshot(query(sentencesCol(uid), orderBy('date', 'desc')), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sentence, 'id'>) })));
  });
}

export async function addSentenceDoc(
  uid: string,
  sentence: Omit<Sentence, 'id' | 'date'>,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(sentencesCol(uid)), withoutUndefined({ ...sentence, date: todayLabel() }));
  batch.update(doc(booksCol(uid), sentence.bookId), { galpiCount: increment(1) });
  await batch.commit();
}
