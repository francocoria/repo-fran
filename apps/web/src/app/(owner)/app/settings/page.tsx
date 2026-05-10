"use client";

import { useState, useTransition } from "react";
import { Button } from "@pet-app/ui";
import { Input } from "@pet-app/ui";
import { Label } from "@pet-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@pet-app/ui";
import { User, Mail, Phone, MapPin, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Página de configuración del perfil del dueño.
 * TODO: Conectar con server action real en Semana 3.
 */
export default function OwnerSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      // TODO: Server action updateOwnerProfile(formData)
      await new Promise((r) => setTimeout(r, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Gestioná tu información personal.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Esta información se comparte con los veterinarios que tengan acceso
              a tus mascotas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Tu nombre"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  className="pl-10 opacity-60"
                  placeholder="tu@email.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El email no se puede cambiar.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="city"
                    name="city"
                    placeholder="Buenos Aires"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Calle 123 (opcional)"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </Button>

              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-primary animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  Guardado
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
