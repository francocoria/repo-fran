import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { env } from "./env";

/**
 * Manejo de push notifications en mobile.
 *
 * Flujo:
 *  1. registerForPushNotifications() — pide permiso, obtiene el Expo push
 *     token, lo manda a /api/push/register.
 *  2. Se llama después del login (cuando hay sesión).
 *  3. unregisterPushToken() — al cerrar sesión.
 */

// Mostrar la notificación aunque la app esté en foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pide permiso y registra el token. Devuelve el token o null si el
 * usuario rechazó o el device no soporta push.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push sólo funciona en device físico, no en simulador
  if (!Device.isDevice) {
    return null;
  }

  // Android necesita un canal de notificación
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Recordatorios",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7c3aed",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  // projectId — EAS lo inyecta en expoConfig.extra.eas.projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  let token: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    token = result.data;
  } catch (err) {
    console.error("[push] getExpoPushTokenAsync failed:", err);
    return null;
  }

  // Mandamos el token al backend
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return token;

    await fetch(`${env.APP_URL}/api/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName ?? undefined,
      }),
    });
  } catch (err) {
    console.error("[push] register backend failed:", err);
  }

  return token;
}

/**
 * Da de baja el token al cerrar sesión.
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch(`${env.APP_URL}/api/push/register`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error("[push] unregister failed:", err);
  }
}
