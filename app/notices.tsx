import { router } from 'expo-router';
import { NoticesScreen } from '../components/screens/notices-screen';

export default function Notices() {
  return <NoticesScreen onBack={() => router.back()} />;
}
