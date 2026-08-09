import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

WebBrowser.maybeCompleteAuthSession();

// Public OAuth client identifiers — safe to ship in the app bundle.
// The iOS/Android ids are only needed for native Google sign-in; until
// they're added (Firebase console → Project settings → add iOS/Android app),
// the native flow will fail at Google's authorization step while web keeps
// working via signInWithPopup.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (Platform.OS === 'web' || response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) return;
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential).catch((err) => {
      console.error('Google sign-in failed', err);
    });
  }, [response]);

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      await signInWithPopup(auth, googleProvider);
      return;
    }
    await promptAsync();
  }

  return { signInWithGoogle, ready: Platform.OS === 'web' || !!request };
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
}

export async function signOutUser() {
  await signOut(auth);
}

/** True when the account has an email/password credential attached (as opposed to Google/Kakao-only). */
export function isPasswordAccount(user: User | null): boolean {
  return !!user?.providerData.some((p) => p.providerId === 'password');
}

/**
 * Updates the Firebase Auth profile (displayName/photoURL) for the signed-in
 * user and reloads it so `auth.currentUser` reflects the change immediately —
 * `updateProfile` mutates the user object in place but doesn't emit an
 * `onAuthStateChanged` event, so callers must re-sync the store manually.
 */
export async function updateUserProfile(changes: {
  displayName?: string;
  photoURL?: string | null;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요해요.');
  await updateProfile(user, changes);
  await user.reload();
}

/** Re-authenticates with the current password, then sets the new one. */
export async function changeUserPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('로그인이 필요해요.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않아요.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않아요.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일이에요.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 해요.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해 주세요.';
    case 'auth/requires-recent-login':
      return '보안을 위해 다시 로그인한 뒤 시도해 주세요.';
    case 'auth/too-many-requests':
      return '시도 횟수가 많아요. 잠시 후 다시 시도해 주세요.';
    default:
      return '문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
  }
}
