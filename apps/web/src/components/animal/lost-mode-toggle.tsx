"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  CheckCircle2,
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
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

    startTransition(async () => {
      const result = await activateLostMode(animalId, formData);
      if (result.success) {
        setShowActivateForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error al activar.");
      }
    });
  }

  function handleMarkFound() {
    if (!confirm("¿Confirmás que apareció? Se desactiva el modo perdido.")) {
      return;
    }
    startTransition(async () => {
      const result = await deactivateLostMode(animalId, true);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error.");
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  const whatsappShare = activeAlert
    ? `https://wa.me/?text=${encodeURIComponent(
        `🚨 SE PERDIÓ ${animalName.toUpperCase()} 🚨\n\nAyudanos a encontrarla. Toda la info acá:\n${publicUrl}\n\nPor favor compartí 🙏`,
      )}`
    : "";

  // ─── ACTIVO ─────────────────────────────────────────────────
  if (isLost && activeAlert) {
    return (
      <Card className="border-rose-300/60 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-rose-700 dark:text-rose-400">
                {animalName} está marcada como perdida
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Activada el{" "}
                {new Date(activeAlert.activated_at).toLocaleDateString(
                  "es-AR",
                )}
                {activeAlert.last_seen_location &&
                  ` · Última ubicación: ${activeAlert.last_seen_location}`}
              </p>

              {/* Public URL */}
              <div className="mt-4 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-background p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Página pública
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
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
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
                    Compartir por WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a
                    href={`/lost/${activeAlert.public_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver página pública
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkFound}
                  disabled={isPending}
                  className="gap-1.5 ml-auto"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Apareció
                </Button>
              </div>

              {error && (
                <p className="mt-3 text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
            <h3 className="font-semibold">Modo perdido</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Si {animalName} se pierde, activá el modo perdido y compartí la
              página pública con los datos de contacto. La activás en segundos.
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
                Activar modo perdido
              </Button>
            ) : (
              <form
                onSubmit={handleActivate}
                className="mt-4 space-y-3 rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contactName">
                      Nombre de contacto{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      type="text"
                      placeholder="Tu nombre"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">
                      Teléfono <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      placeholder="+54 9 11 1234 5678"
                      required
                      maxLength={30}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="contactEmail">Email (opcional)</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="email@ejemplo.com"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeenLocation">Última ubicación</Label>
                    <Input
                      id="lastSeenLocation"
                      name="lastSeenLocation"
                      type="text"
                      placeholder="Ej: Plaza de Almagro, CABA"
                      maxLength={300}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeenAt">¿Cuándo?</Label>
                    <Input
                      id="lastSeenAt"
                      name="lastSeenAt"
                      type="datetime-local"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="rewardDescription">
                      Recompensa (opcional)
                    </Label>
                    <Input
                      id="rewardDescription"
                      name="rewardDescription"
                      type="text"
                      placeholder="Ej: Recompensa al que lo encuentre"
                      maxLength={300}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="additionalInfo">Info extra</Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={2}
                      placeholder="Características que no estén en la foto, lugares que frecuenta, etc."
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
                    Cancelar
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
                    Activar y publicar
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
