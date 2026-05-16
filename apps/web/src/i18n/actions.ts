"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "./config";

/**
 * Guarda el idioma elegido en una cookie de 1 año.
 * La lee `request.ts` en cada render para resolver los mensajes.
 */
export async function setLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
