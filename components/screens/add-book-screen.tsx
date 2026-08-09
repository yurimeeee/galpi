import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, BookOpen } from 'lucide-react-native';
import { searchKakaoBooks, type KakaoBookResult } from '../../lib/kakao-books';
import { colors } from '../../lib/theme';

type Status = 'idle' | 'loading' | 'error' | 'success';

export function AddBookScreen({
  onBack,
  onAdd,
}: {
  onBack: () => void;
  onAdd: (result: KakaoBookResult) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<KakaoBookResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [addingIsbn, setAddingIsbn] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  async function handleSearch() {
    const q = query.trim();
    if (!q || status === 'loading') return;
    setStatus('loading');
    setErrorMessage('');
    setAddError('');
    try {
      const books = await searchKakaoBooks(q);
      setResults(books);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '검색에 실패했어요.');
      setStatus('error');
    }
  }

  async function handleAdd(result: KakaoBookResult) {
    if (addingIsbn) return;
    setAddError('');
    setAddingIsbn(result.isbn || result.title);
    try {
      await onAdd(result);
      onBack();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '책 추가에 실패했어요.');
      setAddingIsbn(null);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="닫기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">책 검색</Text>
      </View>

      <View className="px-5">
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholder="책 제목이나 저자를 검색해보세요"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 text-sm text-foreground"
          />
        </View>
      </View>

      {addError ? (
        <Text className="px-5 pt-2 text-[12px] text-destructive">{addError}</Text>
      ) : null}

      <View className="flex-1 px-5 pt-4">
        {status === 'idle' ? (
          <View className="items-center pt-16">
            <Text className="text-sm text-muted-foreground">책 제목이나 저자를 검색해보세요.</Text>
          </View>
        ) : null}

        {status === 'loading' ? (
          <View className="items-center pt-16">
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : null}

        {status === 'error' ? (
          <View className="items-center pt-16">
            <Text className="text-[13px] text-destructive">{errorMessage}</Text>
          </View>
        ) : null}

        {status === 'success' && results.length === 0 ? (
          <View className="items-center pt-16">
            <Text className="text-sm text-muted-foreground">검색 결과가 없어요.</Text>
          </View>
        ) : null}

        {status === 'success' && results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item, i) => item.isbn || `${item.title}-${i}`}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="pb-6"
            renderItem={({ item }) => (
              <ResultRow
                result={item}
                adding={addingIsbn === (item.isbn || item.title)}
                onAdd={() => handleAdd(item)}
              />
            )}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ResultRow({
  result,
  adding,
  onAdd,
}: {
  result: KakaoBookResult;
  adding: boolean;
  onAdd: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
      {result.thumbnail ? (
        <Image source={{ uri: result.thumbnail }} className="h-16 w-11 rounded-md bg-secondary" resizeMode="cover" />
      ) : (
        <View className="h-16 w-11 items-center justify-center rounded-md bg-secondary">
          <BookOpen size={16} color={colors.mutedForeground} />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <Text numberOfLines={2} className="text-sm font-bold text-foreground">
          {result.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
          {result.authors.join(', ') || '저자 미상'}
        </Text>
        {result.publisher ? (
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted-foreground">
            {result.publisher}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onAdd}
        disabled={adding}
        accessibilityLabel="서재에 추가"
        className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-galpi-green"
      >
        {adding ? (
          <ActivityIndicator size="small" color={colors.galpiInk} />
        ) : (
          <Plus size={16} color={colors.galpiInk} />
        )}
      </Pressable>
    </View>
  );
}
