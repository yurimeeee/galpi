import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { addSentenceDoc } from './data-service';
import { type Book } from './data/books';
import { type Sentence } from './data/sentences';

export type Gate = 'loading' | 'onboarding' | 'login' | 'signup' | 'app';

type NewSentence = Omit<Sentence, 'id' | 'date'>;

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

  bookById: (id: string) => Book | undefined;
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

  bookById: (id) => get().books.find((b) => b.id === id),
  activeReadingBook: () => {
    const { books } = get();
    return books.find((b) => b.status === 'reading') ?? books[0];
  },
}));
