import { router } from 'expo-router';
import { OnboardingScreen } from '../components/screens/onboarding-screen';
import { useAppStore } from '../lib/store';

export default function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  return (
    <OnboardingScreen
      onDone={() => {
        completeOnboarding();
        router.replace('/login');
      }}
    />
  );
}
