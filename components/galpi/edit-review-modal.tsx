import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { useThemeColors } from '../../lib/theme';

export function EditReviewModal({
  review,
  onClose,
  onSave,
}: {
  review: string;
  onClose: () => void;
  onSave: (review: string) => Promise<void>;
}) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState(review);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await onSave(draft.trim());
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
          <Text className="text-base font-black text-foreground">{review ? '총평 수정' : '총평 남기기'}</Text>
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
      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline
        numberOfLines={5}
        autoFocus
        placeholder="이 책은 어땠나요? 짧게 남겨보세요."
        placeholderTextColor={colors.mutedForeground}
        textAlignVertical="top"
        className="w-full rounded-2xl border border-input bg-card p-4 text-sm leading-relaxed text-foreground focus:border-ring"
        style={{ minHeight: 140 }}
      />

      {error ? <Text className="mt-3 text-[12px] text-destructive">{error}</Text> : null}

      <Pressable
        onPress={handleSave}
        disabled={submitting}
        className={`web:cursor-pointer mt-5 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 ${
          submitting ? 'opacity-60' : ''
        }`}
      >
        {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : null}
        <Text className="text-sm font-bold text-primary-foreground">{submitting ? '저장 중...' : '저장하기'}</Text>
      </Pressable>
    </BottomSheet>
  );
}
