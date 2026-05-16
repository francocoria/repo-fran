"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addMedication, toggleMedication, deleteMedication } from "@/app/(owner)/app/animals/[id]/health-actions";
import { Button, Input, Label, Card, CardContent, Badge } from "@pet-app/ui";
import { Pill, Plus, Trash2, Loader2, AlertCircle, Power } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  notes: string | null;
}

interface MedicationListProps {
  animalId: string;
  medications: Medication[];
  isOwner: boolean;
}

export function MedicationList({ animalId, medications, isOwner }: MedicationListProps) {
  const t = useTranslations("medicationList");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const result = await addMedication(animalId, formData);
      if (result.success) setShowForm(false);
      else setError(result.error ?? t("error"));
    })(); });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(() => { void (async () => { await toggleMedication(animalId, id, !active); })(); });
  }

  function handleDelete(id: string) {
    startTransition(() => { void (async () => { await deleteMedication(animalId, id); })(); });
  }

  const active = medications.filter(m => m.active);
  const inactive = medications.filter(m => !m.active);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-lg">{t("title")}</h3>
            {active.length > 0 && (
              <Badge variant="default" className="text-xs">{t(active.length === 1 ? "activeCountOne" : "activeCountOther", { count: active.length })}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />{t("add")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs">{t("name")}</Label>
                <Input name="name" required placeholder={t("namePlaceholder")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("dosage")}</Label>
                <Input name="dosage" required placeholder={t("dosagePlaceholder")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("frequency")}</Label>
                <Input name="frequency" required placeholder={t("frequencyPlaceholder")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("startDate")}</Label>
                <Input name="startDate" type="date" required className="h-9 text-sm" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs">{t("endDate")}</Label>
                <Input name="endDate" type="date" className="h-9 text-sm" />
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

        {medications.length > 0 ? (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {/* Active first */}
            {active.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 group text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                    <p className="font-medium truncate">{m.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">{m.dosage} · {m.frequency}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => handleToggle(m.id, m.active)} className="p-1.5 rounded-md text-muted-foreground hover:text-amber-600 transition-colors" title={t("markInactive")}>
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  {isOwner && (
                    <button type="button" onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all" aria-label={t("delete")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {/* Inactive */}
            {inactive.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pt-2 px-1">{t("finished")}</p>
                {inactive.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm opacity-60">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.name} — {m.dosage}</p>
                      <p className="text-xs text-muted-foreground">{m.frequency}{m.end_date && ` · ${t("until", { date: new Date(m.end_date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) })}`}</p>
                    </div>
                    {isOwner && (
                      <button type="button" onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">{t("empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
