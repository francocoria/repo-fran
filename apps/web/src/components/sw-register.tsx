"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * Registra el service worker y muestra un banner cuando hay una versión
 * nueva disponible. Soluciona el problema de la PWA iOS que cacheaba el
 * HTML y nunca mostraba los cambios sin reinstalar a mano.
 *
 * Flujo:
 *  1. Registra /sw.js
 *  2. El browser chequea updates periódicamente (y en cada visita)
 *  3. Cuando hay un SW nuevo en "waiting", mostramos el banner
 *  4. El usuario toca "Actualizar" → mandamos SKIP_WAITING → el SW
 *     nuevo toma control → recargamos la página
 */
export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] =
    useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    let refreshing = false;

    // Cuando el SW nuevo toma control, recargamos una sola vez.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Si ya hay uno esperando al registrar, mostramos el banner.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Detectar nuevos SW que se instalan mientras la app está abierta.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Chequear updates cada 30 min mientras la app esté abierta.
        const interval = setInterval(
          () => registration.update().catch(() => {}),
          30 * 60 * 1000,
        );
        return () => clearInterval(interval);
      })
      .catch((err) => {
        console.error("[sw] registro falló:", err);
      });
  }, []);

  function applyUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] animate-fade-up md:inset-x-auto md:right-4 md:bottom-4 md:w-80">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-xl">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-tight">
            Hay una versión nueva
          </p>
          <p className="mt-0.5 text-[11.5px] leading-tight text-muted-foreground">
            Actualizá para ver las últimas mejoras.
          </p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => setUpdateAvailable(false)}
          className="shrink-0 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          aria-label="Descartar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
