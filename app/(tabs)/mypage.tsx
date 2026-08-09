import { router } from 'expo-router';
import { MyPageScreen } from '../../components/screens/mypage-screen';
import { signOutUser } from '../../lib/auth';
import { useAppStore } from '../../lib/store';

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

  const galpiCount = books.reduce((sum, b) => sum + b.galpiCount, 0);

  return (
    <MyPageScreen
      displayName={displayName || '갈피 독자'}
      email={email ?? ''}
      photoURL={photoURL ?? null}
      bookCount={books.length}
      galpiCount={galpiCount}
      loaded={books.length > 0 || booksLoaded}
      onLogout={async () => {
        await signOutUser();
        router.replace('/login');
      }}
      onOpenNotificationSettings={() => router.push('/notification-settings')}
    />
  );
}
