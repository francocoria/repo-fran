import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useSession } from "../src/lib/session";

// Mantenemos el splash visible hasta que sepamos si hay sesión, así
// evitamos el flash blanco entre splash y primer screen real.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Cuando ya sabemos el estado de auth, escondemos el splash.
    void SplashScreen.hideAsync().catch(() => {
      /* el splash ya se ocultó antes — ignoramos */
    });

    const inAuth = segments[0] === "(auth)";
    const inApp = segments[0] === "(app)";

    if (!session && inApp) {
      router.replace("/login");
    } else if (session && inAuth) {
      router.replace("/");
    }
  }, [session, loading, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGate />
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
