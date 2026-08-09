import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { BookDetailScreen } from '../../components/screens/book-detail-screen';
import { useAppStore } from '../../lib/store';
import { sentencesByBook } from '../../lib/data/sentences';

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useAppStore((s) => s.bookById(id));
  const allSentences = useAppStore((s) => s.sentences);

  if (!book) {
    return <Redirect href="/library" />;
  }

  return (
    <BookDetailScreen
      book={book}
      sentences={sentencesByBook(allSentences, book.id)}
      onBack={() => router.back()}
      onAddSentence={() => router.push(`/add-sentence?bookId=${book.id}`)}
    />
  );
}
