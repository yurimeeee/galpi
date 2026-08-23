import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CloudDownload, CloudUpload, FileUp, Info } from 'lucide-react-native';
import { buildBackupPayload, importBackupData, parseBackupPayload } from '../../lib/data-service';
import { BackupFileUnavailableError, exportBackupFile, pickBackupFileText } from '../../lib/backup-file';
import { auth } from '../../lib/firebase';
import { type Book } from '../../lib/data/books';
import { type Sentence } from '../../lib/data/sentences';
import { useThemeColors } from '../../lib/theme';

export function DataBackupScreen({
  books,
  sentences,
  onBack,
}: {
  books: Book[];
  sentences: Sentence[];
  onBack: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [pickingFile, setPickingFile] = useState(false);
  const colors = useThemeColors();

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const payload = buildBackupPayload(books, sentences);
      const today = new Date().toISOString().slice(0, 10);
      await exportBackupFile(JSON.stringify(payload, null, 2), `galpi-backup-${today}.json`);
    } catch (err) {
      Alert.alert(
        '백업 실패',
        err instanceof BackupFileUnavailableError ? err.message : '백업 파일을 만드는 중 문제가 발생했어요.',
      );
    } finally {
      setExporting(false);
    }
  }

  async function runImport(text: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const payload = parseBackupPayload(text);
      const result = await importBackupData(uid, payload, { books, sentences });
      setImportText('');
      const skippedNote =
        result.skippedBooks > 0 || result.skippedSentences > 0
          ? `\n(이미 있는 책 ${result.skippedBooks}권, 갈피 ${result.skippedSentences}개는 건너뛰었어요.)`
          : '';
      Alert.alert(
        '복구 완료',
        `책 ${result.books}권, 갈피 ${result.sentences}개를 새로 추가했어요.${skippedNote}`,
      );
    } catch (err) {
      Alert.alert('복구 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.');
    }
  }

  async function handleImport() {
    if (importing || !importText.trim()) return;
    setImporting(true);
    try {
      await runImport(importText.trim());
    } finally {
      setImporting(false);
    }
  }

  async function handlePickFile() {
    if (pickingFile) return;
    setPickingFile(true);
    try {
      const text = await pickBackupFileText();
      if (text) await runImport(text.trim());
    } catch {
      Alert.alert('파일을 열 수 없어요', '선택한 파일을 읽는 중 문제가 발생했어요.');
    } finally {
      setPickingFile(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">데이터 백업 및 복구</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
        {/* 백업(내보내기) */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <CloudDownload size={18} color={colors.foreground} strokeWidth={1.8} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold text-foreground">백업하기</Text>
              <Text className="text-xs text-muted-foreground">
                책 {books.length}권 · 갈피 {sentences.length}개
              </Text>
            </View>
          </View>
          <Text className="text-xs leading-relaxed text-muted-foreground">
            지금까지 등록한 책과 갈피를 하나의 .json 백업 파일로 저장해요. 파일 앱, 클라우드 등 원하는 곳에 보관해두고
            나중에 아래 "복구하기"로 다시 불러올 수 있어요.
          </Text>
          <Pressable
            onPress={handleExport}
            disabled={exporting || books.length === 0}
            className={`web:cursor-pointer mt-1 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 ${
              exporting || books.length === 0 ? 'opacity-50' : ''
            }`}
          >
            {exporting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <CloudDownload size={15} color={colors.primaryForeground} />
            )}
            <Text className="text-sm font-bold text-primary-foreground">
              {books.length === 0 ? '백업할 데이터가 없어요' : '백업 파일 저장하기'}
            </Text>
          </Pressable>
        </View>

        {/* 복구(가져오기) */}
        <View className="mt-4 gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <CloudUpload size={18} color={colors.foreground} strokeWidth={1.8} />
            </View>
            <Text className="text-sm font-bold text-foreground">복구하기</Text>
          </View>

          <View className="flex-row items-start gap-2 rounded-xl bg-secondary p-3">
            <View className="mt-0.5">
              <Info size={13} color={colors.mutedForeground} />
            </View>
            <Text className="flex-1 text-[11px] leading-relaxed text-muted-foreground">
              복구하면 백업 안의 책과 갈피가 새로 추가돼요. 이미 등록된 책·갈피와 겹치는 항목은 자동으로 건너뛰어서,
              같은 백업을 여러 번 복구해도 중복 생성되지 않아요.
            </Text>
          </View>

          <Pressable
            onPress={handlePickFile}
            disabled={pickingFile}
            className={`web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3.5 ${
              pickingFile ? 'opacity-50' : ''
            }`}
          >
            {pickingFile ? <ActivityIndicator color={colors.foreground} /> : <FileUp size={15} color={colors.foreground} />}
            <Text className="text-sm font-bold text-foreground">파일에서 가져오기</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-[10px] font-semibold text-muted-foreground">또는 직접 붙여넣기</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <TextInput
            value={importText}
            onChangeText={setImportText}
            multiline
            numberOfLines={6}
            placeholder="백업 파일에서 복사한 내용을 여기에 붙여넣어주세요."
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            className="w-full rounded-2xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground focus:border-ring"
            style={{ minHeight: 120 }}
          />

          <Pressable
            onPress={handleImport}
            disabled={importing || !importText.trim()}
            className={`web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 ${
              importing || !importText.trim() ? 'opacity-50' : ''
            }`}
          >
            {importing ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <CloudUpload size={15} color={colors.primaryForeground} />
            )}
            <Text className="text-sm font-bold text-primary-foreground">{importing ? '복구 중...' : '복구하기'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
