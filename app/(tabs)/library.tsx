import { router } from 'expo-router';
import { LibrarySkeleton, MainLibraryScreen } from '../../components/screens/library-screen';
import { useAppStore } from '../../lib/store';
import type { Book } from '../../lib/data/books';

export default function Library() {
  const books = useAppStore((s) => s.books);
  const booksLoaded = useAppStore((s) => s.booksLoaded);

  function openBook(book: Book) {
    router.push(`/book/${book.id}`);
  }

  function addBook() {
    router.push('/add-book');
  }

  if (books.length === 0 && !booksLoaded) {
    return <LibrarySkeleton />;
  }

  return <MainLibraryScreen books={books} onOpenBook={openBook} onAddBook={addBook} />;
}
