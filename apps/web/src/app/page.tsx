import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  FileText,
  QrCode,
  AlertTriangle,
  Users,
  Bell,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Crown,
  Stethoscope,
  Syringe,
  Scale,
  TrendingUp,
} from "lucide-react";
import { Button, Badge, Brand, PetAvatar } from "@pet-app/ui";
import { createSupabaseServerClient } from "@pet-app/lib";

export const dynamic = "force-dynamic";

const featureIcons = [
  FileText,
  QrCode,
  AlertTriangle,
  Users,
  Bell,
  ShieldCheck,
];

/**
 * Si hay sesión activa, redirige al dashboard del rol correspondiente.
 * Si no, devuelve la landing pública.
 */
async function resolveAuthenticatedRedirect(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Check role en orden: admin → vet → owner
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (admin) return "/admin";

    const { data: vet } = await supabase
      .from("vet_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (vet) return "/vet";

    const { data: owner } = await supabase
      .from("owner_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (owner) return "/app";

    // Logueado pero sin perfil → onboarding
    return "/onboarding";
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const target = await resolveAuthenticatedRedirect();
  if (target) redirect(target);

  const t = await getTranslations("landing");

  const features = featureIcons.map((icon, i) => ({
    icon,
    title: t(`feature${i + 1}Title` as never),
    desc: t(`feature${i + 1}Desc` as never),
  }));
  const ownerPlanItems = [1, 2, 3, 4, 5].map((i) =>
    t(`pricingOwnerItem${i}` as never),
  );
  const vetPlanItems = [1, 2, 3, 4, 5, 6].map((i) =>
    t(`pricingVetItem${i}` as never),
  );
  const heroPreview = await HeroPreview();

  return (
    <div className="bg-background">
      {/* Header sticky */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a
              href="#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("navFeatures")}
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("navPricing")}
            </a>
            <a
              href="#vets"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("navVets")}
            </a>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("navSignIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">{t("navCreateAccount")}</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button size="sm" asChild>
              <Link href="/signup">{t("navStart")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-grad-brand text-white">
        {/* Glow accents */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgb(255 255 255 / 0.18), transparent 40%), radial-gradient(circle at 80% 80%, rgb(255 255 255 / 0.12), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="container relative px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              {t("heroBadge")}
            </div>
            <h1
              className="text-balance text-[40px] font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[68px]"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("heroTitleLine1")}
              <br className="hidden sm:block" /> {t("heroTitleLine2")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-white/90 md:text-lg">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="dark" asChild>
                <Link href="/signup">
                  {t("heroCtaStart")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/signup/vet">
                  <Stethoscope className="size-4" />
                  {t("heroCtaVet")}
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-xs text-white/80">
              <Check className="-mt-0.5 mr-1 inline size-3.5" />
              {t("heroNote")}
            </p>
          </div>

          {/* Hero preview card */}
          <div
            className="mx-auto mt-16 max-w-3xl animate-fade-up md:mt-20"
            style={{ animationDelay: "120ms" }}
          >
            {heroPreview}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-primary">
              {t("featuresEyebrow")}
            </p>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[42px]">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground md:text-[17px]">
              {t("featuresSubtitle")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-[22px]" />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="border-y border-border bg-surface-2 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-[38px]">
              {t("pricingTitle")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t("pricingSubtitle")}
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
            {/* Owner plan */}
            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
                {t("pricingOwnerLabel")}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">
                  {t("pricingOwnerPrice")}
                </span>
              </div>
              <p className="mb-5 mt-1.5 text-sm text-muted-foreground">
                {t("pricingOwnerNote")}
              </p>
              <ul className="mb-6 space-y-2.5">
                {ownerPlanItems.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/signup">{t("pricingOwnerCta")}</Link>
              </Button>
            </div>

            {/* Vet plan */}
            <div
              id="vets"
              className="relative rounded-2xl border-2 border-primary bg-card p-7 shadow-md"
              style={{
                boxShadow:
                  "0 0 0 4px hsl(var(--primary) / 0.1), var(--shadow-md)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
                  {t("pricingVetLabel")}
                </p>
                <Badge variant="gold">
                  <Crown className="size-3" />
                  {t("pricingVetBadge")}
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-bold tracking-tight">
                  USD 10
                </span>
                <span className="text-base text-muted-foreground">
                  {t("pricingVetPriceUnit")}
                </span>
              </div>
              <p className="mb-5 mt-1.5 text-sm text-muted-foreground">
                {t("pricingVetNote")}
              </p>
              <ul className="mb-6 space-y-2.5">
                {vetPlanItems.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="accent" className="w-full" asChild>
                <Link href="/signup/vet">{t("pricingVetCta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="py-10">
        <div className="container flex flex-wrap items-center justify-between gap-4">
          <Brand size="sm" />
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              {t("footerTerms")}
            </a>
            <a href="#" className="hover:text-foreground">
              {t("footerPrivacy")}
            </a>
            <a href="#" className="hover:text-foreground">
              {t("footerContact")}
            </a>
          </div>
          <p className="text-xs text-subtle">{t("footerMade")}</p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* HeroPreview — card 3D con datos de mock mascota          */
/* ─────────────────────────────────────────────────────── */
async function HeroPreview() {
  const t = await getTranslations("landing");
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/40 bg-card"
      style={{
        boxShadow:
          "0 24px 60px rgb(8 51 68 / 0.25), 0 8px 20px rgb(8 51 68 / 0.15)",
        transform: "perspective(1200px) rotateX(2deg)",
        transformOrigin: "center top",
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-3.5 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 inline-block rounded-md border border-border bg-card px-3 py-0.5 font-mono text-[11.5px] text-subtle">
          pet-friendly.fun/luna
        </span>
      </div>

      {/* Preview content */}
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr,1.2fr] md:p-8">
        <div className="flex flex-col items-center text-center">
          <PetAvatar
            name={t("previewName")}
            species="dog"
            size={120}
            radius={28}
          />
          <div className="mt-3">
            <p className="text-xl font-bold">{t("previewName")}</p>
            <p className="text-[13px] text-muted-foreground">
              {t("previewBreed")}
            </p>
          </div>
          <Badge variant="primary" className="mt-3">
            <Check className="size-3" />
            {t("previewVaccinesOk")}
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5">
          <PreviewRow
            icon={Syringe}
            iconBg="bg-primary/12 text-primary"
            title={t("previewRabiesTitle")}
            subtitle={t("previewRabiesSubtitle")}
            badge={
              <Badge variant="emerald" size="xs">
                {t("previewRabiesBadge")}
              </Badge>
            }
          />
          <PreviewRow
            icon={AlertTriangle}
            iconBg="bg-rose/12 text-rose"
            title={t("previewAllergyTitle")}
            subtitle={t("previewAllergySubtitle")}
            badge={
              <Badge variant="rose" size="xs">
                {t("previewAllergyBadge")}
              </Badge>
            }
          />
          <PreviewRow
            icon={Scale}
            iconBg="bg-accent/15 text-accent"
            title={<span className="font-mono">18.4 kg</span>}
            subtitle={t("previewWeightSubtitle")}
            badge={<TrendingUp className="size-3.5 text-emerald" />}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  title: React.ReactNode;
  subtitle: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
      <div className={`flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">{title}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {badge}
    </div>
  );
}
