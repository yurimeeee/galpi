import { PropsWithChildren } from 'react';
import { Keyboard, Platform, Pressable, useWindowDimensions, View } from 'react-native';

const FRAME_BREAKPOINT = 640; // matches source's `sm:` breakpoint

/**
 * On web desktop widths, centers the app inside a bordered mobile-shaped
 * frame with a shadow (mirrors `app/page.tsx` in the v0 source). On native,
 * or on narrow web viewports, renders full-bleed.
 */
export function WebFrame({ children }: PropsWithChildren) {
  const { width, height } = useWindowDimensions();

  // Dismisses the keyboard on any tap that isn't claimed by a nested
  // touchable/input first — gives every screen a tap-outside-to-close
  // without each one having to wire it up individually.
  const content = (
    <Pressable className="flex-1" onPress={() => Keyboard.dismiss()} accessible={false}>
      {children}
    </Pressable>
  );

  if (Platform.OS !== 'web' || width < FRAME_BREAKPOINT) {
    return <View className="flex-1 bg-background">{content}</View>;
  }

  return (
    <View
      className="flex-1 items-center justify-center bg-secondary"
      style={{ minHeight: height }}
    >
      <View
        className="overflow-hidden bg-background"
        style={{
          width: 400,
          height: 860,
          borderRadius: 44,
          borderWidth: 8,
          borderColor: '#202020',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 20 },
        }}
      >
        {content}
      </View>
    </View>
  );
}
