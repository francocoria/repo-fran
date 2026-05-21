"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Input, Button, Badge } from "@pet-app/ui";
import {
  Search,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  User,
  Phone,
  Loader2,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelative } from "@pet-app/lib/utils/format";
import { archivePatient, unarchivePatient } from "../access-actions";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-5 w-5" />,
  cat: <Cat className="h-5 w-5" />,
  bird: <Bird className="h-5 w-5" />,
  rabbit: <Rabbit className="h-5 w-5" />,
};

const SPECIES_KEY: Record<string, string> = {
  dog: "speciesDog",
  cat: "speciesCat",
  bird: "speciesBird",
  rabbit: "speciesRabbit",
  rodent: "speciesRodent",
  reptile: "speciesReptile",
  fish: "speciesFish",
  exotic: "speciesExotic",
  other: "speciesOther",
};

interface PatientRow {
  id: string;
  archived: boolean;
  lastVisit: string | null;
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
    severeAllergiesCount: number;
    owner_full_name: string;
    owner_phone: string | null;
  };
}

export function PatientsSearch({ accesses }: { accesses: PatientRow[] }) {
  const t = useTranslations("vetPatientsSearch");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accesses.filter((row) => {
      if (!showArchived && row.archived) return false;
      if (showArchived && !row.archived) return false;
      if (!q) return true;
      return (
        row.animal.name.toLowerCase().includes(q) ||
        row.animal.owner_full_name.toLowerCase().includes(q) ||
        row.animal.breed?.toLowerCase().includes(q)
      );
    });
  }, [accesses, query, showArchived]);

  const activeCount = accesses.filter((a) => !a.archived).length;
  const archivedCount = accesses.filter((a) => a.archived).length;

  if (accesses.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* ─── V2 SEARCH HEADER ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-11 h-12 rounded-full border-border/60 bg-card shadow-sm text-[15px]"
          />
        </div>
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Button
            variant={!showArchived ? "default" : "outline"}
            size="default"
            onClick={() => setShowArchived(false)}
            className="h-12 rounded-full px-6 font-semibold"
          >
            Activos ({activeCount})
          </Button>
          {archivedCount > 0 && (
            <Button
              variant={showArchived ? "default" : "outline"}
              size="default"
              onClick={() => setShowArchived(true)}
              className="h-12 rounded-full px-6 font-semibold"
            >
              Archivados ({archivedCount})
            </Button>
          )}
        </div>
      </div>

      {/* ─── RESULT GRID ─── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-surface-2/40 py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-[15px] font-medium text-muted-foreground">
            {query
              ? t("noMatch")
              : showArchived
                ? t("noArchived")
                : t("noActive")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <PatientCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ row }: { row: PatientRow }) {
  const t = useTranslations("vetPatientsSearch");
  const [isPending, startTransition] = useTransition();
  const Icon = speciesIcons[row.animal.species] ?? <Dog className="h-5 w-5" />;

  function handleArchive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      void (async () => {
        const result = row.archived
          ? await unarchivePatient(row.id)
          : await archivePatient(row.id);
        if (result.success) {
          toast.success(
            row.archived ? t("toastReactivated") : t("toastArchived"),
          );
        } else {
          toast.error(result.error ?? t("toastError"));
        }
      })();
    });
  }

  return (
    <Link
      href={`/vet/patients/${row.animal.id}`}
      className="group block focus-ring rounded-3xl"
    >
      <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div className="flex gap-4">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full bg-secondary shadow-sm">
            {row.animal.photo_url ? (
              <Image
                src={row.animal.photo_url}
                alt={row.animal.name}
                fill
                sizes="68px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {Icon}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-[17px] truncate tracking-tight">{row.animal.name}</h3>
              {row.animal.severeAllergiesCount > 0 && (
                <div
                  className="flex h-5 items-center gap-1 rounded-full bg-rose-500/10 px-2 text-[10px] font-bold uppercase tracking-wider text-rose-600"
                  title={t("severeAllergies")}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Alerta
                </div>
              )}
              {row.archived && !row.animal.severeAllergiesCount && (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                  {t("badgeArchived")}
                </Badge>
              )}
            </div>
            
            <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
              {t(SPECIES_KEY[row.animal.species] ?? "speciesOther")}
              {row.animal.breed && ` · ${row.animal.breed}`}
            </p>
            
            <div className="mt-2.5 flex items-center gap-2 text-[13px] text-muted-foreground">
              <User className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate">{row.animal.owner_full_name}</span>
            </div>
            {row.animal.owner_phone && (
              <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
                <Phone className="h-3.5 w-3.5 opacity-70" />
                <span className="font-mono">{row.animal.owner_phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-secondary/50 p-3">
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground/80">
            <Stethoscope className="h-4 w-4 text-primary" />
            {row.lastVisit ? (
              t("lastVisit", { when: formatRelative(row.lastVisit) })
            ) : (
              <span className="italic">{t("noConsults")}</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleArchive}
            disabled={isPending}
            className="inline-flex shrink-0 items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : row.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>
        </div>
      </article>
    </Link>
  );
}
