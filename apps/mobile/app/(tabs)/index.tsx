import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Font, Spacing, Radius } from "@/constants/theme";
import { getPhotos, getTags, Photo } from "@/lib/api";
import { TagFilterBar } from "@/components/TagFilterBar";

export default function PhotosScreen() {
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // ── Fetch helpers ──────────────────────────────────────────────

  const tagsParam = activeTags.length > 0 ? activeTags.join(",") : undefined;

  const fetchPhotos = useCallback(
    async (p: number, replace: boolean) => {
      try {
        const data = await getPhotos(p, 20, tagsParam);
        setPhotos((prev) => (replace ? data.Photos : [...prev, ...data.Photos]));
        setHasMore(data.pagination.has_next);
        setPage(p);
      } catch (e) {
        console.warn("Failed to load photos:", e);
      }
    },
    [tagsParam]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhotos(1, true);
    setRefreshing(false);
  }, [fetchPhotos]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchPhotos(page + 1, false);
  }, [hasMore, loading, page, fetchPhotos]);

  // ── Initial load ───────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPhotos(1, true);
      try {
        const t = await getTags();
        setTags(t.tags);
      } catch {}
      setLoading(false);
    })();
  }, [fetchPhotos]);

  // ── Render ─────────────────────────────────────────────────────

  const renderPhoto = ({ item }: { item: Photo }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/photo/${item._id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Photo ${item.filename}`}
    >
      <Image
        source={{ uri: item.thumbnail ?? item.url }}
        style={styles.thumb}
        contentFit="cover"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        transition={200}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.description || item.filename}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <Text style={styles.cardTags} numberOfLines={1}>
            {item.tags.join(", ")}
          </Text>
        )}
        {item.timestamp && (
          <Text style={styles.cardDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <TagFilterBar tags={tags} activeTags={activeTags} onChange={setActiveTags} />

      {loading && photos.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item._id}
          renderItem={renderPhoto}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={styles.empty}>No photos yet. Tap + to capture one.</Text>
          }
        />
      )}

      {/* FAB — capture */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/capture")}
        accessibilityRole="button"
        accessibilityLabel="Capture new photo"
      >
        <Feather name="plus" size={28} color={Colors.accentContrast} />
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.md, gap: Spacing.sm },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  thumb: {
    width: 88,
    height: 88,
    backgroundColor: Colors.lightGray,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.sm + 2,
    justifyContent: "center",
    gap: 2,
  },
  cardTitle: {
    fontSize: Font.sizes.md,
    fontWeight: Font.weights.medium,
    color: Colors.fg,
  },
  cardTags: {
    fontSize: Font.sizes.xs,
    color: Colors.accent,
  },
  cardDate: {
    fontSize: Font.sizes.xs,
    color: Colors.muted,
  },
  empty: {
    textAlign: "center",
    color: Colors.muted,
    marginTop: 60,
    fontSize: Font.sizes.md,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
