import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Check,
  ChevronDown,
  Heart,
  Languages,
  Lock,
  LogOut,
  Mail,
  Palette,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { useSession, signOut } from "../../src/lib/session";
import { useProfile } from "../../src/lib/session";
import { useAnimals } from "../../src/hooks/use-animals";
import { supabase } from "../../src/lib/supabase";
import { env } from "../../src/lib/env";
import { useTranslation, LOCALES } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const { monthYear } = useLocaleFormat();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const { data: animals } = useAnimals();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const toggle = (key: string) =>
    setOpenRow((cur) => (cur === key ? null : key));

  const activeLocaleLabel =
    LOCALES.find((l) => l.code === locale)?.label ?? locale;

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

  async function handleSignOutAll() {
    Alert.alert(
      t("owner.settings.signOutAll"),
      t("owner.settings.signOutAllBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("owner.settings.signOutConfirm"),
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut({ scope: "global" });
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
  const memberSince = session?.user.created_at
    ? monthYear(session.user.created_at)
    : null;

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
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Heart size={12} color="#7c3aed" fill="#7c3aed" />
                <Text className="text-[11.5px] text-subtle" numberOfLines={1}>
                  {petCount > 0
                    ? t("owner.settings.petCountBadge", { count: petCount })
                    : t("owner.settings.noPets")}
                  {memberSince
                    ? ` · ${t("owner.settings.memberSince", { date: memberSince })}`
                    : ""}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => toggle("personal")}
              hitSlop={8}
              className="items-center justify-center rounded-full bg-primary/10"
              style={{ width: 34, height: 34 }}
            >
              <Pencil size={15} color="#7c3aed" />
            </Pressable>
          </View>
        </View>

        {/* ─── CUENTA ─────────────────────────────────────────── */}
        <SectionLabel text={t("owner.settings.accountGroup")} />
        <View className="px-5">
          <View className="overflow-hidden rounded-[18px] border border-border bg-surface">
            <Row
              icon={User}
              title={t("owner.settings.sectionPersonal")}
              subtitle={t("owner.settings.rowPersonalSub")}
              open={openRow === "personal"}
              onPress={() => toggle("personal")}
              first
            >
              <View className="gap-3.5">
                <Input
                  label={t("owner.settings.fullNameLabel")}
                  required
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t("owner.settings.fullNamePlaceholder")}
                />
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
            </Row>
            <Row
              icon={Mail}
              title={t("owner.settings.emailLabel")}
              subtitle={session?.user.email ?? undefined}
              trailing={<Lock size={15} color="#a8a29e" />}
            />
            <Row
              icon={ShieldCheck}
              title={t("owner.settings.rowSecurity")}
              subtitle={t("owner.settings.rowSecuritySub")}
              open={openRow === "security"}
              onPress={() => toggle("security")}
            >
              <View className="gap-3">
                <Pressable
                  onPress={handleSignOutAll}
                  className="flex-row items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3"
                >
                  <LogOut size={15} color="#0c0a09" />
                  <Text className="text-[13.5px] font-medium text-foreground">
                    {t("owner.settings.signOutAll")}
                  </Text>
                </Pressable>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13.5px] text-foreground">
                    {t("owner.settings.twoFactor")}
                  </Text>
                  <View className="rounded-full bg-surface-2 px-2 py-0.5">
                    <Text className="text-[10.5px] font-semibold text-subtle">
                      {t("owner.settings.comingSoon")}
                    </Text>
                  </View>
                </View>
              </View>
            </Row>
          </View>
        </View>

        {/* ─── PREFERENCIAS ───────────────────────────────────── */}
        <SectionLabel text={t("owner.settings.prefsGroup")} />
        <View className="px-5">
          <View className="overflow-hidden rounded-[18px] border border-border bg-surface">
            <Row
              icon={Languages}
              title={t("owner.settings.rowLanguage")}
              subtitle={activeLocaleLabel}
              open={openRow === "language"}
              onPress={() => toggle("language")}
              first
            >
              <View className="gap-0.5">
                {LOCALES.map((l) => {
                  const active = l.code === locale;
                  return (
                    <Pressable
                      key={l.code}
                      onPress={() => setLocale(l.code)}
                      className="flex-row items-center justify-between rounded-lg px-1 py-2.5"
                    >
                      <Text
                        className={`text-[14px] ${
                          active
                            ? "font-semibold text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {l.label}
                      </Text>
                      {active && <Check size={16} color="#7c3aed" />}
                    </Pressable>
                  );
                })}
              </View>
            </Row>
            <Row
              icon={Bell}
              title={t("owner.settings.rowNotifications")}
              subtitle={t("owner.settings.rowNotificationsSub")}
              open={openRow === "notifications"}
              onPress={() => toggle("notifications")}
            >
              <View className="gap-3">
                <Text className="text-[12.5px] leading-5 text-muted">
                  {t("owner.settings.notifHint")}
                </Text>
                <Pressable
                  onPress={() => void Linking.openSettings()}
                  className="flex-row items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3"
                >
                  <Bell size={15} color="#0c0a09" />
                  <Text className="text-[13.5px] font-medium text-foreground">
                    {t("owner.settings.openSystemSettings")}
                  </Text>
                </Pressable>
              </View>
            </Row>
            <Row
              icon={Palette}
              title={t("owner.settings.rowAppearance")}
              subtitle={t("owner.settings.rowAppearanceSub")}
              open={openRow === "appearance"}
              onPress={() => toggle("appearance")}
            >
              <Text className="text-[12.5px] leading-5 text-muted">
                {t("owner.settings.appearanceHint")}
              </Text>
            </Row>
          </View>
        </View>

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

function Row({
  icon: Icon,
  title,
  subtitle,
  trailing,
  open,
  onPress,
  first,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  open?: boolean;
  onPress?: () => void;
  first?: boolean;
  children?: React.ReactNode;
}) {
  const expandable = !!children;
  return (
    <View className={first ? "" : "border-t border-border/60"}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="flex-row items-center gap-3 px-3.5 py-3"
      >
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 38,
            height: 38,
            backgroundColor: "rgba(124,58,237,0.08)",
          }}
        >
          <Icon size={17} color="#7c3aed" />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="text-[14.5px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[12px] text-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing ??
          (expandable ? (
            <View
              style={{
                transform: [{ rotate: open ? "180deg" : "0deg" }],
              }}
            >
              <ChevronDown size={18} color="#a8a29e" />
            </View>
          ) : null)}
      </Pressable>
      {expandable && open ? (
        <View className="px-3.5 pb-4 pt-0.5">{children}</View>
      ) : null}
    </View>
  );
}
