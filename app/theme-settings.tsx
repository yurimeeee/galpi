import { router } from 'expo-router';
import { ThemeSettingsScreen } from '../components/screens/theme-settings-screen';

export default function ThemeSettings() {
  return <ThemeSettingsScreen onBack={() => router.back()} />;
}
