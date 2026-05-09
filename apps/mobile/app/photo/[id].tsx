import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { Colors, Font, Spacing, Radius } from "@/constants/theme";
import { getPhoto, updatePhoto, deletePhoto, getExportUrl, Photo } from "@/lib/api";
import { TagPicker } from "@/components/TagPicker";

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getPhoto(id);
        setPhoto(data);
        setDescription(data.description ?? "");
        setSelectedTags(data.tags ?? []);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Could not load photo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updatePhoto(id, description, selectedTags.join(", "));
      setDirty(false);
      Alert.alert("Saved", "Photo details updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert("Delete Photo", "This will permanently remove this photo. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto(id);
            Alert.alert("Deleted", "Photo has been removed.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "Could not delete photo.");
          }
        },
      },
    ]);
  };

  const handleExport = () => {
    if (!id) return;
    Alert.alert("Export Photo", "Choose a format", [
      {
        text: "ZIP",
        onPress: () => Linking.openURL(getExportUrl("zip", [id])),
      },
      {
        text: "KML",
        onPress: () => Linking.openURL(getExportUrl("kml", [id])),
      },
      {
        text: "KMZ",
        onPress: () => Linking.openURL(getExportUrl("kmz", [id])),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleShare = async () => {
    if (!photo?.url) return;
    try {
      // Download image to a temp cache file, then share it
      const filename = photo.filename ?? "photo.jpg";
      const cacheDir = `${
        // expo-file-system/legacy cacheDirectory or fallback
        (globalThis as any).__expo_file_system_cache ?? "/tmp"
      }`;

      // Use fetch to get the image blob, write to cache via expo-sharing
      // expo-sharing can share a URL directly on iOS
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing not available on this device.");
        return;
      }

      // Download to temp file using RN's fetch + blob
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const reader = new FileReader();

      // Convert blob to base64 data URI and share
      // Actually, the simplest: share the URL and let the OS handle it
      await Sharing.shareAsync(photo.url, {
        mimeType: photo.content_type ?? "image/jpeg",
        dialogTitle: photo.filename,
        UTI: "public.jpeg",
      });
    } catch (e: any) {
      // Fallback to text share if file sharing fails
      try {
        await Share.share({
          message: `${photo.description ?? photo.filename}\n${photo.url}`,
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Photo" }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </>
    );
  }

  if (!photo) {
    return (
      <>
        <Stack.Screen options={{ title: "Photo" }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Photo not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: photo.filename }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Full image — tap to open lightbox */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/lightbox",
                params: { uri: photo.url ?? photo.thumbnail ?? "", title: photo.filename },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="View full screen"
          >
            <Image
              source={{ uri: photo.url ?? photo.thumbnail }}
              style={styles.image}
              contentFit="contain"
              transition={200}
            />
            <View style={styles.expandHint}>
              <Feather name="maximize-2" size={14} color={Colors.muted} />
              <Text style={styles.expandHintText}>Tap to view full screen</Text>
            </View>
          </Pressable>

          {/* Action bar */}
          <View style={styles.actionBar}>
            <Pressable style={styles.actionBtn} onPress={handleShare}
              accessibilityRole="button" accessibilityLabel="Share photo">
              <Feather name="share" size={20} color={Colors.fg} />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleExport}
              accessibilityRole="button" accessibilityLabel="Export photo">
              <Feather name="download" size={20} color={Colors.fg} />
              <Text style={styles.actionLabel}>Export</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleDelete}
              accessibilityRole="button" accessibilityLabel="Delete photo">
              <Feather name="trash-2" size={20} color={Colors.accent} />
              <Text style={[styles.actionLabel, { color: Colors.accent }]}>Delete</Text>
            </Pressable>
          </View>

          {/* Metadata (read-only) */}
          <View style={styles.metaRow}>
            <MetaItem label="Taken" value={formatDate(photo.timestamp)} />
            <MetaItem label="Size" value={formatBytes(photo.size_bytes)} />
          </View>
          {photo.location && (
            <View style={styles.metaRow}>
              <MetaItem
                label="Location"
                value={`${photo.location.lat.toFixed(5)}, ${photo.location.lon.toFixed(5)}`}
              />
              {photo.location.z != null && (
                <MetaItem label="Altitude" value={`${photo.location.z.toFixed(1)} ft`} />
              )}
            </View>
          )}

          {/* Editable fields */}
          <View style={styles.fields}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={(v) => {
                setDescription(v);
                setDirty(true);
              }}
              placeholder="Add a description…"
              placeholderTextColor={Colors.muted}
              multiline
              maxLength={500}
            />

            <Text style={styles.label}>Tags</Text>
            <TagPicker
              selected={selectedTags}
              onChange={(t) => {
                setSelectedTags(t);
                setDirty(true);
              }}
              placeholder="Add a new tag…"
              allowNew
            />
          </View>

          {dirty && (
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              {saving ? (
                <ActivityIndicator color={Colors.accentContrast} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Small helpers ────────────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatBytes(bytes?: number): string | undefined {
  if (bytes == null) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: Spacing.md,
    paddingBottom: 60,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },

  // Image
  image: {
    width: "100%",
    height: 320,
    borderRadius: Radius.lg,
    backgroundColor: Colors.lightGray,
  },
  expandHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  expandHintText: {
    fontSize: Font.sizes.xs,
    color: Colors.muted,
  },

  // Action bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minWidth: 70,
  },
  actionLabel: {
    fontSize: Font.sizes.xs,
    color: Colors.fg,
    fontWeight: Font.weights.medium,
  },

  // Metadata
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: Font.sizes.xs,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: Font.sizes.sm,
    color: Colors.fg,
    fontWeight: Font.weights.medium,
    marginTop: 2,
  },

  // Fields
  fields: { gap: Spacing.sm, marginTop: Spacing.sm },
  label: {
    fontSize: Font.sizes.sm,
    fontWeight: Font.weights.medium,
    color: Colors.fg,
    marginTop: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    fontSize: Font.sizes.md,
    color: Colors.fg,
    minHeight: 48,
  },

  // Save
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: Colors.accentContrast,
    fontSize: Font.sizes.md,
    fontWeight: Font.weights.semibold,
  },

  // Error state
  errorText: {
    fontSize: Font.sizes.md,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  backBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.darkGray,
  },
  backBtnText: {
    color: Colors.headerFg,
    fontWeight: Font.weights.medium,
  },
});
