import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Brand } from "@pet-app/ui";
import { ChevronLeft } from "lucide-react";

const LAST_UPDATED = "13 de mayo de 2026";

export async function generateMetadata() {
  const t = await getTranslations("terms");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("terms");

  return (
    <div className="bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {t("back")}
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-10 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated", { date: LAST_UPDATED })}
        </p>

        <div className="prose prose-stone mt-8 max-w-none dark:prose-invert">
          <Section title={t("section1Title")}>
            <p>{t("section1Text")}</p>
          </Section>

          <Section title={t("section2Title")}>
            <p>{t("section2Text1")}</p>
            <p>{t("section2Text2")}</p>
          </Section>

          <Section title={t("section3Title")}>
            <ul>
              <li>{t("section3Item1")}</li>
              <li>{t("section3Item2")}</li>
              <li>{t("section3Item3")}</li>
            </ul>
          </Section>

          <Section title={t("section4Title")}>
            <p>{t("section4Text1")}</p>
            <p>{t("section4Text2")}</p>
          </Section>

          <Section title={t("section5Title")}>
            <p>
              {t.rich("section5Text1", {
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <p>{t("section5Text2")}</p>
          </Section>

          <Section title={t("section6Title")}>
            <p>{t("section6Text1")}</p>
            <p>{t("section6Text2")}</p>
          </Section>

          <Section title={t("section7Title")}>
            <p>{t("section7Text")}</p>
          </Section>

          <Section title={t("section8Title")}>
            <p>{t("section8Text")}</p>
          </Section>

          <Section title={t("section9Title")}>
            <p>
              {t.rich("section9Text", {
                link: (chunks) => (
                  <a
                    href="mailto:hola@pet-friendly.fun"
                    className="text-primary hover:underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </Section>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}
