import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Mail, Trash2 } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Card } from "../../src/components/ui/card";
import { useSession, signOut } from "../../src/lib/session";
import { supabase } from "../../src/lib/supabase";
import { env } from "../../src/lib/env";
import { useTranslation } from "../../src/lib/i18n";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("owner_profiles")
      .select("id, full_name, phone, city")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
          setCity(data.city ?? "");
        }
      });
  }, [session]);

  async function handleSave() {
    if (!profileId) return;
    if (!fullName.trim()) {
      Alert.alert(
        t("owner.settings.missingNameTitle"),
        t("owner.settings.missingNameBody"),
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("owner_profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", profileId);
    setSaving(false);
    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }
    Alert.alert(t("common.done"), t("owner.settings.savedBody"));
  }

  async function handleSignOut() {
    Alert.alert(
      t("owner.settings.signOutTitle"),
      t("owner.settings.signOutBody"),
      [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("owner.settings.signOutConfirm"),
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
          t("owner.settings.sessionExpiredTitle"),
          t("owner.settings.sessionExpiredBody"),
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
          body.error ?? t("owner.settings.deleteFailBody"),
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
    // Doble confirmación. En iOS pedimos escribir "ELIMINAR" (Alert.prompt).
    // En Android (sin prompt nativo) usamos dos alerts simples.
    Alert.alert(
      t("owner.settings.deleteConfirmTitle"),
      t("owner.settings.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.continue"),
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                t("owner.settings.deleteLastTitle"),
                t("owner.settings.deleteLastBodyIos"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: (value?: string) => {
                      if (value?.trim() !== "ELIMINAR") {
                        Alert.alert(
                          t("owner.settings.deleteMismatchTitle"),
                          t("owner.settings.deleteMismatchBody"),
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
                t("owner.settings.deleteLastTitle"),
                t("owner.settings.deleteLastBodyAndroid"),
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
        <View className="px-5 pt-4 pb-2">
          <Text className="text-[24px] font-bold tracking-tight text-foreground">
            {t("owner.settings.title")}
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            {t("owner.settings.subtitle")}
          </Text>
        </View>

        <View className="px-3 pt-4">
          <Card className="gap-4">
            <Input
              label={t("owner.settings.fullNameLabel")}
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("owner.settings.fullNamePlaceholder")}
            />
            <View className="gap-1">
              <Text className="text-[13px] font-medium text-foreground">
                {t("owner.settings.emailLabel")}
              </Text>
              <View className="flex-row items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <Mail size={14} color="#78716c" />
                <Text className="flex-1 text-[14px] text-muted">{session?.user.email}</Text>
              </View>
              <Text className="text-xs text-subtle">
                {t("owner.settings.emailCantChange")}
              </Text>
            </View>
            <Input
              label={t("owner.settings.phoneLabel")}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("owner.settings.phonePlaceholder")}
              keyboardType="phone-pad"
            />
            <Input
              label={t("owner.settings.cityLabel")}
              value={city}
              onChangeText={setCity}
              placeholder={t("owner.settings.cityPlaceholder")}
            />
            <Button
              label={t("common.saveChanges")}
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
          </Card>
        </View>

        <View className="mt-6 gap-3 px-3">
          <Button
            label={t("owner.settings.signOut")}
            onPress={handleSignOut}
            variant="outline"
            icon={LogOut}
            fullWidth
          />
          <Button
            label={t("owner.settings.deleteAccount")}
            onPress={handleDeleteAccount}
            variant="rose"
            icon={Trash2}
            fullWidth
          />
          <Text className="px-1 text-center text-[11px] text-subtle">
            {t("owner.settings.deleteWarning")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
