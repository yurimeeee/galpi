import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { AddSentenceScreen } from '../components/screens/add-sentence-screen';
import { useAppStore } from '../lib/store';
import { allTags } from '../lib/data/sentences';

export default function AddSentence() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const addSentence = useAppStore((s) => s.addSentence);
  const uploadSentencePhoto = useAppStore((s) => s.uploadSentencePhoto);
  const bookById = useAppStore((s) => s.bookById);
  const activeReadingBook = useAppStore((s) => s.activeReadingBook);
  const sentences = useAppStore((s) => s.sentences);

  const book = (bookId ? bookById(bookId) : undefined) ?? activeReadingBook();

  if (!book) {
    return <Redirect href="/library" />;
  }

  return (
    <AddSentenceScreen
      bookId={book.id}
      bookTitle={book.title}
      tagSuggestions={allTags(sentences).map((t) => t.tag)}
      onBack={() => router.back()}
      onSave={addSentence}
      onUploadPhoto={uploadSentencePhoto}
    />
  );
}
