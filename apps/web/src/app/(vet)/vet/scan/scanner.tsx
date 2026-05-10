"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent } from "@pet-app/ui";
import { Camera, AlertCircle, CheckCircle2, Loader2, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { requestAccessByToken } from "../access-actions";

type Phase = "idle" | "scanning" | "confirming" | "submitting" | "success" | "error";

/// Reader UMD: el plugin html5-qrcode no es ESM nativo todavía,
/// se carga vía dynamic import dentro del effect.
type Html5QrcodeScannerType = any;

export function Scanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeScannerType>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [scannedAnimal, setScannedAnimal] = useState<{
    name: string;
    photo: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Si llega ?token=... en la URL (escaneo con cámara nativa) → confirmar directo
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && phase === "idle") {
      setScannedToken(token);
      setPhase("confirming");
    }
  }, [searchParams, phase]);

  function extractToken(decoded: string): string | null {
    // El QR codifica una URL: https://app.com/vet/scan?token=XXX
    try {
      const url = new URL(decoded);
      return url.searchParams.get("token");
    } catch {
      // Si no es URL, intentar usar como token directo (UUID format)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
        return decoded;
      }
      return null;
    }
  }

  async function startScanning() {
    setError(null);
    setPhase("scanning");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const elementId = "qr-reader";

      // Asegurar que el div existe en el DOM antes de inicializar
      await new Promise((r) => setTimeout(r, 50));

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          const token = extractToken(decodedText);
          if (token) {
            html5QrCode.stop().catch(() => {});
            setScannedToken(token);
            setPhase("confirming");
          }
        },
        () => {
          // Errores de scan en cada frame: ignorar (es normal)
        },
      );
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(
        err?.message?.includes("NotAllowed")
          ? "Permitinos usar la cámara para escanear el QR."
          : "No se pudo iniciar la cámara. Probá pegando el link manualmente.",
      );
      setPhase("error");
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setPhase("idle");
  }

  async function confirmRequest() {
    if (!scannedToken) return;
    setPhase("submitting");
    startTransition(async () => {
      const result = await requestAccessByToken(scannedToken);
      if (result.success) {
        setScannedAnimal({
          name: result.animalName ?? "Paciente",
          photo: result.animalPhoto ?? null,
        });
        setPhase("success");
        if (result.alreadyApproved) {
          toast.success(`Ya tenés acceso a ${result.animalName}.`);
          router.push(`/vet/patients/${result.animalId}`);
        } else {
          toast.success("Solicitud enviada. Esperá la aprobación del dueño.");
        }
      } else {
        setError(result.error ?? "No se pudo solicitar acceso.");
        setPhase("error");
      }
    });
  }

  function reset() {
    setError(null);
    setScannedToken(null);
    setScannedAnimal(null);
    setPhase("idle");
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4">
      {phase === "idle" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ScanLine className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Escanear QR del paciente
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pedile al dueño que muestre el QR de su mascota desde la app.
              </p>
            </div>
            <Button onClick={startScanning} className="w-full gap-2">
              <Camera className="h-4 w-4" />
              Usar cámara
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              También podés pegar el link directamente en la URL.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "scanning" && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ScanLine className="h-4 w-4 text-primary" />
                Apuntá al QR
              </div>
              <button
                type="button"
                onClick={stopScanning}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              id="qr-reader"
              ref={containerRef}
              className="overflow-hidden rounded-xl border border-border bg-black"
            />
            <p className="text-center text-xs text-muted-foreground">
              Mantené el QR centrado y bien iluminado.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "confirming" && scannedToken && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">QR detectado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Solicitás acceso al historial de este animal. El dueño lo aprueba desde su cuenta.
              </p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              token: {scannedToken}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={confirmRequest} disabled={isPending} className="flex-1 gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Solicitar acceso"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "submitting" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando solicitud...</p>
          </CardContent>
        </Card>
      )}

      {phase === "success" && scannedAnimal && (
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Solicitud enviada
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pedimos acceso a <span className="font-medium text-foreground">{scannedAnimal.name}</span>.
                El dueño tiene que aprobar desde su app.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Escanear otro
              </Button>
              <Button onClick={() => router.push("/vet/patients")} className="flex-1">
                Mis pacientes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">No se pudo</h2>
              <p className="mt-1 text-sm text-muted-foreground">{error ?? "Algo salió mal."}</p>
            </div>
            <Button variant="outline" onClick={reset} className="w-full">
              Volver a intentar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
