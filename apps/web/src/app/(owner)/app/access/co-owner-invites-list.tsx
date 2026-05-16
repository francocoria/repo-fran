"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Check,
  Loader2,
  PawPrint,
  UserPlus,
  X,
  Dog,
  Cat,
  Bird,
  Rabbit,
} from "lucide-react";
import { Button, Card, CardContent } from "@pet-app/ui";
import {
  acceptCoOwnerInvite,
  declineCoOwnerInvite,
} from "@/app/(owner)/app/actions";

export interface CoOwnerInviteRow {
  id: string;
  invitedAt: string;
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
  };
  inviter: { full_name: string | null };
}

const speciesIcons: Record<string, React.ComponentType<{ className?: string }>> =
  {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
  };

export function CoOwnerInvitesList({
  invites,
}: {
  invites: CoOwnerInviteRow[];
}) {
  const t = useTranslations("ownerAccess");
  if (invites.length === 0) {
    return (
      <Card>
        <CardContent className="px-5 py-6 text-center">
          <PawPrint className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noInvites")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {invites.map((invite) => (
        <InviteCard key={invite.id} invite={invite} />
      ))}
    </div>
  );
}

const SPECIES_KEYS: Record<string, string> = {
  dog: "speciesDog",
  cat: "speciesCat",
  bird: "speciesBird",
  rabbit: "speciesRabbit",
  rodent: "speciesRodent",
  reptile: "speciesReptile",
  fish: "speciesFish",
  exotic: "speciesExotic",
  other: "speciesOther",
};

function InviteCard({ invite }: { invite: CoOwnerInviteRow }) {
  const router = useRouter();
  const t = useTranslations("ownerAccess");
  const tc = useTranslations("ownerCommon");
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const Icon = speciesIcons[invite.animal.species] ?? PawPrint;
  const speciesKey = SPECIES_KEYS[invite.animal.species];
  const speciesLabel = speciesKey
    ? tc(speciesKey as Parameters<typeof tc>[0])
    : invite.animal.species;

  function handle(kind: "accept" | "decline") {
    setError(null);
    setAction(kind);
    startTransition(() => {
      void (async () => {
        const fn = kind === "accept" ? acceptCoOwnerInvite : declineCoOwnerInvite;
        try {
          const result = await fn(invite.id);
          if (result.success) {
            router.refresh();
          } else {
            setError(result.error ?? t("inviteGenericError"));
            setAction(null);
          }
        } catch (err) {
          // Típico cuando la Server Action ID quedó desactualizada en el
          // bundle cliente (PWA cacheada vs deploy nuevo). Antes esto se
          // tragaba silencioso y daba la sensación de "no hace nada".
          console.error("[CoOwnerInvite] action call failed:", err);
          setError(t("inviteStaleError"));
          setAction(null);
        }
      })();
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
            {invite.animal.photo_url ? (
              <Image
                src={invite.animal.photo_url}
                alt={invite.animal.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Icon className="size-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <UserPlus className="size-3.5 shrink-0 text-primary" />
              <p className="truncate text-[12.5px] font-medium text-primary">
                {t("invitedYou", {
                  name: invite.inviter.full_name ?? t("inviteFallbackName"),
                })}
              </p>
            </div>
            <p className="mt-0.5 truncate text-base font-semibold">
              {invite.animal.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {speciesLabel}
              {invite.animal.breed && ` · ${invite.animal.breed}`}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handle("accept")}
            disabled={isPending}
            className="flex-1 gap-1.5"
          >
            {isPending && action === "accept" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            {t("accept")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handle("decline")}
            disabled={isPending}
            className="flex-1 gap-1.5"
          >
            {isPending && action === "decline" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            {t("rejectInvite")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
