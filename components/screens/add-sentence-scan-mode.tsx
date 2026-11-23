import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera, ScanLine, RotateCcw } from '../../lib/icons';
import { useThemeColors } from '../../lib/theme';
import { scanBookText } from '../../lib/ocr';

/**
 * 카메라 스캔 tab of the add-갈피 screen. Lives in its own file so
 * add-sentence-screen can React.lazy it: expo-camera and the OCR client are
 * only pulled in (a separate chunk on web) once someone opens this tab.
 */

/* ---------- 카메라 스캔 (OCR) ---------- */
type ScanPhase = 'live' | 'processing' | 'reviewing' | 'error';

export function ScanMode({
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
  const colors = useThemeColors();

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
      <View className="aspect-[4/3] items-center justify-center rounded-xl bg-galpi-ink">
        <ActivityIndicator color={colors.galpiPaper} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] items-center justify-center gap-3 rounded-xl bg-galpi-ink px-8">
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
      <View className="relative aspect-[4/3] overflow-hidden rounded-xl bg-galpi-ink">
        {showLiveCamera ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        ) : photoUri ? (
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
        ) : null}

        {/* 스캔 가이드 프레임 */}
        {phase === 'live' ? (
          <View
            className="absolute inset-x-8 h-16 rounded-lg border-2 border-galpi-yellow"
            style={{ pointerEvents: 'none', top: '50%', marginTop: -32 }}
          >
            <View className="absolute -top-6 left-0 flex-row items-center gap-1">
              <ScanLine size={12} color={colors.galpiYellow} />
              <Text className="text-2xs font-bold" style={{ color: colors.galpiYellow }}>
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
            <Text className="text-2xs font-bold text-galpi-paper">다시 촬영</Text>
          </Pressable>
        ) : null}
      </View>

      {phase === 'error' ? (
        <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Text className="text-sm font-semibold text-destructive">{errorMessage}</Text>
          <Pressable onPress={retake} className="web:cursor-pointer self-start rounded-lg bg-primary px-3 py-2">
            <Text className="text-xs font-bold text-primary-foreground">다시 촬영하기</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'reviewing' ? (
        <Field label="인식된 텍스트 · 담을 단어를 눌러 선택">
          <View className="flex-row flex-wrap gap-1.5 rounded-xl border border-border bg-card p-4">
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
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="text-sm leading-relaxed text-foreground">{quote}</Text>
          </View>
        </Field>
      ) : null}

      <Field label="페이지">
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5">
          <Text className="tabular-nums text-sm font-bold text-muted-foreground">P.</Text>
          <TextInput
            value={page}
            onChangeText={setPage}
            keyboardType="numeric"
            placeholder="201"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 tabular-nums text-sm text-foreground"
          />
        </View>
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
