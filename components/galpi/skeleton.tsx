import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/**
 * Pulsing placeholder block for data that's still loading. The opacity
 * animation lives on a plain `Animated.View` (no className) because
 * NativeWind's className interop isn't wired up for it — shape/color
 * classes go on the plain `View` nested inside instead.
 */
export function Skeleton({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View className={`bg-secondary ${className ?? ''}`} />
    </Animated.View>
  );
}
