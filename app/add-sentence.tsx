import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { AddSentenceScreen } from '../components/screens/add-sentence-screen';
import { useAppStore } from '../lib/store';

export default function AddSentence() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const addSentence = useAppStore((s) => s.addSentence);
  const bookById = useAppStore((s) => s.bookById);
  const activeReadingBook = useAppStore((s) => s.activeReadingBook);

  const book = (bookId ? bookById(bookId) : undefined) ?? activeReadingBook();

  if (!book) {
    return <Redirect href="/library" />;
  }

  return (
    <AddSentenceScreen
      bookId={book.id}
      bookTitle={book.title}
      onBack={() => router.back()}
      onSave={(sentence) => {
        addSentence(sentence).catch((err) => console.error('Failed to save sentence', err));
      }}
    />
  );
}
