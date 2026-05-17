import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PawPrint } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { signInWithOtp } from "../../src/lib/session";
import { useTranslation } from "../../src/lib/i18n";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert(
        t("auth.login.invalidEmailTitle"),
        t("auth.login.invalidEmailBody"),
      );
      return;
    }
    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }
    router.push({ pathname: "/verify", params: { email: email.trim().toLowerCase() } });
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8">
          <LinearGradient
            colors={["#5eead4", "#06b6d4", "#0891b2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mb-6 size-14 items-center justify-center"
            style={{ borderRadius: 16, width: 56, height: 56 }}
          >
            <PawPrint size={26} color="#fff" strokeWidth={2.2} />
          </LinearGradient>

          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {t("auth.login.title")}
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            {t("auth.login.subtitle")}
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label={t("auth.login.emailLabel")}
              required
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.login.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <Button
              label={t("auth.login.sendCode")}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View className="mt-8 rounded-lg bg-surface-2 p-3">
            <Text className="text-xs text-muted">
              {t("auth.login.noPasswordHint")}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
