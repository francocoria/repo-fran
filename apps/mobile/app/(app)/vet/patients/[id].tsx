import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  AlertTriangle,
  ChevronLeft,
  Lock,
  MessageCircle,
  Phone,
  Stethoscope,
  X,
} from "lucide-react-native";
import { PetAvatar } from "../../../../src/components/pet-avatar";
import { Badge } from "../../../../src/components/ui/badge";
import { Card } from "../../../../src/components/ui/card";
import { Button } from "../../../../src/components/ui/button";
import { supabase } from "../../../../src/lib/supabase";
import { useSession } from "../../../../src/lib/session";
import { env } from "../../../../src/lib/env";
import { formatDate, getAge, speciesLabel } from "../../../../src/lib/format";

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
  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;
  const cleanPhone = owner?.phone?.replace(/\D/g, "");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
          <ChevronLeft size={22} color="#0c0a09" />
          <Text className="text-[15px] text-foreground">Pacientes</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center gap-3 px-5 pt-2">
          <PetAvatar
            name={animal.name}
            species={animal.species}
            photoUrl={animal.photo_url}
            size={72}
            radius={18}
          />
          <View className="flex-1">
            <Text className="text-[22px] font-bold tracking-tight text-foreground">
              {animal.name}
            </Text>
            <Text className="text-[12.5px] text-muted">
              {speciesLabel[animal.species] ?? animal.species}
              {animal.breed && ` · ${animal.breed}`}
              {ageText && ` · ${ageText}`}
            </Text>
            {animal.weight_kg && (
              <Text className="text-[12px] text-muted">
                <Text className="font-mono">{Number(animal.weight_kg).toFixed(1)} kg</Text>
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
                  Alergia grave
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
              Historial
            </Text>
            <Text className="text-[11px] text-subtle">
              {records.length} consultas
            </Text>
          </View>
        </View>

        <View className="mt-2 px-3 gap-2">
          {records.length === 0 ? (
            <Card>
              <View className="items-center py-4">
                <Stethoscope size={28} color="#d6d3d1" />
                <Text className="mt-2 text-[13px] text-muted">
                  Sin consultas todavía
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
                  {r.is_mine && <Badge label="Tuya" tone="accent" />}
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
            label="Nueva consulta"
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
    </SafeAreaView>
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
      Alert.alert("Falta motivo", "Ingresá el motivo de la consulta.");
      return;
    }
    if (!session?.user.id) {
      Alert.alert("Sesión inválida", "Volvé a iniciar sesión.");
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
      Alert.alert("Error", "No encontramos tu perfil de veterinario.");
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
        "Error",
        insertErr.message ?? "No pudimos guardar la consulta.",
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
            Nueva consulta
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
                Guardar
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-2 text-[12px] uppercase tracking-wider text-subtle">
            Paciente
          </Text>
          <View className="mb-5 rounded-lg border border-border bg-surface-2/40 px-3 py-2">
            <Text className="text-[14px] font-medium text-foreground">
              {animalName}
            </Text>
          </View>

          <FieldLabel required>Motivo de la consulta</FieldLabel>
          <ConsultInput
            value={reason}
            onChangeText={setReason}
            placeholder="Control anual, vómitos, vacuna, etc."
            multiline={false}
          />

          <FieldLabel>Examen físico</FieldLabel>
          <ConsultInput
            value={examination}
            onChangeText={setExamination}
            placeholder="Estado general, temperatura, frecuencia cardíaca..."
            multiline
          />

          <FieldLabel>Diagnóstico</FieldLabel>
          <ConsultInput
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Otitis externa, dermatitis alérgica..."
            multiline
          />

          <FieldLabel>Tratamiento</FieldLabel>
          <ConsultInput
            value={treatment}
            onChangeText={setTreatment}
            placeholder="Medicación, dosis, duración..."
            multiline
          />

          <FieldLabel>Próximos pasos</FieldLabel>
          <ConsultInput
            value={nextSteps}
            onChangeText={setNextSteps}
            placeholder="Control en 7 días, análisis pendiente..."
            multiline
          />

          <FieldLabel>Notas para el dueño</FieldLabel>
          <ConsultInput
            value={publicNotes}
            onChangeText={setPublicNotes}
            placeholder="Indicaciones de cuidado, alimentación..."
            multiline
          />
          <Text className="-mt-2 mb-3 text-[11px] text-subtle">
            Las ve el dueño en su perfil.
          </Text>

          <View className="flex-row items-center gap-1.5 mt-2">
            <Lock size={12} color="#78716c" />
            <Text className="text-[11px] uppercase tracking-wider text-subtle">
              Notas privadas
            </Text>
          </View>
          <ConsultInput
            value={privateNotes}
            onChangeText={setPrivateNotes}
            placeholder="Sólo vos las ves..."
            multiline
          />
          <Text className="-mt-2 text-[11px] text-subtle">
            El dueño y otros vets NO las ven. Sólo tu cuenta.
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
