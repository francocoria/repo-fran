import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@pet-app/ui";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { VerifyForm } from "./verify-form";

export async function generateMetadata() {
  const t = await getTranslations("vetVerify");
  return { title: t("metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");

  if (profile.verified) redirect("/vet/plan");

  const t = await getTranslations("vetVerify");

  const pending = await prisma.verificationRequest.findFirst({
    where: { vet_id: profile.id, status: "pending" },
  });

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <Link
        href="/vet/plan"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {pending ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t("pendingTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("pendingDesc", {
                    date: formatDateLong(pending.created_at),
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-2">{t("requirementsTitle")}</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5 mb-4 list-disc pl-5">
              <li>{t("req1")}</li>
              <li>{t("req2")}</li>
              <li>{t("req3")}</li>
              <li>{t("req4")}</li>
            </ul>
            <VerifyForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
