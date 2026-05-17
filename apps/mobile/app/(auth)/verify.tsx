import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mail } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { verifyOtp, signInWithOtp } from "../../src/lib/session";
import { useTranslation } from "../../src/lib/i18n";

export default function VerifyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (!code.trim() || code.trim().length < 6) {
      Alert.alert(
        t("auth.verify.invalidCodeTitle"),
        t("auth.verify.invalidCodeBody"),
      );
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(email ?? "", code);
    setLoading(false);
    if (error) {
      Alert.alert(t("auth.verify.wrongCodeTitle"), error.message);
      return;
    }
    router.replace("/");
  }

  async function handleResend() {
    setResending(true);
    const { error } = await signInWithOtp(email ?? "");
    setResending(false);
    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }
    Alert.alert(t("common.done"), t("auth.verify.resentBody"));
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 px-4 py-3">
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">{t("common.back")}</Text>
        </Pressable>

        <View className="flex-1 px-6 pt-4">
          <View className="mb-6 size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail size={26} color="#7c3aed" strokeWidth={2} />
          </View>

          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {t("auth.verify.title")}
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            {t("auth.verify.subtitlePre")}
            <Text className="font-semibold text-foreground">{email}</Text>
            {t("auth.verify.subtitlePost")}
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label={t("auth.verify.codeLabel")}
              required
              value={code}
              onChangeText={setCode}
              placeholder={t("auth.verify.codePlaceholder")}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Button
              label={t("auth.verify.verifyAndEnter")}
              onPress={handleVerify}
              loading={loading}
              fullWidth
              size="lg"
            />
            <Pressable onPress={handleResend} disabled={resending} className="self-center">
              <Text className="text-[14px] font-medium text-primary">
                {resending
                  ? t("auth.verify.resending")
                  : t("auth.verify.resend")}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
