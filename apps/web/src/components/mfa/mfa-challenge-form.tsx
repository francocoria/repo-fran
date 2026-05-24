"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, Input } from "@pet-app/ui";
import { ShieldCheck, Loader2 } from "lucide-react";
import { verifyTotpChallenge } from "@/app/(auth)/mfa-actions";
import { toast } from "sonner";

type Props = {
  factorId: string;
};

export function MfaChallengeForm({ factorId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/app";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("Ingresá los 6 dígitos.");
      return;
    }
    setLoading(true);
    const result = await verifyTotpChallenge(factorId, code);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      setCode("");
      return;
    }
    // El refresh recarga la cookie con AAL2 + ejecuta server components
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Verificación de dos factores</h1>
            <p className="text-sm text-muted-foreground">
              Ingresá el código de 6 dígitos de tu app de autenticación.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center font-mono text-xl tracking-widest"
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length < 6}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Verificar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
