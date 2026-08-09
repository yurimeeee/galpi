import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserRound,
  Pencil,
  Lock,
  Link2,
  Bell,
  CloudDownload,
  Megaphone,
  FileText,
  Info,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../../lib/theme';

type Row = {
  key: string;
  label: string;
  Icon: LucideIcon;
  value?: string;
  toggle?: boolean;
};

export function MyPageScreen({
  displayName,
  email,
  photoURL,
  bookCount,
  galpiCount,
  onLogout,
}: {
  displayName: string;
  email: string;
  photoURL: string | null;
  bookCount: number;
  galpiCount: number;
  onLogout: () => void;
}) {
  const [reminder, setReminder] = useState(true);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <View className="px-6 pt-2">
          <Text className="text-[22px] font-black tracking-tight text-foreground">마이페이지</Text>
        </View>

        {/* 프로필 카드 */}
        <View className="px-5 pt-5">
          <View className="rounded-3xl bg-galpi-blue p-5">
            <View className="flex-row items-center gap-4">
              <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-galpi-paper">
                {photoURL ? (
                  <Image source={{ uri: photoURL }} className="h-16 w-16" />
                ) : (
                  <UserRound size={32} color={colors.galpiInk} strokeWidth={1.6} />
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-[17px] font-bold text-galpi-ink">
                  {displayName}
                </Text>
                <Text numberOfLines={1} className="text-[13px] text-galpi-ink/60">
                  {email}
                </Text>
              </View>
              <Pressable className="web:cursor-pointer flex-row items-center gap-1 rounded-full bg-galpi-ink px-3.5 py-2">
                <Pencil size={14} color={colors.galpiPaper} />
                <Text className="text-[12px] font-semibold text-galpi-paper">프로필 수정</Text>
              </Pressable>
            </View>

            {/* 독서 요약 칩 */}
            <View className="mt-4 flex-row gap-2.5">
              <SummaryChip value={String(bookCount)} label="등록한 책" />
              <SummaryChip value={String(galpiCount)} label="수집한 갈피" />
            </View>
          </View>
        </View>

        {/* 설정 그룹 */}
        <View className="mt-6 gap-6 px-5">
          <SettingsGroup
            title="계정 및 보안"
            rows={[
              { key: 'edit', label: '프로필 수정', Icon: UserRound },
              { key: 'pw', label: '비밀번호 변경', Icon: Lock },
              { key: 'social', label: '소셜 계정 연동', Icon: Link2 },
            ]}
            reminder={reminder}
            onReminder={setReminder}
          />

          <SettingsGroup
            title="앱 설정"
            rows={[
              { key: 'noti', label: '알림 설정', Icon: Bell, toggle: true },
              { key: 'backup', label: '데이터 백업 및 복구', Icon: CloudDownload },
            ]}
            reminder={reminder}
            onReminder={setReminder}
          />

          <SettingsGroup
            title="서비스 정보"
            rows={[
              { key: 'notice', label: '공지사항', Icon: Megaphone },
              { key: 'terms', label: '이용약관', Icon: FileText },
              { key: 'ver', label: '현재 버전', Icon: Info, value: 'v1.0.0' },
            ]}
            reminder={reminder}
            onReminder={setReminder}
          />
        </View>

        {/* 계정 액션 */}
        <View className="mt-8 flex-row items-center justify-center gap-6">
          <Pressable onPress={onLogout} className="web:cursor-pointer">
            <Text className="text-[13px] font-medium text-muted-foreground">로그아웃</Text>
          </Pressable>
          <View className="h-3 w-px bg-border" />
          <Pressable className="web:cursor-pointer">
            <Text className="text-[13px] font-medium text-muted-foreground">회원탈퇴</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryChip({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 flex-row items-baseline gap-1.5 rounded-2xl bg-galpi-paper px-4 py-3">
      <Text className="text-[18px] font-black text-galpi-ink">{value}</Text>
      <Text className="text-[12px] text-galpi-ink/60">{label}</Text>
    </View>
  );
}

function SettingsGroup({
  title,
  rows,
  reminder,
  onReminder,
}: {
  title: string;
  rows: Row[];
  reminder: boolean;
  onReminder: (v: boolean) => void;
}) {
  return (
    <View>
      <Text className="mb-2 pl-2 text-[13px] font-bold text-muted-foreground">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((row, i) => (
          <View
            key={row.key}
            className={`flex-row items-center gap-3 px-4 py-3.5 ${
              i !== rows.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <row.Icon size={18} color={colors.foreground} strokeWidth={1.8} />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-foreground">{row.label}</Text>

            {row.toggle ? (
              <Pressable
                onPress={() => onReminder(!reminder)}
                accessibilityRole="switch"
                accessibilityState={{ checked: reminder }}
                accessibilityLabel="알림 설정"
                className={`web:cursor-pointer relative h-6 w-11 justify-center rounded-full ${
                  reminder ? 'bg-galpi-ink' : 'bg-border'
                }`}
              >
                <View
                  className="absolute h-5 w-5 rounded-full bg-galpi-paper"
                  style={{ left: reminder ? 22 : 2 }}
                />
              </Pressable>
            ) : row.value ? (
              <Text className="text-[13px] text-muted-foreground">{row.value}</Text>
            ) : (
              <ChevronRight size={16} color={colors.mutedForeground} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
