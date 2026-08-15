import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Plus, Tag as TagIcon, X } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 12;

function normalize(raw: string): string {
  return raw.trim().replace(/^#/, '').slice(0, MAX_TAG_LENGTH);
}

/**
 * Chip-style tag editor for a single 갈피 — add/remove up to MAX_TAGS labels,
 * with tap-to-add suggestions drawn from tags already used elsewhere so
 * collections stay consistent instead of drifting into near-duplicates.
 */
export function TagInput({
  tags,
  onChange,
  suggestions = [],
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');
  const colors = useThemeColors();

  const availableSuggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !tags.includes(s))
      .filter((s) => !query || s.toLowerCase().includes(query))
      .slice(0, 6);
  }, [suggestions, tags, draft]);

  function addTag(raw: string) {
    const value = normalize(raw);
    if (!value || tags.includes(value) || tags.length >= MAX_TAGS) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  }

  function removeTag(value: string) {
    onChange(tags.filter((t) => t !== value));
  }

  return (
    <View className="gap-2.5">
      {tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {tags.map((tag) => (
            <View
              key={tag}
              className="flex-row items-center gap-1 rounded-full bg-galpi-ink px-2.5 py-1.5"
            >
              <Text className="text-xs font-bold text-galpi-paper">#{tag}</Text>
              <Pressable
                onPress={() => removeTag(tag)}
                accessibilityLabel={`${tag} 태그 삭제`}
                hitSlop={6}
                className="web:cursor-pointer"
              >
                <X size={11} color={colors.galpiPaper} opacity={0.7} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {tags.length < MAX_TAGS ? (
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <TagIcon size={14} color={colors.mutedForeground} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => addTag(draft)}
            onBlur={() => addTag(draft)}
            placeholder="태그를 입력하고 완료를 눌러보세요"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            className="flex-1 text-sm text-foreground"
          />
          {draft.trim() ? (
            <Pressable
              onPress={() => addTag(draft)}
              accessibilityLabel="태그 추가"
              hitSlop={6}
              className="web:cursor-pointer h-6 w-6 items-center justify-center rounded-full bg-secondary"
            >
              <Plus size={13} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {availableSuggestions.length > 0 && tags.length < MAX_TAGS ? (
        <View className="flex-row flex-wrap gap-1.5">
          {availableSuggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => addTag(s)}
              className="web:cursor-pointer rounded-full bg-secondary px-2.5 py-1.5"
            >
              <Text className="text-xs font-semibold text-muted-foreground">#{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
