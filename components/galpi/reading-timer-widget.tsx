import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BookOpen, Coffee } from 'lucide-react-native';
import { useReadingTimerStore, timerSecondsLeft } from '../../lib/reading-timer-store';
import { useNow } from '../../lib/hooks/use-now';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

const SIZE = 64;
const MARGIN = 14;
const BOTTOM_CLEARANCE = 110; // clears the bottom nav on tab screens

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * PiP-style floating timer bubble — mounted once at the app root (see
 * app/_layout.tsx) so it survives navigation between screens instead of
 * living inside reading-timer-screen.tsx, which unmounts when you leave it.
 * Draggable anywhere within its container (the phone-frame box on wide web,
 * the real screen on native — see the `onLayout` bounds below), snaps to
 * the nearest side edge on release. Tapping it (without dragging) reopens
 * the full timer screen.
 */
export function ReadingTimerWidget() {
  const pathname = usePathname();
  const router = useRouter();

  const active = useReadingTimerStore((s) => s.active);
  const running = useReadingTimerStore((s) => s.running);
  const completed = useReadingTimerStore((s) => s.completed);
  const phase = useReadingTimerStore((s) => s.phase);
  const book = useReadingTimerStore((s) => s.book);

  // Forces a repaint every second while running, so the store-derived
  // `secondsLeft` selector below (computed from Date.now()) stays live.
  useNow(active && running);
  const secondsLeft = useReadingTimerStore(timerSecondsLeft);

  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [positioned, setPositioned] = useState(false);

  useEffect(() => {
    if (bounds.width > 0 && bounds.height > 0 && !positioned) {
      translateX.value = bounds.width - SIZE - MARGIN;
      translateY.value = bounds.height - SIZE - BOTTOM_CLEARANCE;
      setPositioned(true);
    }
  }, [bounds, positioned, translateX, translateY]);

  const { showCover, onCoverError } = useCoverFallback(book?.coverUrl);

  const visible = active && book && pathname !== '/reading-timer' && positioned;

  function openTimer() {
    router.push('/reading-timer');
  }

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd(() => {
      runOnJS(openTimer)();
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = clamp(startX.value + e.translationX, 0, bounds.width - SIZE);
      translateY.value = clamp(startY.value + e.translationY, 0, bounds.height - SIZE);
    })
    .onEnd(() => {
      const nearLeft = translateX.value + SIZE / 2 < bounds.width / 2;
      translateX.value = withSpring(nearLeft ? MARGIN : bounds.width - SIZE - MARGIN, { damping: 18 });
    });

  const gesture = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const isRest = phase === 'rest';
  const PhaseIcon = isRest ? Coffee : BookOpen;

  return (
    <View pointerEvents="box-none" className="absolute inset-0" onLayout={(e) => setBounds(e.nativeEvent.layout)}>
      {visible ? (
        <GestureDetector gesture={gesture}>
          <Animated.View
            accessibilityLabel="독서 타이머 열기"
            style={[{ position: 'absolute', width: SIZE, height: SIZE }, animatedStyle]}
            className="web:cursor-grab"
          >
            <View
              className={`h-full w-full items-center justify-center overflow-hidden rounded-full ${
                showCover ? '' : isRest ? 'bg-galpi-green' : 'bg-galpi-ink'
              }`}
              style={{
                shadowColor: colors.galpiInk,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              {showCover ? (
                <>
                  <Image
                    source={{ uri: book!.coverUrl }}
                    className="absolute inset-0 h-full w-full"
                    resizeMode="cover"
                    onError={onCoverError}
                  />
                  <View className="absolute inset-0 bg-galpi-ink/55" />
                </>
              ) : book!.accent !== 'ink' ? (
                <View className={`absolute inset-0 ${ACCENT_BG_CLASS[book!.accent]} opacity-30`} />
              ) : null}

              <PhaseIcon size={12} color={colors.galpiPaper} opacity={0.8} />
              <Text className="mt-0.5 font-mono text-[13px] font-black tabular-nums text-galpi-paper">
                {fmt(secondsLeft)}
              </Text>
              {!running ? (
                <View className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-galpi-yellow" />
              ) : null}
              {completed ? (
                <View className="absolute inset-0 items-center justify-center bg-galpi-ink/80">
                  <Text className="text-[10px] font-black text-galpi-paper">완료!</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}
