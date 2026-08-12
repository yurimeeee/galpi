import { router } from 'expo-router';
import { CollectionsScreen } from '../components/screens/collections-screen';
import { useAppStore } from '../lib/store';
import type { Sentence } from '../lib/data/sentences';

export default function Collections() {
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);

  function openSentence(sentence: Sentence) {
    router.push(`/edit-sentence?sentenceId=${sentence.id}`);
  }

  return (
    <CollectionsScreen
      books={books}
      sentences={sentences}
      onBack={() => router.back()}
      onOpenSentence={openSentence}
    />
  );
}
