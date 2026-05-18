import { useTranslation } from ".";

/**
 * Helpers de formato sensibles al idioma activo.
 * Reemplaza a `src/lib/format.ts` cuando hace falta i18n.
 */
export function useLocaleFormat() {
  const { t, locale } = useTranslation();
  const localeTag = locale === "es" ? "es-AR" : locale;

  function speciesLabel(species: string): string {
    return t(`format.species.${species}`);
  }

  function ageLabel(birthDate: Date | string): string {
    const birth =
      typeof birthDate === "string" ? new Date(birthDate) : birthDate;
    const now = new Date();
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (months < 1) return t("format.ageNewborn");
    if (months < 12) return t("format.ageMonths", { count: months });
    const years = Math.floor(months / 12);
    return t("format.ageYears", { count: years });
  }

  function formatDate(
    value: Date | string,
    opts?: { short?: boolean },
  ): string {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleDateString(localeTag, {
      day: "numeric",
      month: opts?.short ? "short" : "long",
      year: "numeric",
    });
  }

  return { speciesLabel, ageLabel, formatDate };
}
