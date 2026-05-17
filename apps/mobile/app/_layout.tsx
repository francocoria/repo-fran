import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useSession } from "../src/lib/session";
import { registerForPushNotifications } from "../src/lib/push";
import { I18nProvider } from "../src/lib/i18n";

// Mantenemos el splash visible hasta que sepamos si hay sesión, así
// evitamos el flash blanco entre splash y primer screen real.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

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

  // Registrar push notifications una vez cuando hay sesión.
  useEffect(() => {
    if (!session || pushRegistered.current) return;
    pushRegistered.current = true;
    void registerForPushNotifications();
  }, [session]);

  // Al tocar una notificación, navegamos según el `data.screen`.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          screen?: string;
        };
        if (data?.screen === "invites") {
          router.push("/(app)/invites" as never);
        } else if (data?.screen && data.screen.startsWith("/")) {
          router.push(data.screen as never);
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <AuthGate />
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </QueryClientProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
