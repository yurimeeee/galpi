import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  ChevronLeft,
  Images,
  Plus,
  Search,
  BookOpen,
  PenLine,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { searchAladinBooks, type AladinBookResult } from '../../lib/aladin-books';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { useThemeColors } from '../../lib/theme';

type Status = 'idle' | 'loading' | 'error' | 'success';
type Mode = 'search' | 'manual';

export type ManualBookInput = {
  title: string;
  author: string;
  totalPages?: number;
  genre?: string;
  coverUrl?: string;
};

const MODES: { key: Mode; label: string; Icon: LucideIcon }[] = [
  { key: 'search', label: '검색', Icon: Search },
  { key: 'manual', label: '직접 입력', Icon: PenLine },
];

const GENRE_PRESETS = [
  '소설',
  '시/희곡',
  '에세이',
  '인문',
  '자기계발',
  '경제/경영',
  '역사',
  '과학',
  '예술',
  '만화',
];

export function AddBookScreen({
  onBack,
  onAdd,
  onAddManual,
  onUploadCover,
}: {
  onBack: () => void;
  onAdd: (result: AladinBookResult) => Promise<void>;
  onAddManual: (input: ManualBookInput) => Promise<void>;
  onUploadCover: (dataUrl: string) => Promise<string>;
}) {
  const [mode, setMode] = useState<Mode>('search');

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<AladinBookResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [addingIsbn, setAddingIsbn] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualGenre, setManualGenre] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');
  const colors = useThemeColors();

  async function handleSearch() {
    const q = query.trim();
    if (!q || status === 'loading') return;
    Keyboard.dismiss();
    setStatus('loading');
    setErrorMessage('');
    setAddError('');
    try {
      const books = await searchAladinBooks(q);
      setResults(books);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '검색에 실패했어요.');
      setStatus('error');
    }
  }

  async function handleAdd(result: AladinBookResult) {
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

  async function pickManualCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한이 필요해요', '기기 설정에서 갈피의 사진 보관함 접근을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [2, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  async function takeManualCover() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('카메라 권한이 필요해요', '기기 설정에서 갈피의 카메라 접근을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [2, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  async function handleAddManual() {
    if (manualSaving) return;
    const title = manualTitle.trim();
    if (!title) {
      setManualError('제목을 입력해주세요.');
      return;
    }
    Keyboard.dismiss();
    setManualError('');
    setManualSaving(true);
    try {
      let coverUrl: string | undefined;
      if (coverUri) {
        const resized = await ImageManipulator.manipulateAsync(
          coverUri,
          [{ resize: { width: 600 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        if (!resized.base64) throw new Error('표지 이미지 처리에 실패했어요.');
        coverUrl = await onUploadCover(`data:image/jpeg;base64,${resized.base64}`);
      }
      await onAddManual({
        title,
        author: manualAuthor.trim() || '저자 미상',
        totalPages: manualPages.trim() ? Number(manualPages.trim()) : undefined,
        genre: manualGenre.trim() || undefined,
        coverUrl,
      });
      onBack();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : '책 추가에 실패했어요.');
      setManualSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="닫기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">책 추가</Text>
      </View>

      <View className="px-5">
        <View className="flex-row gap-1 rounded-2xl bg-secondary p-1">
          {MODES.map(({ key, label, Icon }) => {
            const active = mode === key;
            return (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                  active ? 'bg-galpi-ink' : ''
                }`}
              >
                <Icon size={14} color={active ? colors.galpiPaper : colors.mutedForeground} />
                <Text
                  className={`text-xs font-bold ${active ? 'text-galpi-paper' : 'text-muted-foreground'}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === 'search' ? (
        <>
          <View className="px-5 pt-4">
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
        </>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 min-h-0">
          <ScrollView
            className="flex-1 px-5 py-5"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View className="gap-4">
              <Field label="표지 이미지">
                {coverUri ? (
                  <View className="relative aspect-[2/3] w-32 overflow-hidden rounded-2xl bg-galpi-ink">
                    <Image source={{ uri: coverUri }} style={{ flex: 1 }} resizeMode="cover" />
                    <Pressable
                      onPress={() => setCoverUri(null)}
                      className="web:cursor-pointer absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-galpi-ink/70"
                    >
                      <RotateCcw size={11} color={colors.galpiPaper} />
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={takeManualCover}
                      className="web:cursor-pointer flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-primary py-3"
                    >
                      <Camera size={14} color={colors.primaryForeground} />
                      <Text className="text-xs font-bold text-primary-foreground">사진 찍기</Text>
                    </Pressable>
                    <Pressable
                      onPress={pickManualCover}
                      className="web:cursor-pointer flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3"
                    >
                      <Images size={14} color={colors.foreground} />
                      <Text className="text-xs font-bold text-foreground">앨범에서 선택</Text>
                    </Pressable>
                  </View>
                )}
              </Field>

              <Field label="제목">
                <TextInput
                  value={manualTitle}
                  onChangeText={setManualTitle}
                  placeholder="책 제목을 입력해주세요"
                  placeholderTextColor={colors.mutedForeground}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:border-ring"
                />
              </Field>

              <Field label="저자">
                <TextInput
                  value={manualAuthor}
                  onChangeText={setManualAuthor}
                  placeholder="저자 이름 (선택)"
                  placeholderTextColor={colors.mutedForeground}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:border-ring"
                />
              </Field>

              <Field label="장르">
                <View className="gap-2">
                  <View className="flex-row flex-wrap gap-1.5">
                    {GENRE_PRESETS.map((genre) => {
                      const active = manualGenre.trim() === genre;
                      return (
                        <Pressable
                          key={genre}
                          onPress={() => setManualGenre(active ? '' : genre)}
                          className={`web:cursor-pointer rounded-full px-3 py-1.5 ${
                            active ? 'bg-galpi-yellow' : 'bg-secondary'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${active ? 'text-galpi-ink' : 'text-muted-foreground'}`}
                          >
                            {genre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    value={manualGenre}
                    onChangeText={setManualGenre}
                    placeholder="직접 입력하기 (선택)"
                    placeholderTextColor={colors.mutedForeground}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:border-ring"
                  />
                </View>
              </Field>

              <Field label="전체 페이지">
                <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
                  <Text className="font-mono text-sm font-bold text-muted-foreground">P.</Text>
                  <TextInput
                    value={manualPages}
                    onChangeText={setManualPages}
                    keyboardType="numeric"
                    placeholder="320 (선택)"
                    placeholderTextColor={colors.mutedForeground}
                    className="flex-1 font-mono text-sm text-foreground"
                  />
                </View>
              </Field>
            </View>
          </ScrollView>

          {manualError ? (
            <Text className="px-5 pb-2 text-[12px] text-destructive">{manualError}</Text>
          ) : null}

          <View className="border-t border-border bg-card/80 px-5 py-4 web:backdrop-blur">
            <Pressable
              onPress={handleAddManual}
              disabled={manualSaving}
              className={`web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 ${
                manualSaving ? 'opacity-60' : ''
              }`}
              style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
            >
              {manualSaving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Check size={16} color={colors.primaryForeground} />
              )}
              <Text className="text-sm font-bold text-primary-foreground">
                {manualSaving ? '추가하는 중...' : '책 추가하기'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold text-foreground">{label}</Text>
      {children}
    </View>
  );
}

function ResultRow({
  result,
  adding,
  onAdd,
}: {
  result: AladinBookResult;
  adding: boolean;
  onAdd: () => void;
}) {
  const { showCover, onCoverError } = useCoverFallback(result.thumbnail);
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
      {showCover ? (
        <Image
          source={{ uri: result.thumbnail }}
          className="h-16 w-11 rounded-md bg-secondary"
          resizeMode="cover"
          onError={onCoverError}
        />
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
          {result.author || '저자 미상'}
        </Text>
        {result.publisher ? (
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted-foreground">
            {result.publisher}
          </Text>
        ) : null}
        {result.genre ? (
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted-foreground">
            {result.genre.split('>').pop()}
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
