import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PawPrint } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { signInWithOtp } from "../../src/lib/session";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Email inválido", "Ingresá un email válido.");
      return;
    }
    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
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
            Bienvenido a PetApp
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            Ingresá tu email y te mandamos un código de 6 dígitos para entrar.
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label="Email"
              required
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <Button
              label="Enviar código"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View className="mt-8 rounded-lg bg-surface-2 p-3">
            <Text className="text-xs text-muted">
              No tenés que recordar contraseña — usamos códigos por email cada
              vez que entrás desde un dispositivo nuevo.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
