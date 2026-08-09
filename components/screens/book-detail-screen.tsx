import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Bookmark,
  Star,
  Plus,
  Type,
  Camera,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react-native';
import { Skeleton } from '../galpi/skeleton';
import { type Book, type ReadingStatus, STATUS_LABEL } from '../../lib/data/books';
import { ENTRY_LABEL, type EntryType, type Sentence } from '../../lib/data/sentences';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

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
}: {
  book: Book;
  sentences: Sentence[];
  onBack: () => void;
  onAddSentence: () => void;
  onEditSentence: (sentenceId: string) => void;
  onChangeStatus: (status: ReadingStatus) => void;
  onChangeRating: (rating: number) => void;
}) {
  const inkText = book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      {/* 상단 바 */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Pressable
          accessibilityLabel="공유하기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <Share2 size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <FlatList
        data={sentences}
        keyExtractor={(s) => s.id}
        contentContainerClassName="px-6 pb-28"
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item, index }) => {
          const Icon = ENTRY_ICON[item.type];
          return (
            <Pressable
              onPress={() => onEditSentence(item.id)}
              accessibilityLabel="갈피 수정하기"
              className={`web:cursor-pointer relative overflow-hidden rounded-2xl bg-card p-4 ${
                index % 2 === 0 ? 'ml-0 mr-3' : 'ml-3 mr-0'
              }`}
            >
              <View className={`absolute left-0 top-0 h-full w-1.5 ${ACCENT_BG_CLASS[book.accent]}`} />
              <View className="flex-row items-center justify-between pl-2">
                <View className="rounded-md bg-galpi-ink px-2 py-0.5">
                  <Text className="font-mono text-[11px] font-bold text-galpi-paper">
                    P. {item.page}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2 py-1">
                  <Icon size={12} color={colors.mutedForeground} />
                  <Text className="text-[10px] font-semibold text-muted-foreground">
                    {ENTRY_LABEL[item.type]}
                  </Text>
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

              <Text className="mt-3 pl-2 text-[15px] font-semibold leading-relaxed text-foreground">
                “{item.quote}”
              </Text>

              {item.memo ? (
                <Text className="mt-3 border-t border-dashed border-border pl-2 pt-3 text-xs leading-relaxed text-muted-foreground">
                  {item.memo}
                </Text>
              ) : null}

              <Text className="mt-2 pl-2 text-[10px] font-medium text-muted-foreground/70">
                {item.date}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-10">
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
              <View
                className={`h-40 w-28 shrink-0 overflow-hidden rounded-2xl ${book.coverUrl ? 'bg-secondary' : `justify-between ${ACCENT_BG_CLASS[book.accent]} p-3`}`}
                style={{
                  shadowColor: colors.galpiInk,
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                }}
              >
                {book.coverUrl ? (
                  <Image source={{ uri: book.coverUrl }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <>
                    <Bookmark size={16} color={inkText} opacity={0.7} />
                    <Text className="text-[11px] font-black leading-tight" style={{ color: inkText }}>
                      {book.title}
                    </Text>
                  </>
                )}
              </View>

              {/* 정보 */}
              <View className="min-w-0 flex-1 justify-center">
                <Text className="text-xl font-black leading-tight text-foreground">
                  {book.title}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">{book.author}</Text>

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

            {/* 진행률 요약 */}
            <View className="mt-5 flex-row items-center gap-3 rounded-2xl bg-card p-4">
              <StatBit label="읽은 정도" value={`${book.progress}%`} />
              <View className="h-8 w-px bg-border" />
              <StatBit label="남긴 갈피" value={`${book.galpiCount}개`} />
              <View className="h-8 w-px bg-border" />
              <StatBit label="수집 문장" value={`${sentences.length}개`} />
            </View>

            {/* 수집한 갈피 목록 */}
            <View className="mb-4 mt-8 flex-row items-baseline justify-between">
              <Text className="text-lg font-black tracking-tight text-foreground">
                수집한 갈피 목록
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
        <Pressable
          onPress={onAddSentence}
          className="web:cursor-pointer flex-row items-center gap-2 rounded-full bg-galpi-ink px-6 py-3.5"
          style={({ pressed }) => [
            {
              shadowColor: colors.galpiInk,
              shadowOpacity: 0.3,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Plus size={16} color={colors.galpiPaper} />
          <Text className="text-sm font-bold text-galpi-paper">갈피 남기기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StatBit({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-base font-black text-foreground">{value}</Text>
      <Text className="mt-0.5 text-[10px] font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}

export function BookDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View className="px-6 pb-28">
        <View className="flex-row gap-5">
          <Skeleton className="h-40 w-28 shrink-0 rounded-2xl" />
          <View className="min-w-0 flex-1 justify-center gap-2">
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-2/5 rounded-md" />
          </View>
        </View>

        <View className="mt-5 h-20 rounded-2xl bg-card" />

        <View className="mb-4 mt-8">
          <Skeleton className="h-5 w-40 rounded-md" />
        </View>

        <View className="gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
