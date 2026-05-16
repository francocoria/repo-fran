"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addVaccine, deleteVaccine } from "@/app/(owner)/app/animals/[id]/health-actions";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { Syringe, Plus, Trash2, Loader2, AlertCircle, CalendarClock } from "lucide-react";

interface Vaccine {
  id: string;
  name: string;
  applied_date: string;
  lot_number: string | null;
  next_dose_date: string | null;
  notes: string | null;
}

interface VaccineListProps {
  animalId: string;
  vaccines: Vaccine[];
  isOwner: boolean;
  species: string;
}

const SUGGESTED: Record<string, string[]> = {
  dog: ["Polivalente", "Antirrábica", "Bordetella", "Leptospirosis"],
  cat: ["Triple felina", "Antirrábica", "Leucemia felina"],
};

export function VaccineList({ animalId, vaccines, isOwner, species }: VaccineListProps) {
  const t = useTranslations("vaccineList");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const result = await addVaccine(animalId, formData);
      if (result.success) setShowForm(false);
      else setError(result.error ?? t("error"));
    })(); });
  }

  function handleDelete(id: string) {
    startTransition(() => { void (async () => { await deleteVaccine(animalId, id); })(); });
  }

  const suggestions = SUGGESTED[species] || [];
  const upcoming = vaccines.filter(v => v.next_dose_date && new Date(v.next_dose_date) > new Date());

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-lg">{t("title")}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{vaccines.length}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />{t("add")}
          </Button>
        </div>

        {/* Upcoming alerts */}
        {upcoming.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {upcoming.map(v => (
              <div key={v.id} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t.rich("nextDose", {
                    name: v.name,
                    date: new Date(v.next_dose_date!).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }),
                    b: (c) => <strong>{c}</strong>,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs">{t("name")}</Label>
                <Input name="name" required placeholder={t("namePlaceholder")} className="h-9 text-sm" list="vaccine-suggestions" />
                <datalist id="vaccine-suggestions">
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("appliedDate")}</Label>
                <Input name="appliedDate" type="date" required className="h-9 text-sm" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("lotNumber")}</Label>
                <Input name="lotNumber" placeholder={t("lotNumberPlaceholder")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("nextDoseDate")}</Label>
                <Input name="nextDoseDate" type="date" className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("notes")}</Label>
              <Input name="notes" placeholder={t("notesPlaceholder")} className="h-9 text-sm" />
            </div>
            {error && <div className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{error}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}{t("save")}
              </Button>
            </div>
          </form>
        )}

        {vaccines.length > 0 ? (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {vaccines.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.applied_date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    {v.lot_number && <span> · {t("lotLabel", { lot: v.lot_number })}</span>}
                  </p>
                </div>
                {isOwner && (
                  <button type="button" onClick={() => handleDelete(v.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all" aria-label={t("delete")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">{t("empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
