import { PropsWithChildren } from 'react';
import { Keyboard, Platform, Pressable, useWindowDimensions, View } from 'react-native';

// DESIGN_SYSTEM §8 — container strategy shared by web and native tablets.
//   < 640       full-bleed
//   640 – 1023  centered column, max 480
//   ≥ 1024      centered column, max 560
const CONTAINER_BREAKPOINT = 640;
const WIDE_BREAKPOINT = 1024;
const CONTAINER_WIDTH = 480;
const WIDE_CONTAINER_WIDTH = 560;

/** Width of the column the app content actually renders in (not the window). */
export function getContainerWidth(windowWidth: number): number {
  if (windowWidth < CONTAINER_BREAKPOINT) return windowWidth;
  if (windowWidth < WIDE_BREAKPOINT) return CONTAINER_WIDTH;
  return WIDE_CONTAINER_WIDTH;
}

/** Hook form of getContainerWidth, for screens that size their own grid by it. */
export function useContainerWidth(): number {
  const { width } = useWindowDimensions();
  return getContainerWidth(width);
}

/**
 * On wide viewports (desktop web, tablets), centers the app in a single
 * full-height column against a `bg-secondary` backdrop. On phones, or on
 * narrow web viewports, renders full-bleed.
 */
export function WebFrame({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const containerWidth = getContainerWidth(width);

  // Dismisses the keyboard on any tap that isn't claimed by a nested
  // touchable/input first — gives every screen a tap-outside-to-close
  // without each one having to wire it up individually. Native-only:
  // on web, Pressable's onPress is a bubbling DOM click, so wrapping
  // inputs in it would blur them the instant they're focused.
  const content =
    Platform.OS === 'web' ? (
      <View className="flex-1 min-h-0">{children}</View>
    ) : (
      <Pressable className="flex-1 min-h-0" onPress={() => Keyboard.dismiss()} accessible={false}>
        {children}
      </Pressable>
    );

  if (containerWidth >= width) {
    return <View className="flex-1 min-h-0 bg-background">{content}</View>;
  }

  return (
    <View className="flex-1 min-h-0 items-center bg-secondary">
      <View
        className="w-full flex-1 min-h-0 border-x border-border bg-background"
        style={{ maxWidth: containerWidth }}
      >
        {content}
      </View>
    </View>
  );
}
