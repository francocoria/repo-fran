"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { toast } from "sonner";
import { archivePatient, unarchivePatient } from "../access-actions";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-5 w-5" />,
  cat: <Cat className="h-5 w-5" />,
  bird: <Bird className="h-5 w-5" />,
  rabbit: <Rabbit className="h-5 w-5" />,
};

const speciesLabels: Record<string, string> = {
  dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo",
  rodent: "Roedor", reptile: "Reptil", fish: "Pez", exotic: "Exótico", other: "Otro",
};

interface PatientRow {
  id: string;
  archived: boolean;
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, dueño o raza..."
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="default"
          onClick={() => setShowArchived(false)}
          className="shrink-0"
        >
          Activos ({activeCount})
        </Button>
        {archivedCount > 0 && (
          <Button
            variant={showArchived ? "default" : "outline"}
            size="default"
            onClick={() => setShowArchived(true)}
            className="shrink-0"
          >
            Archivados ({archivedCount})
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
          {query
            ? "Ningún paciente coincide con la búsqueda."
            : showArchived
              ? "Sin pacientes archivados."
              : "Sin pacientes activos."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <PatientCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ row }: { row: PatientRow }) {
  const [isPending, startTransition] = useTransition();
  const Icon = speciesIcons[row.animal.species] ?? <Dog className="h-5 w-5" />;

  function handleArchive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = row.archived
        ? await unarchivePatient(row.id)
        : await archivePatient(row.id);
      if (result.success) {
        toast.success(row.archived ? "Paciente reactivado." : "Paciente archivado.");
      } else {
        toast.error(result.error ?? "No se pudo procesar.");
      }
    });
  }

  return (
    <Link
      href={`/vet/patients/${row.animal.id}`}
      className="group block focus-ring rounded-2xl"
    >
      <article className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
            {row.animal.photo_url ? (
              <Image
                src={row.animal.photo_url}
                alt={row.animal.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {Icon}
              </div>
            )}
            {row.animal.severeAllergiesCount > 0 && (
              <div
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                title="Alergias severas"
              >
                <AlertTriangle className="h-3 w-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate">{row.animal.name}</h3>
              {row.archived && (
                <Badge variant="secondary" className="text-[10px]">
                  Archivado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {speciesLabels[row.animal.species] ?? row.animal.species}
              {row.animal.breed && ` · ${row.animal.breed}`}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{row.animal.owner_full_name}</span>
            </div>
            {row.animal.owner_phone && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="font-mono">{row.animal.owner_phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleArchive}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : row.archived ? (
              <>
                <ArchiveRestore className="h-3 w-3" />
                Reactivar
              </>
            ) : (
              <>
                <Archive className="h-3 w-3" />
                Archivar
              </>
            )}
          </button>
        </div>
      </article>
    </Link>
  );
}
