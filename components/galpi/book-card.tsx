import { View, Text } from 'react-native';
import { Bookmark, Star } from '../../lib/icons';
import { type Book, STATUS_LABEL } from '../../lib/data/books';
import { BookCover } from './book-cover';
import { useThemeColors } from '../../lib/theme';

function Rating({ value }: { value: number }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-0.5" accessibilityLabel={`별점 ${value}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          color={i < value ? colors.galpiInk : colors.mutedForeground}
          fill={i < value ? colors.galpiInk : 'transparent'}
          opacity={i < value ? 1 : 0.4}
        />
      ))}
    </View>
  );
}

export function BookCard({ book }: { book: Book }) {
  const isWish = book.status === 'wish';
  const colors = useThemeColors();

  return (
    <View className="flex-row items-stretch gap-4">
      <BookCover coverUrl={book.coverUrl} title={book.title} accent={book.accent} size="md" />

      <View className="min-w-0 flex-1 justify-center border-b border-border pb-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-md font-bold leading-tight text-foreground">
              {book.title}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
              {book.author}
            </Text>
          </View>
          <View className="shrink-0 rounded-full bg-secondary px-2.5 py-1">
            <Text className="text-2xs font-medium text-muted-foreground">
              {STATUS_LABEL[book.status]}
            </Text>
          </View>
        </View>

        {!isWish ? (
          <View className="mt-2.5 flex-row items-center gap-3">
            <Rating value={book.rating} />
            <View className="flex-row items-center gap-1">
              <Bookmark size={12} color={colors.foreground} />
              <Text className="text-xs font-medium text-foreground">
                갈피 {book.galpiCount}개
              </Text>
            </View>
          </View>
        ) : (
          <Text className="mt-2.5 text-xs text-muted-foreground">
            아직 펼치지 않은 책 · 위시리스트
          </Text>
        )}
      </View>
    </View>
  );
}
