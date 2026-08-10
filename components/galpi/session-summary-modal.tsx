import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Clock, Bookmark, BookCheck, Check, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { type Book } from '../../lib/data/books';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

function formatMinutes(totalSeconds: number) {
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}시간 ${rest}분` : `${h}시간`;
}

/**
 * Session-end summary. Page range is captured for the user's own reference
 * only and isn't persisted — there's no per-session page log on Book.
 * Focus minutes *are* persisted, via onSave in reading-timer-screen.tsx
 * (logReadingMinutes), to power the reading-goal screen's daily progress.
 */
export function SessionSummaryModal({
  book,
  totalSeconds,
  sessionsDone,
  sentencesCaptured,
  onClose,
  onSave,
}: {
  book: Book;
  totalSeconds: number;
  sessionsDone: number;
  sentencesCaptured: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);

  const pagesRead = Math.max(0, Number(endPage) - Number(startPage) || 0);

  return (
    <BottomSheet
      onClose={onClose}
      zIndex={30}
      header={
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              독서 세션 완료
            </Text>
            <Text className="mt-1 text-xl font-black tracking-tight text-foreground">
              오늘의 몰입, 잘 마쳤어요
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>
      }
    >
      {/* 요약 지표 */}
      <View className="mb-6 mt-4 flex-row gap-3">
        <SummaryStat Icon={Clock} value={formatMinutes(totalSeconds)} label="총 독서 시간" />
        <SummaryStat Icon={BookCheck} value={`${sessionsDone}회`} label="완료 세션" />
        <SummaryStat Icon={Bookmark} value={`${sentencesCaptured}개`} label="수집한 갈피" />
      </View>

      {/* 대상 책 */}
      <View className="mb-5 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <View
          className={`relative h-14 w-10 shrink-0 items-end justify-center overflow-hidden rounded-lg ${
            showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]
          } p-1.5`}
        >
          {showCover ? (
            <Image
              source={{ uri: book.coverUrl }}
              className="absolute inset-0 h-full w-full"
              resizeMode="cover"
              onError={onCoverError}
            />
          ) : null}
          <View className={showCover ? 'rounded-full bg-galpi-ink/50 p-0.5' : undefined}>
            <Bookmark
              size={14}
              color={showCover || book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk}
              opacity={showCover ? 1 : book.accent === 'ink' ? 1 : 0.7}
            />
          </View>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-bold text-foreground">
            {book.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {book.author}
          </Text>
        </View>
      </View>

      {/* 읽은 페이지 입력 */}
      <View className="mb-6">
        <Text className="mb-2 text-xs font-bold text-foreground">읽은 페이지 수</Text>
        <View className="flex-row items-center gap-3">
          <PageInput value={startPage} onChange={setStartPage} prefix="p." />
          <Text className="text-sm font-medium text-muted-foreground">~</Text>
          <PageInput value={endPage} onChange={setEndPage} prefix="p." />
          <View className="ml-auto rounded-full bg-galpi-green px-3 py-1.5">
            <Text className="text-xs font-bold text-galpi-ink">{pagesRead}p 읽음</Text>
          </View>
        </View>
      </View>

      {/* 저장 */}
      <Pressable
        onPress={onSave}
        className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4"
        style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
      >
        <Check size={16} color={colors.galpiPaper} />
        <Text className="text-sm font-bold text-galpi-paper">독서 기록에 반영하기</Text>
      </Pressable>
    </BottomSheet>
  );
}

function SummaryStat({
  Icon,
  value,
  label,
}: {
  Icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center gap-1.5 rounded-2xl bg-secondary py-4">
      <Icon size={16} color={colors.mutedForeground} />
      <Text className="text-base font-black text-foreground">{value}</Text>
      <Text className="text-[10px] font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}

function PageInput({
  value,
  onChange,
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix: string;
}) {
  return (
    <View className="flex-row items-center gap-1 rounded-xl border border-border bg-card px-3 py-2.5">
      <Text className="text-xs font-medium text-muted-foreground">{prefix}</Text>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        accessibilityLabel={`${prefix} 페이지`}
        className="w-10 text-sm font-bold text-foreground"
      />
    </View>
  );
}
