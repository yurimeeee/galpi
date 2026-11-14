import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { showAlert } from '../../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Star,
  Plus,
  Timer,
  Trash2,
  Type,
  Camera,
  Image as ImageIcon,
  X,
  Pencil,
  Quote,
  type LucideIcon,
} from '../../lib/icons';
import { BookCover } from '../galpi/book-cover';
import { IconButton } from '../galpi/icon-button';
import { Skeleton } from '../galpi/skeleton';
import { BottomSheet } from '../galpi/bottom-sheet';
import { EditProgressModal } from '../galpi/edit-progress-modal';
import { EditReviewModal } from '../galpi/edit-review-modal';
import { SentenceCardModal } from '../galpi/sentence-card-modal';
import { type Book, type ReadingStatus, STATUS_LABEL } from '../../lib/data/books';
import { ENTRY_LABEL, type EntryType, type Sentence } from '../../lib/data/sentences';
import { ACCENT_BG_CLASS, SHADOW, useThemeColors } from '../../lib/theme';

const ENTRY_ICON: Record<EntryType, LucideIcon> = {
  text: Type,
  scan: Camera,
  photo: ImageIcon,
};

export function BookDetailScreen({
  book,
  sentences,
  onBack,
  onAddSentence,
  onEditSentence,
  onChangeStatus,
  onChangeRating,
  onChangeReview,
  onStartTimer,
  onEditProgress,
  onDeleteBook,
  onToggleSentenceFavorite,
}: {
  book: Book;
  sentences: Sentence[];
  onBack: () => void;
  onAddSentence: () => void;
  onEditSentence: (sentenceId: string) => void;
  onChangeStatus: (status: ReadingStatus) => void;
  onChangeRating: (rating: number) => void;
  onChangeReview: (review: string) => Promise<void>;
  onStartTimer: () => void;
  onEditProgress: (patch: { totalPages: number; furthestPage: number; progress: number }) => Promise<void>;
  onDeleteBook: () => Promise<void>;
  onToggleSentenceFavorite: (sentenceId: string, favorite: boolean) => void;
}) {
  const colors = useThemeColors();
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [shareSentence, setShareSentence] = useState<Sentence | null>(null);

  /** Favorites first so the picker surfaces the book's best lines up top, stable order otherwise (sentences arrive newest-first). */
  const shareCandidates = useMemo(
    () => [...sentences].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite)),
    [sentences],
  );

  function handleSharePress() {
    if (sentences.length === 0) {
      showAlert('공유할 갈피가 없어요', '먼저 이 책에 갈피를 남겨보세요.');
      return;
    }
    if (sentences.length === 1) {
      setShareSentence(sentences[0]);
      return;
    }
    setSharePickerOpen(true);
  }

  function handleDelete() {
    showAlert(
      '책을 삭제할까요?',
      `"${book.title}"과 여기에 남긴 모든 갈피가 함께 삭제돼요. 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDeleteBook();
              onBack();
            } catch (err) {
              showAlert(
                '책 삭제에 실패했어요',
                err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.',
              );
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      {/* 상단 바 */}
      <View className="min-h-11 flex-row items-center justify-between px-5 pb-3 pt-1">
        <IconButton Icon={ChevronLeft} label="뒤로 가기" onPress={onBack} iconSize={20} />
        <View className="flex-row items-center gap-2">
          <IconButton Icon={Timer} label="독서 타이머" onPress={onStartTimer} />
          <IconButton Icon={Share2} label="갈피 카드로 공유" onPress={handleSharePress} />
          <View className="mx-1 h-4 w-px bg-border" />
          <IconButton
            Icon={Trash2}
            label="책 삭제"
            onPress={handleDelete}
            loading={deleting}
            iconColor={colors.destructive}
          />
        </View>
      </View>

      <FlatList
        data={sentences}
        keyExtractor={(s) => s.id}
        contentContainerClassName="px-5 pb-28"
        renderItem={({ item }) => {
          const Icon = ENTRY_ICON[item.type];
          return (
            <Pressable
              onPress={() => onEditSentence(item.id)}
              accessibilityRole="button"
              accessibilityLabel="갈피 수정하기"
              className="web:cursor-pointer relative border-b border-border py-4 pl-1"
            >
              <View className={`absolute bottom-4 left-0 top-4 w-[3px] rounded-full ${ACCENT_BG_CLASS[book.accent]}`} />
              <View className="flex-row items-center justify-between pl-2">
                <View className="rounded-md bg-galpi-ink px-2 py-0.5">
                  <Text className="tabular-nums text-2xs font-bold text-galpi-paper">
                    P. {item.page}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2 py-1">
                    <Icon size={12} color={colors.mutedForeground} />
                    <Text className="text-2xs font-semibold text-muted-foreground">
                      {ENTRY_LABEL[item.type]}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onToggleSentenceFavorite(item.id, !item.favorite)}
                    accessibilityLabel={item.favorite ? '즐겨찾기 해제' : '즐겨찾기에 담기'}
                    hitSlop={8}
                    className="web:cursor-pointer h-6 w-6 items-center justify-center rounded-full bg-secondary"
                  >
                    <Star
                      size={12}
                      color={item.favorite ? colors.galpiYellow : colors.mutedForeground}
                      fill={item.favorite ? colors.galpiYellow : 'transparent'}
                    />
                  </Pressable>
                </View>
              </View>

              {item.type === 'photo' ? (
                item.photoUrl ? (
                  <View className="mt-3 ml-2 h-40 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      source={{ uri: item.photoUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                      accessibilityLabel="촬영한 페이지 미리보기"
                    />
                  </View>
                ) : (
                  <View
                    className={`mt-3 ml-2 h-24 justify-end gap-1.5 overflow-hidden rounded-xl ${ACCENT_BG_CLASS[book.accent]} p-3`}
                    accessibilityLabel="촬영한 페이지 미리보기"
                  >
                    <View className={`h-1.5 w-3/5 rounded-full ${book.accent === 'ink' ? 'bg-galpi-paper/40' : 'bg-galpi-ink/25'}`} />
                    <View className={`h-1.5 w-4/5 rounded-full ${book.accent === 'ink' ? 'bg-galpi-paper/40' : 'bg-galpi-ink/25'}`} />
                    <View className={`h-1.5 w-2/5 rounded-full ${book.accent === 'ink' ? 'bg-galpi-paper/40' : 'bg-galpi-ink/25'}`} />
                  </View>
                )
              ) : null}

              <Text className="mt-3 pl-2 text-md font-semibold leading-relaxed text-foreground">
                “{item.quote}”
              </Text>

              {item.memo ? (
                <Text className="mt-3 border-t border-dashed border-border pl-2 pt-3 text-xs leading-relaxed text-muted-foreground">
                  {item.memo}
                </Text>
              ) : null}

              <Text className="mt-2 pl-2 text-2xs font-medium text-muted-foreground">
                {item.date}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="rounded-xl border border-dashed border-border bg-card px-6 py-10">
            <Text className="text-center text-sm leading-relaxed text-muted-foreground">
              아직 남긴 갈피가 없어요.{'\n'}첫 문장을 담아보세요.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            {/* 히어로 */}
            <View className="flex-row gap-5">
              {/* 표지 */}
              <BookCover
                coverUrl={book.coverUrl}
                title={book.title}
                accent={book.accent}
                size="lg"
                style={SHADOW.cover}
              />

              {/* 정보 */}
              <View className="min-w-0 flex-1 justify-center">
                <Text className="text-xl font-black leading-tight text-foreground">
                  {book.title}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">{book.author}</Text>
                {book.genre ? (
                  <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
                    {book.genre.split('>').pop()}
                  </Text>
                ) : null}

                <View className="mt-3 flex-row items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < book.rating;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => onChangeRating(book.rating === i + 1 ? 0 : i + 1)}
                        accessibilityRole="button"
                        accessibilityLabel={`별점 ${i + 1}점`}
                        hitSlop={6}
                      >
                        <Star
                          size={16}
                          color={filled ? colors.galpiInk : colors.mutedForeground}
                          fill={filled ? colors.galpiInk : 'transparent'}
                          opacity={filled ? 1 : 0.4}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 읽기 상태 */}
            <View className="mt-4 flex-row gap-2">
              {(Object.keys(STATUS_LABEL) as ReadingStatus[]).map((status) => {
                const active = book.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => onChangeStatus(status)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`web:cursor-pointer flex-1 items-center rounded-full px-3 py-2 ${
                      active ? 'bg-galpi-ink' : 'bg-card'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${active ? 'text-galpi-paper' : 'text-muted-foreground'}`}
                    >
                      {STATUS_LABEL[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 총평 */}
            {book.status === 'done' ? (
              <View className="mt-4">
                <View className="mb-1.5 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">총평</Text>
                  {book.review ? (
                    <Pressable
                      onPress={() => setReviewModalOpen(true)}
                      accessibilityLabel="총평 수정"
                      hitSlop={6}
                      className="web:cursor-pointer h-6 w-6 items-center justify-center rounded-full bg-secondary"
                    >
                      <Pencil size={12} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>

                {book.review ? (
                  <View className="rounded-xl bg-galpi-ink p-4">
                    <Quote size={14} color={colors.galpiPaper} opacity={0.5} />
                    <Text className="mt-2 text-sm font-medium leading-relaxed text-galpi-paper">
                      {book.review}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setReviewModalOpen(true)}
                    accessibilityLabel="총평 남기기"
                    className="web:cursor-pointer flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-5"
                  >
                    <Pencil size={14} color={colors.mutedForeground} />
                    <Text className="text-sm font-semibold text-muted-foreground">
                      이 책은 어땠나요? 총평을 남겨보세요
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {/* 진행률 요약 */}
            <View className="mt-5 flex-row items-center gap-3 border-y border-border py-3.5">
              <StatBit label="진행도" value={`${book.progress}%`} onPress={() => setProgressModalOpen(true)} />
              <View className="h-8 w-px bg-border" />
              <StatBit label="남긴 갈피" value={`${book.galpiCount}개`} />
              <View className="h-8 w-px bg-border" />
              <StatBit label="수집 문장" value={`${sentences.length}개`} />
            </View>

            {/* 수집한 갈피 목록 */}
            <View className="mb-1 mt-8 flex-row items-baseline justify-between">
              <Text className="text-lg font-bold tracking-tight text-foreground">
                수집한 갈피
              </Text>
              <Text className="text-xs font-medium text-muted-foreground">
                총 {sentences.length}개
              </Text>
            </View>
          </View>
        }
      />

      {/* 스티키 갈피 남기기 */}
      <View className="absolute inset-x-0 bottom-0 items-center pb-6">
        {/*
          The list's bottom padding clears the button once scrolled all the
          way down, but on first render (scrollTop 0) the content is often
          only slightly taller than the viewport, so the last card's text
          sits right behind the button with a hard, awkward-looking edge.
          This scrim fades the background in behind the button so that looks
          intentional instead of like clipped/broken content.
        */}
        <View pointerEvents="none" className="absolute inset-x-0 bottom-0 h-24">
          {[0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 1].map((opacity, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colors.background, opacity }} />
          ))}
        </View>
        <Pressable
          onPress={onAddSentence}
          className="web:cursor-pointer flex-row items-center gap-2 rounded-full bg-primary px-6 py-3.5"
          style={({ pressed }) => [SHADOW.floating, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <Plus size={16} color={colors.primaryForeground} />
          <Text className="text-sm font-bold text-primary-foreground">갈피 남기기</Text>
        </Pressable>
      </View>

      {progressModalOpen ? (
        <EditProgressModal
          book={book}
          onClose={() => setProgressModalOpen(false)}
          onSave={async (patch) => {
            await onEditProgress(patch);
            setProgressModalOpen(false);
          }}
        />
      ) : null}

      {reviewModalOpen ? (
        <EditReviewModal
          review={book.review ?? ''}
          onClose={() => setReviewModalOpen(false)}
          onSave={async (review) => {
            await onChangeReview(review);
            setReviewModalOpen(false);
          }}
        />
      ) : null}

      {sharePickerOpen ? (
        <BottomSheet
          onClose={() => setSharePickerOpen(false)}
          maxHeight="75%"
          header={
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-black text-foreground">공유할 갈피 선택</Text>
              <Pressable
                onPress={() => setSharePickerOpen(false)}
                accessibilityLabel="닫기"
                className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
              >
                <X size={16} color={colors.foreground} />
              </Pressable>
            </View>
          }
        >
          <FlatList
            data={shareCandidates}
            keyExtractor={(s) => s.id}
            style={{ maxHeight: 420 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <SharePickerRow
                sentence={item}
                onPress={() => {
                  setSharePickerOpen(false);
                  setShareSentence(item);
                }}
              />
            )}
          />
        </BottomSheet>
      ) : null}

      {shareSentence ? (
        <SentenceCardModal book={book} sentence={shareSentence} onClose={() => setShareSentence(null)} />
      ) : null}
    </SafeAreaView>
  );
}

/** A single row in the "공유할 갈피 선택" picker — favorites are surfaced first (see shareCandidates). */
function SharePickerRow({ sentence, onPress }: { sentence: Sentence; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="web:cursor-pointer flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
    >
      <View className="shrink-0 rounded-md bg-galpi-ink px-2 py-1">
        <Text className="tabular-nums text-2xs font-bold text-galpi-paper">P.{sentence.page}</Text>
      </View>
      <Text numberOfLines={2} className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-foreground">
        {sentence.quote}
      </Text>
      {sentence.favorite ? (
        <Star size={14} color={colors.galpiYellow} fill={colors.galpiYellow} />
      ) : null}
    </Pressable>
  );
}

function StatBit({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const content = (
    <>
      <Text className="text-base font-black text-foreground">{value}</Text>
      <Text className="mt-0.5 text-2xs font-medium text-muted-foreground">{label}</Text>
    </>
  );
  if (!onPress) {
    return <View className="flex-1 items-center">{content}</View>;
  }
  return (
    <Pressable onPress={onPress} accessibilityLabel={`${label} 수정`} className="web:cursor-pointer flex-1 items-center">
      {content}
    </Pressable>
  );
}

export function BookDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="min-h-11 flex-row items-center justify-between px-5 pb-3 pt-1">
        <IconButton Icon={ChevronLeft} label="뒤로 가기" onPress={onBack} iconSize={20} />
      </View>

      <View className="px-5 pb-28">
        <View className="flex-row gap-5">
          <Skeleton className="aspect-[2/3] w-28 shrink-0 rounded-lg" />
          <View className="min-w-0 flex-1 justify-center gap-2">
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-2/5 rounded-md" />
          </View>
        </View>

        <View className="mt-5 h-16 border-y border-border" />

        <View className="mb-1 mt-8">
          <Skeleton className="h-5 w-40 rounded-md" />
        </View>

        {[0, 1, 2].map((i) => (
          <View key={i} className="gap-2 border-b border-border py-4 pl-3">
            <Skeleton className="h-4 w-16 rounded-sm" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
