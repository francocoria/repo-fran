import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  Gift,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Share2,
  Microchip,
  PawPrint,
} from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@pet-app/db";
import { Button, Badge } from "@pet-app/ui";
import { getAge, formatDateLong } from "@pet-app/lib/utils/format";
import { ShareButtonsClient } from "./share-buttons";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-12 w-12" />,
  cat: <Cat className="h-12 w-12" />,
  bird: <Bird className="h-12 w-12" />,
  rabbit: <Rabbit className="h-12 w-12" />,
};

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  rodent: "Roedor",
  reptile: "Reptil",
  fish: "Pez",
  exotic: "Exótico",
  other: "Otro",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const alert = await prisma.lostPetAlert.findUnique({
    where: { public_slug: slug },
    include: {
      animal: { select: { name: true, photo_url: true, species: true } },
    },
  });

  if (!alert || alert.status !== "active") {
    return { title: "Alerta no disponible" };
  }

  return {
    title: `🚨 Se perdió ${alert.animal.name} — Ayudanos a encontrarla`,
    description: `${speciesLabels[alert.animal.species] ?? "Mascota"} perdida${
      alert.last_seen_location ? ` en ${alert.last_seen_location}` : ""
    }. Si la viste, contactanos.`,
    openGraph: {
      title: `🚨 ${alert.animal.name} está perdid${alert.animal.species === "dog" ? "o" : "a"}`,
      description: alert.last_seen_location
        ? `Última vez vista en ${alert.last_seen_location}`
        : "Ayudanos a encontrarla",
      images: alert.animal.photo_url
        ? [{ url: alert.animal.photo_url }]
        : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `🚨 ${alert.animal.name} está perdid${alert.animal.species === "dog" ? "o" : "a"}`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function LostPetPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const alert = await prisma.lostPetAlert.findUnique({
    where: { public_slug: slug },
    include: {
      animal: {
        select: {
          name: true,
          species: true,
          breed: true,
          sex: true,
          birth_date: true,
          color: true,
          distinctive_marks: true,
          microchip: true,
          photo_url: true,
          neutered: true,
          allergies: {
            where: { severity: "severe" },
            select: { allergen: true },
          },
        },
      },
    },
  });

  if (!alert || alert.status !== "active") {
    notFound();
  }

  const animal = alert.animal;
  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;

  // WhatsApp link con mensaje pre-armado
  const whatsappContact = alert.contact_phone
    ? `https://wa.me/${alert.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola! Vi tu publicación sobre ${animal.name}. Tengo info que te puede servir.`,
      )}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background dark:from-rose-950/30">
      {/* Banner de urgencia */}
      <div className="bg-rose-600 text-white">
        <div className="container py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          MASCOTA PERDIDA — Ayudanos a encontrarla
        </div>
      </div>

      <main className="container max-w-2xl py-8 md:py-12">
        {/* Foto */}
        <div className="mx-auto mb-6 w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-secondary border-4 border-rose-200 dark:border-rose-900/50 shadow-2xl shadow-rose-500/20">
          {animal.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={animal.photo_url}
              alt={animal.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {speciesIcons[animal.species] ?? <PawPrint className="h-16 w-16" />}
            </div>
          )}
        </div>

        {/* Nombre */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {animal.name}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {speciesLabels[animal.species] ?? animal.species}
            {animal.breed && ` · ${animal.breed}`}
            {animal.sex !== "unknown" && (
              <> · {animal.sex === "male" ? "♂ Macho" : "♀ Hembra"}</>
            )}
            {ageText && ` · ${ageText}`}
          </p>
        </div>

        {/* CTA contacto principal */}
        <div className="mb-6 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-card p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-1">
            Si la viste, escribinos
          </p>
          <p className="text-lg font-semibold">{alert.contact_name}</p>
          <p className="mt-1 font-mono text-base text-foreground">
            {alert.contact_phone}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {whatsappContact && (
              <Button asChild size="lg" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-12">
                <a
                  href={whatsappContact}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="w-full gap-2 h-12">
              <a href={`tel:${alert.contact_phone}`}>
                <Phone className="h-4 w-4" />
                Llamar
              </a>
            </Button>
          </div>

          {alert.contact_email && (
            <a
              href={`mailto:${alert.contact_email}?subject=Información sobre ${animal.name}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {alert.contact_email}
            </a>
          )}
        </div>

        {/* Recompensa */}
        {alert.reward_description && (
          <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex items-start gap-2">
              <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Recompensa
                </p>
                <p className="mt-1 text-sm">{alert.reward_description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Última vez vista */}
        {(alert.last_seen_location || alert.last_seen_at) && (
          <div className="mb-6 rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Última vez vista
            </p>
            <div className="space-y-2 text-sm">
              {alert.last_seen_location && (
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{alert.last_seen_location}</span>
                </p>
              )}
              {alert.last_seen_at && (
                <p className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{formatDateLong(alert.last_seen_at)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Características */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {animal.color && (
            <DataCard label="Color" value={animal.color} />
          )}
          {animal.distinctive_marks && (
            <DataCard
              label="Marcas distintivas"
              value={animal.distinctive_marks}
              full
            />
          )}
          {animal.microchip && (
            <DataCard
              label="Chip"
              value={animal.microchip}
              icon={<Microchip className="h-3.5 w-3.5" />}
              mono
            />
          )}
          {animal.neutered && (
            <DataCard label="Estado" value="Castrado/a" />
          )}
        </div>

        {/* Alertas médicas */}
        {animal.allergies.length > 0 && (
          <div className="mb-6 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400 mb-2">
              ⚠️ Tiene alergias graves
            </p>
            <p className="text-sm">
              No darle:{" "}
              <strong>
                {animal.allergies.map((a) => a.allergen).join(", ")}
              </strong>
            </p>
          </div>
        )}

        {/* Info adicional */}
        {alert.additional_info && (
          <div className="mb-6 rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Info adicional
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {alert.additional_info}
            </p>
          </div>
        )}

        {/* Compartir */}
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
          <Share2 className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Compartí esta página para ayudar a que vuelva a casa.
          </p>
          <ShareButtonsClient
            animalName={animal.name}
            slug={alert.public_slug}
          />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Alerta creada el {formatDateLong(alert.activated_at)} ·{" "}
          <Link href="/" className="underline-offset-2 hover:underline">
            PetApp
          </Link>
        </p>
      </main>
    </div>
  );
}

function DataCard({
  label,
  value,
  full,
  mono,
  icon,
}: {
  label: string;
  value: string;
  full?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 ${full ? "sm:col-span-2" : ""}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
