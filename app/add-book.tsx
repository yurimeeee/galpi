import { router } from 'expo-router';
import { AddBookScreen, type ManualBookInput } from '../components/screens/add-book-screen';
import { useAppStore } from '../lib/store';
import { lookupAladinTotalPages, type AladinBookResult } from '../lib/aladin-books';

export default function AddBook() {
  const addBook = useAppStore((s) => s.addBook);
  const uploadBookCover = useAppStore((s) => s.uploadBookCover);

  async function handleAdd(result: AladinBookResult) {
    const totalPages = await lookupAladinTotalPages(result.itemId);
    await addBook({
      title: result.title,
      author: result.author || '저자 미상',
      coverUrl: result.thumbnail || undefined,
      totalPages: totalPages ?? undefined,
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
