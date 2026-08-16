import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanLine, CalendarHeart, BarChart3, ArrowRight } from 'lucide-react-native';
import { GalpiHeaderLogo } from '../galpi/galpi-logo';
import { useThemeColors } from '../../lib/theme';

type Accent = 'blue' | 'green' | 'yellow';

type Slide = {
  key: string;
  accent: Accent;
  title: string;
  desc: string;
  Art: () => React.ReactNode;
};

const ACCENT_BG_CLASS: Record<Accent, string> = {
  blue: 'bg-galpi-blue',
  green: 'bg-galpi-green',
  yellow: 'bg-galpi-yellow',
};

const SLIDES: Slide[] = [
  {
    key: 'scan',
    accent: 'yellow',
    title: '문장을 스캔해\n갈피로 소장하세요',
    desc: '책 속 인상 깊은 문장을 카메라로 스캔하면\n나만의 갈피가 되어 차곡차곡 쌓여요.',
    Art: ScanArt,
  },
  {
    key: 'archive',
    accent: 'green',
    title: '달력과 책장에\n쌓이는 독서 기록',
    desc: '읽은 날짜와 완독한 책이\n달력과 책장에 차곡차곡 기록돼요.',
    Art: ArchiveArt,
  },
  {
    key: 'report',
    accent: 'blue',
    title: '감성적인\n월간·연간 리포트',
    desc: '한 달, 한 해의 독서를 담은\n리포트를 만들고 친구와 공유해요.',
    Art: ReportArt,
  },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const colors = useThemeColors();

  function next() {
    if (isLast) onDone();
    else setIndex((i) => i + 1);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      {/* 상단: 로고 + 건너뛰기 */}
      <View className="flex-row items-center justify-between px-6 pt-6">
        <GalpiHeaderLogo markSize={24} wordClassName="text-[17px] text-foreground" />
        <Pressable onPress={onDone} className="web:cursor-pointer">
          <Text className="text-[13px] font-medium text-muted-foreground">건너뛰기</Text>
        </Pressable>
      </View>

      {/* 일러스트 */}
      <View className="flex-1 items-center justify-center px-6">
        <View
          className={`aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[2.5rem] ${ACCENT_BG_CLASS[slide.accent]}`}
        >
          <slide.Art />
        </View>
      </View>

      {/* 텍스트 */}
      <View className="px-8">
        <Text className="text-[26px] font-black leading-tight tracking-tight text-foreground">
          {slide.title}
        </Text>
        <Text className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          {slide.desc}
        </Text>
      </View>

      {/* 인디케이터 + 버튼 */}
      <View className="px-8 pb-9 pt-7">
        <View className="mb-6 flex-row items-center gap-2">
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={`h-2 rounded-full ${i === index ? 'w-6 bg-foreground' : 'w-2 bg-border'}`}
            />
          ))}
        </View>

        <Pressable
          onPress={next}
          className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4"
          style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
        >
          <Text className="text-[15px] font-bold text-primary-foreground">
            {isLast ? '갈피 시작하기' : '다음'}
          </Text>
          {!isLast ? <ArrowRight size={16} color={colors.galpiPaper} /> : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------- 미니멀 라인아트 ---------- */

function ScanArt() {
  const colors = useThemeColors();
  return (
    <View>
      <ScanLine size={96} color={colors.galpiInk} strokeWidth={1.4} />
      <View
        className="absolute h-12 w-9 rounded-md border-2 border-galpi-ink bg-galpi-paper"
        style={{ right: -24, top: -24, transform: [{ rotate: '6deg' }] }}
      />
      <View
        className="absolute h-10 w-8 rounded-md border-2 border-galpi-ink bg-galpi-paper"
        style={{ left: -28, bottom: -24, transform: [{ rotate: '-12deg' }] }}
      />
    </View>
  );
}

function ArchiveArt() {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-end gap-1.5">
      {[7, 5, 8, 4, 6].map((h, i) => (
        <View
          key={i}
          className="w-6 rounded-t-md border-2 border-galpi-ink bg-galpi-paper"
          style={{ height: h * 12 }}
        />
      ))}
      <CalendarHeart size={48} color={colors.galpiInk} strokeWidth={1.4} style={{ marginBottom: 4, marginLeft: 8 }} />
    </View>
  );
}

function ReportArt() {
  const colors = useThemeColors();
  return (
    <View>
      <BarChart3 size={96} color={colors.galpiInk} strokeWidth={1.4} />
      <View className="absolute gap-1.5" style={{ right: -32, top: 8 }}>
        {[1, 0.7, 0.85].map((w, i) => (
          <View key={i} className="h-2 rounded-full bg-galpi-ink/70" style={{ width: w * 44 }} />
        ))}
      </View>
    </View>
  );
}
