import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { ReadingTimerScreen } from '../components/screens/reading-timer-screen';
import { useAppStore } from '../lib/store';

export default function ReadingTimer() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const books = useAppStore((s) => s.books);
  const bookById = useAppStore((s) => s.bookById);
  const activeReadingBook = useAppStore((s) => s.activeReadingBook);

  const book = (bookId ? bookById(bookId) : undefined) ?? activeReadingBook();

  if (!book) {
    return <Redirect href="/library" />;
  }

  return <ReadingTimerScreen initialBook={book} books={books} onBack={() => router.back()} />;
}
