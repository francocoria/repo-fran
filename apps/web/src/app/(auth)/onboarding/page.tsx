import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Dog, Stethoscope, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@pet-app/ui";
import { createSupabaseServerClient } from "@pet-app/lib";

export const dynamic = "force-dynamic";
export const metadata = { title: "Empezar" };

/**
 * Selector de rol. Sólo se muestra si el usuario no eligió rol durante
 * el signup (caso típico: login OTP con email nuevo). Si ya hay
 * metadata.role, saltamos directo al onboarding correspondiente.
 */
export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata as { role?: string } | null)?.role;
  if (role === "owner") redirect("/onboarding/owner");
  if (role === "vet") redirect("/onboarding/vet");

  const t = await getTranslations("onboarding");

  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        {/* Owner */}
        <Link href="/onboarding/owner" className="group">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Dog className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t("ownerTitle")}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("ownerDescription")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>

        {/* Vet */}
        <Link href="/onboarding/vet" className="group">
          <Card className="transition-all hover:border-accent/50 hover:shadow-md hover:shadow-accent/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t("vetTitle")}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("vetDescription")}
                  <span className="ml-1 text-accent font-medium">
                    {t("vetPremium")}
                  </span>
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
