import { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { Colors, Font, Spacing } from "@/constants/theme";

const screen = Dimensions.get("window");

export default function LightboxScreen() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const lastTap = useRef(0);
  const [dims, setDims] = useState({ w: screen.width, h: screen.height });

  // Unlock rotation for lightbox, re-lock on leave
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setDims({ w: window.width, h: window.height });
    });
    return () => {
      sub.remove();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Double-tap to toggle zoom
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (currentZoom > 1) {
        // Zoom out
        scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
        // Reset zoom by setting zoomScale isn't directly available,
        // but we can use scrollResponderZoomTo on iOS
        (scrollRef.current as any)?.scrollResponderZoomTo?.({
          x: 0, y: 0, width: dims.w, height: dims.h,
        });
      } else {
        // Zoom in to 3x at center
        const zoomW = dims.w / 3;
        const zoomH = dims.h / 3;
        (scrollRef.current as any)?.scrollResponderZoomTo?.({
          x: dims.w / 2 - zoomW / 2,
          y: dims.h / 2 - zoomH / 2,
          width: zoomW,
          height: zoomH,
        });
      }
    }
    lastTap.current = now;
  }, [currentZoom, dims]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentZoom(e.nativeEvent.zoomScale);
  }, []);

  if (!uri) {
    router.back();
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />

      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
          centerContent
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Pressable onPress={handleDoubleTap} style={{ width: dims.w, height: dims.h, justifyContent: "center", alignItems: "center" }}>
            <Image
              source={{ uri }}
              style={{ width: dims.w, height: dims.h }}
              contentFit="contain"
              transition={150}
            />
          </Pressable>
        </ScrollView>

        {/* Top bar overlay */}
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable
            style={styles.closeBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close lightbox"
          >
            <Feather name="x" size={24} color="#fff" />
          </Pressable>

          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}

          {/* Zoom indicator */}
          <View style={styles.zoomBadge}>
            <Text style={styles.zoomText}>
              {currentZoom > 1 ? `${currentZoom.toFixed(1)}x` : ""}
            </Text>
          </View>
        </View>

        {/* Bottom hint */}
        {currentZoom <= 1 && (
          <View style={styles.bottomHint} pointerEvents="none">
            <Text style={styles.hintText}>Pinch to zoom · Double-tap to zoom in</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: Font.sizes.md,
    fontWeight: Font.weights.medium,
    textAlign: "center",
  },
  zoomBadge: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: Font.sizes.xs,
    fontWeight: Font.weights.medium,
  },

  // Bottom hint
  bottomHint: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: Font.sizes.xs,
  },
});
