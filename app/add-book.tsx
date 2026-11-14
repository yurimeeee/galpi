import { router } from 'expo-router';
import { AddBookScreen, type ManualBookInput } from '../components/screens/add-book-screen';
import { useAppStore } from '../lib/store';
import type { BookSearchResult } from '../lib/book-search';

export default function AddBook() {
  const addBook = useAppStore((s) => s.addBook);
  const uploadBookCover = useAppStore((s) => s.uploadBookCover);

  async function handleAdd(result: BookSearchResult) {
    // YES24's API has no page count — the user can set totalPages later from
    // the book detail screen's progress editor.
    await addBook({
      title: result.title,
      author: result.author || '저자 미상',
      coverUrl: result.thumbnail || undefined,
      genre: result.genre || undefined,
    });
  }

  async function handleAddManual(input: ManualBookInput) {
    await addBook(input);
  }

  return (
    <AddBookScreen
      onBack={() => router.back()}
      onAdd={handleAdd}
      onAddManual={handleAddManual}
      onUploadCover={uploadBookCover}
    />
  );
}
