"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@pet-app/ui";
import { createVetProfile } from "../../actions";
import {
  Stethoscope,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function OnboardingVetPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Ingresá tu nombre (mínimo 2 caracteres).");
      return;
    }
    startTransition(() => { void (async () => {
      const result = await createVetProfile({
        fullName: fullName.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (result.success) {
        router.push("/vet");
      } else {
        setError(result.error ?? "Error al crear perfil");
      }
    })(); });
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent/10">
        <Stethoscope className="size-10 text-accent" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">¡Bienvenido, Doc!</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
        Completá estos datos para empezar a gestionar pacientes.
      </p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
        <Sparkles className="size-4" />
        30 días premium incluidos
      </div>

      <div className="mx-auto mt-6 max-w-sm space-y-3 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">
            Nombre completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dra. Camila Martínez"
            maxLength={100}
            autoFocus
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="licenseNumber">Matrícula profesional</Label>
          <Input
            id="licenseNumber"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Ej: 12345 (opcional)"
            maxLength={50}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clinicName">Clínica</Label>
          <Input
            id="clinicName"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Veterinaria Palermo (opcional)"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 11 1234-5678 (opcional)"
            maxLength={30}
          />
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-5 flex max-w-sm items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="text-left">{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="accent"
        className="mt-6 w-full max-w-sm"
        size="lg"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Empezar a usar PetApp"
        )}
      </Button>
    </form>
  );
}
