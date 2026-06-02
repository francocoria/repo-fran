import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  History,
  KeyRound,
  ScanLine,
  Send,
  X,
} from "lucide-react-native";
import { randomUUID } from "expo-crypto";
import { Button } from "../../../src/components/ui/button";
import { supabase } from "../../../src/lib/supabase";
import { useTranslation } from "../../../src/lib/i18n";
import { useLocaleFormat } from "../../../src/lib/i18n/format";

type MatchStatus = "approved" | "pending" | "none" | "sent";

interface MatchState {
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
    photo_url: string | null;
  };
  severeAllergies: string[];
  vetId: string;
  status: MatchStatus;
}

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { speciesLabel, ageLabel } = useLocaleFormat();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  function handleQrScanned({ data }: { data: string }) {
    if (!scanning || processing) return;
    void processCode(data);
  }

  async function processCode(raw: string) {
    setScanning(false);
    setProcessing(true);

    try {
      const url = raw.trim();
      const tokenMatch = url.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : url;

      const { data: animal, error } = await supabase
        .from("animals")
        .select("id, name, owner_id, photo_url, species, breed, birth_date")
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      const status: MatchStatus =
        existing?.status === "approved"
          ? "approved"
          : existing?.status === "pending"
            ? "pending"
            : "none";

      // Alergias graves: se muestran si el vet ya tiene acceso. Si RLS las
      // bloquea (sin acceso aprobado), la lista queda vacía — sin fugas.
      const { data: allergyRows } = await supabase
        .from("allergies")
        .select("allergen")
        .eq("animal_id", animal.id)
        .eq("severity", "severe");

      setManualOpen(false);
      setManualValue("");
      setMatch({
        animal: {
          id: animal.id,
          name: animal.name,
          species: animal.species,
          breed: animal.breed,
          birth_date: animal.birth_date,
          photo_url: animal.photo_url,
        },
        severeAllergies: (allergyRows ?? []).map((a) => a.allergen),
        vetId: vetProfile.id,
        status,
      });
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("vet.scan.somethingWrong"));
      setScanning(true);
    } finally {
      setProcessing(false);
    }
  }

  async function requestAccess() {
    if (!match) return;
    setRequesting(true);
    const { error: insertError } = await supabase.from("vet_access").insert({
      id: randomUUID(),
      animal_id: match.animal.id,
      vet_id: match.vetId,
      status: "pending",
    });
    setRequesting(false);
    if (insertError) {
      Alert.alert(t("common.error"), insertError.message);
      return;
    }
    setMatch({ ...match, status: "sent" });
  }

  function scanAgain() {
    setMatch(null);
    setScanning(true);
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
        onBarcodeScanned={scanning && !match ? handleQrScanned : undefined}
      />

      <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          className="m-4 size-10 items-center justify-center rounded-full bg-black/50"
          style={{ width: 40, height: 40 }}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>

        {!match && (
          <>
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
              <Pressable
                onPress={() => setManualOpen(true)}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 py-3"
              >
                <KeyRound size={16} color="#fff" />
                <Text className="text-[13.5px] font-semibold text-white">
                  {t("vet.scan.manualEntry")}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>

      {match && (
        <View className="absolute inset-0 items-center justify-center bg-black/75 px-6">
          <View
            className="w-full items-center rounded-3xl bg-surface px-6 py-8"
            style={{ maxWidth: 360 }}
          >
            <View className="flex-row items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1">
              <CheckCircle2 size={14} color="#10b981" />
              <Text className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald">
                {t("vet.scan.matchSubtitle")}
              </Text>
            </View>
            <Text className="mt-2.5 text-[30px] font-extrabold tracking-tight text-foreground">
              {t("vet.scan.matchTitle")}
            </Text>

            <View className="mt-4 items-center">
              {match.animal.photo_url ? (
                <Image
                  source={{ uri: match.animal.photo_url }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                />
              ) : (
                <LinearGradient
                  colors={["#06b6d4", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[30px] font-bold text-white">
                    {match.animal.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              <Text className="mt-3 text-[19px] font-bold text-foreground">
                {match.animal.name}
              </Text>
              <Text className="text-[13px] text-muted">
                {[
                  speciesLabel(match.animal.species) +
                    (match.animal.breed ? ` · ${match.animal.breed}` : ""),
                  match.animal.birth_date
                    ? ageLabel(match.animal.birth_date)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            {match.severeAllergies.length > 0 && (
              <View className="mt-4 w-full flex-row items-center gap-2.5 rounded-xl bg-rose px-3.5 py-3">
                <AlertTriangle size={17} color="#fff" strokeWidth={2.4} />
                <View className="flex-1">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">
                    {t("vet.patientDetail.severeAllergyTitle")}
                  </Text>
                  <Text className="text-[13px] font-bold leading-tight text-white">
                    {t("vet.patientDetail.doNotAdminister")}{" "}
                    {match.severeAllergies.join(", ")}
                  </Text>
                </View>
              </View>
            )}

            {match.status === "approved" && (
              <Text className="mt-4 text-center text-[12.5px] text-muted">
                {t("vet.scan.matchAlreadyAccess")}
              </Text>
            )}
            {match.status === "pending" && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-amber/10 px-3 py-2.5">
                <Clock size={15} color="#d97706" />
                <Text className="flex-1 text-[12.5px] text-amber">
                  {t("vet.scan.matchPending", { name: match.animal.name })}
                </Text>
              </View>
            )}
            {match.status === "sent" && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-emerald/10 px-3 py-2.5">
                <CheckCircle2 size={15} color="#10b981" />
                <Text className="flex-1 text-[12.5px] text-emerald">
                  {t("vet.scan.matchSent", { name: match.animal.name })}
                </Text>
              </View>
            )}

            <View className="mt-6 w-full">
              {match.status === "approved" && (
                <Button
                  label={t("vet.scan.matchViewHistory")}
                  variant="accent"
                  icon={History}
                  fullWidth
                  size="lg"
                  onPress={() =>
                    router.replace(
                      `/(app)/vet/patients/${match.animal.id}` as never,
                    )
                  }
                />
              )}
              {match.status === "none" && (
                <Button
                  label={t("vet.scan.matchRequestAccess")}
                  variant="accent"
                  icon={Send}
                  fullWidth
                  size="lg"
                  loading={requesting}
                  onPress={requestAccess}
                />
              )}
              {(match.status === "pending" || match.status === "sent") && (
                <Button
                  label={t("vet.scan.matchScanAnother")}
                  variant="outline"
                  fullWidth
                  size="lg"
                  onPress={scanAgain}
                />
              )}
            </View>

            {(match.status === "approved" || match.status === "none") && (
              <Pressable onPress={scanAgain} className="mt-3 py-1">
                <Text className="text-[12.5px] font-medium text-muted">
                  {t("vet.scan.matchScanAnother")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Ingreso de código manual */}
      <Modal
        visible={manualOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setManualOpen(false)}
      >
        <Pressable
          onPress={() => setManualOpen(false)}
          className="flex-1 items-center justify-center bg-black/70 px-6"
        >
          <Pressable
            onPress={() => {}}
            className="w-full rounded-3xl bg-surface p-6"
            style={{ maxWidth: 360 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[17px] font-bold text-foreground">
                {t("vet.scan.manualTitle")}
              </Text>
              <Pressable onPress={() => setManualOpen(false)} hitSlop={8}>
                <X size={20} color="#78716c" />
              </Pressable>
            </View>
            <Text className="mt-1 text-[12.5px] text-muted">
              {t("vet.scan.manualSub")}
            </Text>
            <TextInput
              value={manualValue}
              onChangeText={setManualValue}
              placeholder={t("vet.scan.manualPlaceholder")}
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-4 rounded-xl border border-border bg-surface-2 px-3 text-[14px] text-foreground"
              style={{ height: 46 }}
            />
            <View className="mt-4">
              <Button
                label={t("vet.scan.manualSubmit")}
                variant="accent"
                fullWidth
                loading={processing}
                onPress={() => {
                  if (manualValue.trim()) void processCode(manualValue.trim());
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
