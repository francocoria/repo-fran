"use client";

import { useState, useTransition } from "react";
import { addAllergy, deleteAllergy } from "@/app/(owner)/app/animals/[id]/health-actions";
import { Button, Input, Label, Card, CardContent, Badge } from "@pet-app/ui";
import { ShieldAlert, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";

interface Allergy {
  id: string;
  type: string;
  allergen: string;
  severity: string;
  notes: string | null;
}

interface AllergyListProps {
  animalId: string;
  allergies: Allergy[];
  isOwner: boolean;
}

const typeLabels: Record<string, string> = {
  food: "Alimentaria", medication: "Medicamento", environmental: "Ambiental", other: "Otra",
};

const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  mild: { label: "Leve", variant: "secondary" },
  moderate: { label: "Moderada", variant: "default" },
  severe: { label: "Severa", variant: "destructive" },
};

export function AllergyList({ animalId, allergies, isOwner }: AllergyListProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const result = await addAllergy(animalId, formData);
      if (result.success) setShowForm(false);
      else setError(result.error ?? "Error");
    })(); });
  }

  function handleDelete(id: string) {
    startTransition(() => { void (async () => { await deleteAllergy(animalId, id); })(); });
  }

  const severeCount = allergies.filter(a => a.severity === "severe").length;

  return (
    <Card className={severeCount > 0 ? "border-rose-300 dark:border-rose-800" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${severeCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`} />
            <h3 className="font-semibold text-lg">Alergias</h3>
            {severeCount > 0 && (
              <Badge variant="destructive" className="text-xs">{severeCount} severa{severeCount > 1 ? "s" : ""}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Agregar
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo *</Label>
                <select name="type" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="food">Alimentaria</option>
                  <option value="medication">Medicamento</option>
                  <option value="environmental">Ambiental</option>
                  <option value="other">Otra</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Severidad *</Label>
                <select name="severity" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="mild">Leve</option>
                  <option value="moderate">Moderada</option>
                  <option value="severe">Severa</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Alérgeno *</Label>
                <Input name="allergen" required placeholder="Ej: Pollo, Amoxicilina, Polen..." className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Input name="notes" placeholder="Reacción observada, tratamiento..." className="h-9 text-sm" />
            </div>
            {error && <div className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{error}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}Guardar
              </Button>
            </div>
          </form>
        )}

        {allergies.length > 0 ? (
          <div className="space-y-2">
            {allergies.map(a => {
              const cfg = severityConfig[a.severity] ?? severityConfig.moderate!;
              return (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={cfg.variant} className="text-xs shrink-0">{cfg.label}</Badge>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.allergen}</p>
                      <p className="text-xs text-muted-foreground">{typeLabels[a.type] || a.type}{a.notes && ` — ${a.notes}`}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <button type="button" onClick={() => handleDelete(a.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all" aria-label="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">Sin alergias registradas. ¡Genial!</p>
        )}
      </CardContent>
    </Card>
  );
}
