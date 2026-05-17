"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Textarea } from "@pet-app/ui";
import { approveVerification, rejectVerification } from "../actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Props {
  requestId: string;
}

export function VerificationActions({ requestId }: Props) {
  const t = useTranslations("adminVerifications");
  const router = useRouter();
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmApprove() {
    setError(null);
    setShowApproveConfirm(false);
    startTransition(() => { void (async () => {
      const result = await approveVerification(requestId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? t("genericError"));
      }
    })(); });
  }

  function handleReject() {
    setError(null);
    if (!rejectReason.trim()) {
      setError(t("rejectReasonRequired"));
      return;
    }
    startTransition(() => { void (async () => {
      const result = await rejectVerification(requestId, rejectReason);
      if (result.success) {
        setShowRejectForm(false);
        setRejectReason("");
        router.refresh();
      } else {
        setError(result.error ?? t("genericError"));
      }
    })(); });
  }

  return (
    <>
      <ConfirmDialog
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={confirmApprove}
        title={t("approveTitle")}
        description={t("approveDesc")}
        confirmLabel={t("approve")}
        loading={isPending}
      />

    <div className="mt-4 space-y-3">
      {!showRejectForm ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setShowApproveConfirm(true)}
            disabled={isPending}
            size="sm"
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {t("approve")}
          </Button>
          <Button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            {t("reject")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("rejectPlaceholder")}
            rows={3}
            maxLength={500}
            disabled={isPending}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {t("confirmReject")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason("");
                setError(null);
              }}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
    </>
  );
}
