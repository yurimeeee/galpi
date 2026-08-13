import { router } from 'expo-router';
import { BadgesScreen } from '../components/screens/badges-screen';
import { useAppStore } from '../lib/store';
import { useReadingGoals } from '../lib/use-reading-goals';
import { computeBadgeProgress } from '../lib/badges';

export default function Badges() {
  const books = useAppStore((s) => s.books);
  const { bestStreak } = useReadingGoals();

  const galpiCount = books.reduce((sum, b) => sum + b.galpiCount, 0);
  const doneCount = books.filter((b) => b.status === 'done').length;
  const badges = computeBadgeProgress({ books: doneCount, galpi: galpiCount, bestStreak });

  return <BadgesScreen badges={badges} onBack={() => router.back()} />;
}
