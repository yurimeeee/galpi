import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Type,
  Camera,
  Image as ImageIcon,
  ScanLine,
  Check,
  type LucideIcon,
} from 'lucide-react-native';
import type { EntryType, Sentence } from '../../lib/data/sentences';
import { colors } from '../../lib/theme';

const MODES: { key: EntryType; label: string; Icon: LucideIcon }[] = [
  { key: 'text', label: '직접 입력', Icon: Type },
  { key: 'scan', label: '카메라 스캔', Icon: Camera },
  { key: 'photo', label: '페이지 사진', Icon: ImageIcon },
];

// 스캔 모드에서 추출된 것처럼 보이는 목업 텍스트 조각
const SCANNED_TOKENS = [
  '가장', '평범한', '하루가', '누군가에게는',
  '간절히', '되찾고', '싶은', '어제였다.',
];
const SCANNED_SENTENCE = '가장 평범한 하루가 누군가에게는 간절히 되찾고 싶은 어제였다.';

export function AddSentenceScreen({
  bookId,
  bookTitle,
  onBack,
  onSave,
}: {
  bookId: string;
  bookTitle: string;
  onBack: () => void;
  onSave: (sentence: Omit<Sentence, 'id' | 'date'>) => void;
}) {
  const [mode, setMode] = useState<EntryType>('text');
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);

  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [memo, setMemo] = useState('');

  function toggleToken(i: number) {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b),
    );
  }

  function handleSave() {
    if (mode === 'text') {
      onSave({
        bookId,
        page: Number(page) || 0,
        quote: text.trim() || '마음에 담고 싶은 문장',
        memo: memo.trim() || undefined,
        type: 'text',
      });
    } else if (mode === 'scan') {
      onSave({
        bookId,
        page: Number(page) || 0,
        quote: selected.map((i) => SCANNED_TOKENS[i]).join(' ') || SCANNED_SENTENCE,
        type: 'scan',
      });
    } else {
      onSave({
        bookId,
        page: Number(page) || 0,
        quote: memo.trim() || '페이지 사진으로 남긴 갈피',
        type: 'photo',
      });
    }
    onBack();
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

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled">
        {mode === 'text' ? (
          <TextMode text={text} setText={setText} page={page} setPage={setPage} memo={memo} setMemo={setMemo} />
        ) : null}
        {mode === 'scan' ? (
          <ScanMode
            tokens={SCANNED_TOKENS}
            selected={selected}
            onToggle={toggleToken}
            page={page}
            setPage={setPage}
          />
        ) : null}
        {mode === 'photo' ? <PhotoMode memo={memo} setMemo={setMemo} page={page} setPage={setPage} /> : null}
      </ScrollView>

      {/* 저장 버튼 */}
      <View className="border-t border-border bg-card/80 px-5 py-4 web:backdrop-blur">
        <Pressable
          onPress={handleSave}
          className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4"
          style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
        >
          <Check size={16} color={colors.galpiPaper} />
          <Text className="text-sm font-bold text-galpi-paper">갈피 저장하기</Text>
        </Pressable>
      </View>
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
function ScanMode({
  tokens,
  selected,
  onToggle,
  page,
  setPage,
}: {
  tokens: string[];
  selected: number[];
  onToggle: (i: number) => void;
  page: string;
  setPage: (v: string) => void;
}) {
  const corners = [
    { top: 12, left: 12 },
    { top: 12, right: 12 },
    { bottom: 12, left: 12 },
    { bottom: 12, right: 12 },
  ];

  return (
    <View className="gap-4">
      {/* 카메라 프리뷰 */}
      <View className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-galpi-ink">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm leading-relaxed text-galpi-paper/40">
            가장 평범한 하루가 누군가에게는 간절히 되찾고 싶은 어제였다.
          </Text>
        </View>
        {/* 하이라이트 박스 */}
        <View
          className="absolute inset-x-8 h-16 rounded-lg border-2 border-galpi-yellow"
          style={{ top: '50%', marginTop: -32 }}
        >
          <View className="absolute -top-6 left-0 flex-row items-center gap-1">
            <ScanLine size={12} color={colors.galpiYellow} />
            <Text className="text-[11px] font-bold" style={{ color: colors.galpiYellow }}>
              문장 인식 중
            </Text>
          </View>
        </View>
        {/* 코너 마커 */}
        {corners.map((pos, i) => (
          <View
            key={i}
            className="absolute h-4 w-4 border-galpi-paper/60"
            style={{ ...pos, borderWidth: 2 }}
          />
        ))}
      </View>

      {/* 추출된 텍스트 (선택 가능) */}
      <Field label="인식된 텍스트 · 담을 단어를 눌러 선택">
        <View className="flex-row flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-4">
          {tokens.map((t, i) => {
            const on = selected.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => onToggle(i)}
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
  memo,
  setMemo,
  page,
  setPage,
}: {
  memo: string;
  setMemo: (v: string) => void;
  page: string;
  setPage: (v: string) => void;
}) {
  return (
    <View className="gap-4">
      <Field label="페이지 사진">
        <View className="aspect-[3/4] w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-galpi-green">
            <ImageIcon size={24} color={colors.galpiInk} />
          </View>
          <Text className="text-sm font-semibold text-foreground">사진 불러오기</Text>
          <Text className="text-xs text-muted-foreground">책 페이지를 통째로 기록해요</Text>
        </View>
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
