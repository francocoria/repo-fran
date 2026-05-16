"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge } from "@pet-app/ui";
import {
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { formatDateLong } from "@pet-app/lib/utils/format";

interface MedicalRecord {
  id: string;
  visit_date: string;
  reason: string;
  examination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  next_steps: string | null;
  public_notes: string | null;
  vet: {
    full_name: string;
    verified: boolean;
    clinic_name: string | null;
  };
}

interface MedicalHistoryListProps {
  records: MedicalRecord[];
}

export function MedicalHistoryList({ records }: MedicalHistoryListProps) {
  const t = useTranslations("medicalHistory");
  const [expandedId, setExpandedId] = useState<string | null>(
    records[0]?.id ?? null,
  );

  function toggle(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-lg">{t("title")}</h3>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {records.length}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => {
              const isOpen = expandedId === r.id;
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-border bg-card/50"
                >
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-secondary/40"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="text-sm font-medium truncate">
                          {r.reason}
                        </p>
                        {r.vet.verified && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] py-0 px-1.5 h-4"
                          >
                            <ShieldCheck className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                            {t("verified")}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDateLong(r.visit_date)} ·{" "}
                        {t("vetPrefix", { name: r.vet.full_name })}
                        {r.vet.clinic_name && (
                          <span className="opacity-70">
                            · {r.vet.clinic_name}
                          </span>
                        )}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-3 text-sm">
                      {r.examination && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("examination")}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap">
                            {r.examination}
                          </p>
                        </div>
                      )}

                      {r.diagnosis && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("diagnosis")}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap">
                            {r.diagnosis}
                          </p>
                        </div>
                      )}

                      {r.treatment && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("treatment")}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap">
                            {r.treatment}
                          </p>
                        </div>
                      )}

                      {r.next_steps && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("nextSteps")}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap">
                            {r.next_steps}
                          </p>
                        </div>
                      )}

                      {r.public_notes && (
                        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            {t("publicNotes")}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">
                            {r.public_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
