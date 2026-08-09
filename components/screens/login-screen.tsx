import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { GalpiHeaderLogo } from '../galpi/galpi-logo';
import { TextField, PasswordField, CheckOption } from '../galpi/auth-field';
import { getAuthErrorMessage } from '../../lib/auth';
import { colors } from '../../lib/theme';

export function LoginScreen({
  onLogin,
  onGoogleLogin,
  onSignUp,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onSignUp: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<'email' | 'google' | null>(null);

  const canSubmit = email.trim() !== '' && password.length > 0 && submitting === null;

  async function handleEmailLogin() {
    if (!canSubmit) return;
    setError('');
    setSubmitting('email');
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      if (message) setError(message);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleGoogleLogin() {
    if (submitting) return;
    setError('');
    setSubmitting('google');
    try {
      await onGoogleLogin();
    } catch (err) {
      const message = getAuthErrorMessage(err);
      if (message) setError(message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-7 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* 브랜드 헤더 */}
        <View className="items-center pt-16">
          <GalpiHeaderLogo
            className="flex-col gap-3"
            markColor={colors.galpiInk}
            markSize={44}
            wordClassName="text-2xl text-foreground"
          />
          <Text className="mt-3 text-[13px] text-muted-foreground">
            책 속 문장을 갈피에 담다
          </Text>
        </View>

        {/* 폼 */}
        <View className="mt-12 gap-4">
          <TextField
            label="이메일"
            keyboardType="email-address"
            placeholder="이메일 주소를 입력해 주세요"
            value={email}
            onChange={setEmail}
          />
          <PasswordField
            label="비밀번호"
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={setPassword}
          />

          {error ? (
            <Text className="pl-1 text-[12px] text-destructive">{error}</Text>
          ) : null}

          <View className="flex-row items-center justify-between">
            <CheckOption checked={remember} onToggle={() => setRemember((v) => !v)}>
              이메일 저장
            </CheckOption>
            <Pressable className="web:cursor-pointer">
              <Text className="text-[13px] font-medium text-muted-foreground">
                비밀번호 재설정
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleEmailLogin}
            disabled={!canSubmit}
            className={`web:cursor-pointer mt-2 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4 ${
              !canSubmit ? 'opacity-60' : ''
            }`}
            style={({ pressed }) => pressed && canSubmit && { transform: [{ scale: 0.98 }] }}
          >
            {submitting === 'email' ? <ActivityIndicator size="small" color={colors.galpiPaper} /> : null}
            <Text className="text-center text-[15px] font-bold text-galpi-paper">로그인</Text>
          </Pressable>
        </View>

        {/* 구분선 */}
        <View className="my-7 flex-row items-center gap-4">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-[12px] text-muted-foreground">또는</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        {/* 소셜 로그인 */}
        <View className="gap-3">
          <Pressable
            onPress={handleGoogleLogin}
            disabled={submitting !== null}
            className={`web:cursor-pointer w-full flex-row items-center justify-center gap-3 rounded-2xl border border-input bg-card py-3.5 ${
              submitting !== null ? 'opacity-60' : ''
            }`}
          >
            {submitting === 'google' ? <ActivityIndicator size="small" color={colors.foreground} /> : <GoogleMark />}
            <Text className="text-[14px] font-semibold text-foreground">Google로 시작하기</Text>
          </Pressable>
        </View>

        {/* 회원가입 링크 */}
        <View className="mt-8 flex-row items-center justify-center">
          <Text className="text-[13px] text-muted-foreground">아직 계정이 없으신가요? </Text>
          <Pressable onPress={onSignUp} className="web:cursor-pointer">
            <Text className="text-[13px] font-bold text-foreground">회원가입</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z"
      />
    </Svg>
  );
}
