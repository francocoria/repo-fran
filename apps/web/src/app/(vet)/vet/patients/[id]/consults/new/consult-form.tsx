"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Textarea,
} from "@pet-app/ui";
import {
  AlertCircle,
  Loader2,
  Save,
  Stethoscope,
  Lock,
  Sparkles,
  Plus,
} from "lucide-react";
import { createConsult } from "../../consult-actions";
import { COMMON_DIAGNOSES } from "@pet-app/lib/constants";

interface Template {
  id: string;
  name: string;
  content: Record<string, string>;
  is_system: boolean;
}

interface ConsultFormProps {
  animalId: string;
  templates: Template[];
}

const TEMPLATE_FIELDS = [
  "examination",
  "diagnosis",
  "treatment",
  "next_steps",
] as const;

export function ConsultForm({ animalId, templates }: ConsultFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Pre-fill desde plantilla
  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (!template || !formRef.current) return;

    const fieldMap: Record<string, string> = {
      examination: "examination",
      diagnosis: "diagnosis",
      treatment: "treatment",
      next_steps: "nextSteps",
    };

    for (const key of TEMPLATE_FIELDS) {
      const fieldName = fieldMap[key];
      if (!fieldName) continue;
      const el = formRef.current.elements.namedItem(fieldName) as
        | HTMLTextAreaElement
        | null;
      const value = template.content[key];
      if (el && value !== undefined) {
        el.value = value;
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Convertir visitDate (datetime-local) a ISO
    const visitDateLocal = formData.get("visitDate") as string;
    if (visitDateLocal) {
      formData.set("visitDate", new Date(visitDateLocal).toISOString());
    }

    startTransition(() => { void (async () => {
      const result = await createConsult(animalId, formData);
      if (result.success) {
        router.push(`/vet/patients/${animalId}`);
        router.refresh();
      } else {
        setError(result.error ?? "Error al crear la consulta.");
      }
    })(); });
  }

  // Default datetime: ahora
  const now = new Date();
  const defaultDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de plantilla */}
      {templates.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Plantilla rápida
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTemplateId === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t.name}
                {t.is_system && (
                  <span className="ml-1.5 text-[10px] opacity-60">·</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Datos básicos */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="visitDate">
            Fecha de la consulta <span className="text-destructive">*</span>
          </Label>
          <Input
            id="visitDate"
            name="visitDate"
            type="datetime-local"
            defaultValue={defaultDateTime}
            required
          />
        </div>
        <div>
          <Label htmlFor="reason">
            Motivo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="reason"
            name="reason"
            type="text"
            placeholder="Ej: Control anual, herida en pata..."
            maxLength={200}
            required
          />
        </div>
      </section>

      {/* Examen físico */}
      <div>
        <Label htmlFor="examination">Examen físico</Label>
        <Textarea
          id="examination"
          name="examination"
          rows={4}
          placeholder="Hallazgos del examen clínico..."
          maxLength={2000}
        />
      </div>

      {/* Diagnóstico */}
      <div>
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          rows={3}
          placeholder="Diagnóstico presuntivo o definitivo..."
          maxLength={2000}
        />
        <DiagnosisChips />
      </div>

      {/* Tratamiento */}
      <div>
        <Label htmlFor="treatment">Tratamiento</Label>
        <Textarea
          id="treatment"
          name="treatment"
          rows={4}
          placeholder="Medicaciones, indicaciones, dosis..."
          maxLength={2000}
        />
      </div>

      {/* Próximos pasos */}
      <div>
        <Label htmlFor="nextSteps">Próximos pasos</Label>
        <Textarea
          id="nextSteps"
          name="nextSteps"
          rows={2}
          placeholder="Re-control, estudios pendientes, derivaciones..."
          maxLength={1000}
        />
      </div>

      {/* Notas para el dueño */}
      <div>
        <Label htmlFor="publicNotes" className="flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Notas visibles para el dueño
        </Label>
        <Textarea
          id="publicNotes"
          name="publicNotes"
          rows={2}
          placeholder="Recomendaciones, cuidados en casa, etc."
          maxLength={2000}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Esta información la verá el dueño en su app.
        </p>
      </div>

      {/* Notas privadas */}
      <div>
        <Label htmlFor="privateNotes" className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          Notas privadas (solo vos)
        </Label>
        <Textarea
          id="privateNotes"
          name="privateNotes"
          rows={3}
          placeholder="Anotaciones internas, hipótesis, recordatorios..."
          maxLength={2000}
          className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10"
        />
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          El dueño y otros vets NO ven estas notas.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar consulta
        </Button>
      </div>
    </form>
  );
}

/* ─── DiagnosisChips ──────────────────────────────────────────
 * Lista de diagnósticos comunes — al click append al textarea.
 * El vet puede seguir tipeando libremente después.
 */
function DiagnosisChips() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? COMMON_DIAGNOSES : COMMON_DIAGNOSES.slice(0, 8);

  function append(diagnosis: string) {
    const ta = document.getElementById("diagnosis") as HTMLTextAreaElement | null;
    if (!ta) return;
    const current = ta.value.trim();
    // Si ya existe, no duplicar
    if (current.toLowerCase().includes(diagnosis.toLowerCase())) return;
    ta.value = current ? `${current}\n· ${diagnosis}` : `· ${diagnosis}`;
    // Trigger React change event para que se actualice si hay listener
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
    // Auto-scroll al final
    ta.scrollTop = ta.scrollHeight;
  }

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
        Diagnósticos comunes (click para agregar):
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((dx) => (
          <button
            key={dx}
            type="button"
            onClick={() => append(dx)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="size-3" />
            {dx}
          </button>
        ))}
        {!showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center rounded-full border border-dashed border-border-strong px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
          >
            +{COMMON_DIAGNOSES.length - 8} más
          </button>
        )}
        {showAll && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="inline-flex items-center rounded-full border border-dashed border-border-strong px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Mostrar menos
          </button>
        )}
      </div>
    </div>
  );
}
