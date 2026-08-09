import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '../../lib/theme';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * `@react-native-community/datetimepicker` has no web implementation, so the
 * web build gets this plain validated "HH:mm" text field instead — Metro
 * resolves this `.web.tsx` file over the native `time-picker-field.tsx` for
 * web bundles, so the native module is never imported there.
 */
export function TimePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function handleChangeText(next: string) {
    setDraft(next);
    if (TIME_RE.test(next)) onChange(next);
  }

  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
      <Clock size={16} color={colors.foreground} />
      <TextInput
        value={draft}
        onChangeText={handleChangeText}
        onBlur={() => {
          if (!TIME_RE.test(draft)) setDraft(value);
        }}
        placeholder="21:00"
        placeholderTextColor={colors.mutedForeground}
        className="flex-1 font-mono text-sm font-bold text-foreground"
      />
    </View>
  );
}
