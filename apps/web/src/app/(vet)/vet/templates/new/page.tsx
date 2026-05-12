import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getFeatureGates } from "@pet-app/lib/utils/subscription";
import { TemplateForm } from "../template-form";

export const metadata = { title: "Nueva plantilla" };
export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
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

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <Link
        href="/vet/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva plantilla</h1>
        <p className="mt-1 text-muted-foreground">
          Pre-armá los campos para reutilizar después en consultas.
        </p>
      </div>

      <TemplateForm mode="create" />
    </div>
  );
}
