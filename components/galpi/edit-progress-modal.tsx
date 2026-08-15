import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalPagesNum = Number(totalPages);
  const currentPageNum = Number(currentPage);
  const canSave =
    !submitting &&
    totalPages.trim() !== '' &&
    currentPage.trim() !== '' &&
    Number.isFinite(totalPagesNum) &&
    Number.isFinite(currentPageNum) &&
    totalPagesNum > 0 &&
    currentPageNum >= 0;

  const previewProgress = canSave
    ? Math.min(100, Math.round((currentPageNum / totalPagesNum) * 100))
    : book.progress;

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

      <Text className="mt-4 text-center text-xs text-muted-foreground">
        예상 진행률 <Text className="font-bold text-foreground">{previewProgress}%</Text>
      </Text>

      {error ? <Text className="mt-3 text-[12px] text-destructive">{error}</Text> : null}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        className={`web:cursor-pointer mt-6 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4 ${
          !canSave ? 'opacity-50' : ''
        }`}
      >
        {submitting ? <ActivityIndicator color={colors.galpiPaper} /> : null}
        <Text className="text-sm font-bold text-galpi-paper">{submitting ? '저장 중...' : '저장하기'}</Text>
      </Pressable>
    </BottomSheet>
  );
}
