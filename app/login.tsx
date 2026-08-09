import { router } from 'expo-router';
import { LoginScreen } from '../components/screens/login-screen';
import { signInWithEmail, useGoogleAuth } from '../lib/auth';
import { useAppStore } from '../lib/store';

export default function Login() {
  const goToSignup = useAppStore((s) => s.goToSignup);
  const { signInWithGoogle } = useGoogleAuth();

  return (
    <LoginScreen
      onLogin={async (email, password) => {
        await signInWithEmail(email, password);
        router.replace('/library');
      }}
      onGoogleLogin={async () => {
        await signInWithGoogle();
        router.replace('/library');
      }}
      onSignUp={() => {
        goToSignup();
        router.push('/signup');
      }}
    />
  );
}
