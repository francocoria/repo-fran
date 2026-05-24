import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Rate limiting con Upstash Redis (audit ALTO-6).
 *
 * Es OPCIONAL: si no hay UPSTASH_REDIS_REST_URL/TOKEN en el entorno,
 * la app sigue funcionando sin rate limit pero loguea un warning.
 * Para activar en producción: crear DB gratis en https://console.upstash.com
 * (10k req/día sin costo) y cargar las dos env vars en Vercel.
 *
 * Tres limiters de uso:
 *  - authByIp:    5 req / 1 min  por IP  (proteger /login, /signup en general)
 *  - authByEmail: 3 req / 5 min  por email (proteger spam de magic link por email)
 *  - otpVerify:   10 req / 5 min por IP+email (proteger brute force del código)
 *
 * Patrón de uso:
 *   const limited = await rateLimit(authByIp, await ipKey());
 *   if (limited) return { success: false, error: limited };
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;
if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no seteados — rate limit DESACTIVADO. " +
      "Cargá las env vars en Vercel para activarlo.",
  );
}

export const authByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "rl:auth:ip",
    })
  : null;

export const authByEmail = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "5 m"),
      analytics: true,
      prefix: "rl:auth:email",
    })
  : null;

export const otpVerify = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      analytics: true,
      prefix: "rl:otp",
    })
  : null;

/**
 * Ejecuta un limiter. Retorna mensaje de error opaco si está limitado,
 * o `null` si pasa (también pasa si Upstash no está configurado).
 */
export async function rateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<string | null> {
  if (!limiter) return null; // sin Upstash, no limita
  const { success, reset } = await limiter.limit(key);
  if (success) return null;
  const secs = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return `Demasiados intentos. Esperá ${secs}s antes de reintentar.`;
}

/**
 * Extrae IP del request actual. En Vercel viene en `x-forwarded-for`
 * (primer valor = IP real). En local cae a "127.0.0.1".
 */
export async function ipKey(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "127.0.0.1";
}
