import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, X } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { env } from "../lib/env";

interface LostModeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Se llama tras activar con éxito — para refrescar la mascota. */
  onActivated: () => void;
  animalId: string;
  animalName: string;
}

const INPUT_STYLE = {
  borderWidth: 1,
  borderColor: "#e7e5e4",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 15,
  color: "#0c0a09",
  backgroundColor: "#ffffff",
} as const;

/**
 * Modal para activar el modo perdido de una mascota desde el celular.
 * Genera una página pública que se puede compartir.
 */
export function LostModeModal({
  visible,
  onClose,
  onActivated,
  animalId,
  animalName,
}: LostModeModalProps) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [reward, setReward] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);

  function reset() {
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setLastSeenLocation("");
    setReward("");
    setInfo("");
    setSending(false);
  }

  const canSubmit = contactName.trim().length > 0 && contactPhone.trim().length >= 5;

  async function handleSubmit() {
    if (!canSubmit) {
      Alert.alert(
        "Faltan datos",
        "El nombre y el teléfono de contacto son obligatorios.",
      );
      return;
    }
    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert("Sesión expirada", "Volvé a iniciar sesión.");
        return;
      }
      const res = await fetch(`${env.APP_URL}/api/lost-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          animalId,
          action: "activate",
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          lastSeenLocation: lastSeenLocation.trim(),
          rewardDescription: reward.trim(),
          additionalInfo: info.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert("Error", body.error ?? "No pudimos activar el modo perdido.");
        return;
      }
      const publicUrl = body.slug ? `${env.APP_URL}/lost/${body.slug}` : null;
      reset();
      onActivated();
      onClose();
      if (publicUrl) {
        Alert.alert(
          "Modo perdido activado",
          "Ya está online la página pública de búsqueda. Compartila por todos lados.",
          [
            {
              text: "Compartir ahora",
              onPress: () => {
                void Share.share({
                  message: `🔴 SE PERDIÓ ${animalName}. Ayudanos a encontrarla:\n${publicUrl}`,
                });
              },
            },
            { text: "Después", style: "cancel" },
          ],
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de red";
      Alert.alert("Error", msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
            disabled={sending}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#0c0a09" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-foreground">
            Reportar como perdida
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={sending || !canSubmit}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 10,
              backgroundColor: sending || !canSubmit ? "#cbd5e1" : "#e11d48",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>
                Activar
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-rose/30 bg-rose/5 p-4">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#e11d48",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-foreground">
                  {animalName}
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Generamos una página pública con esta info para que
                  cualquiera que la encuentre te pueda contactar.
                </Text>
              </View>
            </View>

            <Field
              label="Nombre de contacto *"
              value={contactName}
              onChangeText={setContactName}
              placeholder="Tu nombre"
              editable={!sending}
            />
            <Field
              label="Teléfono de contacto *"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+54 11 1234-5678"
              keyboardType="phone-pad"
              editable={!sending}
            />
            <Field
              label="Email de contacto"
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="tu@email.com (opcional)"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!sending}
            />
            <Field
              label="Última ubicación vista"
              value={lastSeenLocation}
              onChangeText={setLastSeenLocation}
              placeholder="Plaza, barrio, esquina... (opcional)"
              editable={!sending}
            />
            <Field
              label="Recompensa"
              value={reward}
              onChangeText={setReward}
              placeholder="Si ofrecés recompensa (opcional)"
              editable={!sending}
            />
            <Field
              label="Información adicional"
              value={info}
              onChangeText={setInfo}
              placeholder="Detalles que ayuden a identificarla (opcional)"
              editable={!sending}
              multiline
            />

            <Text className="mt-2 text-[12px] text-subtle leading-5">
              Cuando la encuentres, marcala como encontrada desde la pantalla
              de la mascota y la página pública se desactiva al instante.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="mb-1.5 text-[12px] uppercase tracking-wider text-subtle">
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#a8a29e"
        autoCorrect={false}
        multiline={multiline}
        style={[
          INPUT_STYLE,
          multiline ? { height: 88, textAlignVertical: "top" } : null,
        ]}
        {...props}
      />
    </View>
  );
}
