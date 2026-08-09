import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../lib/theme';

type GalpiHeaderLogoProps = {
  className?: string;
  markColor?: string;
  markSize?: number;
  wordClassName?: string;
};

/**
 * 갈피 브랜드 로고 — 책갈피(bookmark) 실루엣 + 한글 워드마크 "갈피"
 */
export function GalpiHeaderLogo({
  className = '',
  markColor = colors.galpiInk,
  markSize = 28,
  wordClassName = '',
}: GalpiHeaderLogoProps) {
  const width = (markSize * 21) / 28;
  return (
    <View className={`flex-row items-center gap-2.5 ${className}`}>
      <Svg width={width} height={markSize} viewBox="0 0 24 32" fill="none">
        <Path
          d="M2 3.2C2 2.54 2.54 2 3.2 2H20.8C21.46 2 22 2.54 22 3.2V29.4C22 30.36 20.94 30.94 20.13 30.43L12 25.3L3.87 30.43C3.06 30.94 2 30.36 2 29.4V3.2Z"
          fill={markColor}
        />
        <Path
          d="M12 8V19M7.4 12.6H16.6"
          stroke={colors.galpiPaper}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
      <Text className={`font-black tracking-tight ${wordClassName}`}>갈피</Text>
    </View>
  );
}
