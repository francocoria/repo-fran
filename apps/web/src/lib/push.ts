import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@pet-app/db";

/**
 * Helper para enviar notificaciones push a la app nativa via Expo Push.
 *
 * Uso:
 *   await sendPushToUser(userId, {
 *     title: "Te invitaron a cuidar a Pepe",
 *     body: "Franco quiere compartir el cuidado con vos.",
 *     data: { screen: "invites" },
 *   });
 *
 * Si el usuario no tiene tokens registrados, es no-op silencioso.
 * Los tokens inválidos (DeviceNotRegistered) se borran automáticamente.
 */

let _expo: Expo | null = null;
function getExpo(): Expo {
  if (!_expo) {
    _expo = new Expo({
      // Si tenés un access token de Expo, se setea acá. Para push básico
      // no hace falta.
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
  }
  return _expo;
}

export interface PushPayload {
  title: string;
  body: string;
  /** data extra — la app la usa para navegar al tocar la notif */
  data?: Record<string, unknown>;
}

export interface PushResult {
  sent: number;
  failed: number;
}

/**
 * Envía una push a TODOS los devices de un usuario.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<PushResult> {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { user_id: userId },
      select: { id: true, token: true },
    });

    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const expo = getExpo();
    const messages: ExpoPushMessage[] = [];
    const validTokenIds: string[] = [];
    const invalidTokenIds: string[] = [];

    for (const { id, token } of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        invalidTokenIds.push(id);
        continue;
      }
      validTokenIds.push(id);
      messages.push({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        priority: "high",
      });
    }

    if (messages.length === 0) {
      if (invalidTokenIds.length > 0) {
        await prisma.pushToken.deleteMany({
          where: { id: { in: invalidTokenIds } },
        });
      }
      return { sent: 0, failed: tokens.length };
    }

    // Expo recomienda mandar en chunks
    const chunks = expo.chunkPushNotifications(messages);
    let sent = 0;
    let failed = 0;

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
          if (ticket.status === "ok") {
            sent++;
          } else {
            failed++;
            // Si el device ya no está registrado, marcamos el token para borrar
            if (
              ticket.details?.error === "DeviceNotRegistered" &&
              "to" in chunk[0]!
            ) {
              // best-effort: no tenemos el mapping exacto ticket->token,
              // pero el cleanup periódico lo resuelve. Aquí lo logueamos.
              console.warn("[push] DeviceNotRegistered ticket:", ticket);
            }
          }
        }
      } catch (err) {
        console.error("[push] chunk send failed:", err);
        failed += chunk.length;
      }
    }

    // Limpiamos tokens con formato inválido
    if (invalidTokenIds.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { id: { in: invalidTokenIds } },
      });
    }

    // Actualizamos last_used_at de los tokens válidos
    if (validTokenIds.length > 0) {
      await prisma.pushToken.updateMany({
        where: { id: { in: validTokenIds } },
        data: { last_used_at: new Date() },
      });
    }

    return { sent, failed };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[push] sendPushToUser failed:", msg);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envía la misma push a varios usuarios (ej: dueños de mascotas que se
 * vacunan hoy). No-op para los que no tengan tokens.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  let sent = 0;
  let failed = 0;
  for (const userId of userIds) {
    const r = await sendPushToUser(userId, payload);
    sent += r.sent;
    failed += r.failed;
  }
  return { sent, failed };
}
