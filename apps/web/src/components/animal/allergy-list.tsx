"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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

const TYPE_KEYS: Record<string, "typeFood" | "typeMedication" | "typeEnvironmental" | "typeOther"> = {
  food: "typeFood",
  medication: "typeMedication",
  environmental: "typeEnvironmental",
  other: "typeOther",
};

const SEVERITY_CONFIG: Record<
  string,
  {
    labelKey: "severityMild" | "severityModerate" | "severitySevere";
    variant: "default" | "secondary" | "destructive";
  }
> = {
  mild: { labelKey: "severityMild", variant: "secondary" },
  moderate: { labelKey: "severityModerate", variant: "default" },
  severe: { labelKey: "severitySevere", variant: "destructive" },
};

export function AllergyList({ animalId, allergies, isOwner }: AllergyListProps) {
  const t = useTranslations("allergyList");
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
      else setError(result.error ?? t("error"));
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
            <h3 className="font-semibold text-lg">{t("title")}</h3>
            {severeCount > 0 && (
              <Badge variant="destructive" className="text-xs">{t(severeCount === 1 ? "severeCountOne" : "severeCountOther", { count: severeCount })}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />{t("add")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("typeLabel")}</Label>
                <select name="type" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="food">{t("typeFood")}</option>
                  <option value="medication">{t("typeMedication")}</option>
                  <option value="environmental">{t("typeEnvironmental")}</option>
                  <option value="other">{t("typeOther")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("severityLabel")}</Label>
                <select name="severity" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="mild">{t("severityMild")}</option>
                  <option value="moderate">{t("severityModerate")}</option>
                  <option value="severe">{t("severitySevere")}</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">{t("allergen")}</Label>
                <Input name="allergen" required placeholder={t("allergenPlaceholder")} className="h-9 text-sm" />
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

        {allergies.length > 0 ? (
          <div className="space-y-2">
            {allergies.map(a => {
              const cfg = SEVERITY_CONFIG[a.severity] ?? SEVERITY_CONFIG.moderate!;
              const typeKey = TYPE_KEYS[a.type];
              return (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={cfg.variant} className="text-xs shrink-0">{t(cfg.labelKey)}</Badge>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.allergen}</p>
                      <p className="text-xs text-muted-foreground">{typeKey ? t(typeKey) : a.type}{a.notes && ` — ${a.notes}`}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <button type="button" onClick={() => handleDelete(a.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all" aria-label={t("delete")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">{t("empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
