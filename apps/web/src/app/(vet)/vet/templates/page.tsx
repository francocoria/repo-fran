import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  Plus,
  FileText,
  Crown,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@pet-app/ui";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import {
  effectivePlan,
  getFeatureGates,
} from "@pet-app/lib/utils/subscription";
import { TemplatesList } from "./templates-list";

export const metadata = { title: "Plantillas de consulta" };
export const dynamic = "force-dynamic";

export default async function VetTemplatesPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");

  const subscription = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
  });
  const subState = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        expiresAt: subscription.expires_at,
      }
    : null;
  const gates = getFeatureGates(subState);
  const plan = effectivePlan(subState);

  const [myTemplates, systemTemplates] = await Promise.all([
    prisma.consultTemplate.findMany({
      where: { vet_id: profile.id },
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, content: true, created_at: true },
    }),
    prisma.consultTemplate.findMany({
      where: { is_system: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, content: true },
    }),
  ]);

  return (
    <div className="animate-fade-up max-w-3xl space-y-6">
      <Link
        href="/vet"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Plantillas de consulta
        </h1>
        <p className="mt-1 text-muted-foreground">
          Guardá tus diagnósticos y tratamientos más usados para reutilizar.
        </p>
      </div>

      {!gates.customTemplates && (
        <Card className="border-amber/30 bg-amber/5">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-grad-gold text-white shadow-sm">
              <Crown className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Feature Premium</p>
              <p className="text-sm text-muted-foreground">
                Las plantillas personalizadas son parte del plan Premium. Podés
                ver y usar las del sistema sin restricciones.
              </p>
            </div>
            <Button variant="default" size="sm" asChild>
              <Link href="/vet/plan">Pasar a Premium</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-base font-semibold">Mis plantillas</h2>
            <p className="text-xs text-muted-foreground">
              {myTemplates.length === 0
                ? "Todavía no tenés plantillas propias."
                : `${myTemplates.length} plantilla${myTemplates.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {gates.customTemplates && (
            <Button size="sm" asChild>
              <Link href="/vet/templates/new">
                <Plus className="size-3.5" />
                Nueva
              </Link>
            </Button>
          )}
        </div>

        <TemplatesList
          templates={myTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            content: t.content as Record<string, string>,
          }))}
          editable={gates.customTemplates}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Plantillas del sistema</h2>
          <Badge variant="secondary" size="sm">
            {systemTemplates.length}
          </Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Disponibles para todos los vets. Usalas como base si querés.
        </p>

        <div className="grid gap-2.5">
          {systemTemplates.map((t) => {
            const content = t.content as Record<string, string>;
            const fieldsFilled = Object.values(content).filter(
              (v) => v && v.trim() !== "",
            ).length;
            return (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fieldsFilled} campo{fieldsFilled !== 1 ? "s" : ""} pre-armado
                      {fieldsFilled !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" size="xs">
                    Sistema
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
