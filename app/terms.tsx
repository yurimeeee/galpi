import { router } from 'expo-router';
import { LegalScreen } from '../components/screens/legal-screen';
import { termsSections } from '../lib/legal-content';

export default function Terms() {
  return <LegalScreen title="이용약관" sections={termsSections} onBack={() => router.back()} />;
}
