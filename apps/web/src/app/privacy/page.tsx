import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Brand } from "@pet-app/ui";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return { title: t("metaTitle") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Brand size="md" />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("back")}
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

        <div className="prose-petapp mt-8 space-y-6 text-[15px] leading-relaxed">
          <Section title={t("whoTitle")}>
            <p>
              {t("whoText")}
              <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">1133985163f@gmail.com</a>
            </p>
          </Section>

          <Section title={t("dataTitle")}>
            <p>{t("dataIntro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>{t("dataItem1")}</li>
              <li>{t("dataItem2")}</li>
              <li>{t("dataItem3")}</li>
              <li>{t("dataItem4")}</li>
            </ul>
          </Section>

          <Section title={t("useTitle")}>
            <p>{t("useIntro")}</p>
            <ol className="ml-5 mt-2 list-decimal space-y-1">
              <li>{t("useItem1")}</li>
              <li>{t("useItem2")}</li>
              <li>{t("useItem3")}</li>
              <li>{t("useItem4")}</li>
            </ol>
            <p className="mt-3 font-semibold">{t("useNoSell")}</p>
          </Section>

          <Section title={t("accessTitle")}>
            <ul className="ml-5 list-disc space-y-1">
              <li>{t("accessItem1")}</li>
              <li>{t("accessItem2")}</li>
              <li>{t("accessItem3")}</li>
              <li>{t("accessItem4")}</li>
            </ul>
          </Section>

          <Section title={t("rightsTitle")}>
            <p>{t("rightsIntro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>{t("rightsItem1")}</li>
              <li>{t("rightsItem2")}</li>
              <li>{t("rightsItem3")}</li>
              <li>{t("rightsItem4")}</li>
              <li>{t("rightsItem5")}</li>
            </ul>
            <p className="mt-3">
              {t("rightsContact")}
              <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">
                1133985163f@gmail.com
              </a>.
            </p>
          </Section>

          <Section title={t("storageTitle")}>
            <p>{t("storageText")}</p>
          </Section>

          <Section title={t("childrenTitle")}>
            <p>{t("childrenText")}</p>
          </Section>

          <Section title={t("changesTitle")}>
            <p>{t("changesText")}</p>
          </Section>

          <Section title={t("contactTitle")}>
            <p>
              {t("contactText")}
              <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">
                1133985163f@gmail.com
              </a>
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
