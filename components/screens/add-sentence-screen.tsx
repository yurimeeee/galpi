import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Type,
  Camera,
  Image as ImageIcon,
  ScanLine,
  Check,
  RotateCcw,
  Images,
  type LucideIcon,
} from 'lucide-react-native';
import type { EntryType, Sentence } from '../../lib/data/sentences';
import { colors } from '../../lib/theme';
import { scanBookText } from '../../lib/ocr';

const MODES: { key: EntryType; label: string; Icon: LucideIcon }[] = [
  { key: 'text', label: '직접 입력', Icon: Type },
  { key: 'scan', label: '카메라 스캔', Icon: Camera },
  { key: 'photo', label: '페이지 사진', Icon: ImageIcon },
];

export function AddSentenceScreen({
  bookId,
  bookTitle,
  onBack,
  onSave,
  onUploadPhoto,
}: {
  bookId: string;
  bookTitle: string;
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

  async function handleSave() {
    if (saving) return;
    if (mode === 'photo' && !photoUri) {
      Alert.alert('페이지 사진을 선택해주세요', '사진을 찍거나 앨범에서 골라주세요.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'text') {
        await onSave({
          bookId,
          page: Number(page) || 0,
          quote: text.trim() || '마음에 담고 싶은 문장',
          memo: memo.trim() || undefined,
          type: 'text',
        });
      } else if (mode === 'scan') {
        await onSave({
          bookId,
          page: Number(page) || 0,
          quote: scanQuote.trim() || '마음에 담고 싶은 문장',
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
          type: 'photo',
        });
      }
      onBack();
    } catch (err) {
      Alert.alert(
        '갈피 저장에 실패했어요',
        err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSaving(false);
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
        <View className="min-w-0">
          <Text className="text-base font-black text-foreground">갈피 남기기</Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {bookTitle}
          </Text>
        </View>
      </View>

      {/* 모드 스위처 */}
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 min-h-0">
        <ScrollView
          className="flex-1 px-5 py-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {mode === 'text' ? (
            <TextMode text={text} setText={setText} page={page} setPage={setPage} memo={memo} setMemo={setMemo} />
          ) : null}
          {mode === 'scan' ? (
            <ScanMode quote={scanQuote} onQuoteChange={setScanQuote} page={page} setPage={setPage} />
          ) : null}
          {mode === 'photo' ? (
            <PhotoMode
              photoUri={photoUri}
              setPhotoUri={setPhotoUri}
              memo={memo}
              setMemo={setMemo}
              page={page}
              setPage={setPage}
            />
          ) : null}
        </ScrollView>

        {/* 저장 버튼 */}
        <View className="border-t border-border bg-card/80 px-5 py-4 web:backdrop-blur">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className={`web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4 ${
              saving ? 'opacity-60' : ''
            }`}
            style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
          >
            {saving ? (
              <ActivityIndicator color={colors.galpiPaper} />
            ) : (
              <Check size={16} color={colors.galpiPaper} />
            )}
            <Text className="text-sm font-bold text-galpi-paper">
              {saving ? '저장 중...' : '갈피 저장하기'}
            </Text>
          </Pressable>
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
}: {
  text: string;
  setText: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
  memo: string;
  setMemo: (v: string) => void;
}) {
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
          className="w-full rounded-2xl border border-border bg-card p-4 text-[15px] leading-relaxed text-foreground focus:border-galpi-ink"
          style={{ minHeight: 120 }}
        />
      </Field>

      <Field label="페이지">
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
          <Text className="font-mono text-sm font-bold text-muted-foreground">P.</Text>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="numeric"
            placeholder="124"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 font-mono text-sm text-foreground"
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
          className="w-full rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground focus:border-galpi-ink"
          style={{ minHeight: 80 }}
        />
      </Field>
    </View>
  );
}

/* ---------- 카메라 스캔 (OCR) ---------- */
type ScanPhase = 'live' | 'processing' | 'reviewing' | 'error';

