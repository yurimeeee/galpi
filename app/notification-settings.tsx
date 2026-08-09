import { router } from 'expo-router';
import { NotificationSettingsScreen } from '../components/screens/notification-settings-screen';

export default function NotificationSettings() {
  return <NotificationSettingsScreen onBack={() => router.back()} />;
}
