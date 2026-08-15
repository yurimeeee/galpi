import { Image, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';
import { type Book } from '../../lib/data/books';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, useThemeColors } from '../../lib/theme';

const ROW_HEIGHT = 76;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** Shifts every id between `from` and `to` by one slot, like an array splice-move — not a plain pairwise swap, so fast drags across multiple rows still land correctly. */
function moveIndex(positions: Record<string, number>, from: number, to: number) {
  'worklet';
  const next = { ...positions };
  for (const id in positions) {
    const index = positions[id];
    if (index === from) {
      next[id] = to;
    } else if (from < to && index > from && index <= to) {
      next[id] = index - 1;
    } else if (from > to && index >= to && index < from) {
      next[id] = index + 1;
    }
  }
  return next;
}

export function ReorderBookList({
  books,
  onReorder,
}: {
  books: Book[];
  /** Called once, at the end of each drag, with the full new front-to-back id order. */
  onReorder: (orderedBookIds: string[]) => void;
}) {
  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(books.map((b, i) => [b.id, i])),
  );

  function handleDragEnd(finalPositions: Record<string, number>) {
    const orderedIds = Object.entries(finalPositions)
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => id);
    onReorder(orderedIds);
  }

  return (
    <View style={{ height: ROW_HEIGHT * books.length }} className="relative">
      {books.map((book) => (
        <DraggableRow
          key={book.id}
          book={book}
          positions={positions}
          numItems={books.length}
          onDragEnd={handleDragEnd}
        />
      ))}
    </View>
  );
}

function DraggableRow({
  book,
  positions,
  numItems,
  onDragEnd,
}: {
  book: Book;
  positions: SharedValue<Record<string, number>>;
  numItems: number;
  onDragEnd: (positions: Record<string, number>) => void;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const startIndex = useSharedValue(0);
  const colors = useThemeColors();

  const pan = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      startIndex.value = positions.value[book.id] ?? 0;
      translateY.value = 0;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
      const newIndex = clamp(Math.round(startIndex.value + e.translationY / ROW_HEIGHT), 0, numItems - 1);
      const currentIndex = positions.value[book.id];
      if (newIndex !== currentIndex) {
        positions.value = moveIndex(positions.value, currentIndex, newIndex);
      }
    })
    .onEnd(() => {
      isActive.value = false;
      translateY.value = withTiming(0, { duration: 200 });
      runOnJS(onDragEnd)(positions.value);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const index = positions.value[book.id] ?? 0;
    return {
      top: isActive.value ? startIndex.value * ROW_HEIGHT : withTiming(index * ROW_HEIGHT, { duration: 200 }),
      transform: [{ translateY: translateY.value }],
      zIndex: isActive.value ? 10 : 0,
      elevation: isActive.value ? 4 : 0,
    };
  });

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT }, animatedStyle]}
    >
      <View className="flex-row items-center gap-3 pr-1">
        <RowCover book={book} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-bold text-foreground">
            {book.title}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
            {book.author}
          </Text>
        </View>
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityLabel={`${book.title} 순서 옮기기`}
            className="h-11 w-11 items-center justify-center web:cursor-grab"
          >
            <GripVertical size={18} color={colors.mutedForeground} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

function RowCover({ book }: { book: Book }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  return (
    <View className={`h-14 w-10 shrink-0 overflow-hidden rounded-lg ${showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]}`}>
      {showCover ? (
        <Image source={{ uri: book.coverUrl }} className="h-full w-full" resizeMode="cover" onError={onCoverError} />
      ) : null}
    </View>
  );
}
