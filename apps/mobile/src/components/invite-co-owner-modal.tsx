import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPlus, X } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { env } from "../lib/env";

interface InviteCoOwnerModalProps {
  visible: boolean;
  onClose: () => void;
  animalId: string;
  animalName: string;
}

/**
 * Modal cross-platform (iOS + Android) para invitar un co-dueño.
 * Reemplaza el Alert.prompt que solo funcionaba en iOS.
 */
export function InviteCoOwnerModal({
  visible,
  onClose,
  animalId,
  animalName,
}: InviteCoOwnerModalProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  function reset() {
    setEmail("");
    setSending(false);
  }

  async function handleSend() {
    if (!email.trim()) {
      Alert.alert("Falta email", "Ingresá el email de la persona.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Email inválido", "Revisá la dirección que pusiste.");
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
      const res = await fetch(`${env.APP_URL}/api/co-owner/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ animalId, email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert("Error", body.error ?? "No pudimos enviar la invitación.");
        return;
      }
      Alert.alert("Listo", body.message ?? "Invitación enviada.");
      reset();
      onClose();
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
            Invitar co-dueño
          </Text>
          <Pressable
            onPress={handleSend}
            disabled={sending || !email.trim()}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 10,
              backgroundColor: sending || !email.trim() ? "#cbd5e1" : "#7c3aed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}
              >
                Enviar
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 p-5">
            <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#7c3aed",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserPlus size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-foreground">
                  {animalName}
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Va a poder ver todo el historial y agregar info.
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-[12px] uppercase tracking-wider text-subtle">
              Email del co-dueño
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="pareja@ejemplo.com"
              placeholderTextColor="#a8a29e"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!sending}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: "#e7e5e4",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 15,
                color: "#0c0a09",
                backgroundColor: "#ffffff",
              }}
            />
            <Text className="mt-3 text-[12px] text-subtle leading-5">
              Le va a llegar un email para confirmar. Si todavía no tiene cuenta
              en PetApp, le mandamos un invite para que se registre y
              automáticamente quede como co-dueño.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
