import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Crown,
  DollarSign,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  PawPrint,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Brand, PetAvatar } from "@pet-app/ui";
import { createSupabaseServerClient } from "@pet-app/lib";
import {
  CountUp,
  HeroPhone,
  Marquee,
  Reveal,
} from "../components/landing/landing-v2-client";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedRedirect(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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

    return "/onboarding";
  } catch {
    return null;
  }
}

const FLOATING_PETS: Array<{
  name: string;
  species: "dog" | "cat" | "rabbit" | "bird";
  size: number;
  pos: { top?: string; left?: string; right?: string; bottom?: string };
  rotate: number;
  duration: number;
  delay: number;
}> = [
  { name: "L", species: "dog", size: 70, pos: { top: "14%", left: "8%" }, rotate: -12, duration: 7, delay: 0 },
  { name: "P", species: "cat", size: 60, pos: { top: "20%", right: "12%" }, rotate: 8, duration: 5.5, delay: 1 },
  { name: "M", species: "rabbit", size: 55, pos: { bottom: "22%", left: "4%" }, rotate: -6, duration: 6.5, delay: 0.5 },
  { name: "T", species: "dog", size: 65, pos: { bottom: "14%", right: "6%" }, rotate: 10, duration: 6, delay: 1.5 },
  { name: "R", species: "bird", size: 50, pos: { top: "60%", left: "12%" }, rotate: 5, duration: 7.5, delay: 2 },
  { name: "K", species: "cat", size: 48, pos: { top: "48%", right: "8%" }, rotate: -8, duration: 5, delay: 0.8 },
];

const MARQUEE_PETS: Array<{ n: string; sp: "dog" | "cat" | "rabbit" | "bird" }> = [
  { n: "Pepe", sp: "dog" }, { n: "Luna", sp: "dog" }, { n: "Pucho", sp: "cat" },
  { n: "Morena", sp: "dog" }, { n: "Ramón", sp: "cat" }, { n: "Thor", sp: "dog" },
  { n: "Miel", sp: "cat" }, { n: "Rocco", sp: "dog" }, { n: "Uma", sp: "rabbit" },
  { n: "Toto", sp: "bird" }, { n: "Kira", sp: "cat" }, { n: "Lola", sp: "dog" },
  { n: "Simba", sp: "cat" }, { n: "Olivia", sp: "rabbit" }, { n: "Bruno", sp: "dog" },
];

