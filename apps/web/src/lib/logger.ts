import "server-only";

/**
 * Logger sanitizado para server-side (audit MEDIO-8).
 *
 * En lugar de `console.error("ctx", error)` que puede incluir PII, query
 * params con tokens, valores de columnas Prisma, etc, este logger sólo
 * imprime metadata estructurada (tag, code, status, name del error).
 *
 * Para los detalles full hay que conectarlo a Sentry/Datadog en V2 — esto
 * es la línea base mínima para no leakear datos sensibles en stdout de
 * Vercel (que es accesible a cualquiera con dashboard access).
 *
 * Uso:
 *   logError("auth/magicLink", error, { userId });
 *   logWarn("co-owner/invite", "email no encontrado");
 */

type ErrorLike = {
  name?: string;
  message?: string;
  code?: string | number;
  status?: number;
  stack?: string;
};

const PII_KEYS = new Set([
  "email",
  "phone",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "api_key",
  "apiKey",
  "secret",
]);

function sanitizeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = typeof v === "string" && v.length > 0 ? "[redacted]" : v;
    } else if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractError(err: unknown): Record<string, unknown> {
  if (!err) return {};
  if (err instanceof Error) {
    const e = err as ErrorLike;
    return {
      name: e.name,
      code: e.code,
      status: e.status,
      // Mensaje: primeros 200 chars sin args interpolados sensibles.
      message: e.message?.slice(0, 200),
    };
  }
  if (typeof err === "object") {
    const e = err as ErrorLike;
    return { code: e.code, status: e.status, message: e.message?.slice(0, 200) };
  }
  return { value: String(err).slice(0, 200) };
}

export function logError(
  tag: string,
  err?: unknown,
  meta?: Record<string, unknown>,
): void {
  console.error(`[${tag}]`, {
    ...extractError(err),
    ...sanitizeMeta(meta),
  });
}

export function logWarn(
  tag: string,
  msg: string,
  meta?: Record<string, unknown>,
): void {
  console.warn(`[${tag}] ${msg}`, sanitizeMeta(meta));
}

export function logInfo(
  tag: string,
  msg: string,
  meta?: Record<string, unknown>,
): void {
  console.log(`[${tag}] ${msg}`, sanitizeMeta(meta));
}
