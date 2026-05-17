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
import { useTranslations } from "next-intl";
import { Button, Card, CardContent } from "@pet-app/ui";
import { deleteConsultTemplate } from "./actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const t = useTranslations("vetTemplatesList");
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TemplateItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestDelete(tpl: TemplateItem) {
    setConfirmTarget(tpl);
  }

  function confirmDelete() {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    setDeletingId(target.id);
    startTransition(() => { void (async () => {
      const result = await deleteConsultTemplate(target.id);
      setDeletingId(null);
      if (result.success) {
        toast.success(t("toastDeleted"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("toastError"));
      }
    })(); });
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="px-5 py-8 text-center">
          <FileText className="mx-auto size-7 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            {editable ? t("emptyEditable") : t("emptyLocked")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
        title={t("confirmTitle", { name: confirmTarget?.name ?? "" })}
        description={t("confirmDescription")}
        confirmLabel={t("confirmLabel")}
        tone="destructive"
        loading={isPending}
      />

      <div className="grid gap-2.5">
        {templates.map((tpl) => {
        const isOpen = expanded === tpl.id;
        const fields = [
          { key: "examination", label: t("fieldExamination") },
          { key: "diagnosis", label: t("fieldDiagnosis") },
          { key: "treatment", label: t("fieldTreatment") },
          { key: "next_steps", label: t("fieldNextSteps") },
        ];
        const filledCount = fields.filter(
          (f) => tpl.content[f.key] && tpl.content[f.key]!.trim() !== "",
        ).length;

        return (
          <Card key={tpl.id}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : tpl.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-secondary/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("fieldsFilled", { count: filledCount })}
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
                      const value = tpl.content[f.key];
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
                        <Link href={`/vet/templates/${tpl.id}/edit`}>
                          <Pencil className="size-3.5" />
                          {t("edit")}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestDelete(tpl)}
                        disabled={isPending && deletingId === tpl.id}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {isPending && deletingId === tpl.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        {t("delete")}
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
    </>
  );
}
