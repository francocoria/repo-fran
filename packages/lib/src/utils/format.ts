/**
 * Formatea fecha como "12 de mayo de 2026"
 */
export function formatDateLong(date: Date | string, locale = "es-AR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatea fecha como "12/05/2026"
 */
export function formatDateShort(date: Date | string, locale = "es-AR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * "hace 3 días", "hace 2 meses", etc.
 */
export function formatRelative(date: Date | string, locale = "es-AR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, "day");
  if (Math.abs(diffMonth) < 12) return rtf.format(-diffMonth, "month");
  return rtf.format(-diffYear, "year");
}

/**
 * Calcula edad de mascota en formato legible
 */
export function getAge(birthDate: Date | string): string {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (months < 1) return "Recién nacido";
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} ${years === 1 ? "año" : "años"}`;
  return `${years}a ${remMonths}m`;
}
