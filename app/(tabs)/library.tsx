import { Alert } from 'react-native';
import { router } from 'expo-router';
import { LibrarySkeleton, MainLibraryScreen } from '../../components/screens/library-screen';
import { useAppStore } from '../../lib/store';
import { useReadingGoals } from '../../lib/use-reading-goals';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';

export default function Library() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const booksLoaded = useAppStore((s) => s.booksLoaded);
  const { currentStreak, todayMinutes, goals } = useReadingGoals();

  function openBook(book: Book) {
    router.push(`/book/${book.id}`);
  }

  function openSentence(sentence: Sentence) {
    router.push(`/edit-sentence?sentenceId=${sentence.id}`);
  }

  function addBook() {
    router.push('/add-book');
  }

  function openFavorites() {
    router.push('/favorites');
  }

  function openCollections() {
    router.push('/collections');
  }

  function startTimer() {
    router.push('/reading-timer');
  }

  function reorderBooks(orderedBookIds: string[]) {
    useAppStore.getState().reorderBooks(orderedBookIds).catch(() => {
      Alert.alert('저장 실패', '서재 순서를 저장하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
    });
  }

  if (books.length === 0 && !booksLoaded) {
    return <LibrarySkeleton />;
  }

  return (
    <MainLibraryScreen
      books={books}
      sentences={sentences}
      onOpenBook={openBook}
      onOpenSentence={openSentence}
      onAddBook={addBook}
      onReorderBooks={reorderBooks}
      onOpenFavorites={openFavorites}
      onOpenCollections={openCollections}
      currentStreak={currentStreak}
      todayMinutes={todayMinutes}
      dailyGoalMinutes={goals.dailyMinutes}
      onStartTimer={startTimer}
    />
  );
}
