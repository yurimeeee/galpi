import { useCallback, useState } from 'react';
import { Tabs, router } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { BottomNav, type NavKey } from '../../components/galpi/bottom-nav';
import { AddChoiceSheet } from '../../components/galpi/add-choice-sheet';
import type { Book } from '../../lib/data/books';

export default function TabsLayout() {
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

  // Stable identity: an inline `tabBar` function is a new prop on every
  // layout render, which re-renders BottomNav (and its Reanimated lift)
  // along with it.
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <CustomTabBar {...props} onAddPress={() => setAddSheetOpen(true)} />,
    [],
  );

  return (
    <View className="flex-1 bg-background">
      {/*
        Tabs (not Slot + router.push) so 내 서재/독서 통계/마이페이지 stay
        mounted after their first visit instead of fully unmounting on every
        switch — that unmount/remount was the source of the flicker on nav
        (scroll position reset, images re-decoding, skeletons flashing).
      */}
      <Tabs
        // `animation: 'fade'` is a known SDK 54 expo-router Tabs bug: it can
        // leave the outgoing screen's touch responder in a broken state,
        // intermittently swallowing scroll/tap gestures on the screen you
        // land on until something forces a re-layout. See
        // https://github.com/expo/expo/issues/39587
        screenOptions={{ headerShown: false }}
        tabBar={renderTabBar}
      >
        <Tabs.Screen name="library" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="mypage" />
      </Tabs>

      {/*
        The sheet reads `books` from the store itself, so book snapshots
        only re-render it while it's open — not the whole Tabs tree.
      */}
      {addSheetOpen ? (
        <AddChoiceSheet
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
