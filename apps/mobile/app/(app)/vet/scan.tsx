import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Camera, ChevronLeft, ScanLine } from "lucide-react-native";
import { randomUUID } from "expo-crypto";
import { Button } from "../../../src/components/ui/button";
import { supabase } from "../../../src/lib/supabase";
import { useTranslation } from "../../../src/lib/i18n";

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  async function handleQrScanned({ data }: { data: string }) {
    if (!scanning || processing) return;
    setScanning(false);
    setProcessing(true);

    try {
      const url = data.trim();
      const tokenMatch = url.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : url;

      const { data: animal, error } = await supabase
        .from("animals")
        .select("id, name, owner_id, photo_url, species")
        .eq("url_token", token)
        .maybeSingle();

      if (error || !animal) {
        Alert.alert(
          t("vet.scan.qrNotRecognizedTitle"),
          t("vet.scan.qrNotRecognizedBody"),
          [{ text: t("common.retry"), onPress: () => setScanning(true) }],
        );
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t("common.error"), t("vet.scan.notAuthBody"));
        return;
      }

      const { data: vetProfile } = await supabase
        .from("vet_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!vetProfile) {
        Alert.alert(t("common.error"), t("vet.scan.noVetProfileBody"));
        return;
      }

      const { data: existing } = await supabase
        .from("vet_access")
        .select("id, status")
        .eq("animal_id", animal.id)
        .eq("vet_id", vetProfile.id)
        .maybeSingle();

      if (existing?.status === "approved") {
        router.replace(`/(app)/vet/patients/${animal.id}` as never);
        return;
      }

      if (existing?.status === "pending") {
        Alert.alert(
          t("vet.scan.alreadyRequestedTitle"),
          t("vet.scan.alreadyRequestedBody", { name: animal.name }),
        );
        router.back();
        return;
      }

      const { error: insertError } = await supabase.from("vet_access").insert({
        id: randomUUID(),
        animal_id: animal.id,
        vet_id: vetProfile.id,
        status: "pending",
      });

      if (insertError) {
        Alert.alert(t("common.error"), insertError.message);
        return;
      }

      Alert.alert(
        t("vet.scan.requestSentTitle"),
        t("vet.scan.requestSentBody", { name: animal.name }),
        [{ text: t("vet.scan.ok"), onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("vet.scan.somethingWrong"));
      setScanning(true);
    } finally {
      setProcessing(false);
    }
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">{t("vet.scan.loadingCamera")}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 px-4 py-3">
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">{t("common.back")}</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-6">
          <Camera size={56} color="#d6d3d1" />
          <Text className="mt-4 text-center text-[16px] font-semibold text-foreground">
            {t("vet.scan.permissionTitle")}
          </Text>
          <Text className="mt-2 text-center text-[13px] text-muted">
            {t("vet.scan.permissionBody")}
          </Text>
          <View className="mt-6">
            <Button
              label={t("vet.scan.grantPermission")}
              onPress={requestPermission}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? handleQrScanned : undefined}
      />

      <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          className="m-4 size-10 items-center justify-center rounded-full bg-black/50"
          style={{ width: 40, height: 40 }}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>

        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <View
            style={{
              width: 260,
              height: 260,
              borderWidth: 3,
              borderColor: "#06b6d4",
              borderRadius: 24,
              backgroundColor: "rgba(6,182,212,0.05)",
            }}
          />
        </View>

        <View className="px-6 pb-10">
          <View className="flex-row items-center justify-center gap-2 rounded-full bg-black/60 px-4 py-3">
            <ScanLine size={18} color="#fff" />
            <Text className="text-[14px] font-medium text-white">
              {processing ? t("vet.scan.processing") : t("vet.scan.aimQr")}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
