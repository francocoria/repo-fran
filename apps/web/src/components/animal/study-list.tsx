"use client";

import { useState, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { uploadStudy, deleteStudy } from "@/app/(owner)/app/animals/[id]/health-actions";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { FileText, Plus, Trash2, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface Study {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  study_date: string;
  notes: string | null;
}

interface StudyListProps {
  animalId: string;
  studies: Study[];
  isOwner: boolean;
}

export function StudyList({ animalId, studies, isOwner }: StudyListProps) {
  const t = useTranslations("studyList");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const result = await uploadStudy(animalId, formData);
      if (result.success) { setShowForm(false); setFileName(""); }
      else setError(result.error ?? t("error"));
    })(); });
  }

  function handleDelete(id: string) {
    startTransition(() => { void (async () => { await deleteStudy(animalId, id); })(); });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-lg">{t("title")}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{studies.length}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />{t("upload")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs">{t("name")}</Label>
                <Input name="title" required placeholder={t("namePlaceholder")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("date")}</Label>
                <Input name="studyDate" type="date" className="h-9 text-sm" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("file")}</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all"
              >
                <input
                  ref={fileRef}
                  type="file"
                  name="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  required
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
                {fileName ? (
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("fileSelect")}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("notes")}</Label>
              <Input name="notes" placeholder={t("notesPlaceholder")} className="h-9 text-sm" />
            </div>
            {error && <div className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{error}</div>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setFileName(""); }}>{t("cancel")}</Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}{t("upload")}
              </Button>
            </div>
          </form>
        )}

        {studies.length > 0 ? (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {studies.map(s => {
              const isPdf = s.file_type === "application/pdf";
              return (
                <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.study_date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        {s.notes && ` — ${s.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors" title={t("open")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {isOwner && (
                      <button type="button" onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all" aria-label={t("delete")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
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
