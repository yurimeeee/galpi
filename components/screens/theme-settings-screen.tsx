import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Smartphone, Sun, Moon, type LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';
import { useThemeStore, type ThemeMode } from '../../lib/theme-store';

const THEME_OPTIONS: { key: ThemeMode; label: string; desc: string; Icon: LucideIcon }[] = [
  { key: 'system', label: '기기 설정', desc: '기기의 화면 모드를 따라가요', Icon: Smartphone },
  { key: 'light', label: '라이트', desc: '항상 밝은 화면으로 보여줘요', Icon: Sun },
  { key: 'dark', label: '다크', desc: '항상 어두운 화면으로 보여줘요', Icon: Moon },
];

export function ThemeSettingsScreen({ onBack }: { onBack: () => void }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">테마</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerClassName="pb-10">
        <Text className="mb-3 pl-1 text-[13px] leading-relaxed text-muted-foreground">
          갈피 화면의 밝기를 선택해 주세요.
        </Text>

        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {THEME_OPTIONS.map((opt, i) => {
            const active = opt.key === mode;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setMode(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`web:cursor-pointer flex-row items-center gap-3 px-4 py-3.5 ${
                  i !== THEME_OPTIONS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                  <opt.Icon size={18} color={colors.foreground} strokeWidth={1.8} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[14px] font-medium text-foreground">{opt.label}</Text>
                  <Text className="mt-0.5 text-[12px] text-muted-foreground">{opt.desc}</Text>
                </View>
                {active ? <Check size={18} color={colors.foreground} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
