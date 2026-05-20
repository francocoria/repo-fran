import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut, Mail, Trash2 } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { useSession, signOut } from "../../src/lib/session";
import { useProfile } from "../../src/lib/session";
import { useAnimals } from "../../src/hooks/use-animals";
import { supabase } from "../../src/lib/supabase";
import { env } from "../../src/lib/env";
import { useTranslation } from "../../src/lib/i18n";
import { LanguageSwitcher } from "../../src/components/language-switcher";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const { data: animals } = useAnimals();

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
      ],
    );
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

  const name = profile?.full_name ?? fullName ?? "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "·";
  const petCount = animals?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Blob ambiental */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(124, 58, 237, 0.10)",
          }}
        />

        {/* Header */}
        <View className="px-5 pb-1 pt-3">
          <Text className="text-[12px] tracking-wide text-muted">
            {t("owner.settings.eyebrow")}
          </Text>
          <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
            {t("owner.settings.title")}
          </Text>
        </View>

        {/* Avatar + nombre card */}
        <View className="px-5 pt-4">
          <View
            className="flex-row items-center gap-3.5 rounded-[18px] border border-border bg-surface p-4"
            style={{
              shadowColor: "#0c0a09",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.06,
              shadowRadius: 18,
              elevation: 2,
            }}
          >
            <LinearGradient
              colors={["#7c3aed", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  textShadowColor: "rgba(0,0,0,0.18)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {initials}
              </Text>
            </LinearGradient>
            <View className="min-w-0 flex-1">
              <Text className="text-[18px] font-bold tracking-tight text-foreground">
                {name || "—"}
              </Text>
              <Text className="mt-0.5 text-[12.5px] text-muted" numberOfLines={1}>
                {session?.user.email}
              </Text>
              {petCount > 0 ? (
                <View className="mt-2 flex-row gap-2">
                  <View className="rounded-full bg-primary/10 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold tracking-wider text-primary">
                      {t("owner.settings.petCountBadge", { count: petCount })}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Sección: Datos personales */}
        <SectionLabel text={t("owner.settings.sectionPersonal")} />
        <View className="px-5">
          <View
            className="rounded-[18px] border border-border bg-surface p-4"
            style={{
              shadowColor: "#0c0a09",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 1,
            }}
          >
            <View className="gap-3.5">
              <Input
                label={t("owner.settings.fullNameLabel")}
                required
                value={fullName}
                onChangeText={setFullName}
                placeholder={t("owner.settings.fullNamePlaceholder")}
              />
              <View className="gap-1.5">
                <Text className="text-[13px] font-medium text-foreground">
                  {t("owner.settings.emailLabel")}
                </Text>
                <View className="flex-row items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-3">
                  <Mail size={14} color="#78716c" />
                  <Text className="flex-1 text-[14px] text-muted" numberOfLines={1}>
                    {session?.user.email}
                  </Text>
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
            </View>
          </View>
        </View>

        {/* Sección: Preferencias / Idioma */}
        <SectionLabel text={t("owner.settings.sectionLanguage")} />
        <LanguageSwitcher />

        {/* Logout + Eliminar */}
        <View className="mt-6 gap-2.5 px-5">
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 rounded-[14px] border border-border bg-surface py-3.5"
          >
            <LogOut size={17} color="#0c0a09" strokeWidth={2} />
            <Text className="text-[14px] font-semibold text-foreground">
              {t("owner.settings.signOut")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-center gap-2 rounded-[14px] border border-rose/30 bg-rose/[0.06] py-3.5"
          >
            <Trash2 size={17} color="#e11d48" strokeWidth={2} />
            <Text className="text-[14px] font-semibold text-rose">
              {t("owner.settings.deleteAccount")}
            </Text>
          </Pressable>
          <Text className="mt-1 px-2 text-center text-[11.5px] leading-5 text-subtle">
            {t("owner.settings.deleteWarning")}
          </Text>
        </View>

        <Text className="mt-6 text-center text-[11px] text-subtle">
          {t("owner.settings.appFooter")} · 🇦🇷
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="mb-2 mt-6 px-7 text-[11px] font-bold uppercase tracking-wider text-subtle">
      {text}
    </Text>
  );
}
