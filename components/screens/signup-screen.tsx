import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField, PasswordField, CheckOption } from '../galpi/auth-field';
import { Button } from '../galpi/button';
import { ScreenHeader } from '../galpi/screen-header';
import { getAuthErrorMessage } from '../../lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({
  onBack,
  onComplete,
  onOpenTerms,
  onOpenPrivacy,
}: {
  onBack: () => void;
  onComplete: (name: string, email: string, password: string) => Promise<void>;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emailValid = useMemo(() => email.length === 0 || EMAIL_RE.test(email), [email]);
  const pwMatch = confirm.length === 0 || confirm === password;

  const canSubmit =
    name.trim() !== '' &&
    EMAIL_RE.test(email) &&
    password.length >= 6 &&
    confirm === password &&
    agree &&
    !submitting;

  async function handleComplete() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await onComplete(name.trim(), email.trim(), password);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      {/* 헤더 */}
      <ScreenHeader title="회원가입" onBack={onBack} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 min-h-0">
        {/* 폼 */}
        <ScrollView
          className="flex-1 px-5 pt-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="gap-4">
            <TextField
              label="이름 (닉네임)"
              placeholder="사용하실 닉네임을 입력해 주세요"
              value={name}
              onChange={setName}
            />

            <View>
              <TextField
                label="이메일 주소"
                keyboardType="email-address"
                placeholder="이메일 주소를 입력해 주세요"
                value={email}
                onChange={setEmail}
              />
              {!emailValid ? (
                <Text className="mt-1.5 pl-1 text-xs text-destructive">
                  올바른 이메일 형식이 아니에요.
                </Text>
              ) : null}
            </View>

            <PasswordField
              label="비밀번호"
              placeholder="6자 이상 입력해 주세요"
              value={password}
              onChange={setPassword}
            />

            <View>
              <PasswordField
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력해 주세요"
                value={confirm}
                onChange={setConfirm}
              />
              {!pwMatch ? (
                <Text className="mt-1.5 pl-1 text-xs text-destructive">
                  비밀번호가 일치하지 않아요.
                </Text>
              ) : null}
            </View>

            <View className="mt-1 rounded-xl border border-border bg-card p-4">
              <CheckOption checked={agree} onToggle={() => setAgree((v) => !v)}>
                <Text onPress={onOpenTerms} className="font-semibold text-foreground underline">
                  서비스 이용약관
                </Text>
                {' 및 '}
                <Text onPress={onOpenPrivacy} className="font-semibold text-foreground underline">
                  개인정보 처리방침
                </Text>
                에 동의합니다.
              </CheckOption>
            </View>

            {error ? (
              <Text className="pl-1 text-xs text-destructive">{error}</Text>
            ) : null}
          </View>
        </ScrollView>

        {/* 완료 버튼 */}
        <View className="px-5 pb-9 pt-4">
          <Button label="회원가입 완료" onPress={handleComplete} disabled={!canSubmit} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
