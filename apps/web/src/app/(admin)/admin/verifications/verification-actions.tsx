"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button, Textarea } from "@pet-app/ui";
import { approveVerification, rejectVerification } from "../actions";

interface Props {
  requestId: string;
}

export function VerificationActions({ requestId }: Props) {
  const router = useRouter();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    if (!confirm("¿Aprobar esta verificación?")) return;
    startTransition(async () => {
      const result = await approveVerification(requestId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error.");
      }
    });
  }

  function handleReject() {
    setError(null);
    if (!rejectReason.trim()) {
      setError("Indicá un motivo para el rechazo.");
      return;
    }
    startTransition(async () => {
      const result = await rejectVerification(requestId, rejectReason);
      if (result.success) {
        setShowRejectForm(false);
        setRejectReason("");
        router.refresh();
      } else {
        setError(result.error ?? "Error.");
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {!showRejectForm ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            size="sm"
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Aprobar
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
            Rechazar
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo del rechazo (visible para el vet)..."
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
              Confirmar rechazo
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
              Cancelar
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
  );
}
