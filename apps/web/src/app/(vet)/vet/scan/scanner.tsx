"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent } from "@pet-app/ui";
import { Camera, AlertCircle, CheckCircle2, Loader2, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { requestAccessByToken } from "../access-actions";

type Phase = "idle" | "scanning" | "confirming" | "submitting" | "success" | "error";

/// Reader UMD: el plugin html5-qrcode no es ESM nativo todavía,
/// se carga vía dynamic import dentro del effect.
type Html5QrcodeScannerType = any;

export function Scanner() {
  const t = useTranslations("vetScan");
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
          ? t("errorCamPermission")
          : t("errorCamStart"),
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
    startTransition(() => { void (async () => {
      const result = await requestAccessByToken(scannedToken);
      if (result.success) {
        setScannedAnimal({
          name: result.animalName ?? t("fallbackAnimal"),
          photo: result.animalPhoto ?? null,
        });
        setPhase("success");
        if (result.alreadyApproved) {
          toast.success(t("toastAlreadyAccess", { name: result.animalName ?? t("fallbackAnimal") }));
          router.push(`/vet/patients/${result.animalId}`);
        } else {
          toast.success(t("toastRequestSent"));
        }
      } else {
        setError(result.error ?? t("errorRequest"));
        setPhase("error");
      }
    })(); });
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
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="space-y-5 pt-8 pb-6 px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm border border-primary/20">
                <ScanLine className="h-8 w-8" />
              </div>
              <h2 className="text-[22px] font-extrabold tracking-tight">
                {t("idleTitle")}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground font-medium">
                {t("idleDesc")}
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={startScanning} className="w-full gap-2 rounded-full h-12 shadow-sm text-base">
                <Camera className="h-5 w-5" />
                {t("useCamera")}
              </Button>
            </div>
            <p className="text-center text-[13px] text-muted-foreground font-medium">
              {t("pasteHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "scanning" && (
        <Card className="rounded-3xl shadow-sm border-border/50 overflow-hidden">
          <CardContent className="space-y-4 pt-6 pb-6 px-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
                <ScanLine className="h-5 w-5 text-primary" />
                {t("scanningAim")}
              </div>
              <button
                type="button"
                onClick={stopScanning}
                className="rounded-full p-2 text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground transition-colors"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              id="qr-reader"
              ref={containerRef}
              className="overflow-hidden rounded-3xl border-2 border-border/50 bg-black shadow-inner"
            />
            <p className="text-center text-[13px] text-muted-foreground font-medium px-4">
              {t("scanningHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "confirming" && scannedToken && (
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="space-y-5 pt-8 pb-6 px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-[22px] font-extrabold tracking-tight">
                {t("qrDetected")}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground font-medium">
                {t("qrDetectedDesc")}
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/50 px-4 py-3 font-mono text-[11px] text-muted-foreground break-all border border-border/40 shadow-inner">
              <span className="uppercase tracking-wider font-bold mr-2 text-[10px] text-foreground/50">{t("tokenLabel")}</span>
              {scannedToken}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reset} className="flex-1 rounded-full h-12 shadow-sm font-semibold">
                {t("cancel")}
              </Button>
              <Button onClick={confirmRequest} disabled={isPending} className="flex-1 gap-2 rounded-full h-12 shadow-sm font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  t("requestAccess")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "submitting" && (
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[15px] text-muted-foreground font-medium">
              {t("submittingMsg")}
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "success" && scannedAnimal && (
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="space-y-5 pt-8 pb-6 px-6 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-[22px] font-extrabold tracking-tight">
                {t("successTitle")}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground font-medium">
                {t("successDescPre")}
                <span className="font-bold text-foreground">
                  {scannedAnimal.name}
                </span>
                {t("successDescPost")}
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={reset} className="flex-1 rounded-full h-12 shadow-sm font-semibold">
                {t("scanAnother")}
              </Button>
              <Button onClick={() => router.push("/vet/patients")} className="flex-1 rounded-full h-12 shadow-sm font-semibold">
                {t("myPatients")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card className="rounded-3xl shadow-sm border-border/50">
          <CardContent className="space-y-5 pt-8 pb-6 px-6 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-[22px] font-extrabold tracking-tight">
                {t("errorTitle")}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground font-medium">
                {error ?? t("errorGeneric")}
              </p>
            </div>
            <div className="pt-2">
              <Button variant="outline" onClick={reset} className="w-full rounded-full h-12 shadow-sm font-semibold">
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
