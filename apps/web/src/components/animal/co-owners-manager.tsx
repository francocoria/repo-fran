"use client";

import { useState, useTransition } from "react";
import { inviteCoOwner, removeCoOwner } from "@/app/(owner)/app/actions";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { UserPlus, X, Loader2, AlertCircle, Users, Mail } from "lucide-react";

interface CoOwnerInfo {
  id: string;
  owner_profile: {
    full_name: string;
  } | null;
}

interface CoOwnersManagerProps {
  animalId: string;
  coOwners: CoOwnerInfo[];
  isOwner: boolean;
}

export function CoOwnersManager({ animalId, coOwners, isOwner }: CoOwnersManagerProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await inviteCoOwner(animalId, email);
      if (result.success) {
        setEmail("");
        setShowInvite(false);
      } else {
        setError(result.error ?? "Error");
      }
    });
  }

  function handleRemove(coOwnerId: string) {
    startTransition(async () => {
      const result = await removeCoOwner(animalId, coOwnerId);
      if (!result.success) {
        setError(result.error ?? "Error");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Co-dueños</h3>
          </div>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className="gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invitar
            </Button>
          )}
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="space-y-1">
              <Label htmlFor="coOwnerEmail" className="text-xs">Email del co-dueño</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="coOwnerEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="otro@email.com"
                  className="h-9 text-sm pl-9"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowInvite(false); setError(null); }}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Enviar invitación
              </Button>
            </div>
          </form>
        )}

        {coOwners.length > 0 ? (
          <div className="space-y-2">
            {coOwners.map((co) => (
              <div
                key={co.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {co.owner_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium">{co.owner_profile?.full_name || "Usuario"}</span>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(co.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Remover co-dueño"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isOwner
              ? "Invitá a alguien para que también pueda ver y gestionar a esta mascota."
              : "No hay co-dueños registrados."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
