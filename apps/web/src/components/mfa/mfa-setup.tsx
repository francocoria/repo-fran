"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input } from "@pet-app/ui";
import { ShieldCheck, ShieldOff, Loader2, KeyRound } from "lucide-react";
import {
  enrollTotp,
  verifyTotpEnrollment,
  unenrollTotp,
} from "@/app/(auth)/mfa-actions";
import { toast } from "sonner";

type Factor = { id: string; status: "verified" | "unverified"; friendly_name?: string | null };

type Props = {
  /** Factores TOTP que ya tiene el usuario (de listFactors() server-side) */
  existingFactors: Factor[];
  /** Si MFA es obligatorio para este rol (admin / vet Premium) o no */
  required?: boolean;
};

/**
 * UI para configurar MFA TOTP.
 *
 * Estados:
 *  - tiene factor verificado → mostrar "MFA activo" + botón para desactivar
 *  - no tiene factor → mostrar botón "Activar MFA" → step de QR + código
 */
export function MfaSetup({ existingFactors, required = false }: Props) {
  const verified = existingFactors.find((f) => f.status === "verified");
  const [pending, setPending] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    const result = await enrollTotp();
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setPending(result.data);
  }

  async function handleVerify() {
    if (!pending) return;
    if (code.length < 6) {
      toast.error("Ingresá los 6 dígitos del código.");
      return;
    }
    setLoading(true);
    const result = await verifyTotpEnrollment(pending.factorId, code);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("MFA activado correctamente.");
    setPending(null);
    setCode("");
    // Reload para refrescar el server state de factores
    window.location.reload();
  }

  async function handleUnenroll(factorId: string) {
    if (required) {
      toast.error("MFA es obligatorio para tu rol — no se puede desactivar.");
      return;
    }
    if (!confirm("¿Seguro que querés desactivar MFA? Tu cuenta queda con un solo factor.")) {
      return;
    }
    setLoading(true);
    const result = await unenrollTotp(factorId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("MFA desactivado.");
    window.location.reload();
  }

  // ─── Estado: factor verificado ─────────────────────────────────
  if (verified && !pending) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="font-semibold">MFA activo</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta pide un código de tu app de autenticación al iniciar sesión.
              </p>
            </div>
          </div>
          {!required && (
            <Button
              variant="outline"
              onClick={() => handleUnenroll(verified.id)}
              disabled={loading}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Desactivar MFA
            </Button>
          )}
          {required && (
            <p className="text-xs text-muted-foreground">
              MFA es obligatorio para tu rol y no puede desactivarse desde acá.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Estado: enrollment pending (mostrando QR) ─────────────────
  if (pending) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">Escaneá el código QR</h2>
          <p className="text-sm text-muted-foreground">
            Abrí Google Authenticator, Authy, 1Password o tu app de
            autenticación, escaneá este QR y después ingresá el código de 6
            dígitos que aparece en la app.
          </p>
          <div className="flex justify-center rounded-lg border bg-white p-4">
            <img
              src={pending.qrCode}
              alt="QR code para MFA"
              className="h-48 w-48"
            />
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              ¿No podés escanear? Usar código manual
            </summary>
            <code className="mt-2 block break-all rounded bg-muted px-2 py-1 font-mono">
              {pending.secret}
            </code>
          </details>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Código de 6 dígitos de tu app
            </label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={loading || code.length < 6}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Verificar y activar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPending(null);
                setCode("");
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Estado: sin MFA, mostrar opción para activar ──────────────
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-3">
          <ShieldOff className="h-5 w-5 text-amber-600" />
          <div>
            <h2 className="font-semibold">
              MFA{" "}
              {required ? (
                <span className="text-amber-600">(requerido)</span>
              ) : (
                "no configurado"
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {required
                ? "Tu rol requiere activar autenticación de dos factores."
                : "Agregá una capa extra de seguridad con un código rotativo."}
            </p>
          </div>
        </div>
        <Button onClick={handleEnroll} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          Activar MFA
        </Button>
      </CardContent>
    </Card>
  );
}
