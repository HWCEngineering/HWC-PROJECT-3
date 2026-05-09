import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  // Lock main app to portrait
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.darkGray },
          headerTintColor: Colors.headerFg,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ title: "Capture" }} />
        <Stack.Screen name="photo/[id]" options={{ title: "Photo" }} />
        <Stack.Screen
          name="lightbox"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack>
    </>
  );
}
