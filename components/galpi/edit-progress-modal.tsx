import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import type { Book } from '../../lib/data/books';
import { useThemeColors } from '../../lib/theme';

export function EditProgressModal({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (patch: { totalPages: number; furthestPage: number; progress: number }) => Promise<void>;
}) {
  const colors = useThemeColors();
  const [totalPages, setTotalPages] = useState(book.totalPages ? String(book.totalPages) : '');
  const [currentPage, setCurrentPage] = useState(book.furthestPage ? String(book.furthestPage) : '');
  const [trackWidth, setTrackWidth] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalPagesNum = Number(totalPages);
  const currentPageNum = Number(currentPage);
  const hasValidTotal = totalPages.trim() !== '' && Number.isFinite(totalPagesNum) && totalPagesNum > 0;
  const canSave =
    !submitting &&
    hasValidTotal &&
    currentPage.trim() !== '' &&
    Number.isFinite(currentPageNum) &&
    currentPageNum >= 0;

  const previewProgress = hasValidTotal
    ? Math.min(100, Math.max(0, Math.round((currentPageNum / totalPagesNum) * 100)))
    : book.progress;

  /** Drives both the drag-to-set slider and tap-to-jump on the track — ratio is the touch x-position as a 0~1 fraction of trackWidth. */
  function setPageFromRatio(ratio: number) {
    const page = Math.round(Math.max(0, Math.min(1, ratio)) * totalPagesNum);
    setCurrentPage(String(page));
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (trackWidth <= 0) return;
      runOnJS(setPageFromRatio)(e.x / trackWidth);
    })
    .onUpdate((e) => {
      if (trackWidth <= 0) return;
      runOnJS(setPageFromRatio)(e.x / trackWidth);
    });

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSubmitting(true);
    try {
      // 총 페이지보다 큰 현재 페이지는 총 페이지로 맞춰 저장 — 별도 에러 없이 자연스럽게 100%로 처리.
      const clampedPage = Math.min(currentPageNum, totalPagesNum);
      await onSave({
        totalPages: totalPagesNum,
        furthestPage: clampedPage,
        progress: Math.min(100, Math.round((clampedPage / totalPagesNum) * 100)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했어요.');
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      header={
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground">읽은 정도 수정</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>
      }
    >
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-1.5 text-[13px] font-semibold text-foreground">총 페이지</Text>
          <TextInput
            value={totalPages}
            onChangeText={setTotalPages}
            keyboardType="numeric"
            placeholder="예: 314"
            placeholderTextColor={colors.mutedForeground}
            className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[14px] text-foreground focus:border-ring"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1.5 text-[13px] font-semibold text-foreground">현재 페이지</Text>
          <TextInput
            value={currentPage}
            onChangeText={setCurrentPage}
            keyboardType="numeric"
            placeholder="예: 128"
            placeholderTextColor={colors.mutedForeground}
            className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[14px] text-foreground focus:border-ring"
          />
        </View>
      </View>

      <View className="mt-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[13px] font-semibold text-foreground">읽은 정도</Text>
          <Text className="text-sm font-black text-foreground">{previewProgress}%</Text>
        </View>

        {hasValidTotal ? (
          <GestureDetector gesture={pan}>
            <View
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              className="web:cursor-pointer h-8 justify-center"
            >
              <View className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <View className="h-full rounded-full bg-primary" style={{ width: `${previewProgress}%` }} />
              </View>
              <View
                pointerEvents="none"
                className="absolute h-6 w-6 items-center justify-center rounded-full bg-primary"
                style={{
                  left: `${previewProgress}%`,
                  marginLeft: -12,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                }}
              />
            </View>
          </GestureDetector>
        ) : (
          <View className="h-8 justify-center">
            <View className="h-2.5 w-full overflow-hidden rounded-full bg-secondary opacity-50" />
          </View>
        )}

        <Text className="mt-2 text-center text-[11px] text-muted-foreground">
          {hasValidTotal ? '밀어서 읽은 정도를 조절할 수 있어요' : '총 페이지를 입력하면 밀어서 조절할 수 있어요'}
        </Text>
      </View>

      {error ? <Text className="mt-3 text-[12px] text-destructive">{error}</Text> : null}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        className={`web:cursor-pointer mt-6 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 ${
          !canSave ? 'opacity-50' : ''
        }`}
      >
        {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : null}
        <Text className="text-sm font-bold text-primary-foreground">{submitting ? '저장 중...' : '저장하기'}</Text>
      </Pressable>
    </BottomSheet>
  );
}
