"use client";

import { useState, useTransition } from "react";
import { addDeworming, deleteDeworming } from "@/app/(owner)/app/animals/[id]/health-actions";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { Bug, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";

interface Deworming {
  id: string;
  type: string;
  product: string;
  applied_date: string;
  next_date: string | null;
  notes: string | null;
}

interface DewormingListProps {
  animalId: string;
  dewormings: Deworming[];
  isOwner: boolean;
}

export function DewormingList({ animalId, dewormings, isOwner }: DewormingListProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addDeworming(animalId, formData);
      if (result.success) setShowForm(false);
      else setError(result.error ?? "Error");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteDeworming(animalId, id); });
  }

  const overdue = dewormings.filter(d => d.next_date && new Date(d.next_date) < new Date());

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-lg">Desparasitación</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Agregar
          </Button>
        </div>

        {overdue.length > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Hay {overdue.length} desparasitación{overdue.length > 1 ? "es" : ""} vencida{overdue.length > 1 ? "s" : ""}.</span>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo *</Label>
                <select name="type" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="internal">Interna</option>
                  <option value="external">Externa</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Producto *</Label>
                <Input name="product" required placeholder="Nexgard, Endal..." className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha *</Label>
                <Input name="appliedDate" type="date" required className="h-9 text-sm" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Próxima</Label>
                <Input name="nextDate" type="date" className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Input name="notes" placeholder="Observaciones..." className="h-9 text-sm" />
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

        {dewormings.length > 0 ? (
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {dewormings.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.type === "internal" ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"}`}>
                      {d.type === "internal" ? "INT" : "EXT"}
                    </span>
                    <p className="font-medium truncate">{d.product}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-[52px]">
                    {new Date(d.applied_date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    {d.next_date && ` · Próxima: ${new Date(d.next_date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                {isOwner && (
                  <button type="button" onClick={() => handleDelete(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all" aria-label="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">Sin desparasitaciones registradas.</p>
        )}
      </CardContent>
    </Card>
  );
}
