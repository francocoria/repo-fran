import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Mail, PawPrint } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PetAvatar } from "../../src/components/pet-avatar";
import { PawPattern } from "../../src/components/ui/paw-pattern";
import { signInWithOtp } from "../../src/lib/session";
import { useTranslation } from "../../src/lib/i18n";

const HERO_HEIGHT = 280;

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
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
    router.push({
      pathname: "/verify",
      params: { email: email.trim().toLowerCase() },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── HERO ─────────────────────────────────────────── */}
          <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>
            <LinearGradient
              colors={["#e9e4f8", "#fafaf9"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <PawPattern
              width={width}
              height={HERO_HEIGHT}
              color="#7c3aed"
              opacity={0.07}
            />

            {/* Retratos de mascotas */}
            <View
              className="flex-row items-center justify-center"
              style={{ gap: 12, paddingTop: 64 }}
            >
              <View style={{ transform: [{ rotate: "-8deg" }, { translateY: 8 }] }}>
                <PetAvatar name="L" species="dog" size={64} radius={18} />
              </View>
              <View style={{ transform: [{ translateY: -8 }] }}>
                <PetAvatar name="P" species="cat" size={88} radius={24} />
              </View>
              <View style={{ transform: [{ rotate: "8deg" }, { translateY: 8 }] }}>
                <PetAvatar name="M" species="rabbit" size={64} radius={18} />
              </View>
            </View>

            {/* Marca */}
            <View
              className="absolute left-0 right-0 flex-row items-center justify-center"
              style={{ bottom: 20, gap: 10 }}
            >
              <LinearGradient
                colors={["#7c3aed", "#06b6d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PawPrint size={20} color="#fff" strokeWidth={2.4} />
              </LinearGradient>
              <Text className="text-[26px] font-extrabold tracking-tight text-foreground">
                Pet<Text className="text-primary">App</Text>
              </Text>
            </View>
          </View>

          {/* ─── FORM ─────────────────────────────────────────── */}
          <View className="flex-1 px-6 pb-6 pt-7">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-primary">
              {t("auth.login.eyebrow")}
            </Text>
            <Text className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-foreground">
              {t("auth.login.titleLine1")}{" "}
              <Text className="text-primary">{t("auth.login.titleLine2")}</Text>
            </Text>
            <Text className="mt-3 text-[14px] leading-5 text-muted">
              {t("auth.login.subtitle")}
            </Text>

            <View className="mt-6">
              <Text className="mb-1.5 text-[12px] font-semibold text-muted">
                {t("auth.login.emailLabel")}
              </Text>
              <View
                className="flex-row items-center rounded-xl border border-border bg-surface px-3.5"
                style={{ height: 50 }}
              >
                <Mail size={18} color="#78716c" />
                <TextInput
                  className="ml-2.5 flex-1 text-[15px] text-foreground"
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.login.emailPlaceholder")}
                  placeholderTextColor="#a8a29e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            <Pressable
              onPress={loading ? undefined : handleSubmit}
              disabled={loading}
              className="mt-3.5"
              style={{
                shadowColor: "#7c3aed",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.32,
                shadowRadius: 14,
                elevation: 4,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={["#7c3aed", "#06b6d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-[16px] font-semibold text-white">
                      {t("auth.login.sendCode")}
                    </Text>
                    <ArrowRight size={18} color="#fff" strokeWidth={2.4} />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View className="flex-1" />

            <Text className="mt-8 text-center text-[11px] leading-5 text-subtle">
              Al continuar aceptás los{" "}
              <Text className="text-primary font-medium">Términos</Text> y la{" "}
              <Text className="text-primary font-medium">Privacidad</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

