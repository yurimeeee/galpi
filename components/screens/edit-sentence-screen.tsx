import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert } from '../../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, Trash2, Check } from '../../lib/icons';
import { Button } from '../galpi/button';
import { IconButton } from '../galpi/icon-button';
import { ScreenHeader } from '../galpi/screen-header';
import { SentenceCardModal } from '../galpi/sentence-card-modal';
import { TagInput } from '../galpi/tag-input';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';
import { useThemeColors } from '../../lib/theme';

export function EditSentenceScreen({
  sentence,
  book,
  tagSuggestions,
  onBack,
  onSave,
  onDelete,
}: {
  sentence: Sentence;
  book: Book;
  tagSuggestions?: string[];
  onBack: () => void;
  onSave: (changes: { page: number; quote: string; memo?: string; tags?: string[] }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [quote, setQuote] = useState(sentence.quote);
  const [page, setPage] = useState(String(sentence.page || ''));
  const [memo, setMemo] = useState(sentence.memo ?? '');
  const [tags, setTags] = useState<string[]>(sentence.tags ?? []);
  const [busy, setBusy] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const colors = useThemeColors();

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      await onSave({
        page: Number(page) || 0,
        quote: quote.trim() || sentence.quote,
        memo: memo.trim() || undefined,
        tags,
      });
      onBack();
    } catch (err) {
      showAlert(
        '갈피 수정에 실패했어요',
        err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.',
      );
      setBusy(false);
    }
  }

  function handleDelete() {
    showAlert('갈피를 삭제할까요?', '삭제한 갈피는 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await onDelete();
            onBack();
          } catch (err) {
            showAlert(
              '갈피 삭제에 실패했어요',
              err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.',
            );
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <ScreenHeader
        title="갈피 수정하기"
        subtitle={book.title}
        onBack={onBack}
        backLabel="닫기"
        right={
          <>
            <IconButton Icon={Share2} label="갈피 카드로 공유" onPress={() => setCardOpen(true)} disabled={busy} />
            <IconButton
              Icon={Trash2}
              label="갈피 삭제"
              onPress={handleDelete}
              disabled={busy}
              iconColor={colors.destructive}
            />
          </>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 min-h-0">
        <ScrollView
          className="flex-1 px-5 py-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="gap-4">
            {sentence.type === 'photo' && sentence.photoUrl ? (
              <Field label="페이지 사진">
                <View className="h-40 w-full overflow-hidden rounded-xl bg-secondary">
                  <Image
                    source={{ uri: sentence.photoUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                    accessibilityLabel="촬영한 페이지 미리보기"
                  />
                </View>
              </Field>
            ) : null}

            <Field label="문장">
              <TextInput
                value={quote}
                onChangeText={setQuote}
                multiline
                numberOfLines={5}
                placeholder="마음에 담고 싶은 문장을 적어주세요."
                placeholderTextColor={colors.mutedForeground}
                textAlignVertical="top"
                className="w-full rounded-xl border border-border bg-card p-4 text-md leading-relaxed text-foreground focus:border-ring"
                style={{ minHeight: 120 }}
              />
            </Field>

            <Field label="페이지">
              <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5">
                <Text className="tabular-nums text-sm font-bold text-muted-foreground">P.</Text>
                <TextInput
                  value={page}
                  onChangeText={setPage}
                  keyboardType="numeric"
                  placeholder="124"
                  placeholderTextColor={colors.mutedForeground}
                  className="flex-1 tabular-nums text-sm text-foreground"
                />
              </View>
            </Field>

            <Field label="메모">
              <TextInput
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={3}
                placeholder="이 문장에 대한 생각을 남겨보세요. (선택)"
                placeholderTextColor={colors.mutedForeground}
                textAlignVertical="top"
                className="w-full rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground focus:border-ring"
                style={{ minHeight: 80 }}
              />
            </Field>

            <Field label="태그">
              <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
            </Field>
          </View>
        </ScrollView>

        <View className="border-t border-border bg-card/80 px-5 py-4 web:backdrop-blur">
          <Button label={busy ? '저장 중...' : '수정 완료'} Icon={Check} onPress={handleSave} loading={busy} />
        </View>
      </KeyboardAvoidingView>

      {cardOpen ? (
        <SentenceCardModal book={book} sentence={sentence} onClose={() => setCardOpen(false)} />
      ) : null}
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      {children}
    </View>
  );
}
