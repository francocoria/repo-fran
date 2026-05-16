"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
} from "@pet-app/ui";
import {
  activateLostMode,
  deactivateLostMode,
} from "@/app/(owner)/app/animals/[id]/lost-actions";
import { useCopyFeedback } from "@/lib/use-copy-feedback";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ActiveAlert {
  id: string;
  public_slug: string;
  activated_at: string;
  last_seen_location: string | null;
}

interface LostModeToggleProps {
  animalId: string;
  animalName: string;
  currentStatus: string;
  activeAlert: ActiveAlert | null;
}

export function LostModeToggle({
  animalId,
  animalName,
  currentStatus,
  activeAlert,
}: LostModeToggleProps) {
  const router = useRouter();
  const t = useTranslations("lostModeToggle");
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [showFoundConfirm, setShowFoundConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopyFeedback();
  const [isPending, startTransition] = useTransition();

  const isLost = currentStatus === "lost" && activeAlert !== null;

  const publicUrl =
    activeAlert && typeof window !== "undefined"
      ? `${window.location.origin}/lost/${activeAlert.public_slug}`
      : "";

  function handleActivate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(() => { void (async () => {
      const result = await activateLostMode(animalId, formData);
      if (result.success) {
        setShowActivateForm(false);
        router.refresh();
      } else {
        setError(result.error ?? t("errorActivate"));
      }
    })(); });
  }

  function confirmMarkFound() {
    setShowFoundConfirm(false);
    startTransition(() => { void (async () => {
      const result = await deactivateLostMode(animalId, true);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? t("errorGeneric"));
      }
    })(); });
  }

  async function handleCopy() {
    const ok = await copy(publicUrl);
    if (!ok) console.error("Copy failed");
  }

  const whatsappShare = activeAlert
    ? `https://wa.me/?text=${encodeURIComponent(
        t("shareWhatsappMessage", {
          name: animalName.toUpperCase(),
          url: publicUrl,
        }),
      )}`
    : "";

  // ─── ACTIVO ─────────────────────────────────────────────────
  if (isLost && activeAlert) {
    return (
      <>
        <ConfirmDialog
          open={showFoundConfirm}
          onClose={() => setShowFoundConfirm(false)}
          onConfirm={confirmMarkFound}
          title={t("markFoundTitle", { name: animalName })}
          description={t("markFoundDescription")}
          confirmLabel={t("markFoundConfirm")}
          loading={isPending}
        />
      <Card className="border-rose-300/60 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-rose-700 dark:text-rose-400">
                {t("activeTitle", { name: animalName })}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("activatedOn", {
                  date: new Date(
                    activeAlert.activated_at,
                  ).toLocaleDateString("es-AR"),
                })}
                {activeAlert.last_seen_location &&
                  ` · ${t("lastLocation", { location: activeAlert.last_seen_location })}`}
              </p>

              {/* Public URL */}
              <div className="mt-4 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-background p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {t("publicPage")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono truncate text-foreground">
                    {publicUrl || `/lost/${activeAlert.public_slug}`}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        {t("copy")}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <a
                    href={whatsappShare}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t("shareWhatsapp")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a
                    href={`/lost/${activeAlert.public_slug}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("downloadPdf")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a
                    href={`/lost/${activeAlert.public_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("viewPublicPage")}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFoundConfirm(true)}
                  disabled={isPending}
                  className="gap-1.5 ml-auto"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {t("found")}
                </Button>
              </div>

              {error && (
                <p className="mt-3 text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </>
    );
  }

  // ─── INACTIVO ─────────────────────────────────────────────
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{t("inactiveTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("inactiveText", { name: animalName })}
            </p>

            {!showActivateForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => setShowActivateForm(true)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("activateButton")}
              </Button>
            ) : (
              <form
                onSubmit={handleActivate}
                className="mt-4 space-y-3 rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contactName">
                      {t("contactName")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      type="text"
                      placeholder={t("contactNamePlaceholder")}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">
                      {t("contactPhone")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      placeholder={t("contactPhonePlaceholder")}
                      required
                      maxLength={30}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder={t("contactEmailPlaceholder")}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeenLocation">{t("lastSeenLocation")}</Label>
                    <Input
                      id="lastSeenLocation"
                      name="lastSeenLocation"
                      type="text"
                      placeholder={t("lastSeenLocationPlaceholder")}
                      maxLength={300}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeenAt">{t("lastSeenAt")}</Label>
                    <Input
                      id="lastSeenAt"
                      name="lastSeenAt"
                      type="datetime-local"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="rewardDescription">
                      {t("reward")}
                    </Label>
                    <Input
                      id="rewardDescription"
                      name="rewardDescription"
                      type="text"
                      placeholder={t("rewardPlaceholder")}
                      maxLength={300}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="additionalInfo">{t("additionalInfo")}</Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={2}
                      placeholder={t("additionalInfoPlaceholder")}
                      maxLength={1000}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowActivateForm(false);
                      setError(null);
                    }}
                    disabled={isPending}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    className="gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {t("activateAndPublish")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
