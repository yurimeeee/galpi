import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

function toDate(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
}

function toTimeString(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

/** Native time picker for the daily reminder — see time-picker-field.web.tsx for the web fallback. */
export function TimePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && date) onChange(toTimeString(date));
      return;
    }
    if (date) onChange(toTimeString(date));
  }

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="알림 시간 선택"
        className="web:cursor-pointer flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5"
      >
        <Clock size={16} color={colors.foreground} />
        <Text className="font-mono text-sm font-bold text-foreground">{value}</Text>
      </Pressable>

      {open && Platform.OS === 'ios' ? (
        <View className="mt-2 rounded-2xl border border-border bg-card p-2">
          <DateTimePicker
            value={toDate(value)}
            mode="time"
            display="spinner"
            is24Hour
            onChange={handleChange}
          />
          <Pressable
            onPress={() => setOpen(false)}
            className="web:cursor-pointer mt-1 items-center rounded-xl bg-galpi-ink py-3"
          >
            <Text className="text-sm font-bold text-galpi-paper">완료</Text>
          </Pressable>
        </View>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={toDate(value)} mode="time" display="default" is24Hour onChange={handleChange} />
      ) : null}
    </View>
  );
}
