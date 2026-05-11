import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mail } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { verifyOtp, signInWithOtp } from "../../src/lib/session";

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (!code.trim() || code.trim().length < 6) {
      Alert.alert("Código inválido", "Ingresá los 6 dígitos del email.");
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(email ?? "", code);
    setLoading(false);
    if (error) {
      Alert.alert("Código incorrecto", error.message);
      return;
    }
    router.replace("/");
  }

  async function handleResend() {
    setResending(true);
    const { error } = await signInWithOtp(email ?? "");
    setResending(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Listo", "Te mandamos un código nuevo.");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 px-4 py-3">
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">Volver</Text>
        </Pressable>

        <View className="flex-1 px-6 pt-4">
          <View className="mb-6 size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail size={26} color="#7c3aed" strokeWidth={2} />
          </View>

          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            Revisá tu email
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            Te mandamos un código a{" "}
            <Text className="font-semibold text-foreground">{email}</Text>.
            Ingresalo abajo para entrar.
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label="Código de 6 dígitos"
              required
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Button
              label="Verificar y entrar"
              onPress={handleVerify}
              loading={loading}
              fullWidth
              size="lg"
            />
            <Pressable onPress={handleResend} disabled={resending} className="self-center">
              <Text className="text-[14px] font-medium text-primary">
                {resending ? "Reenviando..." : "No me llegó, reenviar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
