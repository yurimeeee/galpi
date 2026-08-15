import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Info, Lock, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { PasswordField } from './auth-field';
import { changeUserPassword, getAuthErrorMessage, isPasswordAccount } from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { useThemeColors } from '../../lib/theme';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const colors = useThemeColors();
  const isSocialAccount = !isPasswordAccount(auth.currentUser);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const newPasswordValid = newPassword.length >= 8;
  const confirmValid = confirmNewPassword.length === 0 || confirmNewPassword === newPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPasswordValid &&
    confirmNewPassword === newPassword &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      Alert.alert('비밀번호가 변경되었어요', '다음 로그인부터 새 비밀번호를 사용해 주세요.');
      onClose();
    } catch (err) {
      setError(getAuthErrorMessage(err) || '비밀번호 변경에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      header={
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground">비밀번호 변경</Text>
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
      {isSocialAccount ? (
        <View className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-secondary">
            <Info size={16} color={colors.foreground} />
          </View>
          <Text className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
            소셜 로그인 계정은 해당 플랫폼에서 비밀번호를 관리합니다.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <PasswordField
            label="현재 비밀번호"
            placeholder="현재 비밀번호를 입력해 주세요"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <View>
            <PasswordField
              label="새 비밀번호"
              placeholder="8자 이상 입력해 주세요"
              value={newPassword}
              onChange={setNewPassword}
            />
            {!newPasswordValid && newPassword.length > 0 ? (
              <Text className="mt-1.5 text-[12px] text-destructive">
                비밀번호는 8자 이상이어야 해요.
              </Text>
            ) : null}
          </View>
          <View>
            <PasswordField
              label="새 비밀번호 확인"
              placeholder="새 비밀번호를 다시 입력해 주세요"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
            />
            {!confirmValid ? (
              <Text className="mt-1.5 text-[12px] text-destructive">
                비밀번호가 일치하지 않아요.
              </Text>
            ) : null}
          </View>

          {error ? <Text className="text-[12px] text-destructive">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className={`web:cursor-pointer mt-2 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4 ${
              !canSubmit ? 'opacity-50' : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator color={colors.galpiPaper} />
            ) : (
              <Lock size={15} color={colors.galpiPaper} />
            )}
            <Text className="text-sm font-bold text-galpi-paper">
              {submitting ? '변경 중...' : '비밀번호 변경하기'}
            </Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
}
