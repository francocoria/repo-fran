import { Suspense } from "react";
import { Scanner } from "./scanner";
import { ScanLine } from "lucide-react";

export const metadata = {
  title: "Escanear QR",
};

export default function ScanPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Escanear QR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicitá acceso al historial del paciente escaneando el QR del dueño.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-12 text-center">
            <ScanLine className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        }
      >
        <Scanner />
      </Suspense>
    </div>
  );
}
