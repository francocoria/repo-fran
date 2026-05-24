import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Valida el header `Authorization: Bearer <CRON_SECRET>` de un request
 * de cron de Vercel con comparación timing-safe (resiste timing attacks
 * que podrían inferir el secret byte a byte).
 *
 * Retorna `null` si la auth es válida; si no, retorna una `NextResponse`
 * con el código de error correspondiente — el endpoint solo tiene que
 * devolverla tal cual.
 *
 * Uso:
 *   const unauthorized = verifyCronAuth(request);
 *   if (unauthorized) return unauthorized;
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expectedHeader = `Bearer ${expected}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
