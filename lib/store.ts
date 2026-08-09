import { create } from 'zustand';
import type { User } from 'firebase/auth';
import {
  addBookDoc,
  addSentenceDoc,
  deleteSentenceDoc,
  updateBookDoc,
  updateSentenceDoc,
  uploadSentencePhoto as uploadSentencePhotoDoc,
} from './data-service';
import { type Book } from './data/books';
import { type Sentence } from './data/sentences';
import { ACCENT_CYCLE } from './theme';

export type Gate = 'loading' | 'onboarding' | 'login' | 'signup' | 'app';

type NewSentence = Omit<Sentence, 'id' | 'date'>;
type NewBook = { title: string; author: string; coverUrl?: string };

type AppState = {
  gate: Gate;
  user: User | null;
  books: Book[];
  sentences: Sentence[];

  setUser: (user: User | null) => void;
  setBooks: (books: Book[]) => void;
  setSentences: (sentences: Sentence[]) => void;

  completeOnboarding: () => void;
  goToSignup: () => void;
  goToLogin: () => void;

  addSentence: (sentence: NewSentence) => Promise<void>;
  updateSentence: (id: string, changes: { page: number; quote: string; memo?: string }) => Promise<void>;
  deleteSentence: (id: string) => Promise<void>;
  addBook: (book: NewBook) => Promise<void>;
  updateBook: (bookId: string, patch: Partial<Pick<Book, 'status' | 'rating'>>) => Promise<void>;
  uploadSentencePhoto: (dataUrl: string) => Promise<string>;

  bookById: (id: string) => Book | undefined;
  sentenceById: (id: string) => Sentence | undefined;
  /** The book currently being read — default target for "갈피 남기기". */
  activeReadingBook: () => Book | undefined;
};

export const useAppStore = create<AppState>((set, get) => ({
  gate: 'loading',
  user: null,
  books: [],
  sentences: [],

  setUser: (user) => set({ user }),
  setBooks: (books) => set({ books }),
  setSentences: (sentences) => set({ sentences }),

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

  addBook: async ({ title, author, coverUrl }) => {
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
    };
    await addBookDoc(uid, book, order);
  },

  updateBook: async (bookId, patch) => {
    const uid = get().user?.uid;
    if (!uid) return;
    await updateBookDoc(uid, bookId, patch);
  },

  uploadSentencePhoto: async (dataUrl) => {
    const uid = get().user?.uid;
    if (!uid) throw new Error('로그인이 필요해요.');
    return uploadSentencePhotoDoc(uid, dataUrl);
  },

  bookById: (id) => get().books.find((b) => b.id === id),
  sentenceById: (id) => get().sentences.find((s) => s.id === id),
  activeReadingBook: () => {
    const { books } = get();
    return books.find((b) => b.status === 'reading') ?? books[0];
  },
}));
