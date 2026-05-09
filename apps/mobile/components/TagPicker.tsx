import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Font, Spacing, Radius } from "@/constants/theme";
import { getTags } from "@/lib/api";

interface TagPickerProps {
  /** Currently selected tags */
  selected: string[];
  /** Called when selection changes */
  onChange: (tags: string[]) => void;
  /** Placeholder for the new-tag input */
  placeholder?: string;
  /** Allow adding new tags (not just picking existing ones) */
  allowNew?: boolean;
}

export function TagPicker({
  selected,
  onChange,
  placeholder = "Add a new tag…",
  allowNew = true,
}: TagPickerProps) {
  const [available, setAvailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getTags();
        setAvailable(data.tags);
      } catch {
        // silently fail — user can still type new tags
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addNew = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    // Also add to available so it shows as a chip
    if (!available.includes(trimmed)) {
      setAvailable((prev) => [...prev, trimmed]);
    }
    setNewTag("");
  };

  // Merge available + selected to show all relevant chips
  const allTags = Array.from(new Set([...available, ...selected]));

  return (
    <View style={styles.container}>
      {/* Existing tag chips */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={Colors.accent}
          style={{ marginVertical: Spacing.sm }}
        />
      ) : allTags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {allTags.map((tag) => {
            const isSelected = selected.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(tag)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Tag: ${tag}`}
              >
                {isSelected && (
                  <Feather
                    name="check"
                    size={12}
                    color={Colors.accentContrast}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyHint}>No existing tags yet</Text>
      )}

      {/* New tag input */}
      {allowNew && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newTag}
            onChangeText={setNewTag}
            placeholder={placeholder}
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={addNew}
            maxLength={50}
          />
          <Pressable
            style={[
              styles.addBtn,
              !newTag.trim() && styles.addBtnDisabled,
            ]}
            onPress={addNew}
            disabled={!newTag.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add tag"
          >
            <Feather
              name="plus"
              size={18}
              color={
                newTag.trim()
                  ? Colors.accentContrast
                  : Colors.muted
              }
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { gap: Spacing.sm },

  // Chip row
  chipRow: {
    flexDirection: "row",
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: Font.sizes.sm,
    color: Colors.muted,
  },
  chipTextSelected: {
    color: Colors.accentContrast,
    fontWeight: Font.weights.medium,
  },

  // New tag input
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    fontSize: Font.sizes.sm,
    color: Colors.fg,
    minHeight: 42,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    backgroundColor: Colors.lightGray,
  },

  emptyHint: {
    fontSize: Font.sizes.xs,
    color: Colors.muted,
    fontStyle: "italic",
  },
});
