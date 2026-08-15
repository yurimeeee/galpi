import { useState } from 'react';
import { Tabs, router } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { BottomNav, type NavKey } from '../../components/galpi/bottom-nav';
import { AddChoiceSheet } from '../../components/galpi/add-choice-sheet';
import { useAppStore } from '../../lib/store';
import type { Book } from '../../lib/data/books';

export default function TabsLayout() {
  const books = useAppStore((s) => s.books);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

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
      {/*
        Tabs (not Slot + router.push) so 내 서재/독서 통계/마이페이지 stay
        mounted after their first visit instead of fully unmounting on every
        switch — that unmount/remount was the source of the flicker on nav
        (scroll position reset, images re-decoding, skeletons flashing).
      */}
      <Tabs
        screenOptions={{ headerShown: false, animation: 'fade' }}
        tabBar={(props) => <CustomTabBar {...props} onAddPress={() => setAddSheetOpen(true)} />}
      >
        <Tabs.Screen name="library" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="mypage" />
      </Tabs>

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

function CustomTabBar({
  state,
  navigation,
  onAddPress,
}: BottomTabBarProps & { onAddPress: () => void }) {
  const active = state.routes[state.index].name as NavKey;

  function handleChange(key: NavKey) {
    if (key === 'add') {
      onAddPress();
      return;
    }
    navigation.navigate(key);
  }

  return <BottomNav active={active} onChange={handleChange} />;
}
