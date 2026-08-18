import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { BookDetailScreen, BookDetailSkeleton } from '../../components/screens/book-detail-screen';
import { useAppStore } from '../../lib/store';
import { useReadingReminder } from '../../lib/use-reading-reminder';
import { sentencesByBook } from '../../lib/data/sentences';

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useAppStore((s) => s.bookById(id));
  const booksLoaded = useAppStore((s) => s.booksLoaded);
  const allSentences = useAppStore((s) => s.sentences);
  const updateBook = useAppStore((s) => s.updateBook);
  const deleteBook = useAppStore((s) => s.deleteBook);
  const restoreBook = useAppStore((s) => s.restoreBook);
  const showUndo = useAppStore((s) => s.showUndo);
  const setSentenceFavorite = useAppStore((s) => s.setSentenceFavorite);
  const { triggerStartReadingNotification } = useReadingReminder();

  if (!book) {
    if (!booksLoaded) {
      return <BookDetailSkeleton onBack={() => router.back()} />;
    }
    return <Redirect href="/library" />;
  }

  return (
    <BookDetailScreen
      book={book}
      sentences={sentencesByBook(allSentences, book.id)}
      onBack={() => router.back()}
      onAddSentence={() => router.push(`/add-sentence?bookId=${book.id}`)}
      onEditSentence={(sentenceId) => router.push(`/edit-sentence?sentenceId=${sentenceId}`)}
      onStartTimer={() => router.push(`/reading-timer?bookId=${book.id}`)}
      onChangeStatus={(status) => {
        updateBook(book.id, { status });
        // 아직 읽지 않은 책을 "읽는 중"으로 바꾸는 순간 = 독서 시작
        if (status === 'reading' && book.status !== 'reading') {
          triggerStartReadingNotification();
        }
      }}
      onChangeRating={(rating) => updateBook(book.id, { rating })}
      onChangeReview={(review) => updateBook(book.id, { review })}
      onEditProgress={(patch) => updateBook(book.id, patch)}
      onDeleteBook={async () => {
        const deletedBook = book;
        const deletedSentences = sentencesByBook(allSentences, book.id);
        await deleteBook(book.id);
        showUndo('책을 삭제했어요', () => restoreBook(deletedBook, deletedSentences));
      }}
      onToggleSentenceFavorite={(sentenceId, favorite) => setSentenceFavorite(sentenceId, favorite)}
    />
  );
}
