import { router } from 'expo-router';
import { LinkedAccountsScreen } from '../components/screens/linked-accounts-screen';

export default function LinkedAccounts() {
  return <LinkedAccountsScreen onBack={() => router.back()} />;
}
