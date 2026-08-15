import { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ChevronLeft, Star } from 'lucide-react-native';
import { type Book } from '../../lib/data/books';
import { type Sentence } from '../../lib/data/sentences';
import { useThemeColors } from '../../lib/theme';

export function FavoritesScreen({
  books,
  sentences,
  onBack,
  onOpenSentence,
  onToggleFavorite,
}: {
  books: Book[];
  sentences: Sentence[];
  onBack: () => void;
  onOpenSentence: (sentence: Sentence) => void;
  onToggleFavorite: (sentenceId: string, favorite: boolean) => void;
}) {
  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const colors = useThemeColors();

  const favorites = useMemo(
    () => sentences.filter((s) => s.favorite && booksById.has(s.bookId)),
    [sentences, booksById],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">즐겨찾는 갈피</Text>
        <View className="rounded-full bg-secondary px-2 py-0.5">
          <Text className="text-[11px] font-semibold text-muted-foreground">{favorites.length}</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(s) => s.id}
        contentContainerClassName="px-5 pb-10"
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <FavoriteSentenceCard
            sentence={item}
            book={booksById.get(item.bookId)!}
            onOpen={() => onOpenSentence(item)}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Star size={28} color={colors.mutedForeground} opacity={0.4} />
            <Text className="mt-3 text-center text-sm text-muted-foreground">
              아직 즐겨찾는 갈피가 없어요{'\n'}책 속 문장에 별을 눌러 모아보세요
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function FavoriteSentenceCard({
  sentence,
  book,
  onOpen,
  onToggleFavorite,
}: {
  sentence: Sentence;
  book: Book;
  onOpen: () => void;
  onToggleFavorite: (sentenceId: string, favorite: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onOpen}
      className="web:cursor-pointer rounded-2xl bg-card p-4"
      style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
    >
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <Bookmark size={11} color={colors.mutedForeground} />
          <Text numberOfLines={1} className="flex-1 text-xs font-semibold text-muted-foreground">
            {book.title} · {book.author}
          </Text>
        </View>
        <View className="ml-2 flex-row items-center gap-1.5">
          <View className="rounded-md bg-galpi-ink px-2 py-0.5">
            <Text className="font-mono text-[10px] font-bold text-galpi-paper">P. {sentence.page}</Text>
          </View>
          <Pressable
            onPress={() => onToggleFavorite(sentence.id, false)}
            accessibilityLabel="즐겨찾기 해제"
            hitSlop={8}
            className="web:cursor-pointer h-6 w-6 items-center justify-center rounded-full bg-secondary"
          >
            <Star size={12} color={colors.galpiYellow} fill={colors.galpiYellow} />
          </Pressable>
        </View>
      </View>

      <Text className="mt-2.5 text-sm font-semibold leading-relaxed text-foreground">{sentence.quote}</Text>

      {sentence.memo ? (
        <Text className="mt-2 border-t border-dashed border-border pt-2 text-xs leading-relaxed text-muted-foreground">
          {sentence.memo}
        </Text>
      ) : null}

      <Text className="mt-2 text-[10px] font-medium text-muted-foreground/70">{sentence.date}</Text>
    </Pressable>
  );
}
