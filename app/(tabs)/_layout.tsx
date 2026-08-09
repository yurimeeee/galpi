import { useState } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BottomNav, type NavKey } from '../../components/galpi/bottom-nav';
import { AddChoiceSheet } from '../../components/galpi/add-choice-sheet';
import { useAppStore } from '../../lib/store';
import type { Book } from '../../lib/data/books';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const books = useAppStore((s) => s.books);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const active: NavKey = pathname.endsWith('/stats')
    ? 'stats'
    : pathname.endsWith('/mypage')
      ? 'mypage'
      : 'library';

  function handleChange(key: NavKey) {
    if (key === 'add') {
      setAddSheetOpen(true);
      return;
    }
    if (key === 'library') router.push('/library');
    else router.push(`/${key}`);
  }

  function handleAddNewBook() {
    setAddSheetOpen(false);
    router.push('/add-book');
  }

  function handlePickBook(book: Book) {
    setAddSheetOpen(false);
    router.push(`/add-sentence?bookId=${book.id}`);
  }

  function handleStartTimer() {
    setAddSheetOpen(false);
    router.push('/reading-timer');
  }

  return (
    <View className="flex-1 bg-background">
      <View className="min-h-0 flex-1">
        <Slot />
      </View>
      <BottomNav active={active} onChange={handleChange} />

      {addSheetOpen ? (
        <AddChoiceSheet
          books={books}
          onClose={() => setAddSheetOpen(false)}
          onAddNewBook={handleAddNewBook}
          onPickBook={handlePickBook}
          onStartTimer={handleStartTimer}
        />
      ) : null}
    </View>
  );
}
