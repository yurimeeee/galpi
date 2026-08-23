import { router, useLocalSearchParams } from 'expo-router';
import { YearReviewScreen } from '../components/screens/year-review-screen';
import { useAppStore } from '../lib/store';
import { useReadingGoals } from '../lib/use-reading-goals';

export default function YearReview() {
  const { year: yearParam } = useLocalSearchParams<{ year?: string }>();
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const displayName = useAppStore((s) => s.user?.displayName) || '갈피 독자';
  const { readingLog } = useReadingGoals();

  const year = Number(yearParam) || new Date().getFullYear();

  return (
    <YearReviewScreen
      year={year}
      books={books}
      sentences={sentences}
      readingLog={readingLog}
      displayName={displayName}
      onBack={() => router.back()}
    />
  );
}
