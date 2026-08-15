import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { Bookmark, Check, Download, Quote, Share2, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { captureViewAsImage, MediaPermissionError, saveImageToDevice, shareImage, ShareUnavailableError } from '../../lib/share-image';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { type Book } from '../../lib/data/books';
import { type Sentence } from '../../lib/data/sentences';
import { ACCENT_HEX, colors, useThemeColors } from '../../lib/theme';

type Ratio = '1:1' | '9:16';
type CardTheme = 'ink' | 'paper' | 'accent';

const THEME_LABEL: Record<CardTheme, string> = {
  ink: '잉크',
  paper: '페이퍼',
  accent: '책갈피 컬러',
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Background + text color for a given theme, with `accent` following the
 * book's own spine color. Intentionally uses the fixed light-mode brand
 * colors (not `useThemeColors()`) — the exported card is a shareable image,
 * so its "ink"/"paper" look must stay the same regardless of the viewer's
 * app theme.
 */
function cardPalette(theme: CardTheme, book: Book): { bg: string; text: string } {
  if (theme === 'paper') return { bg: colors.card, text: colors.galpiInk };
  if (theme === 'accent') {
    const bg = ACCENT_HEX[book.accent];
    return { bg, text: book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk };
  }
  return { bg: colors.galpiInk, text: colors.galpiPaper };
}

/**
 * Turns a single 갈피 (quote) into a shareable image card — the per-sentence
 * counterpart to the monthly/yearly report card in stats-report-screen.tsx.
 * Reuses the same "small preview + off-screen full-size capture target"
 * trick so the exported PNG is sharp regardless of the sheet's on-screen
 * width.
 */
export function SentenceCardModal({
  book,
  sentence,
  onClose,
}: {
  book: Book;
  sentence: Sentence;
  onClose: () => void;
}) {
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [theme, setTheme] = useState<CardTheme>('ink');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [realCardWidth, setRealCardWidth] = useState(0);
  const cardRef = useRef<View>(null);
  const themeColors = useThemeColors();

  const palette = cardPalette(theme, book);

  async function handleSaveImage() {
    if (busy) return;
    setBusy('save');
    try {
      const uri = await captureViewAsImage(cardRef);
      await saveImageToDevice(uri, `galpi-quote-${Date.now()}.png`);
      if (Platform.OS !== 'web') {
        Alert.alert('저장 완료', '갈피 카드 이미지를 사진 보관함에 저장했어요.');
      }
    } catch (err) {
      if (err instanceof MediaPermissionError) {
        Alert.alert('권한이 필요해요', err.message);
      } else {
        Alert.alert('저장 실패', '이미지를 저장하는 중 문제가 발생했어요.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await captureViewAsImage(cardRef);
      await shareImage(uri, {
        filename: 'galpi-quote.png',
        title: '갈피',
        dialogTitle: '갈피 카드 공유하기',
      });
    } catch (err) {
      if (err instanceof ShareUnavailableError) {
        Alert.alert('공유하기', err.message);
      } else {
        Alert.alert('공유 실패', '카드를 공유하는 중 문제가 발생했어요.');
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      zIndex={40}
      header={
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Galpi Card
            </Text>
            <Text className="mt-0.5 text-lg font-black tracking-tight text-foreground">갈피 카드 만들기</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={themeColors.foreground} />
          </Pressable>
        </View>
      }
    >
      {/* 비율 선택 */}
      <View className="mb-4 flex-row gap-1 rounded-2xl bg-secondary p-1">
        {([
          { key: '1:1' as Ratio, label: '1:1 인스타 피드' },
          { key: '9:16' as Ratio, label: '9:16 스토리' },
        ]).map(({ key, label }) => {
          const active = ratio === key;
          return (
            <Pressable
              key={key}
              onPress={() => setRatio(key)}
              className={`web:cursor-pointer flex-1 rounded-xl py-2.5 ${active ? 'bg-card' : ''}`}
            >
              <Text className={`text-center text-xs font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 카드 디자인 선택 */}
      <View className="mb-4 flex-row items-center justify-center gap-6">
        {(['ink', 'paper', 'accent'] as CardTheme[]).map((key) => {
          const active = theme === key;
          const { bg, text } = cardPalette(key, book);
          return (
            <Pressable key={key} onPress={() => setTheme(key)} accessibilityLabel={`${THEME_LABEL[key]} 카드`} className="items-center gap-1.5">
              <View
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  key === 'paper' ? 'border border-border' : ''
                }`}
                style={{ backgroundColor: bg }}
              >
                {active ? <Check size={16} color={text} /> : null}
              </View>
              <Text className={`text-[11px] font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {THEME_LABEL[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 카드 미리보기 — 화면엔 작게 보여주고, 캡처는 실제 크기(전체 너비)로 별도 렌더링 */}
      <View className="items-center rounded-2xl bg-secondary p-4">
        {/* 실제 크기 측정용 스페이서: 시각적으로는 차지하는 공간이 없음 */}
        <View className="h-0 w-full" onLayout={(e) => setRealCardWidth(e.nativeEvent.layout.width)} />

        <View
          className={`overflow-hidden rounded-3xl p-6 ${ratio === '1:1' ? 'w-full' : 'w-[58%]'}`}
          style={{
            aspectRatio: ratio === '1:1' ? 1 : 9 / 16,
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: hexToRgba(palette.text, 0.08),
          }}
        >
          <SentenceCardBody book={book} sentence={sentence} theme={theme} palette={palette} />
        </View>

        {/* 캡처 전용 실제 크기 카드: 화면 밖에 렌더링되어 보이지 않음 */}
        {realCardWidth > 0 ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: -99999, top: 0 }}>
            <View
              ref={cardRef}
              collapsable={false}
              className="overflow-hidden rounded-3xl p-6"
              style={{
                width: realCardWidth,
                aspectRatio: ratio === '1:1' ? 1 : 9 / 16,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: hexToRgba(palette.text, 0.08),
              }}
            >
              <SentenceCardBody book={book} sentence={sentence} theme={theme} palette={palette} />
            </View>
          </View>
        ) : null}
      </View>

      {/* 액션 버튼 */}
      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={handleSaveImage}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'save' ? <ActivityIndicator color={themeColors.galpiPaper} /> : <Download size={16} color={themeColors.galpiPaper} />}
          <Text className="text-sm font-bold text-galpi-paper">이미지 저장하기</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'share' ? <ActivityIndicator color={themeColors.foreground} /> : <Share2 size={16} color={themeColors.foreground} />}
          <Text className="text-sm font-bold text-foreground">SNS 공유하기</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/** Longer quotes need a smaller size to avoid overflowing the fixed-aspect card. */
function quoteSizeClass(length: number): string {
  if (length <= 40) return 'text-3xl';
  if (length <= 80) return 'text-2xl';
  if (length <= 140) return 'text-xl';
  if (length <= 220) return 'text-lg';
  return 'text-base';
}

/** 카드의 실제 내용. 작은 미리보기와 실제 크기 캡처 대상 양쪽에서 그대로 재사용한다. */
function SentenceCardBody({
  book,
  sentence,
  theme,
  palette,
}: {
  book: Book;
  sentence: Sentence;
  theme: CardTheme;
  palette: { bg: string; text: string };
}) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const { text } = palette;
  const MarkIcon = theme === 'accent' ? Bookmark : Quote;

  return (
    <View className="relative flex-1 justify-between overflow-hidden">
      {/* 배경 장식: 큰 인용부호로 여백을 채워 카드가 비어 보이지 않게 함 */}
      <Text
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: -6, color: text, opacity: 0.1 }}
        className="text-8xl font-black leading-none"
      >
        “
      </Text>

      <View className="flex-row items-center justify-end">
        <View
          className="flex-row items-center gap-1 rounded-full px-2 py-1"
          style={{ backgroundColor: hexToRgba(text, 0.12) }}
        >
          <MarkIcon size={11} color={text} opacity={0.8} />
          <Text style={{ color: text, opacity: 0.8 }} className="text-[10px] font-bold">
            {sentence.date}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={7}
        ellipsizeMode="tail"
        style={{ color: text }}
        className={`${quoteSizeClass(sentence.quote.length)} font-bold leading-relaxed`}
      >
        "{sentence.quote}"
      </Text>

      <View
        className="flex-row items-center gap-3 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: hexToRgba(text, 0.15) }}
      >
        <View
          className="relative h-10 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md"
          style={{ backgroundColor: hexToRgba(text, showCover ? 0.08 : 0.12) }}
        >
          {showCover ? (
            <Image
              source={{ uri: book.coverUrl }}
              className="absolute inset-0 h-full w-full"
              resizeMode="cover"
              onError={onCoverError}
            />
          ) : (
            <Bookmark size={12} color={text} opacity={0.5} />
          )}
        </View>
        <Text numberOfLines={1} style={{ color: text }} className="min-w-0 flex-1 text-xs font-bold">
          {book.title} <Text style={{ color: text, opacity: 0.5 }} className="font-normal">· {book.author}</Text>
        </Text>
        <View className="shrink-0 rounded-md px-2 py-0.5" style={{ backgroundColor: hexToRgba(text, 0.14) }}>
          <Text style={{ color: text }} className="font-mono text-[10px] font-bold">
            P.{sentence.page}
          </Text>
        </View>
      </View>
    </View>
  );
}
