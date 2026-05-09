import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Font, Spacing } from "@/constants/theme";

interface TagFilterBarProps {
  tags: string[];
  activeTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterBar({ tags, activeTags, onChange }: TagFilterBarProps) {
  if (tags.length === 0) return null;

  const toggle = (tag: string) => {
    if (activeTags.includes(tag)) {
      onChange(activeTags.filter((t) => t !== tag));
    } else {
      onChange([...activeTags, tag]);
    }
  };

  const clearAll = () => onChange([]);
  const isFiltered = activeTags.length > 0;

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Clear / All button */}
        <Pressable
          style={[styles.chip, !isFiltered && styles.chipActive]}
          onPress={clearAll}
        >
          <Text style={[styles.chipText, !isFiltered && styles.chipTextActive]}>
            All
          </Text>
        </Pressable>

        {tags.map((t) => {
          const active = activeTags.includes(t);
          return (
            <Pressable
              key={t}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(t)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
            >
              {active && (
                <Feather name="check" size={12} color={Colors.accentContrast} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs + 2,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: Font.sizes.sm,
    color: Colors.muted,
  },
  chipTextActive: {
    color: Colors.accentContrast,
    fontWeight: Font.weights.medium,
  },
});
