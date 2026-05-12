"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button, Card, CardContent } from "@pet-app/ui";
import { deleteConsultTemplate } from "./actions";

interface TemplateItem {
  id: string;
  name: string;
  content: Record<string, string>;
}

interface Props {
  templates: TemplateItem[];
  editable: boolean;
}

export function TemplatesList({ templates, editable }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Borrar la plantilla "${name}"? No se puede deshacer.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteConsultTemplate(id);
      setDeletingId(null);
      if (result.success) {
        toast.success("Plantilla eliminada");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al borrar");
      }
    });
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="px-5 py-8 text-center">
          <FileText className="mx-auto size-7 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            {editable
              ? "Empezá creando tu primera plantilla."
              : "Pasate a Premium para crear plantillas propias."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2.5">
      {templates.map((t) => {
        const isOpen = expanded === t.id;
        const fields = [
          { key: "examination", label: "Examen físico" },
          { key: "diagnosis", label: "Diagnóstico" },
          { key: "treatment", label: "Tratamiento" },
          { key: "next_steps", label: "Próximos pasos" },
        ];
        const filledCount = fields.filter(
          (f) => t.content[f.key] && t.content[f.key]!.trim() !== "",
        ).length;

        return (
          <Card key={t.id}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-secondary/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {filledCount} campo{filledCount !== 1 ? "s" : ""} pre-armado
                    {filledCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-border bg-surface-2/40 p-4">
                  <div className="space-y-3 text-sm">
                    {fields.map((f) => {
                      const value = t.content[f.key];
                      if (!value || value.trim() === "") return null;
                      return (
                        <div key={f.key}>
                          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
                            {f.label}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] text-foreground/85">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {editable && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/vet/templates/${t.id}/edit`}>
                          <Pencil className="size-3.5" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={isPending && deletingId === t.id}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {isPending && deletingId === t.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Borrar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
