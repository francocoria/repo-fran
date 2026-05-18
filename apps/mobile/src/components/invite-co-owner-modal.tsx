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
import { useTranslation } from "../lib/i18n";

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
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  function reset() {
    setEmail("");
    setSending(false);
  }

  async function handleSend() {
    if (!email.trim()) {
      Alert.alert(
        t("components.inviteCoOwner.missingEmailTitle"),
        t("components.inviteCoOwner.missingEmailBody"),
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(
        t("components.inviteCoOwner.invalidEmailTitle"),
        t("components.inviteCoOwner.invalidEmailBody"),
      );
      return;
    }
    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert(
          t("components.inviteCoOwner.sessionExpiredTitle"),
          t("components.inviteCoOwner.sessionExpiredBody"),
        );
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
        Alert.alert(
          t("common.error"),
          body.error ?? t("components.inviteCoOwner.sendFailBody"),
        );
        return;
      }
      Alert.alert(
        t("common.done"),
        body.message ?? t("components.inviteCoOwner.sentBody"),
      );
      reset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.networkError");
      Alert.alert(t("common.error"), msg);
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
            {t("components.inviteCoOwner.title")}
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
                {t("components.inviteCoOwner.send")}
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
                  {t("components.inviteCoOwner.intro")}
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-[12px] uppercase tracking-wider text-subtle">
              {t("components.inviteCoOwner.emailLabel")}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("components.inviteCoOwner.emailPlaceholder")}
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
              {t("components.inviteCoOwner.footer")}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
