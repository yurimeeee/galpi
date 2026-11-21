import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { ReadingTimerScreen } from '../components/screens/reading-timer-screen';
import { useAppStore } from '../lib/store';

export default function ReadingTimer() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const books = useAppStore((s) => s.books);
  const bookById = useAppStore((s) => s.bookById);
  const activeReadingBook = useAppStore((s) => s.activeReadingBook);
  const booksLoaded = useAppStore((s) => s.booksLoaded);

  const book = (bookId ? bookById(bookId) : undefined) ?? activeReadingBook();

  if (!book) {
    // Wait for the first snapshot before deciding there's nothing to time —
    // a reload on /reading-timer starts with an empty, not-yet-loaded library.
    if (!booksLoaded) return null;
    return <Redirect href="/library" />;
  }

  return <ReadingTimerScreen initialBook={book} books={books} onBack={() => router.back()} />;
}
