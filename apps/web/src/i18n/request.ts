import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  detectLocaleFromHeader,
  isLocale,
  type Locale,
} from "./config";

/**
 * Config de next-intl en modo "sin routing": el idioma NO va en la URL.
 * Se lee de la cookie `petapp-locale`; si no existe, se detecta del
 * header Accept-Language del browser.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    locale = detectLocaleFromHeader(headerStore.get("accept-language"));
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

export { DEFAULT_LOCALE };
