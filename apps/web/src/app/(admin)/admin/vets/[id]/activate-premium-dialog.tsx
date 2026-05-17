"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, X, AlertCircle, Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Label,
  Textarea,
} from "@pet-app/ui";
import { activatePremium } from "../../actions";

interface Props {
  vetId: string;
  vetName: string;
  currentExpiresAt: string | null;
}

export function ActivatePremiumDialog({
  vetId,
  vetName,
  currentExpiresAt,
}: Props) {
  const t = useTranslations("adminVetDetail");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("vetId", vetId);

    startTransition(() => { void (async () => {
      const result = await activatePremium(formData);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? t("errorActivate"));
      }
    })(); });
  }

  const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Crown className="h-4 w-4" />
        {t("activatePremium")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => !isPending && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => !isPending && setOpen(false)}
              disabled={isPending}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={t("closeAria")}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">{t("dialogTitle")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dialogVet")}
                <strong className="text-foreground">{vetName}</strong>
                {currentExpiresAt &&
                  t("dialogCurrentExpiry", {
                    date: new Date(currentExpiresAt).toLocaleDateString("es-AR"),
                  })}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="monthsGranted">
                    {t("fieldMonths")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="monthsGranted"
                    name="monthsGranted"
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="paidAt">
                    {t("fieldPaidAt")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paidAt"
                    name="paidAt"
                    type="date"
                    defaultValue={todayLocal}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">
                    {t("fieldAmount")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">{t("fieldCurrency")}</Label>
                  <Input
                    id="currency"
                    name="currency"
                    type="text"
                    defaultValue="USD"
                    maxLength={3}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="method">
                    {t("fieldMethod")} <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="method"
                    name="method"
                    required
                    defaultValue="transfer"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="transfer">{t("methodTransfer")}</option>
                    <option value="cash">{t("methodCash")}</option>
                    <option value="mp_external">{t("methodMpExternal")}</option>
                    <option value="stripe_external">
                      {t("methodStripeExternal")}
                    </option>
                    <option value="other">{t("methodOther")}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">{t("fieldNotes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder={t("notesPlaceholder")}
                    maxLength={500}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {t("submit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
