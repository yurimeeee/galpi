import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../lib/theme';

type FieldProps = {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
  value: string;
  onChange: (v: string) => void;
};

export function TextField({
  label,
  placeholder,
  keyboardType = 'default',
  value,
  onChange,
}: FieldProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        placeholderTextColor={colors.mutedForeground}
        className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[14px] text-foreground focus:border-galpi-ink"
      />
    </View>
  );
}

export function PasswordField({
  label,
  placeholder,
  value,
  onChange,
}: Omit<FieldProps, 'keyboardType'>) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-semibold text-foreground">{label}</Text>
      <View className="relative justify-center">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          placeholderTextColor={colors.mutedForeground}
          className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 pr-12 text-[14px] text-foreground focus:border-galpi-ink"
        />
        <Pressable
          onPress={() => setShow((s) => !s)}
          accessibilityLabel={show ? '비밀번호 숨기기' : '비밀번호 표시'}
          className="web:cursor-pointer absolute right-3 h-5 w-5 items-center justify-center"
        >
          {show ? (
            <EyeOff size={20} color={colors.mutedForeground} />
          ) : (
            <Eye size={20} color={colors.mutedForeground} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function CheckOption({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onToggle} className="web:cursor-pointer flex-row items-center gap-2.5">
      <View
        className={`h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          checked ? 'border-galpi-ink bg-galpi-ink' : 'border-input bg-card'
        }`}
      >
        {checked ? (
          <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
            <Path
              d="M3 8.5L6.5 12L13 4.5"
              stroke={colors.galpiPaper}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
      <Text className="flex-1 text-[13px] text-muted-foreground">{children}</Text>
    </Pressable>
  );
}
