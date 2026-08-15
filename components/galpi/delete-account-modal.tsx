import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { CheckOption, PasswordField } from './auth-field';
import {
  deleteCurrentUser,
  getAuthErrorMessage,
  isPasswordAccount,
  reauthenticateWithPassword,
} from '../../lib/auth';
import { deleteAllUserData, deleteAllUserFiles } from '../../lib/data-service';
import { auth } from '../../lib/firebase';
import { useThemeColors } from '../../lib/theme';

export function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  /** Called once the account and all of its data have been deleted — caller should navigate off to /login. */
  onDeleted: () => void;
}) {
  const colors = useThemeColors();
  const isPassword = isPasswordAccount(auth.currentUser);

  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = acknowledged && (!isPassword || password.length > 0) && !submitting;

  function confirmAndDelete() {
    Alert.alert(
      '정말 탈퇴할까요?',
      '등록한 모든 책과 갈피, 사진이 영구적으로 삭제되며 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setError('');
    setSubmitting(true);
    try {
      if (isPassword) {
        await reauthenticateWithPassword(password);
      }
      await deleteAllUserData(uid);
      await deleteAllUserFiles(uid);
      await deleteCurrentUser();
      onDeleted();
    } catch (err) {
      setError(getAuthErrorMessage(err) || '회원 탈퇴에 실패했어요.');
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      header={
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground">회원 탈퇴</Text>
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
      <View className="gap-4">
        <View className="flex-row items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <View className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle size={16} color={colors.destructive} />
          </View>
          <Text className="flex-1 text-[13px] leading-relaxed text-destructive">
            탈퇴하면 등록한 모든 책, 갈피(문장), 사진, 독서 기록이 영구적으로 삭제되며 되돌릴 수 없어요.
          </Text>
        </View>

        {isPassword ? (
          <PasswordField
            label="비밀번호 확인"
            placeholder="현재 비밀번호를 입력해 주세요"
            value={password}
            onChange={setPassword}
          />
        ) : null}

        <CheckOption checked={acknowledged} onToggle={() => setAcknowledged((v) => !v)}>
          위 내용을 확인했으며, 계정과 모든 데이터를 삭제하는 데 동의해요.
        </CheckOption>

        {error ? <Text className="text-[12px] text-destructive">{error}</Text> : null}

        <Pressable
          onPress={confirmAndDelete}
          disabled={!canSubmit}
          className={`web:cursor-pointer mt-2 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-destructive py-4 ${
            !canSubmit ? 'opacity-50' : ''
          }`}
        >
          {submitting ? (
            <ActivityIndicator color={colors.galpiPaper} />
          ) : (
            <Trash2 size={15} color={colors.galpiPaper} />
          )}
          <Text className="text-sm font-bold text-galpi-paper">
            {submitting ? '탈퇴 처리 중...' : '회원 탈퇴하기'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
