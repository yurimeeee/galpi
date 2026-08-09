import {
  collection,
  deleteField,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { type Book } from './data/books';
import { type Sentence } from './data/sentences';

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

/**
 * `subscribeBooks` orders by the `order` field, and Firestore's orderBy()
 * silently excludes documents missing that field — so `order` must always
 * be written or the new book would never show up in the library.
 */
export async function addBookDoc(uid: string, book: Omit<Book, 'id'>, order: number): Promise<void> {
  await setDoc(doc(booksCol(uid)), withoutUndefined({ ...book, order }));
}

export async function updateBookDoc(
  uid: string,
  bookId: string,
  patch: Partial<Pick<Book, 'status' | 'rating'>>,
): Promise<void> {
  await updateDoc(doc(booksCol(uid), bookId), patch);
}

/**
 * Uploads a page photo (as a `data:image/jpeg;base64,...` URI) to Firebase
 * Storage and returns its public download URL, for embedding in a Sentence.
 *
 * React Native's Blob polyfill can't construct a blob directly from raw
 * bytes/base64 (uploadString/uploadBytes with a Uint8Array throws "Creating
 * blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported"), but it
 * *can* produce one via fetch() — so route the data URL through fetch first.
 */
export async function uploadSentencePhoto(uid: string, dataUrl: string): Promise<string> {
  const photoRef = ref(storage, `users/${uid}/sentence-photos/${Date.now()}.jpg`);
  const blob = await (await fetch(dataUrl)).blob();
  await uploadBytes(photoRef, blob);
  return getDownloadURL(photoRef);
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

export async function updateSentenceDoc(
  uid: string,
  sentenceId: string,
  changes: { page: number; quote: string; memo?: string },
): Promise<void> {
  await updateDoc(doc(sentencesCol(uid), sentenceId), {
    page: changes.page,
    quote: changes.quote,
    memo: changes.memo === undefined ? deleteField() : changes.memo,
  });
}

/**
 * Deletes a sentence and decrements the parent book's galpiCount to match —
 * the inverse of the increment addSentenceDoc performs on create.
 */
export async function deleteSentenceDoc(uid: string, sentence: Sentence): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(sentencesCol(uid), sentence.id));
  batch.update(doc(booksCol(uid), sentence.bookId), { galpiCount: increment(-1) });
  await batch.commit();
}
