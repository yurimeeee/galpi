import { useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Bookmark, ChevronLeft, Plus, Timer, X } from 'lucide-react-native';
import { BottomSheet } from './bottom-sheet';
import { type Book } from '../../lib/data/books';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

type Step = 'choice' | 'pick-book';

/**
 * Bottom sheet opened by the center nav "+" button: lets the user leave a
 * 갈피 (quote) on a book they're reading, start a reading timer session, or
 * add a brand-new book. Picking "갈피 남기기" moves to a book-picker step
 * (with a fallback into "새 책 추가" if the one they want isn't in the
 * library yet); the timer defaults to the active reading book and lets the
 * user switch books from within the timer screen itself.
 */
export function AddChoiceSheet({
  books,
  onClose,
  onAddNewBook,
  onPickBook,
  onStartTimer,
}: {
  books: Book[];
  onClose: () => void;
  onAddNewBook: () => void;
  onPickBook: (book: Book) => void;
  onStartTimer: () => void;
}) {
  const [step, setStep] = useState<Step>('choice');

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="75%"
      zIndex={30}
      header={
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {step === 'pick-book' ? (
              <Pressable
                onPress={() => setStep('choice')}
                accessibilityLabel="뒤로"
                className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
              >
                <ChevronLeft size={16} color={colors.foreground} />
              </Pressable>
            ) : null}
            <Text className="text-base font-black text-foreground">
              {step === 'choice' ? '무엇을 하시겠어요?' : '어떤 책에 남길까요?'}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>
      }
    >
      {step === 'choice' ? (
        <View className="gap-3">
          <Pressable
            onPress={() => setStep('pick-book')}
            className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl bg-galpi-ink p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-galpi-paper/15">
              <Bookmark size={18} color={colors.galpiPaper} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-galpi-paper">갈피 남기기</Text>
              <Text className="mt-0.5 text-[12px] text-galpi-paper/70">
                읽고 있는 책에 문장을 담아요
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onStartTimer}
            className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-galpi-blue">
              <Timer size={18} color={colors.galpiInk} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">독서 타이머 시작</Text>
              <Text className="mt-0.5 text-[12px] text-muted-foreground">
                집중해서 읽고 갈피를 남겨요
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onAddNewBook}
            className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-galpi-green">
              <Plus size={18} color={colors.galpiInk} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">새 책 추가하기</Text>
              <Text className="mt-0.5 text-[12px] text-muted-foreground">
                서재에 책을 새로 등록해요
              </Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.id}
          style={{ maxHeight: 420 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            <Text className="py-6 text-center text-sm text-muted-foreground">
              아직 등록된 책이 없어요.
            </Text>
          }
          renderItem={({ item }) => <BookPickRow book={item} onPress={() => onPickBook(item)} />}
          ListFooterComponent={
            <Pressable
              onPress={onAddNewBook}
              className="web:cursor-pointer mt-2 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-3.5"
            >
              <Plus size={14} color={colors.foreground} />
              <Text className="text-xs font-semibold text-foreground">새 책 추가하기</Text>
            </Pressable>
          }
        />
      )}
    </BottomSheet>
  );
}

function BookPickRow({ book, onPress }: { book: Book; onPress: () => void }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);

  return (
    <Pressable
      onPress={onPress}
      className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
    >
      <View
        className={`h-12 w-9 shrink-0 overflow-hidden rounded-md ${
          showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]
        }`}
      >
        {showCover ? (
          <Image
            source={{ uri: book.coverUrl }}
            className="h-full w-full"
            resizeMode="cover"
            onError={onCoverError}
          />
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
          {book.author}
        </Text>
      </View>
    </Pressable>
  );
}
