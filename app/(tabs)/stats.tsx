import { StatsReportScreen } from '../../components/screens/stats-report-screen';
import { useAppStore } from '../../lib/store';

export default function Stats() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);

  return <StatsReportScreen books={books} sentences={sentences} />;
}
