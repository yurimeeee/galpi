import { StatsReportScreen, StatsReportSkeleton } from '../../components/screens/stats-report-screen';
import { useAppStore } from '../../lib/store';

export default function Stats() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const booksLoaded = useAppStore((s) => s.booksLoaded);
  const sentencesLoaded = useAppStore((s) => s.sentencesLoaded);

  const hasCachedData = books.length > 0 || sentences.length > 0;
  if (!hasCachedData && !(booksLoaded && sentencesLoaded)) {
    return <StatsReportSkeleton />;
  }

  return <StatsReportScreen books={books} sentences={sentences} />;
}
