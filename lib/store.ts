import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import {
  addBookDoc,
  addSentenceDoc,
  deleteBookDoc,
  deleteSentenceDoc,
  reorderBooksDoc,
  restoreBookDoc,
  restoreSentenceDoc,
  setSentenceFavoriteDoc,
  updateBookDoc,
  updateSentenceDoc,
  uploadBookCover as uploadBookCoverDoc,
  uploadSentencePhoto as uploadSentencePhotoDoc,
  DEFAULT_READING_GOALS,
  type ReadingGoals,
} from './data-service';
import { type Book } from './data/books';
import { type Sentence } from './data/sentences';
import { ACCENT_CYCLE } from './theme';

export type Gate = 'loading' | 'onboarding' | 'login' | 'signup' | 'app';

type NewSentence = Omit<Sentence, 'id' | 'date' | 'hour'>;
type NewBook = { title: string; author: string; coverUrl?: string; totalPages?: number; genre?: string };

/** A dismissible "실행취소" snackbar request — see `showUndo`. */
type PendingUndo = { id: number; message: string; onUndo: () => void };

type AppState = {
  gate: Gate;
  user: User | null;
  books: Book[];
  sentences: Sentence[];
  /** True once the first Firestore snapshot has arrived for this session. */
  booksLoaded: boolean;
  sentencesLoaded: boolean;
  /** Daily reading-timer minutes, keyed by "YYYY.MM.DD" — live-synced so a session logged from any screen is visible everywhere immediately (see lib/use-auth-sync.ts). */
  readingLog: Record<string, number>;
  readingGoals: ReadingGoals;
  readingGoalsLoaded: boolean;
  /** Set by a destructive action to surface a global "실행취소" toast (see components/galpi/undo-snackbar.tsx), which survives navigating away from the screen the action happened on. */
  pendingUndo: PendingUndo | null;

  setUser: (user: User | null) => void;
  setBooks: (books: Book[]) => void;
  setSentences: (sentences: Sentence[]) => void;
  setReadingLog: (log: Record<string, number>) => void;
  setReadingGoals: (goals: ReadingGoals) => void;
  showUndo: (message: string, onUndo: () => void) => void;
  clearUndo: () => void;

  completeOnboarding: () => void;
  goToSignup: () => void;
  goToLogin: () => void;

  addSentence: (sentence: NewSentence) => Promise<void>;
  updateSentence: (
    id: string,
    changes: { page: number; quote: string; memo?: string; tags?: string[] },
  ) => Promise<void>;
  deleteSentence: (id: string) => Promise<void>;
  setSentenceFavorite: (id: string, favorite: boolean) => Promise<void>;
  addBook: (book: NewBook) => Promise<void>;
  updateBook: (
    bookId: string,
    patch: Partial<Pick<Book, 'status' | 'rating' | 'totalPages' | 'furthestPage' | 'progress' | 'review'>>,
  ) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  /** Re-creates a deleted book and its 갈피 at their original ids — pairs with `showUndo` after `deleteBook`. */
  restoreBook: (book: Book, sentences: Sentence[]) => Promise<void>;
  /** Re-creates a deleted 갈피 at its original id — pairs with `showUndo` after `deleteSentence`. */
  restoreSentence: (sentence: Sentence) => Promise<void>;
  /** Applies a full manual reorder of the library: `orderedBookIds` is the new front-to-back id order. */
  reorderBooks: (orderedBookIds: string[]) => Promise<void>;
  uploadSentencePhoto: (dataUrl: string) => Promise<string>;
  uploadBookCover: (dataUrl: string) => Promise<string>;

  bookById: (id: string) => Book | undefined;
  sentenceById: (id: string) => Sentence | undefined;
  /** The book currently being read — default target for "갈피 남기기". */
  activeReadingBook: () => Book | undefined;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      gate: 'loading',
      user: null,
      books: [],
      sentences: [],
      booksLoaded: false,
      sentencesLoaded: false,
      readingLog: {},
      readingGoals: DEFAULT_READING_GOALS,
      readingGoalsLoaded: false,
      pendingUndo: null,

      setUser: (user) => set({ user }),
      setBooks: (books) => set({ books, booksLoaded: true }),
      setSentences: (sentences) => set({ sentences, sentencesLoaded: true }),
      setReadingLog: (readingLog) => set({ readingLog }),
      setReadingGoals: (readingGoals) => set({ readingGoals, readingGoalsLoaded: true }),
      showUndo: (message, onUndo) => set({ pendingUndo: { id: Date.now(), message, onUndo } }),
      clearUndo: () => set({ pendingUndo: null }),

      completeOnboarding: () => set({ gate: 'login' }),
      goToSignup: () => set({ gate: 'signup' }),
      goToLogin: () => set({ gate: 'login' }),

      addSentence: async (sentence) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await addSentenceDoc(uid, sentence);
      },

      updateSentence: async (id, changes) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await updateSentenceDoc(uid, id, changes);
      },

      deleteSentence: async (id) => {
        const uid = get().user?.uid;
        const sentence = get().sentences.find((s) => s.id === id);
        if (!uid || !sentence) return;
        await deleteSentenceDoc(uid, sentence);
      },

      setSentenceFavorite: async (id, favorite) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await setSentenceFavoriteDoc(uid, id, favorite);
      },

      addBook: async ({ title, author, coverUrl, totalPages, genre }) => {
        const { user, books } = get();
        const uid = user?.uid;
        if (!uid) return;
        const order = books.length;
        const book: Omit<Book, 'id'> = {
          title,
          author,
          rating: 0,
          galpiCount: 0,
          status: 'wish',
          progress: 0,
          accent: ACCENT_CYCLE[order % ACCENT_CYCLE.length],
          coverUrl,
          totalPages,
          genre,
        };
        await addBookDoc(uid, book, order);
      },

      updateBook: async (bookId, patch) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await updateBookDoc(uid, bookId, patch);
      },

      deleteBook: async (bookId) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await deleteBookDoc(uid, bookId);
      },

      restoreBook: async (book, sentences) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await restoreBookDoc(uid, book, sentences);
      },

      restoreSentence: async (sentence) => {
        const uid = get().user?.uid;
        if (!uid) return;
        await restoreSentenceDoc(uid, sentence);
      },

      /**
       * Applies optimistically so the drag UI doesn't snap back while the
       * batch write is in flight, then persists — the live subscription
       * (use-auth-sync.ts) will reconcile `books` once Firestore confirms.
       * If the write fails, reverts to the pre-reorder order — Firestore
       * never changed, so there's nothing for the live subscription to
       * reconcile back to on its own.
       */
      reorderBooks: async (orderedBookIds) => {
        const uid = get().user?.uid;
        if (!uid) return;
        const previous = get().books;
        const byId = new Map(previous.map((b) => [b.id, b]));
        const reordered = orderedBookIds.map((id) => byId.get(id)).filter((b): b is Book => !!b);
        set({ books: reordered });
        try {
          await reorderBooksDoc(uid, orderedBookIds);
        } catch (err) {
          set({ books: previous });
          throw err;
        }
      },

      uploadSentencePhoto: async (dataUrl) => {
        const uid = get().user?.uid;
        if (!uid) throw new Error('로그인이 필요해요.');
        return uploadSentencePhotoDoc(uid, dataUrl);
      },

      uploadBookCover: async (dataUrl) => {
        const uid = get().user?.uid;
        if (!uid) throw new Error('로그인이 필요해요.');
        return uploadBookCoverDoc(uid, dataUrl);
      },

      bookById: (id) => get().books.find((b) => b.id === id),
      sentenceById: (id) => get().sentences.find((s) => s.id === id),
      activeReadingBook: () => {
        const { books } = get();
        return books.find((b) => b.status === 'reading') ?? books[0];
      },
    }),
    {
      /**
       * Caches the last-known library so a relaunch/reload can render it
       * immediately instead of a skeleton, while the live Firestore
       * subscription (see use-auth-sync.ts) streams in fresh data behind it.
       * `booksLoaded`/`sentencesLoaded`/`readingGoalsLoaded` are intentionally
       * left out — they must reflect *this session's* subscription state, not
       * the cache's.
       */
      name: 'galpi-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        books: state.books,
        sentences: state.sentences,
        readingLog: state.readingLog,
        readingGoals: state.readingGoals,
      }),
    },
  ),
);
