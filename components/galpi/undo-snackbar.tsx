import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';

const AUTO_DISMISS_MS = 5000;

/**
 * Global "실행취소" toast for destructive deletes — mounted once at the app
 * root (see app/_layout.tsx) so it survives navigating away from the screen
 * the delete happened on (e.g. deleting a book pops back to the library
 * while this stays up), mirroring how ReadingTimerWidget is mounted.
 */
export function UndoSnackbar() {
  const pendingUndo = useAppStore((s) => s.pendingUndo);
  const clearUndo = useAppStore((s) => s.clearUndo);
  const insets = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingUndo) return;
    timerRef.current = setTimeout(clearUndo, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingUndo, clearUndo]);

  if (!pendingUndo) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <View className="mx-5 w-full max-w-[420px] flex-row items-center justify-between rounded-2xl bg-galpi-ink px-4 py-3.5">
        <Text className="mr-3 flex-1 text-[13px] font-bold text-galpi-paper" numberOfLines={1}>
          {pendingUndo.message}
        </Text>
        <Pressable
          onPress={() => {
            const { onUndo } = pendingUndo;
            clearUndo();
            onUndo();
          }}
          hitSlop={10}
          accessibilityLabel="실행취소"
          className="web:cursor-pointer"
        >
          <Text className="text-[13px] font-black text-galpi-yellow">실행취소</Text>
        </Pressable>
      </View>
    </View>
  );
}
