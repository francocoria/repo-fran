"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button, Card, CardContent, Input, Label } from "@pet-app/ui";
import { deleteAccount } from "@/app/(auth)/actions";

/**
 * Sección de eliminación de cuenta. Doble confirmación:
 *  1. Click "Quiero eliminar mi cuenta" → expande
 *  2. Escribir literalmente "ELIMINAR" + click "Confirmar eliminación"
 *
 * Borra toda la data del usuario (perfiles, animales, vacunas, accesos,
 * suscripciones, etc.) de forma irreversible. Requerido por App Store y
 * Google Play.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await deleteAccount(confirmation);
        if (result.success) {
          router.push("/");
          router.refresh();
        } else {
          setError(result.error ?? "Error al eliminar la cuenta.");
        }
      })();
    });
  }

  return (
    <Card className="border-destructive/30 bg-destructive/[0.02]">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">
              Eliminar mi cuenta
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Borra tu perfil, todas tus mascotas, vacunas, alergias, estudios,
              accesos a veterinarios y suscripciones. Esta acción no se puede
              deshacer.
            </p>
          </div>
        </div>

        {!expanded ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setExpanded(true)}
          >
            <Trash2 className="size-3.5" />
            Quiero eliminar mi cuenta
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-background p-4">
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirm" className="text-foreground">
                Para confirmar, escribí{" "}
                <span className="font-mono font-semibold text-destructive">
                  ELIMINAR
                </span>{" "}
                en mayúsculas
              </Label>
              <Input
                id="deleteConfirm"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="ELIMINAR"
                disabled={isPending}
                className="font-mono"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending || confirmation !== "ELIMINAR"}
                onClick={handleConfirm}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Confirmar eliminación
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setExpanded(false);
                  setConfirmation("");
                  setError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
