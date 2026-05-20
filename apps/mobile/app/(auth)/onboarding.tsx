import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Dog, Stethoscope } from "lucide-react-native";
import { randomUUID } from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../src/lib/supabase";
import { useSession } from "../../src/lib/session";
import { useTranslation } from "../../src/lib/i18n";

type Role = "owner" | "vet";

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role>("owner");
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!session) {
      Alert.alert(t("common.error"), t("auth.onboarding.noSession"));
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert(
        t("auth.onboarding.missingNameTitle"),
        t("auth.onboarding.missingNameBody"),
      );
      return;
    }

    setLoading(true);
    const id = randomUUID();
    const userId = session.user.id;

    try {
      if (role === "owner") {
        const { error } = await supabase.from("owner_profiles").insert({
          id,
          user_id: userId,
          full_name: fullName.trim(),
        });
        if (error) throw error;
        router.replace("/(app)/" as never);
      } else {
        const { error } = await supabase.from("vet_profiles").insert({
          id,
          user_id: userId,
          full_name: fullName.trim(),
          license_number: licenseNumber.trim() || null,
          clinic_name: clinicName.trim() || null,
        });
        if (error) throw error;

        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        await supabase.from("subscriptions").insert({
          id: randomUUID(),
          vet_id: id,
          plan: "trial",
          status: "active",
          starts_at: new Date().toISOString(),
          expires_at: trialEnd.toISOString(),
        });

        router.replace("/(app)/vet" as never);
      }
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("auth.onboarding.createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* ─── PROGRESS BAR HEADER ─────────────────────────────── */}
      <View className="px-6 pt-3 pb-2 flex-row items-center justify-between gap-3">
        {step === "details" ? (
          <Pressable
            onPress={() => setStep("role")}
            className="size-9 items-center justify-center rounded-xl bg-surface border border-border"
            style={{ width: 36, height: 36 }}
          >
            <ChevronLeft size={18} color="#0c0a09" />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View className="flex-1 h-[6px] bg-stone-200 rounded-full overflow-hidden max-w-[180px]">
          <LinearGradient
            colors={["#7c3aed", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              width: step === "role" ? "50%" : "100%",
            }}
          />
        </View>

        <View style={{ width: 36 }} />
      </View>

      <Text className="text-center text-[10px] font-extrabold uppercase tracking-widest text-primary mt-1">
        {step === "role"
          ? t("auth.onboarding.roleQuestion").substring(0, 0) || "Paso 1 de 2"
          : "Paso 2 de 2"}
      </Text>

      {step === "role" ? (
        <View className="flex-1 px-6 pt-5">
          <Text className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
            {t("auth.onboarding.roleQuestion")}
          </Text>
          <Text className="mt-2 text-[14.5px] leading-relaxed text-muted">
            {t("auth.onboarding.roleSubtitle")}
          </Text>

          <View className="mt-8 gap-4">
            <RoleCard
              icon={Dog}
              title={t("auth.onboarding.roleOwnerTitle")}
              description={t("auth.onboarding.roleOwnerDesc")}
              tone="primary"
              selected={role === "owner"}
              onPress={() => setRole("owner")}
            />
            <RoleCard
              icon={Stethoscope}
              title={t("auth.onboarding.roleVetTitle")}
              description={t("auth.onboarding.roleVetDesc")}
              tone="accent"
              selected={role === "vet"}
              onPress={() => setRole("vet")}
            />
          </View>

          <View className="mt-auto pb-4">
            <Pressable
              onPress={() => setStep("details")}
              style={{
                shadowColor: role === "owner" ? "#7c3aed" : "#06b6d4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={role === "owner" ? ["#7c3aed", "#a78bfa"] : ["#06b6d4", "#14b8a6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontStyle: "normal", fontWeight: "700" }}>
                  {t("common.continue")}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-[26px] font-bold tracking-tight text-foreground leading-tight">
              {role === "owner"
                ? t("auth.onboarding.detailsTitleOwner")
                : t("auth.onboarding.detailsTitleVet")}
            </Text>
            <Text className="mt-2 text-[14.5px] leading-relaxed text-muted">
              {role === "owner"
                ? t("auth.onboarding.detailsSubtitleOwner")
                : t("auth.onboarding.detailsSubtitleVet")}
            </Text>

            <View className="mt-8 gap-5">
              {/* Full Name Input */}
              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold text-muted">
                  {t("auth.onboarding.fullNameLabel")}
                  <Text className="text-rose"> *</Text>
                </Text>
                <View
                  className="flex-row items-center rounded-xl border border-border bg-surface px-3.5"
                  style={{ height: 50 }}
                >
                  <TextInput
                    className="flex-1 text-[15px] text-foreground"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={
                      role === "vet"
                        ? t("auth.onboarding.fullNamePlaceholderVet")
                        : t("auth.onboarding.fullNamePlaceholderOwner")
                    }
                    placeholderTextColor="#a8a29e"
                    autoFocus
                  />
                </View>
              </View>

              {role === "vet" && (
                <>
                  {/* License Number Input */}
                  <View className="gap-1.5">
                    <View className="flex-row items-baseline justify-between">
                      <Text className="text-[12px] font-semibold text-muted">
                        {t("auth.onboarding.licenseLabel")}
                      </Text>
                      <Text className="text-[10px] text-subtle font-medium">
                        {t("auth.onboarding.optional")}
                      </Text>
                    </View>
                    <View
                      className="flex-row items-center rounded-xl border border-border bg-surface px-3.5"
                      style={{ height: 50 }}
                    >
                      <TextInput
                        className="flex-1 text-[15px] text-foreground"
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        placeholder={t("auth.onboarding.licensePlaceholder")}
                        placeholderTextColor="#a8a29e"
                      />
                    </View>
                  </View>

                  {/* Clinic Name Input */}
                  <View className="gap-1.5">
                    <View className="flex-row items-baseline justify-between">
                      <Text className="text-[12px] font-semibold text-muted">
                        {t("auth.onboarding.clinicLabel")}
                      </Text>
                      <Text className="text-[10px] text-subtle font-medium">
                        {t("auth.onboarding.optional")}
                      </Text>
                    </View>
                    <View
                      className="flex-row items-center rounded-xl border border-border bg-surface px-3.5"
                      style={{ height: 50 }}
                    >
                      <TextInput
                        className="flex-1 text-[15px] text-foreground"
                        value={clinicName}
                        onChangeText={setClinicName}
                        placeholder={t("auth.onboarding.clinicPlaceholder")}
                        placeholderTextColor="#a8a29e"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Finish Account Button */}
              <Pressable
                onPress={loading ? undefined : handleFinish}
                disabled={loading || !fullName.trim()}
                style={{
                  shadowColor: "#7c3aed",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: loading || !fullName.trim() ? 0 : 0.32,
                  shadowRadius: 14,
                  elevation: 4,
                  marginTop: 10,
                  opacity: loading || !fullName.trim() ? 0.6 : 1,
                }}
              >
                <LinearGradient
                  colors={["#7c3aed", "#06b6d4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 52,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                    {t("auth.onboarding.createAccount")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  tone,
  selected,
  onPress,
}: {
  icon: typeof Dog;
  title: string;
  description: string;
  tone: "primary" | "accent";
  selected: boolean;
  onPress: () => void;
}) {
  const activeColor = tone === "primary" ? "#7c3aed" : "#06b6d4";
  return (
    <Pressable
      onPress={onPress}
      className={`relative flex-row items-start gap-4 rounded-2xl border-2 p-5 ${
        selected
          ? tone === "primary"
            ? "border-primary bg-primary/5"
            : "border-accent bg-accent/5"
          : "border-border bg-surface"
      }`}
      style={{
        shadowColor: selected ? activeColor : "#000",
        shadowOffset: { width: 0, height: selected ? 8 : 2 },
        shadowOpacity: selected ? 0.08 : 0.02,
        shadowRadius: selected ? 16 : 6,
        elevation: selected ? 3 : 1,
      }}
    >
      <View
        className={`size-11 items-center justify-center rounded-xl ${
          tone === "primary" ? "bg-primary/10" : "bg-accent/10"
        }`}
        style={{ width: 44, height: 44 }}
      >
        <Icon size={22} color={activeColor} strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-bold text-foreground">{title}</Text>
        <Text className="mt-1 text-[13px] leading-relaxed text-muted">{description}</Text>
      </View>

      {/* Selected indicator check badge */}
      {selected && (
        <View
          className="absolute top-4 right-4 size-5 rounded-full items-center justify-center"
          style={{ backgroundColor: activeColor }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}
