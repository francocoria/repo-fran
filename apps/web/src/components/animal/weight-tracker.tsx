"use client";

import { useState, useTransition } from "react";
import { addWeightEntry, deleteWeightEntry } from "@/app/(owner)/app/actions";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface WeightEntry {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
}

interface WeightTrackerProps {
  animalId: string;
  currentWeight: number | null;
  entries: WeightEntry[];
  isOwner: boolean;
}

export function WeightTracker({ animalId, currentWeight, entries, isOwner }: WeightTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(() => { void (async () => {
      const result = await addWeightEntry(animalId, formData);
      if (result.success) {
        setShowForm(false);
        // Page will revalidate
      } else {
        setError(result.error ?? "Error");
      }
    })(); });
  }

  function handleDelete(entryId: string) {
    startTransition(() => { void (async () => {
      await deleteWeightEntry(animalId, entryId);
    })(); });
  }

  // Trend: compare last two entries
  const last = entries[0];
  const prev = entries[1];
  const trend =
    last && prev
      ? last.weight_kg > prev.weight_kg
        ? "up"
        : last.weight_kg < prev.weight_kg
          ? "down"
          : "same"
      : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Peso</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold tabular-nums">
                {currentWeight ? `${currentWeight} kg` : "—"}
              </span>
              {trend === "up" && <TrendingUp className="h-4 w-4 text-orange-500" />}
              {trend === "down" && <TrendingDown className="h-4 w-4 text-emerald-500" />}
              {trend === "same" && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="weightKg" className="text-xs">Peso (kg)</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  required
                  placeholder="12.5"
                  defaultValue={currentWeight || ""}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">Nota (opcional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Control mensual"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Guardar
              </Button>
            </div>
          </form>
        )}

        {entries.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Historial</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
              {entries.map((entry, i) => {
                const date = new Date(entry.recorded_at);
                const next = entries[i + 1];
                const diff = next ? entry.weight_kg - next.weight_kg : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums w-16">{entry.weight_kg} kg</span>
                      {diff !== null && diff !== 0 && (
                        <span className={`text-xs font-medium ${diff > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {entry.notes && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">— {entry.notes}</span>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive transition-all"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin registros de peso. Registrá el primero para llevar un seguimiento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
