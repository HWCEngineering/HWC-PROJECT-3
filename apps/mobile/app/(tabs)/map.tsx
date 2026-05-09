import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Font, Spacing, Radius } from "@/constants/theme";
import { getMarkers, getTags, PhotoMarker } from "@/lib/api";
import { clusterMarkers, deltaToRadius } from "@/lib/cluster";
import { TagFilterBar } from "@/components/TagFilterBar";

const MARKER_RED = Colors.accent;
const MARKER_BORDER = "#FFFFFF";

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [markers, setMarkers] = useState<PhotoMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [region, setRegion] = useState<Region | null>(null);

  const tagsParam = activeTags.length > 0 ? activeTags.join(",") : undefined;

  const fetchMarkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMarkers(tagsParam);
      setMarkers(data.markers);
    } catch (e: any) {
      setError(e.message ?? "Failed to load markers");
    } finally {
      setLoading(false);
    }
  }, [tagsParam]);

  useEffect(() => { fetchMarkers(); }, [fetchMarkers]);

  useEffect(() => {
    (async () => {
      try { const t = await getTags(); setTags(t.tags); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (markers.length === 0 || !mapRef.current) return;
    const coords = markers.map((m) => ({
      latitude: m.location.lat, longitude: m.location.lon,
    }));
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 300);
  }, [markers]);

  // Cluster markers based on current zoom level
  const clustered = useMemo(() => {
    const radius = region ? deltaToRadius(region.latitudeDelta) : 2;
    return clusterMarkers(markers, radius);
  }, [markers, region]);

  const handleFitAll = () => {
    if (markers.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      markers.map((m) => ({ latitude: m.location.lat, longitude: m.location.lon })),
      { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  };

  const handleClusterPress = (cluster: { items: PhotoMarker[] }) => {
    if (!mapRef.current || cluster.items.length === 0) return;
    const coords = cluster.items.map((m) => ({
      latitude: m.location.lat,
      longitude: m.location.lon,
    }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading map data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={32} color={Colors.muted} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={fetchMarkers}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TagFilterBar tags={tags} activeTags={activeTags} onChange={setActiveTags} />
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled={false}
        onRegionChangeComplete={setRegion}
      >
        {clustered.map((item) => {
          if (item.type === "cluster") {
            const size = item.count < 10 ? 36 : item.count < 100 ? 44 : 52;
            return (
              <Marker
                key={item.id}
                coordinate={item.coordinate}
                onPress={() => handleClusterPress(item)}
                tracksViewChanges={false}
              >
                <View style={[styles.clusterOuter, { width: size, height: size, borderRadius: size / 2 }]}>
                  <View style={[styles.clusterInner, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }]}>
                    <Text style={styles.clusterText}>{item.count}</Text>
                  </View>
                </View>
              </Marker>
            );
          }
          const m = item.item;
          return (
            <Marker
              key={m._id}
              coordinate={{ latitude: m.location.lat, longitude: m.location.lon }}
              onPress={() => router.push(`/photo/${m._id}`)}
              title={m.filename}
              description={m.tags?.join(", ")}
              tracksViewChanges={false}
            >
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.badge}>
        <Feather name="map-pin" size={14} color={Colors.accent} />
        <Text style={styles.badgeText}>{markers.length}</Text>
      </View>

      {markers.length > 0 && (
        <Pressable style={styles.fitBtn} onPress={handleFitAll}
          accessibilityRole="button" accessibilityLabel="Fit all markers">
          <Feather name="maximize" size={20} color={Colors.headerFg} />
        </Pressable>
      )}

      <Pressable style={styles.fab} onPress={() => router.push("/capture")}
        accessibilityRole="button" accessibilityLabel="Capture new photo">
        <Feather name="plus" size={28} color={Colors.accentContrast} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg, gap: Spacing.sm },

  // Individual marker
  markerOuter: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: MARKER_BORDER,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
  },
  markerInner: { width: 22, height: 22, borderRadius: 11, backgroundColor: MARKER_RED },

  // Cluster marker — red circle with white border + count
  clusterOuter: {
    backgroundColor: MARKER_BORDER, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4, elevation: 5,
  },
  clusterInner: {
    backgroundColor: MARKER_RED, alignItems: "center", justifyContent: "center",
  },
  clusterText: {
    color: Colors.accentContrast, fontSize: Font.sizes.sm, fontWeight: Font.weights.bold,
  },

  // Overlays
  badge: {
    position: "absolute", top: Spacing.md, left: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.bg, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
    borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  badgeText: { fontSize: Font.sizes.sm, fontWeight: Font.weights.medium, color: Colors.fg },
  fitBtn: {
    position: "absolute", top: Spacing.md, right: Spacing.md, width: 44, height: 44,
    borderRadius: Radius.sm, backgroundColor: Colors.darkGray, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  fab: {
    position: "absolute", bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },

  // States
  loadingText: { color: Colors.muted, fontSize: Font.sizes.sm, marginTop: Spacing.sm },
  errorText: { color: Colors.muted, fontSize: Font.sizes.md, textAlign: "center" },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, backgroundColor: Colors.darkGray, marginTop: Spacing.sm },
  retryBtnText: { color: Colors.headerFg, fontWeight: Font.weights.medium },
});
