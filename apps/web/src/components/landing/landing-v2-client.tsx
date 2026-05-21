"use client";

/**
 * Landing v2 — client-side pieces (animations + IntersectionObserver).
 * Server bits live in app/page.tsx.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Scale,
  Syringe,
} from "lucide-react";
import { PetAvatar } from "@pet-app/ui";

/* ──────────────────────────────────────────────────────────
   Reveal-on-scroll
   ────────────────────────────────────────────────────────── */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add("lv2-in");
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const delayMs = delay * 100;
  return (
    <div
      ref={ref}
      className={`lv2-reveal ${className}`}
      style={delay ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   CountUp — animated number when visible
   ────────────────────────────────────────────────────────── */
export function CountUp({
  to,
  suffix = "",
  duration = 1600,
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          io.unobserve(el);
          const start = Date.now();
          const tick = () => {
            const t = Math.min(1, (Date.now() - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(to * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Hero phone — 3 screen carousel auto-rotating
   "Juli" is hard-coded as the greeting on screen 1.
   ────────────────────────────────────────────────────────── */
export function HeroPhone({
  scanLabel,
  greeting,
  petName,
  petBreed,
  yourQrLabel,
  qrUrl,
  lostBadge,
  lostName,
  lostLocation,
  okBadge,
  weight,
  vaccines,
  age,
}: {
  scanLabel: string;
  greeting: string;
  petName: string;
  petBreed: string;
  yourQrLabel: string;
  qrUrl: string;
  lostBadge: string;
  lostName: string;
  lostLocation: string;
  okBadge: string;
  weight: string;
  vaccines: string;
  age: string;
}) {
  const [screen, setScreen] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setScreen((s) => (s + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex h-[600px] items-center justify-center">
      {/* Glow halo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3), transparent 60%)",
          filter: "blur(40px)",
          animation: "lv2-blob 10s ease-in-out infinite",
        }}
      />

      {/* Phone */}
      <div
        className="relative z-10"
        style={{
          width: 320,
          height: 560,
          background: "#000",
          borderRadius: 48,
          padding: 10,
          boxShadow:
            "0 40px 80px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.15), inset 0 0 0 2px rgba(255,255,255,.05)",
          animation: "lv2-phone-float 6s ease-in-out infinite",
          transform: "rotate(-2deg)",
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ borderRadius: 38, background: "hsl(var(--background))" }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 top-2 z-50 h-7 -translate-x-1/2"
            style={{ width: 96, borderRadius: 18, background: "#000" }}
          />

          {/* Screens */}
          {screen === 0 && (
            <Screen1
              greeting={greeting}
              petName={petName}
              okBadge={okBadge}
              weight={weight}
              vaccines={vaccines}
              age={age}
            />
          )}
          {screen === 1 && (
            <Screen2
              yourQrLabel={yourQrLabel}
              petName={petName}
              qrUrl={qrUrl}
              scanLabel={scanLabel}
            />
          )}
          {screen === 2 && (
            <Screen3
              lostBadge={lostBadge}
              lostName={lostName}
              lostLocation={lostLocation}
            />
          )}

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 z-[60] flex -translate-x-1/2 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-400"
                style={{
                  width: i === screen ? 18 : 6,
                  background:
                    i === screen
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <FloatingChip
        position={{ top: 50, right: 20 }}
        icon={<Syringe className="size-3.5" strokeWidth={2.4} />}
        tone="primary"
        label={petBreed}
        delay={0.5}
      />
      <FloatingChip
        position={{ top: 160, left: -10 }}
        icon={<AlertTriangle className="size-3.5" strokeWidth={2.4} />}
        tone="rose"
        label={`Alergia · Pollo`}
        delay={1}
      />
      <FloatingChip
        position={{ bottom: 120, right: -20 }}
        icon={<Scale className="size-3.5" strokeWidth={2.4} />}
        tone="accent"
        label={weight}
        delay={1.5}
      />
      <FloatingChip
        position={{ bottom: 40, left: 20 }}
        icon={<CheckCircle2 className="size-3.5" strokeWidth={2.4} />}
        tone="emerald"
        label={okBadge}
        delay={2}
      />
    </div>
  );
}

function FloatingChip({
  position,
  icon,
  tone,
  label,
  delay = 0,
}: {
  position: { top?: number; left?: number; right?: number; bottom?: number };
  icon: ReactNode;
  tone: "primary" | "accent" | "rose" | "emerald";
  label: string;
  delay?: number;
}) {
  const tones = {
    primary: {
      bg: "hsl(var(--primary) / 0.15)",
      fg: "hsl(var(--primary))",
      bd: "hsl(var(--primary) / 0.4)",
    },
    accent: {
      bg: "hsl(var(--accent) / 0.15)",
      fg: "hsl(var(--accent-600))",
      bd: "hsl(var(--accent) / 0.4)",
    },
    rose: {
      bg: "rgba(255,228,230,.95)",
      fg: "hsl(var(--rose))",
      bd: "rgba(225,29,72,.4)",
    },
    emerald: {
      bg: "rgba(209,250,229,.95)",
      fg: "#047857",
      bd: "rgba(16,185,129,.4)",
    },
  } as const;
  const t = tones[tone];
  return (
    <div
      className="absolute z-20 inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold backdrop-blur"
      style={{
        ...position,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: 999,
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        animation: `lv2-pop-in .6s ${delay + 1}s backwards, lv2-float-y 5s ease-in-out infinite ${delay + 1.5}s`,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function Screen1({
  greeting,
  petName,
  okBadge,
  weight,
  vaccines,
  age,
}: {
  greeting: string;
  petName: string;
  okBadge: string;
  weight: string;
  vaccines: string;
  age: string;
}) {
  return (
    <div
      className="absolute inset-0 pt-12"
      style={{
        background: "hsl(var(--background))",
        animation: "lv2-pop-in .4s",
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <div>
          <div className="text-[11px] text-muted-foreground">Hola,</div>
          <div className="text-[18px] font-extrabold tracking-tight">
            {greeting} 👋
          </div>
        </div>
        <div className="flex size-8 items-center justify-center rounded-[10px] border border-border bg-surface">
          <Bell className="size-3.5" />
        </div>
      </div>
      <div className="px-4">
        <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
          <div className="relative h-[130px]">
            <PetAvatar name={petName} species="dog" size={9999} radius={0} />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.55))",
              }}
            />
            <div className="absolute bottom-2 left-3 text-[18px] font-extrabold tracking-tight text-white">
              {petName}
            </div>
            <div
              className="absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white"
              style={{ background: "hsl(var(--emerald))" }}
            >
              {okBadge}
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border">
            {[
              { label: "PESO", val: weight },
              { label: "VACUNAS", val: vaccines },
              { label: "EDAD", val: age },
            ].map((s, i) => (
              <div
                key={i}
                className="px-1 py-2 text-center"
                style={{
                  borderLeft: i > 0 ? "1px solid hsl(var(--border))" : "none",
                }}
              >
                <div className="text-[8px] font-bold tracking-widest text-subtle">
                  {s.label}
                </div>
                <div className="mt-0.5 font-mono text-[13px] font-bold">
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen2({
  yourQrLabel,
  petName,
  qrUrl,
  scanLabel: _scanLabel,
}: {
  yourQrLabel: string;
  petName: string;
  qrUrl: string;
  scanLabel: string;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-7 pt-12"
      style={{
        background: "hsl(var(--background))",
        animation: "lv2-pop-in .4s",
      }}
    >
      <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
        {yourQrLabel}
      </div>
      <div
        className="relative rounded-2xl bg-white p-4"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,.12)" }}
      >
        <FakeQR size={160} />
        <div
          className="absolute left-4 right-4 top-4 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)",
            boxShadow: "0 0 12px hsl(var(--accent))",
            animation: "lv2-scan-bar 2.5s ease-in-out infinite",
          }}
        />
      </div>
      <div className="text-center">
        <div className="text-base font-bold tracking-tight">{petName}</div>
        <div className="text-[11px] text-muted-foreground">{qrUrl}</div>
      </div>
    </div>
  );
}

function Screen3({
  lostBadge,
  lostName,
  lostLocation,
}: {
  lostBadge: string;
  lostName: string;
  lostLocation: string;
}) {
  return (
    <div
      className="absolute inset-0 pt-12 text-white"
      style={{
        background: "linear-gradient(180deg, hsl(var(--rose)), #be123c)",
        animation: "lv2-pop-in .4s",
      }}
    >
      <div className="px-4 pt-3.5 text-center">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest"
          style={{
            background: "rgba(255,255,255,.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="size-1.5 rounded-full bg-white"
            style={{ animation: "lv2-pulse-dot 1.2s infinite" }}
          />
          {lostBadge}
        </div>
        <div className="mt-4 flex justify-center">
          <div
            className="overflow-hidden rounded-2xl border-2 border-white/30"
            style={{ width: 130, height: 130 }}
          >
            <PetAvatar name={lostName} species="dog" size={130} radius={0} />
          </div>
        </div>
        <div className="mt-3 text-[26px] font-extrabold tracking-tight">
          {lostName}
        </div>
        <div className="text-[11px] opacity-90">{lostLocation}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur">
          📞 +54 11 6712-4408
        </div>
      </div>
    </div>
  );
}

function FakeQR({ size = 160 }: { size?: number }) {
  // Pseudo-QR grid (decorative — not a real QR)
  const cells = 21;
  const cell = size / cells;
  // Deterministic random pattern
  const seed = 7;
  const pattern: boolean[][] = [];
  for (let r = 0; r < cells; r++) {
    pattern[r] = [];
    for (let c = 0; c < cells; c++) {
      pattern[r]![c] = (r * 31 + c * 17 + seed) % 3 !== 0;
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#0c0a09"
            />
          ) : null,
        ),
      )}
      {/* Finder patterns (corners) */}
      {[
        [0, 0],
        [cells - 7, 0],
        [0, cells - 7],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect
            x={(x ?? 0) * cell}
            y={(y ?? 0) * cell}
            width={cell * 7}
            height={cell * 7}
            fill="white"
          />
          <rect
            x={(x ?? 0) * cell}
            y={(y ?? 0) * cell}
            width={cell * 7}
            height={cell * 7}
            fill="none"
            stroke="#0c0a09"
            strokeWidth={cell}
          />
          <rect
            x={((x ?? 0) + 2) * cell}
            y={((y ?? 0) + 2) * cell}
            width={cell * 3}
            height={cell * 3}
            fill="#0c0a09"
          />
        </g>
      ))}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
   Marquee — two rows of pet names scrolling in opposite dirs
   ────────────────────────────────────────────────────────── */
export function Marquee({
  pets,
}: {
  pets: { n: string; sp: "dog" | "cat" | "rabbit" | "bird" }[];
}) {
  const items = [...pets, ...pets];
  return (
    <div className="relative">
      <div
        className="flex w-fit gap-6"
        style={{ animation: "lv2-marquee 30s linear infinite" }}
      >
        {items.map((p, i) => (
          <div
            key={i}
            className="flex flex-shrink-0 items-center gap-3 rounded-full border border-border bg-background py-3 pl-3 pr-5"
          >
            <PetAvatar name={p.n} species={p.sp} size={44} radius={22} />
            <span className="text-[17px] font-bold tracking-tight">{p.n}</span>
          </div>
        ))}
      </div>
      <div
        className="mt-4 flex w-fit gap-6"
        style={{ animation: "lv2-marquee-reverse 36s linear infinite" }}
      >
        {[...items].reverse().map((p, i) => (
          <div
            key={i}
            className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5"
          >
            <span className="text-[13px] text-muted-foreground">
              {p.sp === "dog" ? "🐕" : p.sp === "cat" ? "🐈" : p.sp === "rabbit" ? "🐇" : "🐦"}
            </span>
            <span className="text-sm font-semibold">{p.n}</span>
          </div>
        ))}
      </div>
      {/* Fade edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-24"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--surface)), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-24"
        style={{
          background:
            "linear-gradient(-90deg, hsl(var(--surface)), transparent)",
        }}
      />
    </div>
  );
}
