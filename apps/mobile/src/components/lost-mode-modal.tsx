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
import { useTranslation } from "../lib/i18n";

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
  const { t } = useTranslation();
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
        t("components.lostMode.missingDataTitle"),
        t("components.lostMode.missingDataBody"),
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
          t("components.lostMode.sessionExpiredTitle"),
          t("components.lostMode.sessionExpiredBody"),
        );
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
        Alert.alert(
          t("common.error"),
          body.error ?? t("components.lostMode.activateFailBody"),
        );
        return;
      }
      const publicUrl = body.slug ? `${env.APP_URL}/lost/${body.slug}` : null;
      reset();
      onActivated();
      onClose();
      if (publicUrl) {
        Alert.alert(
          t("components.lostMode.activatedTitle"),
          t("components.lostMode.activatedBody"),
          [
            {
              text: t("components.lostMode.shareNow"),
              onPress: () => {
                void Share.share({
                  message: t("components.lostMode.shareMessage", {
                    name: animalName,
                    url: publicUrl,
                  }),
                });
              },
            },
            { text: t("components.lostMode.later"), style: "cancel" },
          ],
        );
      }
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
            {t("components.lostMode.title")}
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
                {t("components.lostMode.activate")}
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
                  {t("components.lostMode.intro")}
                </Text>
              </View>
            </View>

            <Field
              label={t("components.lostMode.contactNameLabel")}
              value={contactName}
              onChangeText={setContactName}
              placeholder={t("components.lostMode.contactNamePlaceholder")}
              editable={!sending}
            />
            <Field
              label={t("components.lostMode.contactPhoneLabel")}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder={t("components.lostMode.contactPhonePlaceholder")}
              keyboardType="phone-pad"
              editable={!sending}
            />
            <Field
              label={t("components.lostMode.contactEmailLabel")}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder={t("components.lostMode.contactEmailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!sending}
            />
            <Field
              label={t("components.lostMode.lastSeenLabel")}
              value={lastSeenLocation}
              onChangeText={setLastSeenLocation}
              placeholder={t("components.lostMode.lastSeenPlaceholder")}
              editable={!sending}
            />
            <Field
              label={t("components.lostMode.rewardLabel")}
              value={reward}
              onChangeText={setReward}
              placeholder={t("components.lostMode.rewardPlaceholder")}
              editable={!sending}
            />
            <Field
              label={t("components.lostMode.infoLabel")}
              value={info}
              onChangeText={setInfo}
              placeholder={t("components.lostMode.infoPlaceholder")}
              editable={!sending}
              multiline
            />

            <Text className="mt-2 text-[12px] text-subtle leading-5">
              {t("components.lostMode.footer")}
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
