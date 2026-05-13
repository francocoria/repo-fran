import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Mail, Trash2 } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Card } from "../../src/components/ui/card";
import { useSession, signOut } from "../../src/lib/session";
import { supabase } from "../../src/lib/supabase";
import { env } from "../../src/lib/env";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      Alert.alert("Falta tu nombre", "El nombre no puede estar vacío.");
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
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Listo", "Cambios guardados.");
  }

  async function handleSignOut() {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }

  async function performAccountDeletion() {
    try {
      const {
        data: { session: current },
      } = await supabase.auth.getSession();
      if (!current?.access_token) {
        Alert.alert("Sesión expirada", "Volvé a iniciar sesión.");
        return;
      }
      const res = await fetch(`${env.APP_URL}/api/account/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${current.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert("Error", body.error ?? "No pudimos eliminar la cuenta.");
        return;
      }
      await signOut();
      router.replace("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de red";
      Alert.alert("Error", msg);
    }
  }

  async function handleDeleteAccount() {
    // Doble confirmación. En iOS pedimos escribir "ELIMINAR" (Alert.prompt).
    // En Android (sin prompt nativo) usamos dos alerts simples.
    Alert.alert(
      "¿Eliminar cuenta?",
      "Se borrarán tu perfil, todas tus mascotas, vacunas, alergias, accesos a veterinarios y suscripciones. Esta acción NO se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Última confirmación",
                'Escribí "ELIMINAR" (en mayúsculas) para confirmar.',
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: (value?: string) => {
                      if (value?.trim() !== "ELIMINAR") {
                        Alert.alert(
                          "No coincide",
                          'Tenías que escribir "ELIMINAR" exacto.',
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
                "Última confirmación",
                "Tocá 'Eliminar' para borrar tu cuenta y todos los datos.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-[24px] font-bold tracking-tight text-foreground">
            Configuración
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            Gestioná tu información personal.
          </Text>
        </View>

        <View className="px-3 pt-4">
          <Card className="gap-4">
            <Input
              label="Nombre completo"
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder="Tu nombre"
            />
            <View className="gap-1">
              <Text className="text-[13px] font-medium text-foreground">Email</Text>
              <View className="flex-row items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <Mail size={14} color="#78716c" />
                <Text className="flex-1 text-[14px] text-muted">{session?.user.email}</Text>
              </View>
              <Text className="text-xs text-subtle">El email no se puede cambiar.</Text>
            </View>
            <Input
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="+54 11 1234-5678"
              keyboardType="phone-pad"
            />
            <Input
              label="Ciudad"
              value={city}
              onChangeText={setCity}
              placeholder="Buenos Aires"
            />
            <Button label="Guardar cambios" onPress={handleSave} loading={saving} fullWidth />
          </Card>
        </View>

        <View className="mt-6 gap-3 px-3">
          <Button
            label="Cerrar sesión"
            onPress={handleSignOut}
            variant="outline"
            icon={LogOut}
            fullWidth
          />
          <Button
            label="Eliminar mi cuenta"
            onPress={handleDeleteAccount}
            variant="rose"
            icon={Trash2}
            fullWidth
          />
          <Text className="px-1 text-center text-[11px] text-subtle">
            Esta acción es irreversible. Se borran tus mascotas y todo el historial.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
