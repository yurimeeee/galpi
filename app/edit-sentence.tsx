import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { EditSentenceScreen } from '../components/screens/edit-sentence-screen';
import { useAppStore } from '../lib/store';

export default function EditSentence() {
  const { sentenceId } = useLocalSearchParams<{ sentenceId: string }>();
  const sentence = useAppStore((s) => s.sentenceById(sentenceId));
  const book = useAppStore((s) => (sentence ? s.bookById(sentence.bookId) : undefined));
  const updateSentence = useAppStore((s) => s.updateSentence);
  const deleteSentence = useAppStore((s) => s.deleteSentence);

  if (!sentence || !book) {
    return <Redirect href="/library" />;
  }

  return (
    <EditSentenceScreen
      sentence={sentence}
      bookTitle={book.title}
      onBack={() => router.back()}
      onSave={(changes) => {
        updateSentence(sentence.id, changes).catch((err) => console.error('Failed to update sentence', err));
      }}
      onDelete={() => {
        deleteSentence(sentence.id).catch((err) => console.error('Failed to delete sentence', err));
      }}
    />
  );
}
