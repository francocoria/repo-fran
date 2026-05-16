"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@pet-app/ui";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { updateOwnerProfile } from "./actions";
import { useAutoReset } from "@/lib/use-copy-feedback";

interface Props {
  email: string;
  initialData: {
    fullName: string;
    phone: string | null;
    city: string | null;
    address: string | null;
  };
}

export function SettingsForm({ email, initialData }: Props) {
  const router = useRouter();
  const t = useTranslations("ownerSettings");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  useAutoReset(saved, setSaved, 3000);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(() => { void (async () => {
      const result = await updateOwnerProfile(formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? t("errorSave"));
      }
    })(); });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>
            {t("profileDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              {t("fullName")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                placeholder={t("fullNamePlaceholder")}
                className="pl-10"
                defaultValue={initialData.fullName}
                required
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                disabled
                className="pl-10 opacity-60"
                value={email}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("emailHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t("phonePlaceholder")}
                className="pl-10"
                defaultValue={initialData.phone ?? ""}
                maxLength={30}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">{t("city")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="city"
                  name="city"
                  placeholder={t("cityPlaceholder")}
                  className="pl-10"
                  defaultValue={initialData.city ?? ""}
                  maxLength={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                name="address"
                placeholder={t("addressPlaceholder")}
                defaultValue={initialData.address ?? ""}
                maxLength={200}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("saveChanges")}
            </Button>

            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald animate-fade-in">
                <CheckCircle2 className="size-4" />
                {t("saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
