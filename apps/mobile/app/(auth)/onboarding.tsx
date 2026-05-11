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

type Role = "owner" | "vet";

export default function OnboardingScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role>("owner");
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!session) {
      Alert.alert("Error", "No hay sesión activa.");
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert("Falta tu nombre", "Ingresá tu nombre completo.");
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
      Alert.alert("Error", e?.message ?? "No pudimos crear tu perfil.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "role") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 pt-8">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            ¿Quién sos?
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            Elegí el tipo de cuenta para empezar.
          </Text>

          <View className="mt-8 gap-3">
            <RoleCard
              icon={Dog}
              title="Soy dueño"
              description="Quiero llevar el control de la salud de mi mascota."
              tone="primary"
              selected={role === "owner"}
              onPress={() => setRole("owner")}
            />
            <RoleCard
              icon={Stethoscope}
              title="Soy veterinario"
              description="Quiero atender pacientes y registrar consultas."
              tone="accent"
              selected={role === "vet"}
              onPress={() => setRole("vet")}
            />
          </View>

          <View className="mt-auto pb-4">
            <Button
              label="Continuar"
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
            {role === "owner" ? "Tu perfil" : "Datos profesionales"}
          </Text>
          <Text className="mt-2 text-[15px] text-muted">
            {role === "owner"
              ? "Solo necesitamos tu nombre para empezar."
              : "Completá tu información profesional."}
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label="Nombre completo"
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder={role === "vet" ? "Dra. Camila Martínez" : "Tu nombre"}
              autoFocus
            />
            {role === "vet" && (
              <>
                <Input
                  label="Matrícula profesional"
                  hint="Opcional"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholder="Ej: 12345"
                />
                <Input
                  label="Clínica"
                  hint="Opcional"
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="Veterinaria Palermo"
                />
              </>
            )}
            <Button
              label="Crear cuenta"
              onPress={handleFinish}
              loading={loading}
              fullWidth
              size="lg"
            />
            <Pressable onPress={() => setStep("role")} className="self-center">
              <Text className="text-[14px] text-muted">Volver atrás</Text>
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
