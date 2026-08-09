import { router } from 'expo-router';
import { AddBookScreen } from '../components/screens/add-book-screen';
import { useAppStore } from '../lib/store';
import type { KakaoBookResult } from '../lib/kakao-books';

export default function AddBook() {
  const addBook = useAppStore((s) => s.addBook);

  async function handleAdd(result: KakaoBookResult) {
    await addBook({
      title: result.title,
      author: result.authors.join(', ') || '저자 미상',
      coverUrl: result.thumbnail || undefined,
    });
  }

  return <AddBookScreen onBack={() => router.back()} onAdd={handleAdd} />;
}
