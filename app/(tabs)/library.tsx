import { router } from 'expo-router';
import { LibrarySkeleton, MainLibraryScreen } from '../../components/screens/library-screen';
import { useAppStore } from '../../lib/store';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';

export default function Library() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const booksLoaded = useAppStore((s) => s.booksLoaded);

  function openBook(book: Book) {
    router.push(`/book/${book.id}`);
  }

  function openSentence(sentence: Sentence) {
    router.push(`/edit-sentence?sentenceId=${sentence.id}`);
  }

  function addBook() {
    router.push('/add-book');
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
    />
  );
}
