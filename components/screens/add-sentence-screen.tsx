import { Suspense, lazy, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert } from '../../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  Type,
  Camera,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Images,
  type LucideIcon,
} from '../../lib/icons';
import type { EntryType, Sentence } from '../../lib/data/sentences';
import { useThemeColors } from '../../lib/theme';
import { Button } from '../galpi/button';
import { ScreenHeader } from '../galpi/screen-header';
import { TagInput } from '../galpi/tag-input';

// expo-camera and the OCR client are only needed once the 카메라 스캔 tab is
// opened, so web loads ScanMode as its own chunk on first use.
const ScanMode = lazy(() => import('./add-sentence-scan-mode').then((m) => ({ default: m.ScanMode })));

const MODES: { key: EntryType; label: string; Icon: LucideIcon }[] = [
  { key: 'text', label: '직접 입력', Icon: Type },
  { key: 'scan', label: '카메라 스캔', Icon: Camera },
  { key: 'photo', label: '페이지 사진', Icon: ImageIcon },
];

export function AddSentenceScreen({
  bookId,
  bookTitle,
  tagSuggestions,
  onBack,
  onSave,
  onUploadPhoto,
}: {
  bookId: string;
  bookTitle: string;
  tagSuggestions?: string[];
  onBack: () => void;
  onSave: (sentence: Omit<Sentence, 'id' | 'date'>) => Promise<void>;
  onUploadPhoto: (dataUrl: string) => Promise<string>;
}) {
  const [mode, setMode] = useState<EntryType>('text');
  const [scanQuote, setScanQuote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const colors = useThemeColors();

  async function handleSave() {
    if (saving) return;
    if (mode === 'text' && !text.trim()) {
      showAlert('문장을 입력해주세요', '담고 싶은 문장을 적어야 갈피를 남길 수 있어요.');
      return;
    }
    if (mode === 'scan' && !scanQuote.trim()) {
      showAlert('담을 문장을 선택해주세요', '인식된 단어 중 담을 부분을 눌러 선택해주세요.');
      return;
    }
    if (mode === 'photo' && !photoUri) {
      showAlert('페이지 사진을 선택해주세요', '사진을 찍거나 앨범에서 골라주세요.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'text') {
        await onSave({
          bookId,
          page: Number(page) || 0,
          quote: text.trim(),
          memo: memo.trim() || undefined,
          tags: tags.length ? tags : undefined,
          type: 'text',
        });
      } else if (mode === 'scan') {
        await onSave({
          bookId,
          page: Number(page) || 0,
          quote: scanQuote.trim(),
          type: 'scan',
        });
      } else {
        const resized = await ImageManipulator.manipulateAsync(
          photoUri!,
          [{ resize: { width: 1400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        if (!resized.base64) throw new Error('이미지 처리에 실패했어요.');

        const photoUrl = await onUploadPhoto(`data:image/jpeg;base64,${resized.base64}`);
        await onSave({
          bookId,
          page: Number(page) || 0,
          quote: memo.trim() || '페이지 사진으로 남긴 갈피',
          photoUrl,
          tags: tags.length ? tags : undefined,
          type: 'photo',
        });
      }
      onBack();
    } catch (err) {
      showAlert(
        '갈피 저장에 실패했어요',
        err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <ScreenHeader title="갈피 남기기" subtitle={bookTitle} onBack={onBack} backLabel="닫기" />

      {/* 모드 스위처 */}
      <View className="px-5">
        <View className="flex-row gap-1 rounded-xl bg-secondary p-1">
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 min-h-0">
        <ScrollView
          className="flex-1 px-5 py-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {mode === 'text' ? (
            <TextMode
              text={text}
              setText={setText}
              page={page}
              setPage={setPage}
              memo={memo}
              setMemo={setMemo}
              tags={tags}
              setTags={setTags}
              tagSuggestions={tagSuggestions}
            />
          ) : null}
          {mode === 'scan' ? (
            <Suspense
              fallback={
                <View className="aspect-[4/3] items-center justify-center rounded-xl bg-galpi-ink">
                  <ActivityIndicator color={colors.galpiPaper} />
                </View>
              }
            >
              <ScanMode quote={scanQuote} onQuoteChange={setScanQuote} page={page} setPage={setPage} />
            </Suspense>
          ) : null}
          {mode === 'photo' ? (
            <PhotoMode
              photoUri={photoUri}
              setPhotoUri={setPhotoUri}
              memo={memo}
              setMemo={setMemo}
              page={page}
              setPage={setPage}
              tags={tags}
              setTags={setTags}
              tagSuggestions={tagSuggestions}
            />
          ) : null}
        </ScrollView>

        {/* 저장 버튼 */}
        <View className="border-t border-border bg-card/80 px-5 py-4 web:backdrop-blur">
          <Button label={saving ? '저장 중...' : '갈피 저장하기'} Icon={Check} onPress={handleSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- 직접 입력 ---------- */
function TextMode({
  text,
  setText,
  page,
  setPage,
  memo,
  setMemo,
  tags,
  setTags,
  tagSuggestions,
}: {
  text: string;
  setText: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
  memo: string;
  setMemo: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  tagSuggestions?: string[];
}) {
  const colors = useThemeColors();
  return (
    <View className="gap-4">
      <Field label="문장">
        <TextInput
          value={text}
          onChangeText={setText}
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
  );
}

/* ---------- 페이지 사진 ---------- */
function PhotoMode({
  photoUri,
  setPhotoUri,
  memo,
  setMemo,
  page,
  setPage,
  tags,
  setTags,
  tagSuggestions,
}: {
  photoUri: string | null;
  setPhotoUri: (v: string | null) => void;
  memo: string;
  setMemo: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  tagSuggestions?: string[];
}) {
  const colors = useThemeColors();

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('카메라 권한이 필요해요', '기기 설정에서 갈피의 카메라 접근을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('사진 접근 권한이 필요해요', '기기 설정에서 갈피의 사진 보관함 접근을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  return (
    <View className="gap-4">
      <Field label="페이지 사진">
        {photoUri ? (
          <View className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-galpi-ink">
            <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
            <Pressable
              onPress={() => setPhotoUri(null)}
              className="web:cursor-pointer absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-galpi-ink/70 px-3 py-1.5"
            >
              <RotateCcw size={12} color={colors.galpiPaper} />
              <Text className="text-2xs font-bold text-galpi-paper">다시 선택</Text>
            </Pressable>
          </View>
        ) : (
          <View className="aspect-[3/4] w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-6">
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-galpi-green">
              <ImageIcon size={24} color={colors.galpiInk} />
            </View>
            <Text className="text-sm font-semibold text-foreground">책 페이지를 통째로 기록해요</Text>
            <View className="w-full max-w-[220px] gap-2">
              <Pressable
                onPress={takePhoto}
                className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3"
              >
                <Camera size={14} color={colors.primaryForeground} />
                <Text className="text-xs font-bold text-primary-foreground">사진 찍기</Text>
              </Pressable>
              <Pressable
                onPress={pickFromLibrary}
                className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-xl border border-border bg-background py-3"
              >
                <Images size={14} color={colors.foreground} />
                <Text className="text-xs font-bold text-foreground">앨범에서 선택</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Field>

      <Field label="페이지">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5">
          <Text className="tabular-nums text-sm font-bold text-muted-foreground">P.</Text>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="numeric"
            placeholder="46"
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
          placeholder="이 페이지를 기억하고 싶은 이유를 적어보세요. (선택)"
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
