"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@pet-app/ui";
import { logout } from "@/app/(auth)/actions";

export function LogoutButton() {
  const t = useTranslations("appHeader");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void (async () => {
            await logout();
          })();
        })
      }
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <LogOut className="size-3.5" />
      )}
      {t("logout")}
    </Button>
  );
}
