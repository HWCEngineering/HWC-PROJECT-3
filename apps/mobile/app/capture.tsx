import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Font, Spacing, Radius } from "@/constants/theme";
import { uploadPhoto } from "@/lib/api";
import { TagPicker } from "@/components/TagPicker";

export default function CaptureScreen() {
  const router = useRouter();

  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // ── Pickers ────────────────────────────────────────────────────

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      exif: true,
    });
    if (!result.canceled && result.assets[0]) setAsset(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: true,
    });
    if (!result.canceled && result.assets[0]) setAsset(result.assets[0]);
  };

  // ── Upload ─────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!asset) return;
    setUploading(true);
    try {
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mime = asset.mimeType ?? "image/jpeg";
      await uploadPhoto(asset.uri, filename, mime, description, selectedTags.join(", "));
      Alert.alert("Uploaded", "Photo saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ title: "Capture" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Source buttons */}
          {!asset && (
            <View style={styles.pickerArea}>
              <Pressable
                style={[styles.pickerBtn, styles.cameraBtn]}
                onPress={pickFromCamera}
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
              >
                <Feather name="camera" size={24} color={Colors.accent} />
                <Text style={styles.pickerBtnLabel}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={[styles.pickerBtn, styles.galleryBtn]}
                onPress={pickFromGallery}
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
              >
                <Feather name="image" size={24} color={Colors.mediumGray} />
                <Text style={styles.pickerBtnLabel}>Choose from Library</Text>
              </Pressable>
            </View>
          )}

          {/* Preview */}
          {asset && (
            <>
              <Pressable onPress={() => setAsset(null)} accessibilityLabel="Remove selected photo">
                <Image source={{ uri: asset.uri }} style={styles.preview} contentFit="contain" />
                <Text style={styles.changeHint}>Tap image to change</Text>
              </Pressable>

              {/* Metadata */}
              <View style={styles.fields}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What are we looking at?"
                  placeholderTextColor={Colors.muted}
                  multiline
                  maxLength={500}
                />

                <Text style={styles.label}>Tags</Text>
                <TagPicker
                  selected={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Add a new tag…"
                  allowNew
                />
              </View>

              {/* Upload */}
              <Pressable
                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                onPress={handleUpload}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel="Upload photo"
              >
                {uploading ? (
                  <ActivityIndicator color={Colors.accentContrast} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="upload" size={20} color={Colors.accentContrast} />
                    <Text style={styles.uploadBtnText}>Upload Photo</Text>
                  </View>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: Spacing.lg,
    paddingBottom: 60,
    gap: Spacing.lg,
  },

  // Picker buttons
  pickerArea: {
    gap: Spacing.md,
    marginTop: 40,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 22,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  cameraBtn: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(238, 47, 39, 0.06)",
  },
  galleryBtn: {
    borderColor: Colors.lightGray,
    backgroundColor: Colors.bg,
  },
  pickerBtnLabel: {
    fontSize: Font.sizes.lg,
    fontWeight: Font.weights.medium,
    color: Colors.fg,
  },

  // Preview
  preview: {
    width: "100%",
    height: 300,
    borderRadius: Radius.lg,
    backgroundColor: Colors.lightGray,
  },
  changeHint: {
    textAlign: "center",
    color: Colors.muted,
    fontSize: Font.sizes.xs,
    marginTop: Spacing.xs,
  },

  // Fields
  fields: { gap: Spacing.sm },
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

  // Upload button
  uploadBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: {
    color: Colors.accentContrast,
    fontSize: Font.sizes.lg,
    fontWeight: Font.weights.semibold,
  },
});