function ScanMode({
  quote,
  onQuoteChange,
  page,
  setPage,
}: {
  quote: string;
  onQuoteChange: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<ScanPhase>('live');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  function toggleToken(i: number) {
    setSelected((prev) => {
      const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b);
      onQuoteChange(next.map((idx) => tokens[idx]).join(' '));
      return next;
    });
  }

  function retake() {
    setPhase('live');
    setPhotoUri(null);
    setTokens([]);
    setSelected([]);
    setErrorMessage('');
    onQuoteChange('');
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
      if (!photo?.uri) throw new Error('촬영에 실패했어요.');
      setPhotoUri(photo.uri);
      setPhase('processing');

      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!resized.base64) throw new Error('이미지 처리에 실패했어요.');

      const result = await scanBookText(`data:image/jpeg;base64,${resized.base64}`);
      if (!result.tokens.length) {
        setErrorMessage('문장을 인식하지 못했어요. 문장이 잘 보이도록 다시 촬영해주세요.');
        setPhase('error');
        return;
      }

      setTokens(result.tokens);
      const all = result.tokens.map((_, i) => i);
      setSelected(all);
      onQuoteChange(result.sentence);
      setPhase('reviewing');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '문장 인식에 실패했어요. 다시 시도해주세요.');
      setPhase('error');
    }
  }

  if (!permission) {
    return (
      <View className="aspect-[4/3] items-center justify-center rounded-2xl bg-galpi-ink">
        <ActivityIndicator color={colors.galpiPaper} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] items-center justify-center gap-3 rounded-2xl bg-galpi-ink px-8">
          <Camera size={28} color={colors.galpiPaper} />
          <Text className="text-center text-sm leading-relaxed text-galpi-paper/80">
            {permission.canAskAgain
              ? '문장을 스캔하려면 카메라 접근을 허용해주세요.'
              : '카메라 권한이 꺼져 있어요. 기기 설정에서 갈피의 카메라 접근을 허용해주세요.'}
          </Text>
          {permission.canAskAgain ? (
            <Pressable
              onPress={requestPermission}
              className="web:cursor-pointer rounded-xl bg-galpi-yellow px-4 py-2.5"
            >
              <Text className="text-sm font-bold text-galpi-ink">카메라 허용하기</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const showLiveCamera = phase === 'live' || phase === 'processing';

  return (
    <View className="gap-4">
      <View className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-galpi-ink">
        {showLiveCamera ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        ) : photoUri ? (
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
        ) : null}

        {/* 스캔 가이드 프레임 */}
        {phase === 'live' ? (
          <View
            className="absolute inset-x-8 h-16 rounded-lg border-2 border-galpi-yellow"
            style={{ top: '50%', marginTop: -32 }}
            pointerEvents="none"
          >
            <View className="absolute -top-6 left-0 flex-row items-center gap-1">
              <ScanLine size={12} color={colors.galpiYellow} />
              <Text className="text-[11px] font-bold" style={{ color: colors.galpiYellow }}>
                문장을 프레임 안에 맞춰주세요
              </Text>
            </View>
          </View>
        ) : null}

        {/* 촬영 버튼 */}
        {phase === 'live' ? (
          <View className="absolute inset-x-0 bottom-4 items-center">
            <Pressable
              onPress={handleCapture}
              accessibilityLabel="촬영하기"
              className="web:cursor-pointer h-16 w-16 items-center justify-center rounded-full border-4 border-galpi-paper/70 bg-galpi-paper/20"
            >
              <View className="h-12 w-12 rounded-full bg-galpi-paper" />
            </Pressable>
          </View>
        ) : null}

        {/* 처리 중 오버레이 */}
        {phase === 'processing' ? (
          <View className="absolute inset-0 items-center justify-center gap-2 bg-galpi-ink/70">
            <ActivityIndicator color={colors.galpiYellow} />
            <Text className="text-xs font-bold text-galpi-paper">문장 인식 중...</Text>
          </View>
        ) : null}

        {/* 다시 촬영 버튼 */}
        {phase === 'reviewing' || phase === 'error' ? (
          <Pressable
            onPress={retake}
            className="web:cursor-pointer absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-galpi-ink/70 px-3 py-1.5"
          >
            <RotateCcw size={12} color={colors.galpiPaper} />
            <Text className="text-[11px] font-bold text-galpi-paper">다시 촬영</Text>
          </Pressable>
        ) : null}
      </View>

      {phase === 'error' ? (
        <View className="gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <Text className="text-sm font-semibold text-destructive">{errorMessage}</Text>
          <Pressable onPress={retake} className="web:cursor-pointer self-start rounded-lg bg-galpi-ink px-3 py-2">
            <Text className="text-xs font-bold text-galpi-paper">다시 촬영하기</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'reviewing' ? (
        <Field label="인식된 텍스트 · 담을 단어를 눌러 선택">
          <View className="flex-row flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-4">
            {tokens.map((t, i) => {
              const on = selected.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleToken(i)}
                  className={`web:cursor-pointer rounded-lg px-2 py-1 ${on ? 'bg-galpi-yellow' : 'bg-secondary'}`}
                >
                  <Text className={`text-sm font-medium ${on ? 'text-galpi-ink' : 'text-muted-foreground'}`}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      ) : null}

      {quote ? (
        <Field label="담을 문장">
          <View className="rounded-2xl border border-border bg-card p-4">
            <Text className="text-sm leading-relaxed text-foreground">{quote}</Text>
          </View>
        </Field>
      ) : null}

      <Field label="페이지">
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
          <Text className="font-mono text-sm font-bold text-muted-foreground">P.</Text>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="numeric"
            placeholder="201"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 font-mono text-sm text-foreground"
          />
        </View>
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
}: {
  photoUri: string | null;
  setPhotoUri: (v: string | null) => void;
  memo: string;
  setMemo: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
}) {
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('카메라 권한이 필요해요', '기기 설정에서 갈피의 카메라 접근을 허용해주세요.');
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
      Alert.alert('사진 접근 권한이 필요해요', '기기 설정에서 갈피의 사진 보관함 접근을 허용해주세요.');
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
          <View className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-galpi-ink">
            <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
            <Pressable
              onPress={() => setPhotoUri(null)}
              className="web:cursor-pointer absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-galpi-ink/70 px-3 py-1.5"
            >
              <RotateCcw size={12} color={colors.galpiPaper} />
              <Text className="text-[11px] font-bold text-galpi-paper">다시 선택</Text>
            </Pressable>
          </View>
        ) : (
          <View className="aspect-[3/4] w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-6">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-galpi-green">
              <ImageIcon size={24} color={colors.galpiInk} />
            </View>
            <Text className="text-sm font-semibold text-foreground">책 페이지를 통째로 기록해요</Text>
            <View className="w-full max-w-[220px] gap-2">
              <Pressable
                onPress={takePhoto}
                className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-xl bg-galpi-ink py-3"
              >
                <Camera size={14} color={colors.galpiPaper} />
                <Text className="text-xs font-bold text-galpi-paper">사진 찍기</Text>
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
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
          <Text className="font-mono text-sm font-bold text-muted-foreground">P.</Text>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="numeric"
            placeholder="46"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 font-mono text-sm text-foreground"
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
          className="w-full rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground focus:border-galpi-ink"
          style={{ minHeight: 80 }}
        />
      </Field>
    </View>
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
