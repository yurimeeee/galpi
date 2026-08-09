import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { UserRound, Image as ImageIcon, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { updateUserProfile } from '../../lib/auth';
import { updateUserDoc, uploadProfilePhoto } from '../../lib/data-service';
import { auth } from '../../lib/firebase';
import { useAppStore } from '../../lib/store';
import { colors } from '../../lib/theme';

const NICKNAME_RE = /^[a-zA-Z0-9가-힣]{2,12}$/;

export function EditProfileModal({
  displayName,
  photoURL,
  onClose,
}: {
  displayName: string;
  photoURL: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(displayName);
  const [avatarUri, setAvatarUri] = useState<string | null>(photoURL);
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null);
  const [avatarCleared, setAvatarCleared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const trimmedName = name.trim();
  const nameValid = NICKNAME_RE.test(trimmedName);
  const canSave = useMemo(() => nameValid && !submitting, [nameValid, submitting]);

  async function pickImage() {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('사진 접근 권한이 필요해요. 기기 설정에서 갈피의 사진 보관함 접근을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manipulated.base64) throw new Error('이미지 처리에 실패했어요.');
      setAvatarUri(manipulated.uri);
      setNewAvatarBase64(manipulated.base64);
      setAvatarCleared(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 처리에 실패했어요.');
    }
  }

  function clearAvatar() {
    setAvatarUri(null);
    setNewAvatarBase64(null);
    setAvatarCleared(true);
  }

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('로그인이 필요해요.');

      let nextPhotoURL: string | null | undefined;
      if (newAvatarBase64) {
        nextPhotoURL = await uploadProfilePhoto(uid, `data:image/jpeg;base64,${newAvatarBase64}`);
      } else if (avatarCleared) {
        nextPhotoURL = null;
      }

      const changes = {
        displayName: trimmedName,
        ...(nextPhotoURL !== undefined ? { photoURL: nextPhotoURL } : {}),
      };
      await updateUserProfile(changes);
      await updateUserDoc(uid, changes);

      useAppStore.getState().setUser(auth.currentUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-base font-black text-foreground">프로필 수정</Text>
        <Pressable
          onPress={onClose}
          accessibilityLabel="닫기"
          className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
        >
          <X size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {/* 아바타 */}
      <View className="items-center gap-3">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="h-24 w-24" />
          ) : (
            <UserRound size={40} color={colors.mutedForeground} strokeWidth={1.6} />
          )}
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={pickImage}
            className="web:cursor-pointer flex-row items-center gap-1.5 rounded-full bg-galpi-ink px-4 py-2"
          >
            <ImageIcon size={13} color={colors.galpiPaper} />
            <Text className="text-[12px] font-semibold text-galpi-paper">사진 선택</Text>
          </Pressable>
          {avatarUri ? (
            <Pressable
              onPress={clearAvatar}
              className="web:cursor-pointer rounded-full border border-border px-4 py-2"
            >
              <Text className="text-[12px] font-semibold text-muted-foreground">기본 이미지로</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 닉네임 */}
      <View className="mt-6">
        <Text className="mb-1.5 text-[13px] font-semibold text-foreground">닉네임</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="2~12자, 특수문자 제외"
          placeholderTextColor={colors.mutedForeground}
          maxLength={12}
          className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[14px] text-foreground focus:border-galpi-ink"
        />
        {!nameValid && trimmedName.length > 0 ? (
          <Text className="mt-1.5 text-[12px] text-destructive">
            닉네임은 특수문자 없이 2~12자로 입력해 주세요.
          </Text>
        ) : null}
      </View>

      {error ? <Text className="mt-3 text-[12px] text-destructive">{error}</Text> : null}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        className={`web:cursor-pointer mt-6 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4 ${
          !canSave ? 'opacity-50' : ''
        }`}
      >
        {submitting ? <ActivityIndicator color={colors.galpiPaper} /> : null}
        <Text className="text-sm font-bold text-galpi-paper">
          {submitting ? '저장 중...' : '저장하기'}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
