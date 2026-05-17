import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getFeatureGates } from "@pet-app/lib/utils/subscription";
import { TemplateForm } from "../../template-form";

export async function generateMetadata() {
  const t = await getTranslations("vetTemplateEdit");
  return { title: t("metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");

  const subscription = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
  });
  const gates = getFeatureGates(
    subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        }
      : null,
  );
  if (!gates.customTemplates) redirect("/vet/templates");

  const tpl = await prisma.consultTemplate.findUnique({
    where: { id },
    select: { id: true, vet_id: true, name: true, content: true, is_system: true },
  });

  if (!tpl || tpl.vet_id !== profile.id || tpl.is_system) notFound();

  const t = await getTranslations("vetTemplateEdit");
  const content = tpl.content as Record<string, string>;

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <Link
        href="/vet/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("back")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{tpl.name}</p>
      </div>

      <TemplateForm
        mode="edit"
        templateId={tpl.id}
        initialData={{
          name: tpl.name,
          examination: content.examination ?? "",
          diagnosis: content.diagnosis ?? "",
          treatment: content.treatment ?? "",
          nextSteps: content.next_steps ?? "",
        }}
      />
    </div>
  );
}
