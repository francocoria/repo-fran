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
import Svg, { Path } from "react-native-svg";
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

            {/* O divider */}
            <View className="mt-5 flex-row items-center gap-3">
              <View className="h-[1px] flex-1 bg-border" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-subtle">
                o
              </Text>
              <View className="h-[1px] flex-1 bg-border" />
            </View>

            {/* Apple & Google buttons */}
            <View className="mt-3.5 flex-row gap-2.5">
              <Pressable
                onPress={() => Alert.alert("Próximamente", "El inicio de sesión con Apple estará disponible pronto.")}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3"
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="#0c0a09">
                  <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </Svg>
                <Text className="text-[13px] font-semibold text-foreground">Apple</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert("Próximamente", "El inicio de sesión con Google estará disponible pronto.")}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3"
              >
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#fbbc04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <Path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </Svg>
                <Text className="text-[13px] font-semibold text-foreground">Google</Text>
              </Pressable>
            </View>

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

