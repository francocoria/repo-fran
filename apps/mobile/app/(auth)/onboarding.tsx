import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dog, Stethoscope } from "lucide-react-native";
import { randomUUID } from "expo-crypto";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
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

  if (step === "role") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 pt-8">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {t("auth.onboarding.roleQuestion")}
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            {t("auth.onboarding.roleSubtitle")}
          </Text>

          <View className="mt-8 gap-3">
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
            <Button
              label={t("common.continue")}
              onPress={() => setStep("details")}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {role === "owner"
              ? t("auth.onboarding.detailsTitleOwner")
              : t("auth.onboarding.detailsTitleVet")}
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            {role === "owner"
              ? t("auth.onboarding.detailsSubtitleOwner")
              : t("auth.onboarding.detailsSubtitleVet")}
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label={t("auth.onboarding.fullNameLabel")}
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder={
                role === "vet"
                  ? t("auth.onboarding.fullNamePlaceholderVet")
                  : t("auth.onboarding.fullNamePlaceholderOwner")
              }
              autoFocus
            />
            {role === "vet" && (
              <>
                <Input
                  label={t("auth.onboarding.licenseLabel")}
                  hint={t("auth.onboarding.optional")}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholder={t("auth.onboarding.licensePlaceholder")}
                />
                <Input
                  label={t("auth.onboarding.clinicLabel")}
                  hint={t("auth.onboarding.optional")}
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder={t("auth.onboarding.clinicPlaceholder")}
                />
              </>
            )}
            <Button
              label={t("auth.onboarding.createAccount")}
              onPress={handleFinish}
              loading={loading}
              fullWidth
              size="lg"
            />
            <Pressable onPress={() => setStep("role")} className="self-center">
              <Text className="text-[14px] text-muted">
                {t("auth.onboarding.goBack")}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  const iconColor = tone === "primary" ? "#7c3aed" : "#06b6d4";
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-3 rounded-2xl border-2 p-4 ${
        selected ? "border-primary bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <View
        className={`size-10 items-center justify-center rounded-xl ${
          tone === "primary" ? "bg-primary/10" : "bg-accent/10"
        }`}
        style={{ width: 40, height: 40 }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-semibold text-foreground">{title}</Text>
        <Text className="mt-0.5 text-[13px] text-muted">{description}</Text>
      </View>
    </Pressable>
  );
}
