import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Link2, Mail } from 'lucide-react-native';
import {
  getAuthErrorMessage,
  linkedProviderIds,
  unlinkProvider,
  useGoogleAccountLink,
} from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { colors } from '../../lib/theme';

const GOOGLE_PROVIDER_ID = 'google.com';
const PASSWORD_PROVIDER_ID = 'password';

export function LinkedAccountsScreen({ onBack }: { onBack: () => void }) {
  const [providerIds, setProviderIds] = useState(() => linkedProviderIds(auth.currentUser));
  const [unlinking, setUnlinking] = useState(false);
  const { linkGoogleAccount, linking, error: linkError, ready } = useGoogleAccountLink();

  const isGoogleLinked = providerIds.includes(GOOGLE_PROVIDER_ID);
  const isPasswordLinked = providerIds.includes(PASSWORD_PROVIDER_ID);

  function refreshProviders() {
    setProviderIds(linkedProviderIds(auth.currentUser));
  }

  /**
   * On native, tapping "연동하기" only kicks off a browser redirect —
   * `linkWithCredential` itself resolves later, inside the hook's own effect
   * reacting to the redirect result. So the provider list can't be refreshed
   * right after awaiting the button press; instead watch `linking` and
   * re-read `auth.currentUser` whenever a link attempt finishes (covers both
   * the native redirect flow and the web popup flow, which does resolve
   * synchronously within the press).
   */
  useEffect(() => {
    if (!linking) refreshProviders();
  }, [linking]);

  async function handleLink() {
    await linkGoogleAccount();
  }

  function handleUnlink() {
    if (!isPasswordLinked) {
      Alert.alert(
        '연동을 해제할 수 없어요',
        '비밀번호가 설정되어 있지 않아요. 구글 연동을 해제하면 로그인할 방법이 없어져요.',
      );
      return;
    }
    Alert.alert('구글 계정 연동을 해제할까요?', '다음부터는 이메일과 비밀번호로 로그인해야 해요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '연동 해제',
        style: 'destructive',
        onPress: async () => {
          setUnlinking(true);
          try {
            await unlinkProvider(GOOGLE_PROVIDER_ID);
            refreshProviders();
          } catch (err) {
            Alert.alert('연동 해제에 실패했어요', getAuthErrorMessage(err));
          } finally {
            setUnlinking(false);
          }
        },
      },
    ]);
  }

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
        <Text className="text-base font-black text-foreground">소셜 계정 연동</Text>
      </View>

      <View className="gap-3 px-5 pt-3">
        <Text className="mb-1 text-[13px] leading-relaxed text-muted-foreground">
          연동된 계정으로 갈피에 로그인할 수 있어요. 로그인 수단이 하나뿐일 때는 연동을 해제할 수 없어요.
        </Text>

        {/* 이메일/비밀번호 — 정보 표시 전용 */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Mail size={18} color={colors.foreground} strokeWidth={1.8} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground">이메일 · 비밀번호</Text>
            <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
              {isPasswordLinked ? (auth.currentUser?.email ?? '연동됨') : '연동 안 됨'}
            </Text>
          </View>
          <StatusPill linked={isPasswordLinked} />
        </View>

        {/* 구글 — 연동/해제 가능 */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Link2 size={18} color={colors.foreground} strokeWidth={1.8} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground">구글 계정</Text>
            <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
              {isGoogleLinked
                ? (auth.currentUser?.providerData.find((p) => p.providerId === GOOGLE_PROVIDER_ID)?.email ??
                  '연동됨')
                : '연동되어 있지 않아요'}
            </Text>
          </View>
          {isGoogleLinked ? (
            <Pressable
              onPress={handleUnlink}
              disabled={unlinking}
              className={`web:cursor-pointer rounded-full bg-secondary px-3.5 py-2 ${unlinking ? 'opacity-60' : ''}`}
            >
              {unlinking ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text className="text-xs font-bold text-foreground">연동 해제</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleLink}
              disabled={linking || !ready}
              className={`web:cursor-pointer rounded-full bg-galpi-ink px-3.5 py-2 ${
                linking || !ready ? 'opacity-60' : ''
              }`}
            >
              {linking ? (
                <ActivityIndicator size="small" color={colors.galpiPaper} />
              ) : (
                <Text className="text-xs font-bold text-galpi-paper">연동하기</Text>
              )}
            </Pressable>
          )}
        </View>

        {linkError ? <Text className="px-1 text-[12px] text-destructive">{linkError}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function StatusPill({ linked }: { linked: boolean }) {
  return (
    <View className={`rounded-full px-3 py-1.5 ${linked ? 'bg-galpi-green' : 'bg-secondary'}`}>
      <Text className={`text-[11px] font-bold ${linked ? 'text-galpi-ink' : 'text-muted-foreground'}`}>
        {linked ? '연동됨' : '미설정'}
      </Text>
    </View>
  );
}
