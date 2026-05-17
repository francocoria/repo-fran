import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Scanner } from "./scanner";
import { ScanLine } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("vetScan");
  return { title: t("metaTitle") };
}

export default async function ScanPage() {
  const t = await getTranslations("vetScan");
  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-12 text-center">
            <ScanLine className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        }
      >
        <Scanner />
      </Suspense>
    </div>
  );
}
