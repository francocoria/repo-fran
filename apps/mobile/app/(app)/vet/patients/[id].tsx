import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  ChevronLeft,
  Lock,
  MessageCircle,
  Phone,
  Stethoscope,
  X,
} from "lucide-react-native";
import { Badge } from "../../../../src/components/ui/badge";
import { Card } from "../../../../src/components/ui/card";
import { Button } from "../../../../src/components/ui/button";
import { supabase } from "../../../../src/lib/supabase";
import { useSession } from "../../../../src/lib/session";
import { env } from "../../../../src/lib/env";
import { useTranslation } from "../../../../src/lib/i18n";
import { useLocaleFormat } from "../../../../src/lib/i18n/format";

interface PatientData {
  animal: any;
  owner: { full_name: string; phone: string | null; city: string | null } | null;
  severeAllergies: { id: string; allergen: string }[];
  records: {
    id: string;
    visit_date: string;
    reason: string;
    diagnosis: string | null;
    vet_id: string;
    is_mine: boolean;
  }[];
  myVetId: string;
}

export default function VetPatientView() {
  const router = useRouter();
  const { t } = useTranslation();
  const { ageLabel, speciesLabel, formatDate } = useLocaleFormat();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newConsultOpen, setNewConsultOpen] = useState(false);

  async function loadPatient() {
    if (!id) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vetProfile } = await supabase
      .from("vet_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!vetProfile) return;

    const [animalRes, allergiesRes, recordsRes] = await Promise.all([
      supabase
        .from("animals")
        .select(
          `*, owner_profile:owner_profiles(full_name, phone, city)`,
        )
        .eq("id", id)
        .single(),
      supabase
        .from("allergies")
        .select("id, allergen, severity")
        .eq("animal_id", id)
        .eq("severity", "severe"),
      supabase
        .from("medical_records")
        .select("id, visit_date, reason, diagnosis, vet_id")
        .eq("animal_id", id)
        .order("visit_date", { ascending: false })
        .limit(20),
    ]);

    setData({
      animal: animalRes.data,
      owner: animalRes.data?.owner_profile ?? null,
      severeAllergies: allergiesRes.data ?? [],
      records:
        (recordsRes.data ?? []).map((r) => ({
          ...r,
          is_mine: r.vet_id === vetProfile.id,
        })) ?? [],
      myVetId: vetProfile.id,
    });
    setLoading(false);
  }

  useEffect(() => {
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !data || !data.animal) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#06b6d4" />
      </View>
    );
  }

  const { animal, owner, severeAllergies, records } = data;
  const ageText = animal.birth_date ? ageLabel(animal.birth_date) : null;
  const cleanPhone = owner?.phone?.replace(/\D/g, "");

  const heroGradient: [string, string] = ((): [string, string] => {
    const map: Record<string, [string, string]> = {
      dog: ["#06b6d4", "#0891b2"],
      cat: ["#0d9488", "#14b8a6"],
      bird: ["#f59e0b", "#fb923c"],
      rabbit: ["#a78bfa", "#8b5cf6"],
      rodent: ["#fb7185", "#f43f5e"],
      reptile: ["#84cc16", "#65a30d"],
      fish: ["#38bdf8", "#0ea5e9"],
      exotic: ["#c084fc", "#a855f7"],
      other: ["#64748b", "#475569"],
    };
    return map[animal.species] ?? map.other;
  })();

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ─── HERO FULL-BLEED ─────────────────────────────────── */}
        <View style={{ position: "relative", height: 300, width: "100%" }}>
          {animal.photo_url ? (
            <Image
              source={{ uri: animal.photo_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", height: "100%" }}
            />
          )}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.45)",
              "transparent",
              "transparent",
              "#faf9f7",
            ]}
            locations={[0, 0.35, 0.6, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Back glass */}
          <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 top-0 flex-row items-center px-4 pt-2"
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.92)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#0c0a09",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <ChevronLeft size={20} color="#0c0a09" />
            </Pressable>
          </View>

          {/* Nombre + sub */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 20, right: 20, bottom: 22 }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(255,255,255,0.88)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#0c0a09",
                  letterSpacing: 0.2,
                }}
              >
                {speciesLabel(animal.species)}
                {animal.breed ? ` · ${animal.breed}` : ""}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 38,
                fontWeight: "800",
                color: "#0c0a09",
                letterSpacing: -1.2,
                lineHeight: 42,
              }}
            >
              {animal.name}
            </Text>
            {(ageText || animal.weight_kg) && (
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#44403c",
                }}
              >
                {[
                  ageText,
                  animal.weight_kg
                    ? `${Number(animal.weight_kg).toFixed(1)} kg`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
          </View>
        </View>

        {owner && (
          <View className="mt-4 mx-3">
            <Card className="flex-row items-center gap-3">
              <View
                className="size-9 items-center justify-center rounded-lg bg-accent"
                style={{ width: 36, height: 36 }}
              >
                <Text className="text-[12px] font-semibold text-white">
                  {owner.full_name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-foreground">
                  {owner.full_name}
                </Text>
                {owner.phone && (
                  <Text className="font-mono text-[11.5px] text-subtle">
                    {owner.phone}
                  </Text>
                )}
              </View>
              {cleanPhone && (
                <View className="flex-row gap-1.5">
                  <Pressable
                    onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)}
                    className="size-9 items-center justify-center rounded-lg bg-whatsapp"
                    style={{ width: 36, height: 36 }}
                  >
                    <MessageCircle size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${cleanPhone}`)}
                    className="size-9 items-center justify-center rounded-lg border border-border"
                    style={{ width: 36, height: 36 }}
                  >
                    <Phone size={16} color="#0c0a09" />
                  </Pressable>
                </View>
              )}
            </Card>
          </View>
        )}

        {severeAllergies.length > 0 && (
          <View className="mt-3 mx-3">
            <View className="flex-row items-center gap-3 rounded-xl bg-rose p-3">
              <AlertTriangle size={20} color="#fff" strokeWidth={2.4} />
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                  {t("vet.patientDetail.severeAllergyTitle")}
                </Text>
                <Text className="text-[14px] font-semibold text-white">
                  {severeAllergies.map((a) => a.allergen).join(", ")}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
              {t("vet.patientDetail.history")}
            </Text>
            <Text className="text-[11px] text-subtle">
              {t("vet.patientDetail.consultsCount", {
                count: records.length,
              })}
            </Text>
          </View>
        </View>

        <View className="mt-2 px-3 gap-2">
          {records.length === 0 ? (
            <Card>
              <View className="items-center py-4">
                <Stethoscope size={28} color="#d6d3d1" />
                <Text className="mt-2 text-[13px] text-muted">
                  {t("vet.patientDetail.noConsults")}
                </Text>
              </View>
            </Card>
          ) : (
            records.map((r) => (
              <View
                key={r.id}
                className={`rounded-xl border p-3 ${
                  r.is_mine ? "border-accent/40 bg-accent/5" : "border-border bg-surface"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-mono text-[11px] text-subtle">
                    {formatDate(r.visit_date, { short: true })}
                  </Text>
                  {r.is_mine && (
                    <Badge label={t("vet.patientDetail.badgeMine")} tone="accent" />
                  )}
                </View>
                <Text className="mt-1 text-[14px] font-semibold text-foreground">
                  {r.reason}
                </Text>
                {r.diagnosis && (
                  <Text className="mt-0.5 text-[12.5px] text-muted">
                    {r.diagnosis}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        <View className="mt-6 mx-3">
          <Button
            label={t("vet.patientDetail.newConsult")}
            variant="accent"
            fullWidth
            size="lg"
            onPress={() => setNewConsultOpen(true)}
          />
        </View>
      </ScrollView>

      <NewConsultModal
        visible={newConsultOpen}
        onClose={() => setNewConsultOpen(false)}
        animalId={animal.id}
        animalName={animal.name}
        onCreated={() => {
          setNewConsultOpen(false);
          // Refrescamos contadores
          loadPatient();
        }}
      />
    </View>
  );
}

// ─── Modal de creación de consulta (Apple 4.2: minimum functionality) ───

interface NewConsultModalProps {
  visible: boolean;
  onClose: () => void;
  animalId: string;
  animalName: string;
  onCreated: () => void;
}

function NewConsultModal({
  visible,
  onClose,
  animalId,
  animalName,
  onCreated,
}: NewConsultModalProps) {
  const { t } = useTranslation();
  const { session } = useSession();
  const [reason, setReason] = useState("");
  const [examination, setExamination] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [publicNotes, setPublicNotes] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setReason("");
    setExamination("");
    setDiagnosis("");
    setTreatment("");
    setNextSteps("");
    setPublicNotes("");
    setPrivateNotes("");
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      Alert.alert(
        t("vet.patientDetail.missingReasonTitle"),
        t("vet.patientDetail.missingReasonBody"),
      );
      return;
    }
    if (!session?.user.id) {
      Alert.alert(
        t("vet.patientDetail.invalidSessionTitle"),
        t("vet.patientDetail.invalidSessionBody"),
      );
      return;
    }

    setSaving(true);

    // Resolvemos el vet_id (vet_profiles.id del usuario actual).
    const { data: vetProfile, error: vetErr } = await supabase
      .from("vet_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (vetErr || !vetProfile) {
      setSaving(false);
      Alert.alert(t("common.error"), t("vet.patientDetail.noVetProfileBody"));
      return;
    }

    const { error: insertErr } = await supabase
      .from("medical_records")
      .insert({
        animal_id: animalId,
        vet_id: vetProfile.id,
        visit_date: new Date().toISOString(),
        reason: reason.trim(),
        examination: examination.trim() || null,
        diagnosis: diagnosis.trim() || null,
        treatment: treatment.trim() || null,
        next_steps: nextSteps.trim() || null,
        public_notes: publicNotes.trim() || null,
        private_notes: privateNotes.trim() || null,
      });

    setSaving(false);

    if (insertErr) {
      console.error("[newConsult] insert error:", insertErr);
      Alert.alert(
        t("common.error"),
        insertErr.message ?? t("vet.patientDetail.saveError"),
      );
      return;
    }

    reset();
    onCreated();
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
            onPress={onClose}
            disabled={saving}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} color="#0c0a09" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-foreground">
            {t("vet.patientDetail.newConsult")}
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={saving || !reason.trim()}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 10,
              backgroundColor: saving || !reason.trim() ? "#cbd5e1" : "#06b6d4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                {t("common.save")}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-2 text-[12px] uppercase tracking-wider text-subtle">
            {t("vet.patientDetail.patient")}
          </Text>
          <View className="mb-5 rounded-lg border border-border bg-surface-2/40 px-3 py-2">
            <Text className="text-[14px] font-medium text-foreground">
              {animalName}
            </Text>
          </View>

          <FieldLabel required>
            {t("vet.patientDetail.reasonLabel")}
          </FieldLabel>
          <ConsultInput
            value={reason}
            onChangeText={setReason}
            placeholder={t("vet.patientDetail.reasonPlaceholder")}
            multiline={false}
          />

          <FieldLabel>{t("vet.patientDetail.examinationLabel")}</FieldLabel>
          <ConsultInput
            value={examination}
            onChangeText={setExamination}
            placeholder={t("vet.patientDetail.examinationPlaceholder")}
            multiline
          />

          <FieldLabel>{t("vet.patientDetail.diagnosisLabel")}</FieldLabel>
          <ConsultInput
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder={t("vet.patientDetail.diagnosisPlaceholder")}
            multiline
          />

          <FieldLabel>{t("vet.patientDetail.treatmentLabel")}</FieldLabel>
          <ConsultInput
            value={treatment}
            onChangeText={setTreatment}
            placeholder={t("vet.patientDetail.treatmentPlaceholder")}
            multiline
          />

          <FieldLabel>{t("vet.patientDetail.nextStepsLabel")}</FieldLabel>
          <ConsultInput
            value={nextSteps}
            onChangeText={setNextSteps}
            placeholder={t("vet.patientDetail.nextStepsPlaceholder")}
            multiline
          />

          <FieldLabel>{t("vet.patientDetail.publicNotesLabel")}</FieldLabel>
          <ConsultInput
            value={publicNotes}
            onChangeText={setPublicNotes}
            placeholder={t("vet.patientDetail.publicNotesPlaceholder")}
            multiline
          />
          <Text className="-mt-2 mb-3 text-[11px] text-subtle">
            {t("vet.patientDetail.publicNotesHint")}
          </Text>

          <View className="flex-row items-center gap-1.5 mt-2">
            <Lock size={12} color="#78716c" />
            <Text className="text-[11px] uppercase tracking-wider text-subtle">
              {t("vet.patientDetail.privateNotesLabel")}
            </Text>
          </View>
          <ConsultInput
            value={privateNotes}
            onChangeText={setPrivateNotes}
            placeholder={t("vet.patientDetail.privateNotesPlaceholder")}
            multiline
          />
          <Text className="-mt-2 text-[11px] text-subtle">
            {t("vet.patientDetail.privateNotesHint")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Text className="mb-1.5 mt-1 text-[12px] uppercase tracking-wider text-subtle">
      {children}
      {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
    </Text>
  );
}

function ConsultInput({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  multiline: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#a8a29e"
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={{
        borderWidth: 1,
        borderColor: "#e7e5e4",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        fontSize: 14,
        color: "#0c0a09",
        backgroundColor: "#ffffff",
        minHeight: multiline ? 72 : 44,
        textAlignVertical: multiline ? "top" : "center",
      }}
    />
  );
}
