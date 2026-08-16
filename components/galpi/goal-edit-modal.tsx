import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Clock, BookOpen, Target, X, type LucideIcon } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { type ReadingGoals } from '../../lib/data-service';
import { useThemeColors, ACCENT_BG_CLASS, type Accent } from '../../lib/theme';

export function GoalEditModal({
  goals,
  onClose,
  onSave,
}: {
  goals: ReadingGoals;
  onClose: () => void;
  onSave: (next: ReadingGoals) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<ReadingGoals>(goals);
  const [saving, setSaving] = useState(false);
  const colors = useThemeColors();

  function set<K extends keyof ReadingGoals>(key: K, value: number, min: number, max: number) {
    setDraft((d) => ({ ...d, [key]: Math.max(min, Math.min(max, value)) }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      zIndex={30}
      header={
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-lg font-black text-foreground">독서 목표 설정</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>
      }
    >
      <View className="gap-3">
        <Stepper
          Icon={Clock}
          accent="blue"
          label="하루 독서 시간"
          unit="분"
          value={draft.dailyMinutes}
          step={5}
          onChange={(v) => set('dailyMinutes', v, 5, 240)}
        />
        <Stepper
          Icon={BookOpen}
          accent="green"
          label="한 달 목표"
          unit="권"
          value={draft.monthlyBooks}
          step={1}
          onChange={(v) => set('monthlyBooks', v, 1, 30)}
        />
        <Stepper
          Icon={Target}
          accent="yellow"
          label="올해 목표"
          unit="권"
          value={draft.yearlyBooks}
          step={1}
          onChange={(v) => set('yearlyBooks', v, 1, 365)}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        className={`web:cursor-pointer mt-6 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 ${
          saving ? 'opacity-60' : ''
        }`}
        style={({ pressed }) => pressed && !saving && { transform: [{ scale: 0.98 }] }}
      >
        {saving ? <ActivityIndicator color={colors.primaryForeground} /> : null}
        <Text className="text-sm font-bold text-primary-foreground">
          {saving ? '저장 중...' : '목표 저장하기'}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

function Stepper({
  Icon,
  accent,
  label,
  unit,
  value,
  step,
  onChange,
}: {
  Icon: LucideIcon;
  accent: Accent;
  label: string;
  unit: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <View className={`h-11 w-11 items-center justify-center rounded-xl ${ACCENT_BG_CLASS[accent]}`}>
        <Icon size={20} color={colors.galpiInk} strokeWidth={1.9} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-foreground">{label}</Text>
        <Text className="text-[12px] text-muted-foreground">목표를 조절해 보세요</Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onChange(value - step)}
          accessibilityLabel="줄이기"
          className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
        >
          <Text className="text-lg font-bold text-foreground">−</Text>
        </Pressable>
        <Text className="w-16 text-center text-[15px] font-black tabular-nums text-foreground">
          {value}
          <Text className="ml-0.5 text-[12px] font-medium text-muted-foreground">{unit}</Text>
        </Text>
        <Pressable
          onPress={() => onChange(value + step)}
          accessibilityLabel="늘리기"
          className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-primary"
        >
          <Text className="text-lg font-bold text-primary-foreground">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
