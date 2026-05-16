import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Brand, Card, CardContent } from "@pet-app/ui";
import {
  ChevronLeft,
  Trash2,
  Smartphone,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

const LAST_UPDATED = "13 de mayo de 2026";
const SUPPORT_EMAIL = "1133985163f@gmail.com";

export async function generateMetadata() {
  const t = await getTranslations("dataDeletion");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/**
 * Página pública de eliminación de datos.
 *
 * Google Play exige una URL accesible SIN login donde cualquiera pueda
 * encontrar las instrucciones para solicitar la eliminación de su cuenta
 * y los datos asociados. Esta es esa página.
 */
export default async function DataDeletionPage() {
  const t = await getTranslations("dataDeletion");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {t("backPrivacy")}
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-10 md:py-14">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("lastUpdated", { date: LAST_UPDATED })}
            </p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-foreground/85">
          {t("intro")}
        </p>

        <div className="mt-8 grid gap-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">{t("option1Title")}</h2>
              </div>
              <ol className="ml-5 list-decimal space-y-2 text-[14.5px] leading-relaxed">
                <li>
                  {t.rich("option1Step1", {
                    link: (chunks) => (
                      <Link
                        href="/login"
                        className="text-primary hover:underline"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </li>
                <li>
                  {t.rich("option1Step2", {
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </li>
                <li>
                  {t.rich("option1Step3", {
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </li>
                <li>{t("option1Step4")}</li>
                <li>{t("option1Step5")}</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Mail className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">{t("option2Title")}</h2>
              </div>
              <p className="text-[14.5px] leading-relaxed">
                {t.rich("option2Text1", {
                  email: SUPPORT_EMAIL,
                  link: (chunks) => (
                    <a
                      href={`mailto:${SUPPORT_EMAIL}?subject=Eliminaci%C3%B3n%20de%20cuenta%20PetApp`}
                      className="text-primary hover:underline"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
              <p className="text-[14.5px] leading-relaxed">
                {t.rich("option2Text2", {
                  code: (chunks) => (
                    <span className="font-mono text-[13px]">{chunks}</span>
                  ),
                })}
              </p>
              <p className="text-[14.5px] leading-relaxed">
                {t("option2Text3")}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("deletedTitle")}
          </h2>
          <ul className="ml-5 list-disc space-y-1.5 text-[14.5px] leading-relaxed text-foreground/85">
            <li>{t("deletedItem1")}</li>
            <li>{t("deletedItem2")}</li>
            <li>{t("deletedItem3")}</li>
            <li>{t("deletedItem4")}</li>
            <li>{t("deletedItem5")}</li>
            <li>{t("deletedItem6")}</li>
            <li>{t("deletedItem7")}</li>
            <li>{t("deletedItem8")}</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("keptTitle")}
          </h2>
          <p className="text-[14.5px] leading-relaxed">{t("keptIntro")}</p>
          <ul className="ml-5 list-disc space-y-1.5 text-[14.5px] leading-relaxed text-foreground/85">
            <li>
              {t.rich("keptItem1", {
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("keptItem2", {
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
          </ul>
        </section>

        <Card className="mt-10 border-emerald-300/40 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                {t("rightsTitle")}
              </h3>
            </div>
            <p className="text-[14px] leading-relaxed text-emerald-900/85 dark:text-emerald-100/85">
              {t.rich("rightsText", {
                email: SUPPORT_EMAIL,
                link: (chunks) => (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="underline underline-offset-2"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/40 p-4 text-[13.5px]">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("inAppFast")}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t("inAppFastDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/40 p-4 text-[13.5px]">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("byEmailSlow")}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t("byEmailSlowDesc")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            {t("footerPrivacy")}
          </Link>
          <Link href="/" className="hover:text-foreground">
            {t("footerHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
