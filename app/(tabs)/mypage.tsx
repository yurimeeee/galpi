import { router } from 'expo-router';
import { MyPageScreen } from '../../components/screens/mypage-screen';
import { signOutUser } from '../../lib/auth';
import { useAppStore } from '../../lib/store';

export default function MyPage() {
  const user = useAppStore((s) => s.user);
  const books = useAppStore((s) => s.books);

  const galpiCount = books.reduce((sum, b) => sum + b.galpiCount, 0);

  return (
    <MyPageScreen
      displayName={user?.displayName || '갈피 독자'}
      email={user?.email ?? ''}
      photoURL={user?.photoURL ?? null}
      bookCount={books.length}
      galpiCount={galpiCount}
      onLogout={async () => {
        await signOutUser();
        router.replace('/login');
      }}
    />
  );
}
