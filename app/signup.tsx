import { router } from 'expo-router';
import { SignUpScreen } from '../components/screens/signup-screen';
import { signUpWithEmail } from '../lib/auth';
import { useAppStore } from '../lib/store';

export default function SignUp() {
  const goToLogin = useAppStore((s) => s.goToLogin);

  return (
    <SignUpScreen
      onBack={() => {
        goToLogin();
        router.back();
      }}
      onComplete={async (name, email, password) => {
        await signUpWithEmail(name, email, password);
        router.replace('/library');
      }}
    />
  );
}
