import { router } from 'expo-router';
import { FavoritesScreen } from '../components/screens/favorites-screen';
import { useAppStore } from '../lib/store';
import type { Sentence } from '../lib/data/sentences';

export default function Favorites() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const setSentenceFavorite = useAppStore((s) => s.setSentenceFavorite);

  function openSentence(sentence: Sentence) {
    router.push(`/edit-sentence?sentenceId=${sentence.id}`);
  }

  return (
    <FavoritesScreen
      books={books}
      sentences={sentences}
      onBack={() => router.back()}
      onOpenSentence={openSentence}
      onToggleFavorite={(id, favorite) => setSentenceFavorite(id, favorite)}
    />
  );
}
