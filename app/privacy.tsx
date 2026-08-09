import { router } from 'expo-router';
import { LegalScreen } from '../components/screens/legal-screen';
import { privacySections } from '../lib/legal-content';

export default function Privacy() {
  return (
    <LegalScreen title="개인정보 처리방침" sections={privacySections} onBack={() => router.back()} />
  );
}
