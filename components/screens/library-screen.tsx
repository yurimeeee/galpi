import { useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpDown, Bookmark, Check, Search, ChevronRight, Quote, Star, Tags, List, Grid2x2 } from 'lucide-react-native';
import { GalpiHeaderLogo } from '../galpi/galpi-logo';
import { BookCard } from '../galpi/book-card';
import { ColorChips } from '../galpi/color-chips';
import { ReorderBookList } from '../galpi/reorder-book-list';
import { Skeleton } from '../galpi/skeleton';
import { StatusFilter, type FilterKey } from '../galpi/status-filter';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { type Book } from '../../lib/data/books';
import { type Sentence } from '../../lib/data/sentences';
import { parseDotDate } from '../../lib/date-utils';
import { ACCENT_BG_CLASS, useThemeColors } from '../../lib/theme';

type ViewMode = 'list' | 'card';

/** Aladin genres arrive as a full category path ("국내도서>소설/시/희곡>한국소설"); manually-entered ones are already just the leaf label — both cases collapse to the same last-segment value. */
function bookGenreLabel(book: Book): string | undefined {
  return book.genre?.split('>').pop()?.trim();
}

function completedYear(book: Book): number | undefined {
  if (book.status !== 'done' || !book.completedAt) return undefined;
  return parseDotDate(book.completedAt)?.getFullYear() ?? undefined;
}

type SearchRow = { kind: 'header'; key: string; label: string } | { kind: 'book'; book: Book } | { kind: 'sentence'; sentence: Sentence; book: Book };

