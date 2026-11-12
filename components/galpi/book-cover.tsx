import type { ReactNode } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, useThemeColors, type Accent } from '../../lib/theme';

type Size = 'sm' | 'md' | 'lg' | 'fill';

/**
 * Width and corner radius per size (docs/design/DESIGN_SYSTEM.md §4, §7):
 * the radius grows with the cover so a 44px thumbnail reads as a book
 * edge, not an app icon. `fill` takes the parent's width (grid tiles).
 */
const SIZE: Record<Size, { width: string; radius: string; icon: number; showTitle: boolean }> = {
  sm: { width: 'w-11', radius: 'rounded-sm', icon: 12, showTitle: false },
  md: { width: 'w-14', radius: 'rounded-md', icon: 14, showTitle: false },
  lg: { width: 'w-28', radius: 'rounded-lg', icon: 16, showTitle: true },
  fill: { width: 'w-full', radius: 'rounded-md', icon: 20, showTitle: false },
};

/**
 * The one way to draw a book cover: always 2:3, radius by size, a hairline
 * inside the edge so white covers don't dissolve into a white surface, and
 * the accent-color spine fallback when there's no image or it fails to
 * load. Overlays (count badges, dim layers) go in `children` and are
 * positioned absolutely by the caller. Shadow is the caller's choice —
 * pass `SHADOW.cover` via `style` on hero covers only.
 */
export function BookCover({
  coverUrl,
  title,
  accent,
  size = 'md',
  className = '',
  style,
  children,
}: {
  coverUrl?: string;
  title: string;
  accent: Accent;
  size?: Size;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { showCover, onCoverError } = useCoverFallback(coverUrl);
  const colors = useThemeColors();
  const { width, radius, icon, showTitle } = SIZE[size];
  const onInk = accent === 'ink';
  const inkText = onInk ? colors.galpiPaper : colors.galpiInk;

  return (
    <View
      className={`relative aspect-[2/3] shrink-0 overflow-hidden ${width} ${radius} ${
        showCover ? 'bg-secondary' : ACCENT_BG_CLASS[accent]
      } ${className}`}
      style={style}
    >
      {showCover ? (
        <Image
          source={{ uri: coverUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
          onError={onCoverError}
          accessibilityLabel={`${title} 표지`}
        />
      ) : (
        <View className={`flex-1 ${showTitle ? 'justify-between p-3' : 'items-end justify-end p-1.5'}`}>
          <View className={`absolute bottom-0 left-1.5 top-0 w-px ${onInk ? 'bg-galpi-paper/15' : 'bg-galpi-ink/10'}`} />
          <Bookmark size={icon} color={inkText} opacity={0.7} />
          {showTitle ? (
            <Text numberOfLines={3} className="text-2xs font-black leading-tight" style={{ color: inkText }}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
      <View pointerEvents="none" className={`absolute inset-0 border border-galpi-ink/5 ${radius}`} />
      {children}
    </View>
  );
}