export default async function LandingPage() {
  const target = await resolveAuthenticatedRedirect();
  if (target) redirect(target);

  const t = await getTranslations("landing");

  return (
    <div className="bg-background">
      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-[90px]"
        style={{
          minHeight: "92vh",
          background: `
            radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.22), transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.22), transparent 50%),
            hsl(var(--background))
          `,
        }}
      >
        {/* Morphing blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: "10%",
            left: "-10%",
            width: 500,
            height: 500,
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25))",
            filter: "blur(60px)",
            animation: "lv2-blob 18s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: "-15%",
            right: "-10%",
            width: 600,
            height: 600,
            background:
              "linear-gradient(135deg, hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.3))",
            filter: "blur(80px)",
            animation: "lv2-blob 22s ease-in-out infinite reverse",
          }}
        />

        {/* Floating pets */}
        {FLOATING_PETS.map((p, i) => (
          <FloatingPet key={i} {...p} />
        ))}

        {/* Pill nav */}
        <header className="absolute left-0 right-0 top-6 z-10">
          <div
            className="container flex items-center justify-between gap-3 rounded-full border bg-surface/70 px-3 py-2.5 backdrop-blur-xl md:max-w-[980px]"
            style={{
              boxShadow: "0 12px 32px rgba(0,0,0,.06)",
              borderColor: "hsl(var(--border) / 0.7)",
            }}
          >
            <div className="pl-3">
              <Brand size="sm" />
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#how"
                className="rounded-full px-3 py-2 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                {t("navHow")}
              </a>
              <a
                href="#vets"
                className="rounded-full px-3 py-2 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                {t("navVets")}
              </a>
              <a
                href="#pricing"
                className="rounded-full px-3 py-2 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                {t("navPricing")}
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 text-[13.5px] font-medium text-foreground md:inline-block"
              >
                {t("navSignIn")}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full px-4 py-2 text-[13.5px] font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                  boxShadow: "0 6px 16px hsl(var(--primary) / 0.3)",
                }}
              >
                {t("navStart")}
              </Link>
            </div>
          </div>
        </header>

        {/* Two-column hero */}
        <div className="container relative z-[2] grid items-center gap-10 pt-2 md:grid-cols-[1.05fr_.95fr] md:gap-16 md:pt-20">
          {/* Left copy */}
          <div>
            <Reveal>
              <div
                className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: "hsl(var(--primary) / 0.12)",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  color: "hsl(var(--primary))",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: "hsl(var(--primary))",
                    animation: "lv2-pulse-dot 1.5s infinite",
                  }}
                />
                {t("heroEyebrow")}
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h1
                className="font-extrabold leading-[0.96]"
                style={{
                  fontSize: "clamp(42px, 9vw, 92px)",
                  letterSpacing: "-0.035em",
                }}
              >
                {t("heroLine1")}
                <br />
                {t("heroLine2")}
                <br />
                <span
                  className="inline-block"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {t("heroLine3")}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p
                className="mt-6 max-w-[480px] text-[19px] leading-[1.5] text-muted-foreground"
                style={{ textWrap: "pretty" }}
              >
                {t.rich("heroSubtitle", {
                  strong: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-[15.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    boxShadow: "0 12px 28px hsl(var(--primary) / 0.35)",
                  }}
                >
                  {t("heroCtaStart")}
                  <ArrowRight className="size-[18px]" strokeWidth={2.4} />
                </Link>
                <Link
                  href="/signup/vet"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border-strong bg-surface px-6 py-4 text-[15.5px] font-semibold"
                >
                  <Stethoscope className="size-[18px]" />
                  {t("heroCtaVet")}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <div className="mt-8 flex items-center gap-3.5">
                {/* Avatar stack */}
                <div className="flex">
                  {[
                    { n: "L", sp: "dog" as const },
                    { n: "P", sp: "cat" as const },
                    { n: "M", sp: "rabbit" as const },
                    { n: "T", sp: "dog" as const },
                  ].map((a, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-full"
                      style={{
                        marginLeft: i > 0 ? -10 : 0,
                        width: 36,
                        height: 36,
                        border: "3px solid hsl(var(--background))",
                        zIndex: 4 - i,
                      }}
                    >
                      <PetAvatar
                        name={a.n}
                        species={a.sp}
                        size={36}
                        radius={18}
                      />
                    </div>
                  ))}
                  <div
                    className="relative flex size-9 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      marginLeft: -10,
                      border: "3px solid hsl(var(--background))",
                      background: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                      zIndex: 0,
                    }}
                  >
                    +2k
                  </div>
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold">
                    {t.rich("heroSocial", {
                      count: () => <CountUp to={2400} />,
                    })}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ★★★★★{" "}
                    <span className="font-semibold text-foreground">4.9</span>{" "}
                    · App Store
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right phone */}
          <Reveal delay={2}>
            <HeroPhone
              scanLabel={t("heroPhoneScan")}
              greeting={t("heroPhoneGreeting")}
              petName={t("heroPhonePetName")}
              petBreed={t("heroPhonePetBreed")}
              yourQrLabel={t("heroPhoneQrLabel")}
              qrUrl={t("heroPhoneQrUrl")}
              lostBadge={t("heroPhoneLostBadge")}
              lostName={t("heroPhoneLostName")}
              lostLocation={t("heroPhoneLostLocation")}
              okBadge={t("heroPhoneOkBadge")}
              weight="18.4 kg"
              vaccines="3"
              age="3a"
            />
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-subtle">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              {t("heroScroll")}
            </span>
            <div
              className="relative"
              style={{
                width: 22,
                height: 36,
                borderRadius: 999,
                border: "1.5px solid hsl(var(--foreground) / 0.3)",
              }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: 6,
                  width: 3,
                  height: 8,
                  borderRadius: 999,
                  background: "hsl(var(--foreground) / 0.3)",
                  animation: "lv2-scan-bar 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-border bg-surface py-10">
        <div className="mb-6 text-center text-[11px] font-bold uppercase tracking-widest text-subtle">
          {t("marqueeTagline")}
        </div>
        <Marquee pets={MARQUEE_PETS} />
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
      <section
        id="how"
        className="relative py-24 md:py-[120px]"
        style={{ background: "hsl(var(--surface-2))" }}
      >
        <div className="container">
          <Reveal>
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                {t("howEyebrow")}
              </div>
              <h2
                className="font-extrabold leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {t("howTitle")}
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n, i) => (
              <Reveal key={n} delay={((i + 1) as 1 | 2 | 3)}>
                <div className="h-full overflow-hidden rounded-3xl border border-border bg-surface">
                  <div
                    className="relative flex h-[220px] items-center justify-center overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))",
                    }}
                  >
                    <StepIllustration step={n} />
                  </div>
                  <div className="p-7">
                    <div className="mb-2 font-mono text-[13px] font-bold tracking-widest text-primary">
                      0{n}
                    </div>
                    <h3 className="mb-3 text-[22px] font-bold leading-[1.2] tracking-tight">
                      {t(`howStep${n}Title`)}
                    </h3>
                    <p className="text-[14.5px] leading-[1.55] text-muted-foreground">
                      {t(`howStep${n}Desc`)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PET STORIES ═════════════════════════════════════ */}
      <section className="relative py-24 md:py-[120px]">
        <div className="container">
          <Reveal>
            <div className="mb-14 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                {t("storiesEyebrow")}
              </div>
              <h2
                className="font-extrabold leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {t("storiesTitle")}
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n, i) => {
              const tones = {
                "1": { bg: "rgba(16,185,129,.12)", fg: "#047857" },
                "2": {
                  bg: "hsl(var(--primary) / 0.12)",
                  fg: "hsl(var(--primary))",
                },
                "3": {
                  bg: "hsl(var(--accent) / 0.12)",
                  fg: "hsl(var(--accent-600))",
                },
              } as const;
              const species: Record<string, "dog" | "cat"> = {
                "1": "dog",
                "2": "dog",
                "3": "cat",
              };
              const tone = tones[n];
              return (
                <Reveal key={n} delay={((i + 1) as 1 | 2 | 3)}>
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-transform hover:-translate-y-1.5">
                    <div className="relative h-[200px]">
                      <PetAvatar
                        name={t(`stories${n}Name`)}
                        species={species[n]}
                        size={9999}
                        radius={0}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.5))",
                        }}
                      />
                      <div
                        className="absolute left-3.5 top-3.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {t(`stories${n}Tag`)}
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-[26px] font-extrabold tracking-tight">
                          {t(`stories${n}Name`)}
                        </div>
                        <div className="text-xs opacity-90">
                          {t(`stories${n}Owner`)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <Sparkles
                        className="mb-3 size-5 text-primary"
                        strokeWidth={2.2}
                      />
                      <p
                        className="text-[15.5px] leading-[1.5]"
                        style={{ textWrap: "pretty" }}
                      >
                        “{t(`stories${n}Quote`)}”
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ STATS BAND ══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-[100px]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 800,
            height: 400,
            background:
              "radial-gradient(ellipse, hsl(var(--primary) / 0.1), transparent 70%)",
          }}
        />

        <div className="container relative">
          <Reveal>
            <div className="mb-12 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                {t("statsEyebrow")}
              </div>
              <h2
                className="font-extrabold leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {t("statsTitleLine1")}
                <br />
                <span className="text-primary">{t("statsTitleLine2")}</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: PawPrint, value: 2400, suffix: "+", labelKey: "statsLabel1" },
              { icon: AlertTriangle, value: 89, suffix: "%", labelKey: "statsLabel2" },
              { icon: Stethoscope, value: 320, suffix: "+", labelKey: "statsLabel3" },
              { icon: Star, value: 4.9, suffix: "", decimals: 1, labelKey: "statsLabel4" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={((i + 1) as 1 | 2 | 3 | 4)}>
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-7">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-5 -top-5 size-32 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, hsl(var(--primary) / 0.1), transparent)",
                      }}
                    />
                    <div
                      className="mb-4 flex size-11 items-center justify-center rounded-xl"
                      style={{
                        background: "hsl(var(--primary) / 0.12)",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      <Icon className="size-5" strokeWidth={2.2} />
                    </div>
                    <div
                      className="text-[48px] font-extrabold leading-none tracking-tight"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      <CountUp
                        to={s.value}
                        suffix={s.suffix}
                        decimals={s.decimals ?? 0}
                      />
                    </div>
                    <div className="mt-2 text-[13.5px] font-medium text-muted-foreground">
                      {t(s.labelKey as never)}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ LOST MODE ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-24 text-white md:py-[120px]"
        style={{
          background:
            "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(225,29,72,.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(225,29,72,.15), transparent 50%)",
          }}
        />

        <div className="container relative">
          <div className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div>
                <div
                  className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: "rgba(225,29,72,.2)",
                    borderColor: "rgba(225,29,72,.4)",
                    color: "#fda4af",
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      background: "#fda4af",
                      animation: "lv2-pulse-dot 1.2s infinite",
                    }}
                  />
                  {t("lostEyebrow")}
                </div>
                <h2
                  className="font-extrabold leading-[1.0]"
                  style={{
                    fontSize: "clamp(36px, 5.5vw, 64px)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {t("lostTitleLine1")}
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #fda4af, #f43f5e)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {t("lostTitleLine2")}
                  </span>
                </h2>
                <p
                  className="mt-5 max-w-[500px] text-[18px] leading-[1.5] opacity-85"
                  style={{ textWrap: "pretty" }}
                >
                  {t("lostSubtitle")}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  {[
                    { icon: Zap, key: "lostFeat1" },
                    { icon: Share2, key: "lostFeat2" },
                    { icon: MapPin, key: "lostFeat3" },
                    { icon: AlertTriangle, key: "lostFeat4" },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-[14.5px]">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: "rgba(225,29,72,.2)",
                            color: "#fda4af",
                          }}
                        >
                          <Icon className="size-3.5" strokeWidth={2.4} />
                        </div>
                        {t(f.key as never)}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/lost"
                  className="mt-9 inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white"
                  style={{
                    background: "hsl(var(--rose))",
                    boxShadow: "0 12px 28px rgba(225,29,72,.4)",
                  }}
                >
                  {t("lostCta")}
                  <ArrowRight className="size-[18px]" strokeWidth={2.4} />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <LostPosterMockup
                lostStripe={t("lostPosterStripe")}
                petName={t("lostPosterName")}
                meta={t("lostPosterMeta")}
                rewardLabel={t("lostPosterReward")}
                rewardAmount="$80.000"
                phone="+54 9 11 6712-4408"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ VET SECTION ═════════════════════════════════════ */}
      <section
        id="vets"
        className="relative overflow-hidden py-24 md:py-[120px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10%] top-[10%]"
          style={{
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.18), transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="container relative">
          <div className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div>
                <div
                  className="mb-6 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: "hsl(var(--accent) / 0.12)",
                    borderColor: "hsl(var(--accent) / 0.25)",
                    color: "hsl(var(--accent-600))",
                  }}
                >
                  <Stethoscope className="size-3.5" strokeWidth={2.4} />
                  {t("vetEyebrow")}
                </div>
                <h2
                  className="font-extrabold leading-[1.05]"
                  style={{
                    fontSize: "clamp(32px, 5vw, 56px)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {t("vetTitleLine1")}
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {t("vetTitleLine2")}
                  </span>
                </h2>
                <p className="mt-5 max-w-[500px] text-[18px] leading-[1.5] text-muted-foreground">
                  {t("vetSubtitle")}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    { icon: QrCode, key: "vetFeat1" },
                    { icon: ShieldCheck, key: "vetFeat2" },
                    { icon: FileText, key: "vetFeat3" },
                    { icon: TrendingUp, key: "vetFeat4" },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[13.5px] font-semibold"
                      >
                        <div
                          className="flex size-7 items-center justify-center rounded-lg"
                          style={{
                            background: "hsl(var(--accent) / 0.12)",
                            color: "hsl(var(--accent-600))",
                          }}
                        >
                          <Icon className="size-3.5" strokeWidth={2.4} />
                        </div>
                        {t(f.key as never)}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/signup/vet"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))",
                    boxShadow: "0 12px 28px hsl(var(--accent) / 0.35)",
                  }}
                >
                  {t("vetCta")}
                  <ArrowRight className="size-[18px]" strokeWidth={2.4} />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <VetDashboardMockup t={t} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═════════════════════════════════════════ */}
      <section
        id="pricing"
        className="py-24 md:py-[120px]"
        style={{ background: "hsl(var(--surface-2))" }}
      >
        <div className="container">
          <Reveal>
            <div className="mb-14 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                {t("pricingEyebrow")}
              </div>
              <h2
                className="font-extrabold leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {t("pricingTitleLine1")}
                <br />
                <span className="text-primary">{t("pricingTitleLine2")}</span>
              </h2>
              <p
                className="mx-auto mt-4 max-w-[500px] text-[17px] text-muted-foreground"
                style={{ textWrap: "pretty" }}
              >
                {t("pricingSubtitle")}
              </p>
            </div>
          </Reveal>

          <div className="mx-auto grid max-w-[900px] gap-5 sm:grid-cols-2">
            <Reveal delay={1}>
              <div className="h-full rounded-3xl border border-border bg-surface p-9">
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                  {t("pricingOwnerLabel")}
                </div>
                <div className="text-[56px] font-extrabold leading-none tracking-tight">
                  {t("pricingOwnerPrice")}
                </div>
                <div className="mb-7 mt-1 text-[13px] text-muted-foreground">
                  {t("pricingOwnerNote")}
                </div>
                <ul className="mb-7 space-y-3">
                  {(["1", "2", "3", "4", "5", "6"] as const).map((n) => (
                    <li key={n} className="flex items-center gap-2.5 text-sm">
                      <div
                        className="flex size-[22px] shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "hsl(var(--primary) / 0.12)",
                          color: "hsl(var(--primary))",
                        }}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </div>
                      {t(`pricingOwnerItem${n}`)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-2xl border border-border-strong bg-surface px-5 py-3.5 text-center text-[15px] font-semibold"
                >
                  {t("pricingOwnerCta")}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div
                className="relative h-full overflow-hidden rounded-3xl p-9 text-white"
                style={{
                  background:
                    "linear-gradient(160deg, #18181b 0%, #27272a 100%)",
                  border: "1px solid #3f3f46",
                  boxShadow: "0 24px 60px rgba(0,0,0,.18)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-5 -top-5 size-52 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, hsl(var(--accent) / 0.4), transparent 70%)",
                    filter: "blur(30px)",
                  }}
                />
                <div
                  className="absolute right-6 top-6 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--amber)), #fbbf24)",
                    boxShadow: "0 4px 10px rgba(245,158,11,.4)",
                  }}
                >
                  ★ {t("pricingVetBadge")}
                </div>
                <div className="relative mb-3 text-xs font-bold uppercase tracking-widest text-cyan-300">
                  {t("pricingVetLabel")}
                </div>
                <div className="relative flex items-baseline gap-1.5">
                  <span className="font-mono text-[56px] font-extrabold leading-none tracking-tight">
                    USD 10
                  </span>
                  <span className="text-base opacity-70">
                    {t("pricingVetPriceUnit")}
                  </span>
                </div>
                <div className="mb-7 mt-1 text-[13px] opacity-70">
                  {t("pricingVetNote")}
                </div>
                <ul className="relative mb-7 space-y-3">
                  {(["1", "2", "3", "4", "5", "6"] as const).map((n) => (
                    <li key={n} className="flex items-center gap-2.5 text-sm">
                      <div
                        className="flex size-[22px] shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "rgba(103,232,249,.18)",
                          color: "#67e8f9",
                        }}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </div>
                      {t(`pricingVetItem${n}`)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup/vet"
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))",
                    boxShadow: "0 12px 28px hsl(var(--accent) / 0.35)",
                  }}
                >
                  {t("pricingVetCta")}
                  <ArrowRight className="size-4" strokeWidth={2.4} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-32 text-white md:py-[140px]"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,.2), transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.15), transparent 50%)",
          }}
        />

        {/* Floating pets */}
        <FloatingPet name="X" species="cat" size={60} pos={{ top: "20%", left: "8%" }} rotate={-10} duration={6} delay={0.5} />
        <FloatingPet name="Y" species="dog" size={70} pos={{ bottom: "15%", left: "15%" }} rotate={8} duration={7} delay={1} />
        <FloatingPet name="Z" species="rabbit" size={55} pos={{ top: "25%", right: "10%" }} rotate={6} duration={6.5} delay={1.5} />
        <FloatingPet name="W" species="bird" size={50} pos={{ bottom: "20%", right: "8%" }} rotate={-12} duration={5.5} delay={2} />

        <div className="relative mx-auto max-w-[800px] px-6 text-center">
          <Reveal>
            <h2
              className="font-extrabold leading-[0.95]"
              style={{
                fontSize: "clamp(40px, 7vw, 80px)",
                letterSpacing: "-0.03em",
                textWrap: "balance",
              }}
            >
              {t("ctaTitleLine1")}
              <br />
              {t("ctaTitleLine2")}
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mx-auto mt-6 max-w-[520px] text-[19px] leading-[1.5] opacity-90">
              {t("ctaSubtitle")}
            </p>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-[18px] text-base font-bold text-foreground"
                style={{ boxShadow: "0 16px 36px rgba(0,0,0,.18)" }}
              >
                {t("ctaStart")}
                <ArrowRight className="size-[18px]" strokeWidth={2.4} />
              </Link>
              <Link
                href="/signup/vet"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-7 py-[18px] text-base font-semibold text-white backdrop-blur"
              >
                <Stethoscope className="size-[18px]" strokeWidth={2.4} />
                {t("ctaVet")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-6 text-[13px] opacity-85">
              <Check className="-mt-0.5 mr-1 inline size-3.5" />
              {t("ctaFooter")}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-border py-14 md:py-[60px]">
        <div className="container">
          <div className="mb-10 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Brand size="sm" />
              <p className="mt-4 max-w-[280px] text-sm leading-[1.5] text-muted-foreground">
                {t("footerTagline")}
              </p>
              <div className="mt-4 flex gap-2">
                {[Mail, Phone, Globe].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground"
                    style={{ background: "hsl(var(--surface-2))" }}
                  >
                    <Icon className="size-[15px]" />
                  </div>
                ))}
              </div>
            </div>
            {(["Product", "Company", "Legal"] as const).map((col) => (
              <div key={col}>
                <div className="mb-3.5 text-[11px] font-bold uppercase tracking-widest text-subtle">
                  {t(`footerCol${col}Title` as never)}
                </div>
                <div className="flex flex-col gap-2.5">
                  {(["1", "2", "3", "4"] as const).map((n) => (
                    <a
                      key={n}
                      href="#"
                      className="text-[13.5px] font-medium text-foreground hover:text-primary"
                    >
                      {t(`footerCol${col}Item${n}` as never)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-xs text-subtle">
            <div>{t("footerCopyright")}</div>
            <div>★★★★★ {t("footerRating")}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-components (server, decorative)
   ────────────────────────────────────────────────────────── */

function FloatingPet({
  name,
  species,
  size,
  pos,
  rotate,
  duration,
  delay,
}: {
  name: string;
  species: "dog" | "cat" | "rabbit" | "bird";
  size: number;
  pos: { top?: string; left?: string; right?: string; bottom?: string };
  rotate: number;
  duration: number;
  delay: number;
}) {
  // Sólo desde md+ — en mobile cramping con el contenido y empujan ancho.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[1] hidden overflow-hidden rounded-2xl md:block"
      style={{
        ...pos,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        ["--rot" as never]: `${rotate}deg`,
        animation: `lv2-float-y ${duration}s ease-in-out infinite ${delay}s`,
        boxShadow: "0 12px 32px rgba(0,0,0,.15)",
        border: "3px solid hsl(var(--background))",
      }}
    >
      <PetAvatar name={name} species={species} size={size} radius={0} />
    </div>
  );
}

function StepIllustration({ step }: { step: "1" | "2" | "3" }) {
  if (step === "1") {
    return (
      <div className="relative size-full">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ animation: "lv2-float-y 4s ease-in-out infinite" }}
        >
          <PetAvatar name="L" species="dog" size={120} radius={32} />
        </div>
      </div>
    );
  }
  if (step === "2") {
    return (
      <div className="relative flex size-full items-center justify-center">
        <div
          className="grid w-[180px] gap-1.5 rounded-2xl bg-white p-3"
          style={{ boxShadow: "0 12px 32px rgba(0,0,0,.1)" }}
        >
          {[
            { i: "💉", l: "Antirrábica", v: "12 sept" },
            { i: "💊", l: "Apoquel", v: "diaria" },
            { i: "⚖️", l: "Peso", v: "18.4 kg" },
            { i: "🦴", l: "Alergia", v: "Pollo" },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]"
              style={{ background: "hsl(var(--surface-2))" }}
            >
              <span>{r.i}</span>
              <span className="flex-1 font-medium">{r.l}</span>
              <span className="font-mono text-muted-foreground">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // step 3
  return (
    <div className="relative flex size-full items-center justify-center">
      <div
        className="relative flex size-[140px] items-center justify-center rounded-3xl bg-white"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,.12)" }}
      >
        <QrCode className="size-20 text-foreground" strokeWidth={1.6} />
        <div
          className="absolute left-3 right-3 top-3 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            boxShadow: "0 0 12px hsl(var(--primary))",
            animation: "lv2-scan-bar 2.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function LostPosterMockup({
  lostStripe,
  petName,
  meta,
  rewardLabel,
  rewardAmount,
  phone,
}: {
  lostStripe: string;
  petName: string;
  meta: string;
  rewardLabel: string;
  rewardAmount: string;
  phone: string;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl bg-white text-foreground sm:max-w-[380px]"
      style={{
        boxShadow:
          "0 32px 80px rgba(0,0,0,.4), 0 12px 32px rgba(225,29,72,.25)",
        transform: "rotate(2deg)",
        animation: "lv2-phone-float 8s ease-in-out infinite",
      }}
    >
      <div
        className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
        style={{ background: "hsl(var(--rose))" }}
      >
        <span
          className="size-2 rounded-full bg-white"
          style={{ animation: "lv2-pulse-dot 1.5s infinite" }}
        />
        {lostStripe}
        <span
          className="size-2 rounded-full bg-white"
          style={{ animation: "lv2-pulse-dot 1.5s infinite" }}
        />
      </div>
      <div className="p-6 pb-7 text-center">
        <div
          className="inline-block rounded-3xl p-1.5"
          style={{ background: "hsl(var(--rose))" }}
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{ width: 160, height: 160 }}
          >
            <PetAvatar name={petName} species="dog" size={180} radius={0} />
          </div>
        </div>
        <h3 className="mt-4 text-[36px] font-extrabold tracking-tight sm:text-[44px]">
          {petName}
        </h3>
        <div className="text-xs text-muted-foreground">{meta}</div>
        <div
          className="mt-4 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold"
          style={{
            background: "rgba(245,158,11,.15)",
            border: "1px solid rgba(245,158,11,.35)",
            color: "#b45309",
          }}
        >
          <DollarSign className="size-3.5" strokeWidth={2.4} />
          {rewardLabel} {rewardAmount}
        </div>
        <div className="mt-3.5 text-sm font-semibold">📞 {phone}</div>
      </div>
    </div>
  );
}

function VetDashboardMockup({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"landing">>>;
}) {
  return (
    <div
      className="mx-auto w-full max-w-full overflow-hidden rounded-3xl border border-border bg-surface sm:max-w-[500px]"
      style={{
        boxShadow: "0 24px 60px rgba(0,0,0,.12), 0 8px 20px rgba(0,0,0,.06)",
        transform: "perspective(1200px) rotateY(-4deg)",
      }}
    >
      {/* Chrome */}
      <div
        className="flex items-center gap-1.5 border-b border-border px-3.5 py-2.5"
        style={{ background: "hsl(var(--surface-2))" }}
      >
        <div className="size-2.5 rounded-full bg-[#ff5f57]" />
        <div className="size-2.5 rounded-full bg-[#febc2e]" />
        <div className="size-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 rounded border border-border bg-surface px-2.5 py-0.5 font-mono text-[10.5px] text-subtle">
          vet.petapp.com.ar
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-[10px] text-sm font-bold text-white"
            style={{ background: "hsl(var(--accent))" }}
          >
            CM
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-bold">{t("vetMockName")}</div>
            <div className="text-[11px] text-muted-foreground">
              {t("vetMockSub")}
            </div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white"
            style={{
              background: "linear-gradient(135deg, hsl(var(--amber)), #fbbf24)",
            }}
          >
            Premium
          </span>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {[
            { labelKey: "vetMockStatToday", val: "3", c: "hsl(var(--primary))" },
            { labelKey: "vetMockStatActive", val: "47", c: "hsl(var(--accent-600))" },
            { labelKey: "vetMockStatWeek", val: "14", c: "#047857" },
            { labelKey: "vetMockStatPending", val: "6", c: "#b45309" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-[10px] px-2.5 py-2"
              style={{ background: "hsl(var(--surface-2))" }}
            >
              <div className="text-[8.5px] font-bold uppercase tracking-widest text-subtle">
                {t(s.labelKey as never)}
              </div>
              <div
                className="mt-0.5 font-mono text-lg font-bold"
                style={{ color: s.c }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {[
            { name: "Luna", sp: "dog" as const, reasonKey: "vetMockRowReason1" },
            { name: "Pucho", sp: "cat" as const, reasonKey: "vetMockRowReason2" },
            { name: "Thor", sp: "dog" as const, reasonKey: "vetMockRowReason3" },
          ].map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-[10px] p-2"
              style={{ background: "hsl(var(--surface-2))" }}
            >
              <PetAvatar
                name={p.name}
                species={p.sp}
                size={32}
                radius={9}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t(p.reasonKey as never)}
                </div>
              </div>
              <ChevronRight className="size-3 text-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