export function MainLibraryScreen({
  books,
  sentences,
  onOpenBook,
  onOpenSentence,
  onAddBook,
  onReorderBooks,
  onOpenFavorites,
  onOpenCollections,
}: {
  books: Book[];
  sentences: Sentence[];
  onOpenBook: (book: Book) => void;
  onOpenSentence: (sentence: Sentence) => void;
  onAddBook: () => void;
  onReorderBooks: (orderedBookIds: string[]) => void;
  onOpenFavorites: () => void;
  onOpenCollections: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const listRef = useRef<FlatList<SearchRow>>(null);
  const colors = useThemeColors();

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      const genre = bookGenreLabel(b);
      if (genre) set.add(genre);
    });
    return Array.from(set).sort();
  }, [books]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    books.forEach((b) => {
      const year = completedYear(b);
      if (year) set.add(year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [books]);

  /** "전체보기": drop any status filter and jump back to the top of the (now unfiltered) shelf below. */
  function showAll() {
    setFilter('all');
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const trimmedQuery = query.trim().toLowerCase();
  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const hasActiveFilter = !!genreFilter || yearFilter !== null;

  function matchesFilters(book: Book): boolean {
    if (genreFilter && bookGenreLabel(book) !== genreFilter) return false;
    if (yearFilter !== null && completedYear(book) !== yearFilter) return false;
    return true;
  }

  const bookResults = useMemo(() => {
    if (!trimmedQuery && !hasActiveFilter) return [];
    return books.filter((b) => (!trimmedQuery || b.title.toLowerCase().includes(trimmedQuery) || b.author.toLowerCase().includes(trimmedQuery)) && matchesFilters(b));
  }, [books, trimmedQuery, genreFilter, yearFilter]);

  const sentenceResults = useMemo(() => {
    if (!trimmedQuery && !hasActiveFilter) return [];
    return sentences.filter((s) => {
      const book = booksById.get(s.bookId);
      if (!book || !matchesFilters(book)) return false;
      return !trimmedQuery || s.quote.toLowerCase().includes(trimmedQuery) || (s.memo?.toLowerCase().includes(trimmedQuery) ?? false);
    });
  }, [sentences, trimmedQuery, booksById, genreFilter, yearFilter]);

  const searchRows = useMemo<SearchRow[]>(() => {
    const rows: SearchRow[] = [];
    if (bookResults.length > 0) {
      rows.push({ kind: 'header', key: 'header-book', label: `책 ${bookResults.length}` });
      bookResults.forEach((book) => rows.push({ kind: 'book', book }));
    }
    if (sentenceResults.length > 0) {
      rows.push({ kind: 'header', key: 'header-sentence', label: `갈피 ${sentenceResults.length}` });
      sentenceResults.forEach((sentence) => {
        const book = booksById.get(sentence.bookId);
        if (book) rows.push({ kind: 'sentence', sentence, book });
      });
    }
    return rows;
  }, [bookResults, sentenceResults, booksById]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    setGenreFilter(null);
    setYearFilter(null);
  }

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

  const visible = useMemo(() => (filter === 'all' ? books : books.filter((b) => b.status === filter)), [books, filter]);

  if (reorderMode) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 min-h-0 bg-background">
        <View className="flex-1 px-6 pb-6">
          <View className="flex-row items-center justify-between pt-1 pb-4">
            <Text className="text-lg font-black tracking-tight text-foreground">서재 순서 편집</Text>
            <Pressable
              onPress={() => setReorderMode(false)}
              accessibilityLabel="순서 편집 완료"
              className="web:cursor-pointer flex-row items-center gap-1 rounded-full bg-primary px-3.5 py-2"
            >
              <Check size={14} color={colors.primaryForeground} />
              <Text className="text-xs font-semibold text-primary-foreground">완료</Text>
            </Pressable>
          </View>
          <Text className="mb-4 text-xs text-muted-foreground">오른쪽 손잡이를 눌러 드래그하면 순서를 바꿀 수 있어요</Text>
          <ScrollView contentContainerClassName="pb-6">
            <ReorderBookList books={books} onReorder={onReorderBooks} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 min-h-0 bg-background">
      <FlatList
        key={searchOpen ? 'search' : viewMode}
        ref={listRef}
        // Caps the grid to a sane card size on wide/tablet native screens —
        // on web the phone-shaped WebFrame already does this, but native has
        // no such ceiling, so 4 columns could stretch huge on an iPad.
        style={!searchOpen && viewMode === 'card' ? { maxWidth: 480, width: '100%', alignSelf: 'center' } : undefined}
        data={searchOpen ? searchRows : visible.map((book): SearchRow => ({ kind: 'book', book }))}
        keyExtractor={(row) => (row.kind === 'header' ? row.key : row.kind === 'book' ? `book-${row.book.id}` : `sentence-${row.sentence.id}`)}
        numColumns={!searchOpen && viewMode === 'card' ? 4 : 1}
        contentContainerClassName="px-6 pb-6"
        ItemSeparatorComponent={!searchOpen && viewMode === 'card' ? undefined : () => <View className="h-4" />}
        renderItem={({ item: row }) => {
          if (row.kind === 'header') {
            return <Text className="pt-1 text-xs font-bold text-muted-foreground">{row.label}</Text>;
          }
          if (row.kind === 'book') {
            if (!searchOpen && viewMode === 'card') {
              // Fixed 25% width (not flex-1) so a partial last row keeps the
              // same card size as full rows instead of stretching to fill.
              return (
                <Pressable
                  onPress={() => onOpenBook(row.book)}
                  className="web:cursor-pointer w-1/4 px-1.5 pb-4"
                  style={({ pressed }) => pressed && { transform: [{ scale: 0.97 }] }}
                >
                  <BookCoverTile book={row.book} />
                </Pressable>
              );
            }
            return (
              <Pressable onPress={() => onOpenBook(row.book)} className="web:cursor-pointer" style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}>
                <BookCard book={row.book} />
              </Pressable>
            );
          }
          return (
            <Pressable onPress={() => onOpenSentence(row.sentence)} className="web:cursor-pointer" style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}>
              <SentenceResultCard sentence={row.sentence} book={row.book} query={trimmedQuery} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          searchOpen ? (
            <View className="items-center py-16">
              <Text className="text-sm text-center text-muted-foreground">
                {trimmedQuery ? `'${query.trim()}'에 대한 검색 결과가 없어요` : hasActiveFilter ? '조건에 맞는 책이나 갈피가 없어요' : '책 제목, 작가, 또는 문장으로 검색해보세요'}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          searchOpen ? (
            <View className="pt-1 pb-4">
              <View className="flex-row items-center gap-3">
                <View className="flex-1 flex-row items-center gap-2 rounded-full bg-card px-4 py-2.5">
                  <Search size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="책 제목, 작가, 또는 갈피 문장 검색"
                    placeholderTextColor={colors.mutedForeground}
                    autoFocus
                    returnKeyType="search"
                    className="flex-1 text-sm text-foreground"
                  />
                </View>
                <Pressable onPress={closeSearch} className="web:cursor-pointer">
                  <Text className="text-sm font-semibold text-muted-foreground">취소</Text>
                </Pressable>
              </View>

              {genreOptions.length > 0 || yearOptions.length > 0 ? (
                <View className="gap-2 mt-3">
                  {genreOptions.length > 0 ? <FilterChipRow options={genreOptions.map((g) => ({ key: g, label: g }))} active={genreFilter} onChange={setGenreFilter} /> : null}
                  {yearOptions.length > 0 ? (
                    <FilterChipRow options={yearOptions.map((y) => ({ key: y, label: `${y}년 완독` }))} active={yearFilter} onChange={setYearFilter} />
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : (
            <View>
              {/* 헤더 */}
              <View className="flex-row items-center justify-between pt-1 pb-4">
                <GalpiHeaderLogo markSize={28} wordClassName="text-xl text-foreground" />
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={onOpenCollections}
                    accessibilityLabel="태그 모음집 보기"
                    className="items-center justify-center rounded-full web:cursor-pointer h-9 w-9 bg-card"
                  >
                    <Tags size={16} color={colors.foreground} />
                  </Pressable>
                  <Pressable
                    onPress={onOpenFavorites}
                    accessibilityLabel="즐겨찾는 갈피 모아보기"
                    className="items-center justify-center rounded-full web:cursor-pointer h-9 w-9 bg-card"
                  >
                    <Star size={16} color={colors.foreground} />
                  </Pressable>
                  <Pressable
                    onPress={() => setSearchOpen(true)}
                    accessibilityLabel="책·갈피 검색"
                    className="items-center justify-center rounded-full web:cursor-pointer h-9 w-9 bg-card"
                  >
                    <Search size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>

              {/* 에디토리얼 인사말 */}
              <View className="mb-6">
                <Text className="text-xs font-medium text-muted-foreground">오늘도 한 문장, 갈피에 담다</Text>
                <Text className="mt-1 text-[26px] font-black leading-[1.25] tracking-tight text-foreground">지금까지 모은 문장</Text>
                <View className="mt-1.5 flex-row">
                  <View className="rounded-lg bg-galpi-yellow px-2 py-0.5">
                    <Text className="text-[26px] font-black leading-[1.25] tracking-tight text-galpi-ink">{totalGalpi}개의 갈피</Text>
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
                      <View className="px-3 py-1 rounded-full bg-galpi-ink/10">
                        <Text className="text-[11px] font-bold text-galpi-ink">지금 읽는 중</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Bookmark size={12} color={colors.galpiInk} opacity={0.7} />
                        <Text className="text-[11px] font-semibold text-galpi-ink/70">{featured.galpiCount}개</Text>
                      </View>
                    </View>

                    <Text className="mt-4 text-xl font-black leading-tight text-galpi-ink">{featured.title}</Text>
                    <Text className="mt-0.5 text-xs font-medium text-galpi-ink/60">{featured.author}</Text>

                    {featured.quote ? (
                      <View className="flex-row gap-2 p-3 mt-4 rounded-2xl bg-galpi-paper/60">
                        <Quote size={14} color={colors.galpiInk} opacity={0.5} />
                        <Text className="flex-1 text-xs leading-relaxed text-galpi-ink/80">{featured.quote}</Text>
                      </View>
                    ) : null}

                    {/* 진행률 */}
                    <View className="mt-4">
                      <View className="mb-1.5 flex-row items-center justify-between">
                        <Text className="text-[11px] font-semibold text-galpi-ink/70">읽은 정도</Text>
                        <Text className="text-[11px] font-semibold text-galpi-ink/70">{featured.progress}%</Text>
                      </View>
                      <View className="h-1.5 w-full overflow-hidden rounded-full bg-galpi-ink/15">
                        <View className="h-full rounded-full bg-galpi-ink" style={{ width: `${featured.progress}%` }} />
                      </View>
                    </View>
                  </Pressable>
                </View>
              ) : null}

              {/* 내 서재 */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-black tracking-tight text-foreground">내 서재</Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-row gap-0.5 rounded-full bg-secondary p-0.5">
                    <Pressable
                      onPress={() => setViewMode('list')}
                      accessibilityLabel="리스트로 보기"
                      className={`web:cursor-pointer items-center justify-center rounded-full p-1.5 ${viewMode === 'list' ? 'bg-card' : ''}`}
                    >
                      <List size={13} color={viewMode === 'list' ? colors.foreground : colors.mutedForeground} />
                    </Pressable>
                    <Pressable
                      onPress={() => setViewMode('card')}
                      accessibilityLabel="카드로 보기"
                      className={`web:cursor-pointer items-center justify-center rounded-full p-1.5 ${viewMode === 'card' ? 'bg-card' : ''}`}
                    >
                      <Grid2x2 size={13} color={viewMode === 'card' ? colors.foreground : colors.mutedForeground} />
                    </Pressable>
                  </View>
                  {books.length > 1 ? (
                    <Pressable onPress={() => setReorderMode(true)} accessibilityLabel="서재 순서 편집" className="web:cursor-pointer flex-row items-center gap-0.5">
                      <ArrowUpDown size={12} color={colors.mutedForeground} />
                      {/* <Text className="text-xs font-medium text-muted-foreground">순서 편집</Text> */}
                    </Pressable>
                  ) : null}
                  <Pressable onPress={showAll} className="web:cursor-pointer flex-row items-center gap-0.5">
                    <Text className="text-xs font-medium text-muted-foreground">전체보기</Text>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              <View className="mb-5">
                <StatusFilter active={filter} onChange={setFilter} counts={counts} />
              </View>
            </View>
          )
        }
        ListFooterComponent={
          searchOpen ? null : (
            <Pressable
              onPress={onAddBook}
              className="flex-row items-center justify-center w-full gap-2 py-4 mt-5 border border-dashed web:cursor-pointer rounded-2xl border-border bg-card"
            >
              <View className="items-center justify-center w-5 h-5 rounded-full bg-galpi-green">
                <Text className="text-galpi-ink">+</Text>
              </View>
              <Text className="text-sm font-semibold text-muted-foreground">새로운 책 추가하기</Text>
            </Pressable>
          )
        }
      />
    </SafeAreaView>
  );
}

/** A horizontal row of toggleable filter chips — tapping the active chip again clears the filter. */
function FilterChipRow<T extends string | number>({ options, active, onChange }: { options: { key: T; label: string }[]; active: T | null; onChange: (key: T | null) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(isActive ? null : opt.key)}
            className={`web:cursor-pointer shrink-0 rounded-full px-3 py-1.5 ${isActive ? 'bg-galpi-ink' : 'bg-card'}`}
          >
            <Text className={`text-xs font-medium ${isActive ? 'text-galpi-paper' : 'text-muted-foreground'}`}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Cover-only grid tile for the 카드 view — same book, denser layout than BookCard's list row. */
function BookCoverTile({ book }: { book: Book }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const colors = useThemeColors();

  return (
    <View>
      <View className={`relative aspect-[3/4] overflow-hidden rounded-xl ${showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]}`}>
        {showCover ? (
          <Image source={{ uri: book.coverUrl }} className="absolute inset-0 h-full w-full" resizeMode="cover" onError={onCoverError} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Bookmark size={20} color={book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} opacity={0.7} />
          </View>
        )}
        {book.status !== 'wish' ? (
          <View className="absolute left-1.5 top-1.5 flex-row items-center gap-0.5 rounded-full bg-galpi-ink/60 px-1.5 py-0.5">
            <Bookmark size={9} color={colors.galpiPaper} />
            <Text className="text-[9px] font-bold text-galpi-paper">{book.galpiCount}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} className="mt-1.5 text-xs font-bold text-foreground">
        {book.title}
      </Text>
      <Text numberOfLines={1} className="text-[10px] text-muted-foreground">
        {book.author}
      </Text>
    </View>
  );
}

/** Splits `text` on the (case-insensitive) `query` and highlights each match. */
function HighlightText({ text, query, className }: { text: string; query: string; className: string }) {
  if (!query) return <Text className={className}>{text}</Text>;

  const lower = text.toLowerCase();
  const parts: { chunk: string; match: boolean }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(query, cursor);
    if (idx === -1) {
      parts.push({ chunk: text.slice(cursor), match: false });
      break;
    }
    if (idx > cursor) parts.push({ chunk: text.slice(cursor, idx), match: false });
    parts.push({ chunk: text.slice(idx, idx + query.length), match: true });
    cursor = idx + query.length;
  }

  return (
    <Text className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <Text key={i} className="bg-galpi-yellow">
            {part.chunk}
          </Text>
        ) : (
          part.chunk
        ),
      )}
    </Text>
  );
}

/** A single 갈피 search hit — the quote (and matching memo, if that's what matched) with its source book. */
function SentenceResultCard({ sentence, book, query }: { sentence: Sentence; book: Book; query: string }) {
  const quoteMatches = sentence.quote.toLowerCase().includes(query);
  const memoMatches = !quoteMatches && !!sentence.memo?.toLowerCase().includes(query);
  const colors = useThemeColors();

  return (
    <View className="p-4 rounded-2xl bg-card">
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

      <HighlightText text={sentence.quote} query={quoteMatches ? query : ''} className="mt-2.5 text-sm font-semibold leading-relaxed text-foreground" />

      {sentence.memo ? (
        <HighlightText
          text={sentence.memo}
          query={memoMatches ? query : ''}
          className="pt-2 mt-2 text-xs leading-relaxed border-t border-dashed border-border text-muted-foreground"
        />
      ) : null}

      <Text className="mt-2 text-[10px] font-medium text-muted-foreground/70">{sentence.date}</Text>
    </View>
  );
}

export function LibrarySkeleton() {
  const colors = useThemeColors();
  return (
    <SafeAreaView edges={['top']} className="flex-1 min-h-0 bg-background">
      <View className="px-6 pb-6">
        <View className="flex-row items-center justify-between pt-1 pb-4">
          <GalpiHeaderLogo markSize={28} wordClassName="text-xl text-foreground" />
          <View className="items-center justify-center rounded-full h-9 w-9 bg-card">
            <Search size={16} color={colors.foreground} />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-muted-foreground">오늘도 한 문장, 갈피에 담다</Text>
          <Text className="mt-1 text-[26px] font-black leading-[1.25] tracking-tight text-foreground">지금까지 모은 문장</Text>
          <Skeleton className="mt-1.5 h-8 w-32 rounded-lg" />
        </View>

        <Skeleton className="w-full h-40 mb-7 rounded-3xl" />

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-black tracking-tight text-foreground">내 서재</Text>
        </View>

        <View className="flex-row gap-2 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-16 h-8 rounded-full" />
          ))}
        </View>

        <View className="gap-4">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-stretch gap-4">
              <Skeleton className="h-20 w-14 rounded-xl" />
              <View className="justify-center flex-1 gap-2 pb-4 border-b border-border">
                <Skeleton className="w-2/3 h-4 rounded-md" />
                <Skeleton className="w-1/3 h-3 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
