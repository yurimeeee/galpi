import { router } from 'expo-router';
import { DataBackupScreen } from '../components/screens/data-backup-screen';
import { useAppStore } from '../lib/store';

export default function DataBackup() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);

  return <DataBackupScreen books={books} sentences={sentences} onBack={() => router.back()} />;
}
