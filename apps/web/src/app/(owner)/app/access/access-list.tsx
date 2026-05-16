"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@pet-app/ui";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Stethoscope,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { approveAccess, rejectAccess, revokeAccess } from "./actions";
import { useAutoReset } from "@/lib/use-copy-feedback";

export interface AccessRow {
  id: string;
  status: "pending" | "approved" | "revoked";
  requested_at: string;
  approved_at: string | null;
  vet: {
    full_name: string;
    specialty: string | null;
    clinic_name: string | null;
    verified: boolean;
  };
  animal: {
    id: string;
    name: string;
    photo_url: string | null;
  };
}

export function PendingAccessList({ requests }: { requests: AccessRow[] }) {
  const t = useTranslations("ownerAccess");
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          {t("noPending")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <PendingRow key={req.id} request={req} />
      ))}
    </div>
  );
}

function PendingRow({ request }: { request: AccessRow }) {
  const t = useTranslations("ownerAccess");
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  function handleApprove() {
    setDecision("approve");
    startTransition(() => { void (async () => {
      const result = await approveAccess(request.id);
      if (result.success) {
        toast.success(t("toastApproved", { name: request.vet.full_name }));
      } else {
        toast.error(result.error ?? t("toastApproveError"));
        setDecision(null);
      }
    })(); });
  }

  function handleReject() {
    setDecision("reject");
    startTransition(() => { void (async () => {
      const result = await rejectAccess(request.id);
      if (result.success) {
        toast.success(t("toastRejected"));
      } else {
        toast.error(result.error ?? t("toastRejectError"));
        setDecision(null);
      }
    })(); });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold truncate">{request.vet.full_name}</p>
              {request.vet.verified && (
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-label={t("verified")} />
              )}
            </div>
            {request.vet.clinic_name && (
              <p className="text-sm text-muted-foreground truncate">
                {request.vet.clinic_name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("requestsAccessTo")}{" "}
              <span className="font-medium text-foreground">
                {request.animal.name}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={isPending}
          className="flex-1 gap-1.5"
        >
          {decision === "reject" && isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {t("reject")}
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending}
          className="flex-1 gap-1.5"
        >
          {decision === "approve" && isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {t("approve")}
        </Button>
      </div>
    </div>
  );
}

export function ApprovedAccessList({ accesses }: { accesses: AccessRow[] }) {
  const t = useTranslations("ownerAccess");
  if (accesses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-10 text-center">
        <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          {t("noApproved")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          {t("noApprovedHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accesses.map((acc) => (
        <ApprovedRow key={acc.id} access={acc} />
      ))}
    </div>
  );
}

function ApprovedRow({ access }: { access: AccessRow }) {
  const t = useTranslations("ownerAccess");
  const [isPending, startTransition] = useTransition();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  useAutoReset(confirmRevoke, setConfirmRevoke, 4000);

  function handleRevoke() {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }
    startTransition(() => { void (async () => {
      const result = await revokeAccess(access.id);
      if (result.success) {
        toast.success(t("toastRevoked"));
      } else {
        toast.error(result.error ?? t("toastRevokeError"));
      }
      setConfirmRevoke(false);
    })(); });
  }

  const approvedDate = access.approved_at
    ? new Date(access.approved_at).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold truncate">{access.vet.full_name}</p>
              {access.vet.verified && (
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
            {access.vet.clinic_name && (
              <p className="text-sm text-muted-foreground truncate">
                {access.vet.clinic_name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("approvedOn", { name: access.animal.name, date: approvedDate })}
            </p>
          </div>
        </div>
        <Button
          variant={confirmRevoke ? "destructive" : "ghost"}
          size="sm"
          onClick={handleRevoke}
          disabled={isPending}
          className="shrink-0 gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : confirmRevoke ? (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              {t("confirm")}
            </>
          ) : (
            t("revoke")
          )}
        </Button>
      </div>
    </div>
  );
}
