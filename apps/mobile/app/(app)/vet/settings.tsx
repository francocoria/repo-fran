import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Mail, Trash2 } from "lucide-react-native";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Card } from "../../../src/components/ui/card";
import { useSession, signOut } from "../../../src/lib/session";
import { supabase } from "../../../src/lib/supabase";
import { env } from "../../../src/lib/env";
import { useTranslation } from "../../../src/lib/i18n";
import { LanguageSwitcher } from "../../../src/components/language-switcher";

export default function VetSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("vet_profiles")
      .select("id, full_name, clinic_name, license_number, phone")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setFullName(data.full_name ?? "");
          setClinicName(data.clinic_name ?? "");
          setLicenseNumber(data.license_number ?? "");
          setPhone(data.phone ?? "");
        }
      });
  }, [session]);

  async function handleSave() {
    if (!profileId) return;
    if (!fullName.trim()) {
      Alert.alert(
        t("vet.settings.missingNameTitle"),
        t("vet.settings.missingNameBody"),
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("vet_profiles")
      .update({
        full_name: fullName.trim(),
        clinic_name: clinicName.trim() || null,
        license_number: licenseNumber.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", profileId);
    setSaving(false);
    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }
    Alert.alert(t("common.done"), t("vet.settings.savedBody"));
  }

  async function handleSignOut() {
    Alert.alert(
      t("vet.settings.signOutTitle"),
      t("vet.settings.signOutBody"),
      [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("vet.settings.signOutConfirm"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }

  async function performAccountDeletion() {
    try {
      const {
        data: { session: current },
      } = await supabase.auth.getSession();
      if (!current?.access_token) {
        Alert.alert(
          t("vet.settings.sessionExpiredTitle"),
          t("vet.settings.sessionExpiredBody"),
        );
        return;
      }
      const res = await fetch(`${env.APP_URL}/api/account/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${current.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert(
          t("common.error"),
          body.error ?? t("vet.settings.deleteFailBody"),
        );
        return;
      }
      await signOut();
      router.replace("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.networkError");
      Alert.alert(t("common.error"), msg);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      t("vet.settings.deleteConfirmTitle"),
      t("vet.settings.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.continue"),
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                t("vet.settings.deleteLastTitle"),
                t("vet.settings.deleteLastBodyIos"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: (value?: string) => {
                      if (value?.trim() !== "ELIMINAR") {
                        Alert.alert(
                          t("vet.settings.deleteMismatchTitle"),
                          t("vet.settings.deleteMismatchBody"),
                        );
                        return;
                      }
                      void performAccountDeletion();
                    },
                  },
                ],
                "plain-text",
              );
            } else {
              Alert.alert(
                t("vet.settings.deleteLastTitle"),
                t("vet.settings.deleteLastBodyAndroid"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => void performAccountDeletion(),
                  },
                ],
              );
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Blob ambiental decorativo */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(6, 182, 212, 0.10)",
          }}
        />

        <View className="px-5 pt-3 pb-1">
          <Text className="text-[12px] tracking-wide text-muted">
            {t("vet.settings.eyebrow")}
          </Text>
          <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
            {t("vet.settings.title")}
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            {t("vet.settings.subtitle")}
          </Text>
        </View>

        <View className="px-3 pt-4">
          <Card className="gap-4">
            <Input
              label={t("vet.settings.fullNameLabel")}
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("vet.settings.fullNamePlaceholder")}
            />
            <View className="gap-1">
              <Text className="text-[13px] font-medium text-foreground">
                {t("vet.settings.emailLabel")}
              </Text>
              <View className="flex-row items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <Mail size={14} color="#78716c" />
                <Text className="flex-1 text-[14px] text-muted">{session?.user.email}</Text>
              </View>
            </View>
            <Input
              label={t("vet.settings.clinicLabel")}
              value={clinicName}
              onChangeText={setClinicName}
              placeholder={t("vet.settings.clinicPlaceholder")}
            />
            <Input
              label={t("vet.settings.licenseLabel")}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder={t("vet.settings.licensePlaceholder")}
            />
            <Input
              label={t("vet.settings.phoneLabel")}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("vet.settings.phonePlaceholder")}
              keyboardType="phone-pad"
            />
            <Button
              label={t("common.saveChanges")}
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
          </Card>
        </View>

        <View className="mt-4">
          <LanguageSwitcher />
        </View>

        <View className="mt-6 gap-3 px-3">
          <Button
            label={t("vet.settings.signOut")}
            onPress={handleSignOut}
            variant="outline"
            icon={LogOut}
            fullWidth
          />
          <Button
            label={t("vet.settings.deleteAccount")}
            onPress={handleDeleteAccount}
            variant="rose"
            icon={Trash2}
            fullWidth
          />
          <Text className="px-1 text-center text-[11px] text-subtle">
            {t("vet.settings.deleteWarning")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
