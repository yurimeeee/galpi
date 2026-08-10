import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { todayLabel } from './date-utils';
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

/**
 * Setting status to 'done' stamps completedAt with today's date so monthly/
 * yearly reports can attribute the book to the period it was actually
 * finished in; moving off 'done' (e.g. back to "읽는 중") clears it.
 */
export async function updateBookDoc(
  uid: string,
  bookId: string,
  patch: Partial<Pick<Book, 'status' | 'rating' | 'totalPages' | 'furthestPage' | 'progress'>>,
): Promise<void> {
  const fullPatch: Record<string, unknown> = { ...patch };
  if (patch.status === 'done') {
    fullPatch.completedAt = todayLabel();
  } else if (patch.status) {
    fullPatch.completedAt = deleteField();
  }
  await updateDoc(doc(booksCol(uid), bookId), fullPatch);
}

/**
 * Deletes a book along with every 갈피 (sentence) written against it —
 * otherwise those sentences would be left dangling, pointing at a bookId
 * that no longer resolves to anything in the library.
 */
export async function deleteBookDoc(uid: string, bookId: string): Promise<void> {
  const orphanedSentences = await getDocs(query(sentencesCol(uid), where('bookId', '==', bookId)));
  const batch = writeBatch(db);
  orphanedSentences.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(booksCol(uid), bookId));
  await batch.commit();
}

/**
 * Uploads a profile avatar (as a `data:image/jpeg;base64,...` URI) to
 * Firebase Storage and returns its public download URL — mirrors
 * `uploadSentencePhoto`'s fetch()-through-blob approach.
 */
export async function uploadProfilePhoto(uid: string, dataUrl: string): Promise<string> {
  const photoRef = ref(storage, `users/${uid}/profile/${Date.now()}.jpg`);
  const blob = await (await fetch(dataUrl)).blob();
  await uploadBytes(photoRef, blob);
  return getDownloadURL(photoRef);
}

/**
 * Uploads a manually-entered book's cover (as a `data:image/jpeg;base64,...`
 * URI) to Firebase Storage and returns its public download URL — mirrors
 * `uploadSentencePhoto`'s fetch()-through-blob approach.
 */
export async function uploadBookCover(uid: string, dataUrl: string): Promise<string> {
  const coverRef = ref(storage, `users/${uid}/book-covers/${Date.now()}.jpg`);
  const blob = await (await fetch(dataUrl)).blob();
  await uploadBytes(coverRef, blob);
  return getDownloadURL(coverRef);
}

/** Upserts fields on the top-level `users/{uid}` profile document. */
export async function updateUserDoc(
  uid: string,
  patch: { displayName?: string; photoURL?: string | null },
): Promise<void> {
  await setDoc(doc(db, 'users', uid), withoutUndefined(patch), { merge: true });
}

export type NotificationPreferences = {
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  expoPushToken?: string | null;
};

function notificationPreferencesDoc(uid: string) {
  return doc(db, 'users', uid, 'userSettings', 'preferences');
}

export async function getNotificationPreferences(
  uid: string,
): Promise<NotificationPreferences | null> {
  const snap = await getDoc(notificationPreferencesDoc(uid));
  return snap.exists() ? (snap.data() as NotificationPreferences) : null;
}

export async function saveNotificationPreferences(
  uid: string,
  patch: NotificationPreferences,
): Promise<void> {
  await setDoc(notificationPreferencesDoc(uid), withoutUndefined(patch), { merge: true });
}

export type ReadingGoals = {
  dailyMinutes: number;
  monthlyBooks: number;
  yearlyBooks: number;
};

export const DEFAULT_READING_GOALS: ReadingGoals = {
  dailyMinutes: 30,
  monthlyBooks: 3,
  yearlyBooks: 36,
};

function readingGoalsDoc(uid: string) {
  return doc(db, 'users', uid, 'userSettings', 'readingGoals');
}

export async function getReadingGoals(uid: string): Promise<ReadingGoals> {
  const snap = await getDoc(readingGoalsDoc(uid));
  return snap.exists()
    ? { ...DEFAULT_READING_GOALS, ...(snap.data() as Partial<ReadingGoals>) }
    : DEFAULT_READING_GOALS;
}

export async function saveReadingGoals(uid: string, goals: ReadingGoals): Promise<void> {
  await setDoc(readingGoalsDoc(uid), goals, { merge: true });
}

/** Daily reading-session minutes, keyed by "YYYY.MM.DD" (see todayLabel). Powers the "오늘의 독서" goal on the reading-goal screen. */
function readingLogDoc(uid: string) {
  return doc(db, 'users', uid, 'userSettings', 'readingLog');
}

export async function getReadingLog(uid: string): Promise<Record<string, number>> {
  const snap = await getDoc(readingLogDoc(uid));
  return snap.exists() ? (snap.data() as Record<string, number>) : {};
}

export async function logReadingMinutes(uid: string, minutes: number): Promise<void> {
  if (minutes <= 0) return;
  await setDoc(readingLogDoc(uid), { [todayLabel()]: increment(minutes) }, { merge: true });
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

/**
 * `progress` only ever tracks forward: the furthest page a saved 갈피 has
 * referenced, as a % of totalPages. It doesn't recompute from scratch (that
 * would mean scanning every sentence for the book on each write) and doesn't
 * regress on edit-down or delete — "how far you've read" shouldn't drop just
 * because a note was edited or removed.
 */
function furthestPagePatch(book: Book | undefined, page: number): Record<string, unknown> {
  if (!book?.totalPages) return {};
  const furthestPage = Math.max(book.furthestPage ?? 0, page);
  return {
    furthestPage,
    progress: Math.min(100, Math.round((furthestPage / book.totalPages) * 100)),
  };
}

export async function addSentenceDoc(
  uid: string,
  sentence: Omit<Sentence, 'id' | 'date'>,
): Promise<void> {
  const bookRef = doc(booksCol(uid), sentence.bookId);
  const sentenceRef = doc(sentencesCol(uid));
  await runTransaction(db, async (tx) => {
    const bookSnap = await tx.get(bookRef);
    const book = bookSnap.exists() ? (bookSnap.data() as Book) : undefined;

    tx.set(sentenceRef, withoutUndefined({ ...sentence, date: todayLabel() }));
    tx.update(bookRef, { galpiCount: increment(1), ...furthestPagePatch(book, sentence.page) });
  });
}

export async function updateSentenceDoc(
  uid: string,
  sentenceId: string,
  changes: { page: number; quote: string; memo?: string },
): Promise<void> {
  const sentenceRef = doc(sentencesCol(uid), sentenceId);
  await runTransaction(db, async (tx) => {
    const sentenceSnap = await tx.get(sentenceRef);
    const bookId = sentenceSnap.exists() ? (sentenceSnap.data() as Sentence).bookId : undefined;
    const bookRef = bookId ? doc(booksCol(uid), bookId) : null;
    const bookSnap = bookRef ? await tx.get(bookRef) : null;
    const book = bookSnap?.exists() ? (bookSnap.data() as Book) : undefined;

    tx.update(sentenceRef, {
      page: changes.page,
      quote: changes.quote,
      memo: changes.memo === undefined ? deleteField() : changes.memo,
    });
    if (bookRef) {
      const patch = furthestPagePatch(book, changes.page);
      if (Object.keys(patch).length > 0) tx.update(bookRef, patch);
    }
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
