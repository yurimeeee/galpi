import { router } from 'expo-router';
import { MyPageScreen } from '../../components/screens/mypage-screen';
import { signOutUser } from '../../lib/auth';
import { useAppStore } from '../../lib/store';
import { useReadingGoals } from '../../lib/use-reading-goals';
import { computeBadgeProgress } from '../../lib/badges';

export default function MyPage() {
  // Selected as individual primitives, not the whole `user` object — Firebase
  // mutates `auth.currentUser` in place on reload() (e.g. after a profile
  // edit), so a reference-based selector on `s.user` would never see the
  // update and the screen would keep showing the stale name/photo.
  const displayName = useAppStore((s) => s.user?.displayName);
  const email = useAppStore((s) => s.user?.email);
  const photoURL = useAppStore((s) => s.user?.photoURL);
  const books = useAppStore((s) => s.books);
  const booksLoaded = useAppStore((s) => s.booksLoaded);
  const { currentStreak, bestStreak } = useReadingGoals();

  const galpiCount = books.reduce((sum, b) => sum + b.galpiCount, 0);
  const doneCount = books.filter((b) => b.status === 'done').length;
  const badges = computeBadgeProgress({ books: doneCount, galpi: galpiCount, bestStreak });
  const badgeSummary = `${badges.filter((b) => b.achieved).length}/${badges.length}개 달성`;

  return (
    <MyPageScreen
      displayName={displayName || '갈피 독자'}
      email={email ?? ''}
      photoURL={photoURL ?? null}
      bookCount={books.length}
      galpiCount={galpiCount}
      currentStreak={currentStreak}
      badgeSummary={badgeSummary}
      loaded={books.length > 0 || booksLoaded}
      onLogout={async () => {
        await signOutUser();
        router.replace('/login');
      }}
      onAccountDeleted={() => router.replace('/login')}
      onOpenGoals={() => router.push('/reading-goal')}
      onOpenBadges={() => router.push('/badges')}
      onOpenNotificationSettings={() => router.push('/notification-settings')}
      onOpenTerms={() => router.push('/terms')}
      onOpenPrivacy={() => router.push('/privacy')}
      onOpenLinkedAccounts={() => router.push('/linked-accounts')}
      onOpenDataBackup={() => router.push('/data-backup')}
      onOpenNotices={() => router.push('/notices')}
    />
  );
}
