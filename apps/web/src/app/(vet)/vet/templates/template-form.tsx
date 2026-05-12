"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { Button, Input, Label, Textarea } from "@pet-app/ui";
import { createConsultTemplate, updateConsultTemplate } from "./actions";

interface FormData {
  name: string;
  examination: string;
  diagnosis: string;
  treatment: string;
  nextSteps: string;
}

interface Props {
  mode: "create" | "edit";
  templateId?: string;
  initialData?: FormData;
}

const EMPTY: FormData = {
  name: "",
  examination: "",
  diagnosis: "",
  treatment: "",
  nextSteps: "",
};

export function TemplateForm({ mode, templateId, initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<FormData>(initialData ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result =
        mode === "edit" && templateId
          ? await updateConsultTemplate(templateId, formData)
          : await createConsultTemplate(formData);

      if (result.success) {
        router.push("/vet/templates");
        router.refresh();
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre de la plantilla <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="Ej: Control sano, Vacunación de cachorros..."
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="examination">Examen físico</Label>
        <Textarea
          id="examination"
          name="examination"
          rows={3}
          maxLength={2000}
          placeholder="Texto base para reutilizar..."
          value={data.examination}
          onChange={(e) => update("examination", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          rows={3}
          maxLength={2000}
          placeholder="Texto base de diagnóstico..."
          value={data.diagnosis}
          onChange={(e) => update("diagnosis", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Tratamiento</Label>
        <Textarea
          id="treatment"
          name="treatment"
          rows={3}
          maxLength={2000}
          placeholder="Plan de tratamiento por defecto..."
          value={data.treatment}
          onChange={(e) => update("treatment", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextSteps">Próximos pasos</Label>
        <Textarea
          id="nextSteps"
          name="nextSteps"
          rows={2}
          maxLength={1000}
          placeholder="Recomendaciones, re-control, etc."
          value={data.nextSteps}
          onChange={(e) => update("nextSteps", e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: podés usar marcadores como{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
          {"{{paciente}}"}
        </code>
        ,{" "}
        <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
          {"{{dosis}}"}
        </code>{" "}
        — los completás en cada consulta.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
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
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? "Crear plantilla" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
