import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ChevronLeft, Tags } from 'lucide-react-native';
import { type Book } from '../../lib/data/books';
import { allTags, sentencesByTag, type Sentence, type TagCount } from '../../lib/data/sentences';
import { colors } from '../../lib/theme';

/**
 * Cross-book quote collections: browse every tag in use, then drill into the
 * 갈피 filed under one — the tag-scoped counterpart to FavoritesScreen's
 * favorite-scoped list. Kept as a single screen with local `selectedTag`
 * state instead of two routes, since the drill-in is a lightweight peek.
 */
export function CollectionsScreen({
  books,
  sentences,
  onBack,
  onOpenSentence,
}: {
  books: Book[];
  sentences: Sentence[];
  onBack: () => void;
  onOpenSentence: (sentence: Sentence) => void;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const tags = useMemo(() => allTags(sentences), [sentences]);

  if (selectedTag) {
    const tagged = sentencesByTag(sentences, selectedTag).filter((s) => booksById.has(s.bookId));
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
          <Pressable
            onPress={() => setSelectedTag(null)}
            accessibilityLabel="태그 목록으로"
            className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>
          <Text className="text-base font-black text-foreground">#{selectedTag}</Text>
          <View className="rounded-full bg-secondary px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-muted-foreground">{tagged.length}</Text>
          </View>
        </View>

        <FlatList
          data={tagged}
          keyExtractor={(s) => s.id}
          contentContainerClassName="px-5 pb-10"
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <TaggedSentenceCard
              sentence={item}
              book={booksById.get(item.bookId)!}
              onOpen={() => onOpenSentence(item)}
            />
          )}
        />
      </SafeAreaView>
    );
  }

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
        <Text className="text-base font-black text-foreground">모음집</Text>
        <View className="rounded-full bg-secondary px-2 py-0.5">
          <Text className="text-[11px] font-semibold text-muted-foreground">{tags.length}</Text>
        </View>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(t) => t.tag}
        contentContainerClassName="px-5 pb-10"
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => <TagRow tag={item} onOpen={() => setSelectedTag(item.tag)} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Tags size={28} color={colors.mutedForeground} opacity={0.4} />
            <Text className="mt-3 text-center text-sm text-muted-foreground">
              아직 모음집이 없어요{'\n'}갈피를 남길 때 태그를 달아 모아보세요
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function TagRow({ tag, onOpen }: { tag: TagCount; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl bg-card p-4"
      style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-galpi-yellow">
        <Tags size={16} color={colors.galpiInk} />
      </View>
      <Text className="min-w-0 flex-1 text-sm font-bold text-foreground">#{tag.tag}</Text>
      <View className="shrink-0 rounded-full bg-secondary px-2.5 py-1">
        <Text className="text-[11px] font-bold text-foreground">{tag.count}개</Text>
      </View>
    </Pressable>
  );
}

function TaggedSentenceCard({
  sentence,
  book,
  onOpen,
}: {
  sentence: Sentence;
  book: Book;
  onOpen: () => void;
}) {
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
        <View className="ml-2 rounded-md bg-galpi-ink px-2 py-0.5">
          <Text className="font-mono text-[10px] font-bold text-galpi-paper">P. {sentence.page}</Text>
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
