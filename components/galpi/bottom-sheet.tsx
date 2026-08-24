import { useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 1.2;
const useNativeDriver = Platform.OS !== 'web';

/**
 * Backdrop + rounded-top sheet shared by the app's bottom-sheet-style
 * modals. Closes on backdrop tap, on tapping the grab handle, or on
 * dragging the handle/header down past a distance/velocity threshold —
 * otherwise it springs back to resting position.
 *
 * The drag gesture is attached to the handle + `header` slot only (not
 * `children`), so interactive content below — text inputs, buttons, lists —
 * keeps receiving its own touches untouched.
 *
 * Wrapped in a `KeyboardAvoidingView` so the sheet rises above the keyboard
 * on iOS instead of letting it cover whichever field is focused.
 *
 * The animated transform lives on a plain (unstyled) `Animated.View` —
 * NativeWind's className interop isn't wired up for it (see `skeleton.tsx`)
 * — with the rounded/background/padding classes on a nested plain `View`.
 */
export function BottomSheet({
  onClose,
  header,
  children,
  maxHeight,
  zIndex = 20,
}: {
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: ViewStyle['maxHeight'];
  zIndex?: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Closing tears down this whole overlay — including whichever Pressable
  // the closing tap landed on — in the same tick as that Pressable's own
  // onPress. On iOS that can leave the native touch handler in a stuck
  // state (it never finishes that view's touch lifecycle), which then
  // swallows the next gesture — e.g. scrolling — on whatever's underneath.
  // Deferring the unmount by a frame lets the touch finish first.
  function deferredClose() {
    requestAnimationFrame(onClose);
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 180,
            useNativeDriver,
          }).start(deferredClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="absolute inset-0 justify-end bg-galpi-ink/50 web:backdrop-blur-sm"
      style={{ zIndex }}
    >
      <Pressable className="web:cursor-pointer flex-1" accessibilityLabel="닫기" onPress={deferredClose} />

      <Animated.View style={{ transform: [{ translateY }], maxHeight }}>
        <View className="rounded-t-3xl bg-background px-5 pb-6 pt-2">
          <View {...panResponder.panHandlers}>
            <Pressable
              onPress={deferredClose}
              accessibilityLabel="닫기"
              accessibilityRole="button"
              hitSlop={12}
              className="web:cursor-pointer mb-2 items-center py-2.5"
            >
              <View className="h-1 w-10 rounded-full bg-border" />
            </Pressable>

            {header}
          </View>

          {children}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
