import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { EditSentenceScreen } from '../components/screens/edit-sentence-screen';
import { useAppStore } from '../lib/store';
import { allTags } from '../lib/data/sentences';

export default function EditSentence() {
  const { sentenceId } = useLocalSearchParams<{ sentenceId: string }>();
  const sentence = useAppStore((s) => s.sentenceById(sentenceId));
  const book = useAppStore((s) => (sentence ? s.bookById(sentence.bookId) : undefined));
  const updateSentence = useAppStore((s) => s.updateSentence);
  const deleteSentence = useAppStore((s) => s.deleteSentence);
  const sentences = useAppStore((s) => s.sentences);

  if (!sentence || !book) {
    return <Redirect href="/library" />;
  }

  return (
    <EditSentenceScreen
      sentence={sentence}
      book={book}
      tagSuggestions={allTags(sentences).map((t) => t.tag)}
      onBack={() => router.back()}
      onSave={(changes) => updateSentence(sentence.id, changes)}
      onDelete={() => deleteSentence(sentence.id)}
    />
  );
}
