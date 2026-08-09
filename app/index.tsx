import { Redirect } from 'expo-router';
import { useAppStore } from '../lib/store';

export default function GateRedirect() {
  const gate = useAppStore((s) => s.gate);

  if (gate === 'loading') return null;
  if (gate === 'onboarding') return <Redirect href="/onboarding" />;
  if (gate === 'login') return <Redirect href="/login" />;
  if (gate === 'signup') return <Redirect href="/signup" />;
  return <Redirect href="/library" />;
}
