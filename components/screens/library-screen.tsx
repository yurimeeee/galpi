import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Search, ChevronRight, Quote } from 'lucide-react-native';
import { GalpiHeaderLogo } from '../galpi/galpi-logo';
import { BookCard } from '../galpi/book-card';
import { ColorChips } from '../galpi/color-chips';
import { StatusFilter, type FilterKey } from '../galpi/status-filter';
import { type Book } from '../../lib/data/books';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

export function MainLibraryScreen({
  books,
  onOpenBook,
}: {
  books: Book[];
  onOpenBook: (book: Book) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(
    () => ({
      all: books.length,
      reading: books.filter((b) => b.status === 'reading').length,
      done: books.filter((b) => b.status === 'done').length,
      wish: books.filter((b) => b.status === 'wish').length,
    }),
    [books],
  );

  const featured = books.find((b) => b.status === 'reading') ?? books[0];
  const totalGalpi = books.reduce((sum, b) => sum + b.galpiCount, 0);

  const visible = useMemo(
    () => (filter === 'all' ? books : books.filter((b) => b.status === filter)),
    [books, filter],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <FlatList
        data={visible}
        keyExtractor={(b) => b.id}
        contentContainerClassName="px-6 pb-6"
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpenBook(item)}
            className="web:cursor-pointer"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
          >
            <BookCard book={item} />
          </Pressable>
        )}
        ListHeaderComponent={
          <View>
            {/* 헤더 */}
            <View className="flex-row items-center justify-between pb-4 pt-1">
              <GalpiHeaderLogo markColor={colors.galpiInk} markSize={28} wordClassName="text-xl text-foreground" />
              <Pressable
                accessibilityLabel="책 검색"
                className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
              >
                <Search size={16} color={colors.foreground} />
              </Pressable>
            </View>

            {/* 에디토리얼 인사말 */}
            <View className="mb-6">
              <Text className="text-xs font-medium text-muted-foreground">
                오늘도 한 문장, 갈피에 담다
              </Text>
              <Text className="mt-1 text-[26px] font-black leading-[1.25] tracking-tight text-foreground">
                지금까지 모은 문장
              </Text>
              <View className="mt-1.5 flex-row">
                <View className="rounded-lg bg-galpi-yellow px-2 py-0.5">
                  <Text className="text-[26px] font-black leading-[1.25] tracking-tight text-foreground">
                    {totalGalpi}개의 갈피
                  </Text>
                </View>
              </View>
            </View>

            {/* 지금 읽는 중 — 대표 카드 */}
            {featured ? (
              <View accessibilityLabel="지금 읽는 중" className="mb-7">
                <Pressable
                  onPress={() => onOpenBook(featured)}
                  className={`web:cursor-pointer overflow-hidden rounded-3xl ${ACCENT_BG_CLASS[featured.accent]} p-5`}
                  style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="rounded-full bg-galpi-ink/10 px-3 py-1">
                      <Text className="text-[11px] font-bold text-galpi-ink">지금 읽는 중</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Bookmark size={12} color={colors.galpiInk} opacity={0.7} />
                      <Text className="text-[11px] font-semibold text-galpi-ink/70">
                        {featured.galpiCount}개
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-4 text-xl font-black leading-tight text-galpi-ink">
                    {featured.title}
                  </Text>
                  <Text className="mt-0.5 text-xs font-medium text-galpi-ink/60">
                    {featured.author}
                  </Text>

                  {featured.quote ? (
                    <View className="mt-4 flex-row gap-2 rounded-2xl bg-galpi-paper/60 p-3">
                      <Quote size={14} color={colors.galpiInk} opacity={0.5} />
                      <Text className="flex-1 text-xs leading-relaxed text-galpi-ink/80">
                        {featured.quote}
                      </Text>
                    </View>
                  ) : null}

                  {/* 진행률 */}
                  <View className="mt-4">
                    <View className="mb-1.5 flex-row items-center justify-between">
                      <Text className="text-[11px] font-semibold text-galpi-ink/70">읽은 정도</Text>
                      <Text className="text-[11px] font-semibold text-galpi-ink/70">
                        {featured.progress}%
                      </Text>
                    </View>
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-galpi-ink/15">
                      <View
                        className="h-full rounded-full bg-galpi-ink"
                        style={{ width: `${featured.progress}%` }}
                      />
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {/* 컬러칩 팔레트 */}
            <View className="mb-7">
              <ColorChips />
            </View>

            {/* 내 서재 */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-black tracking-tight text-foreground">내 서재</Text>
              <Pressable className="web:cursor-pointer flex-row items-center gap-0.5">
                <Text className="text-xs font-medium text-muted-foreground">전체보기</Text>
                <ChevronRight size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View className="mb-5">
              <StatusFilter active={filter} onChange={setFilter} counts={counts} />
            </View>
          </View>
        }
        ListFooterComponent={
          <Pressable className="web:cursor-pointer mt-5 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-4">
            <View className="h-5 w-5 items-center justify-center rounded-full bg-galpi-green">
              <Text className="text-galpi-ink">+</Text>
            </View>
            <Text className="text-sm font-semibold text-muted-foreground">
              새로운 책 추가하기
            </Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}
