import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ChevronLeft } from '../../lib/icons';
import { IconButton } from './icon-button';

/**
 * Header row for stack screens (docs/design/DESIGN_SYSTEM.md §6): back
 * button, title at the screen-title size, optional one-line subtitle, and
 * a right-hand slot for actions. Render it directly under the screen's
 * SafeAreaView so every pushed screen lines up the same way.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = '뒤로 가기',
  right,
  className = '',
}: {
  title: string;
  subtitle?: string;
  /** Omit on tab roots that have no back navigation. */
  onBack?: () => void;
  /** Spoken name of the back button — "닫기" on modal-presented screens. */
  backLabel?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <View className={`min-h-11 flex-row items-center gap-3 px-5 pb-3 pt-1 ${className}`}>
      {onBack ? <IconButton Icon={ChevronLeft} label={backLabel} onPress={onBack} iconSize={20} /> : null}
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-xl font-black tracking-tight text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
