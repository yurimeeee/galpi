import { router } from 'expo-router';
import { MainLibraryScreen } from '../../components/screens/library-screen';
import { useAppStore } from '../../lib/store';
import type { Book } from '../../lib/data/books';

export default function Library() {
  const books = useAppStore((s) => s.books);

  function openBook(book: Book) {
    router.push(`/book/${book.id}`);
  }

  return <MainLibraryScreen books={books} onOpenBook={openBook} />;
}
