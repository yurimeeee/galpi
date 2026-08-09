import { Slot, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BottomNav, type NavKey } from '../../components/galpi/bottom-nav';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const active: NavKey = pathname.endsWith('/stats')
    ? 'stats'
    : pathname.endsWith('/mypage')
      ? 'mypage'
      : 'library';

  function handleChange(key: NavKey) {
    if (key === 'add') router.push('/add-sentence');
    else if (key === 'library') router.push('/library');
    else router.push(`/${key}`);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="min-h-0 flex-1">
        <Slot />
      </View>
      <BottomNav active={active} onChange={handleChange} />
    </View>
  );
}
