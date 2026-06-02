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
  Bug,
  ChevronLeft,
  FileText,
  Lock,
  MessageCircle,
  Phone,
  Pill,
  Plus,
  Scale,
  Sparkles,
  Stethoscope,
  Syringe,
  X,
} from "lucide-react-native";
import { Badge } from "../../../../src/components/ui/badge";
import { Card } from "../../../../src/components/ui/card";
import { Button } from "../../../../src/components/ui/button";
import { supabase } from "../../../../src/lib/supabase";
import { useSession } from "../../../../src/lib/session";
import { useTranslation } from "../../../../src/lib/i18n";
import { useLocaleFormat } from "../../../../src/lib/i18n/format";

// Diagnósticos frecuentes — chips de auto-completado (paridad con web).
const COMMON_DIAGNOSES = [
  "Otitis",
  "Dermatitis",
  "Gastroenteritis",
  "Conjuntivitis",
  "Pulgas / Garrapatas",
  "Gingivitis",
  "Parásitos intestinales",
  "Cistitis",
  "Vómitos agudos",
  "Diarrea aguda",
  "Control rutinario",
  "Vacunación de rutina",
  "Desparasitación",
  "Obesidad",
];

interface ConsultTemplate {
  id: string;
  name: string;
  content: Record<string, string>;
  is_system: boolean;
}

interface PatientData {
  animal: any;
  owner: { full_name: string; phone: string | null; city: string | null } | null;
  allergies: { id: string; allergen: string; type: string; severity: string }[];
  severeAllergies: { id: string; allergen: string }[];
  records: {
    id: string;
    visit_date: string;
    reason: string;
    diagnosis: string | null;
    vet_id: string;
    is_mine: boolean;
  }[];
  activeMeds: { id: string; name: string; dosage: string; frequency: string }[];
  vaccines: {
    id: string;
    name: string;
    applied_date: string | null;
    next_dose_date: string | null;
  }[];
  dewormings: {
    id: string;
    product: string;
    type: string;
    applied_date: string | null;
    next_date: string | null;
  }[];
  weights: { id: string; weight_kg: number; recorded_at: string }[];
  studies: { id: string; title: string; type: string; study_date: string }[];
  myNotes: {
    id: string;
    visit_date: string;
    reason: string;
    private_notes: string | null;
    public_notes: string | null;
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
  const [activeTab, setActiveTab] = useState<"history" | "health" | "notes">(
    "history",
  );

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

    const [
      animalRes,
      allergiesRes,
      recordsRes,
      medsRes,
      vaccinesRes,
      dewormingsRes,
      weightsRes,
      studiesRes,
      myNotesRes,
    ] = await Promise.all([
      supabase
        .from("animals")
        .select(
          `*, owner_profile:owner_profiles(full_name, phone, city)`,
        )
        .eq("id", id)
        .single(),
      supabase
        .from("allergies")
        .select("id, allergen, type, severity")
        .eq("animal_id", id),
      supabase
        .from("medical_records")
        .select("id, visit_date, reason, diagnosis, vet_id")
        .eq("animal_id", id)
        .order("visit_date", { ascending: false })
        .limit(20),
      supabase
        .from("medications")
        .select("id, name, dosage, frequency, active")
        .eq("animal_id", id)
        .eq("active", true),
      supabase
        .from("vaccines")
        .select("id, name, applied_date, next_dose_date")
        .eq("animal_id", id)
        .order("applied_date", { ascending: false }),
      supabase
        .from("deworming")
        .select("id, product, type, applied_date, next_date")
        .eq("animal_id", id)
        .order("applied_date", { ascending: false }),
      supabase
        .from("weight_entries")
        .select("id, weight_kg, recorded_at")
        .eq("animal_id", id)
        .order("recorded_at", { ascending: false })
        .limit(12),
      supabase
        .from("studies")
        .select("id, title, type, study_date")
        .eq("animal_id", id)
        .order("study_date", { ascending: false }),
      // Notas: SOLO las de mis propias consultas (no se leakean las privadas
      // de otros veterinarios — RLS filtra filas, no columnas).
      supabase
        .from("medical_records")
        .select("id, visit_date, reason, private_notes, public_notes")
        .eq("animal_id", id)
        .eq("vet_id", vetProfile.id)
        .order("visit_date", { ascending: false }),
    ]);

    const allAllergies = (allergiesRes.data ?? []) as PatientData["allergies"];

    setData({
      animal: animalRes.data,
      owner: animalRes.data?.owner_profile ?? null,
      allergies: allAllergies,
      severeAllergies: allAllergies.filter((a) => a.severity === "severe"),
      records:
        (recordsRes.data ?? []).map((r) => ({
          ...r,
          is_mine: r.vet_id === vetProfile.id,
        })) ?? [],
      activeMeds: (medsRes.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage ?? "",
        frequency: m.frequency ?? "",
      })),
      vaccines: (vaccinesRes.data ?? []) as PatientData["vaccines"],
      dewormings: (dewormingsRes.data ?? []) as PatientData["dewormings"],
      weights: (weightsRes.data ?? []) as PatientData["weights"],
      studies: (studiesRes.data ?? []) as PatientData["studies"],
      myNotes: ((myNotesRes.data ?? []) as PatientData["myNotes"]).filter(
        (n) => n.private_notes || n.public_notes,
      ),
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

  const {
    animal,
    owner,
    allergies,
    severeAllergies,
    records,
    activeMeds,
    vaccines,
    dewormings,
    weights,
    studies,
    myNotes,
  } = data;
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
        <View style={{ position: "relative", height: 320, width: "100%", marginBottom: -32 }}>
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
              "rgba(0,0,0,0.35)",
              "transparent",
              "transparent",
              "#faf9f7",
            ]}
            locations={[0, 0.4, 0.65, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Top bar back button */}
          <SafeAreaView
            pointerEvents="box-none"
            className="absolute left-0 right-0 top-0 flex-row items-center px-4 pt-2"
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <ChevronLeft size={20} color="#fff" strokeWidth={2.4} />
            </Pressable>
          </SafeAreaView>

          {/* Severe Allergy stripe overlaid on Hero */}
          {severeAllergies.length > 0 && (
            <View
              className="absolute left-4 right-4 flex-row items-center gap-3 rounded-xl bg-rose p-3.5"
              style={{
                top: 100,
                shadowColor: "#e11d48",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 4,
                zIndex: 10,
              }}
            >
              <AlertTriangle size={18} color="#fff" strokeWidth={2.4} />
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">
                  {t("vet.patientDetail.severeAllergyTitle")}
                </Text>
                <Text className="text-[13.5px] font-bold text-white leading-tight">
                  {t("vet.patientDetail.doNotAdminister")}{" "}
                  {severeAllergies.map((a) => a.allergen).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Name & metadata */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 20, right: 20, bottom: 52 }}
          >
            <Text
              style={{
                fontSize: 38,
                fontWeight: "800",
                color: "#0c0a09",
                letterSpacing: -1,
                lineHeight: 42,
                textShadowColor: "rgba(255, 255, 255, 0.4)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 8,
              }}
            >
              {animal.name}
            </Text>
            <Text
              className="mt-1 text-[13.5px] font-medium text-foreground"
              style={{
                textShadowColor: "rgba(255, 255, 255, 0.4)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              {[
                speciesLabel(animal.species) + (animal.breed ? ` · ${animal.breed}` : ""),
                ageText,
                animal.weight_kg
                  ? `${Number(animal.weight_kg).toFixed(1)} kg`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        </View>

        {/* Owner card overlapping */}
        {owner && (
          <View className="px-4" style={{ zIndex: 10, position: "relative" }}>
            <View
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={["#06b6d4", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-[13px] font-bold text-white">
                  {owner.full_name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </LinearGradient>
              <View className="flex-1 min-w-0">
                <Text className="text-[13.5px] font-bold text-foreground" numberOfLines={1}>
                  {owner.full_name}
                </Text>
                {owner.phone && (
                  <Text className="font-mono text-[11px] text-muted mt-0.5" numberOfLines={1}>
                    {owner.phone}
                  </Text>
                )}
              </View>
              {cleanPhone && (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)}
                    className="size-[38px] items-center justify-center rounded-xl bg-whatsapp"
                    style={{ width: 38, height: 38 }}
                  >
                    <MessageCircle size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${cleanPhone}`)}
                    className="size-[38px] items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200"
                    style={{ width: 38, height: 38 }}
                  >
                    <Phone size={16} color="#57534e" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Active Medications banner */}
        {activeMeds.length > 0 && (
          <View className="mt-3 px-4">
            <View className="flex-row items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-3">
              <View className="size-[34px] items-center justify-center rounded-xl bg-accent" style={{ width: 34, height: 34 }}>
                <Pill size={16} color="#fff" strokeWidth={2.4} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[10.5px] font-bold uppercase tracking-wider text-accent">
                  {t("vet.patientDetail.activeMedsTitle")}
                </Text>
                <Text className="text-[13.5px] font-bold text-foreground mt-0.5" numberOfLines={1}>
                  {activeMeds[0].name}
                </Text>
                <Text className="text-[11.5px] text-muted mt-0.5" numberOfLines={1}>
                  {activeMeds[0].dosage} {activeMeds[0].frequency ? `· ${activeMeds[0].frequency}` : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="mt-4 px-4 flex-row gap-2">
          <TabButton
            label={t("vet.patientDetail.tabHistory")}
            active={activeTab === "history"}
            onPress={() => setActiveTab("history")}
          />
          <TabButton
            label={t("vet.patientDetail.tabHealth")}
            active={activeTab === "health"}
            onPress={() => setActiveTab("health")}
          />
          <TabButton
            label={t("vet.patientDetail.tabNotes")}
            active={activeTab === "notes"}
            onPress={() => setActiveTab("notes")}
          />
        </View>

        {/* ─── HISTORIAL ───────────────────────────────────────── */}
        {activeTab === "history" && (
          <View className="mt-4 px-3 gap-2">
            {records.length === 0 ? (
              <Card>
                <View className="items-center py-8">
                  <Stethoscope size={32} color="#d6d3d1" />
                  <Text className="mt-3 text-[13px] text-muted text-center px-6">
                    {t("vet.patientDetail.noConsults")}
                  </Text>
                </View>
              </Card>
            ) : (
              records.map((r) => (
                <View
                  key={r.id}
                  className={`rounded-2xl border p-3.5 ${
                    r.is_mine
                      ? "border-accent/30 bg-accent/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-mono text-[11px] text-subtle font-semibold">
                      {formatDate(r.visit_date, { short: true })}
                    </Text>
                    {r.is_mine && (
                      <Badge
                        label={t("vet.patientDetail.badgeMine")}
                        tone="accent"
                      />
                    )}
                  </View>
                  <Text className="mt-1.5 text-[14px] font-bold text-foreground">
                    {r.reason}
                  </Text>
                  {r.diagnosis && (
                    <Text className="mt-1 text-[12.5px] text-muted leading-relaxed">
                      {r.diagnosis}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── SALUD ───────────────────────────────────────────── */}
        {activeTab === "health" && (
          <View className="mt-4 px-3 gap-3">
            <HealthSection
              icon={Syringe}
              title={t("animalDetail.sectionVaccines")}
              empty={t("animalDetail.emptyVaccines")}
            >
              {vaccines.length > 0 &&
                vaccines.map((v) => (
                  <HealthRow
                    key={v.id}
                    title={v.name}
                    sub={[
                      v.applied_date
                        ? formatDate(v.applied_date, { short: true })
                        : null,
                      v.next_dose_date
                        ? t("animalDetail.vaccineNext", {
                            date: formatDate(v.next_dose_date, { short: true }),
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
            </HealthSection>

            <HealthSection
              icon={Bug}
              title={t("animalDetail.sectionDewormings")}
              empty={t("animalDetail.emptyDewormings")}
            >
              {dewormings.length > 0 &&
                dewormings.map((d) => (
                  <HealthRow
                    key={d.id}
                    title={d.product}
                    sub={[
                      t(`animalDetail.dewormingType.${d.type}`),
                      d.applied_date
                        ? formatDate(d.applied_date, { short: true })
                        : null,
                      d.next_date
                        ? t("animalDetail.dewormingNext", {
                            date: formatDate(d.next_date, { short: true }),
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
            </HealthSection>

            <HealthSection
              icon={Scale}
              title={t("animalDetail.sectionWeight")}
              empty={t("animalDetail.emptyWeight")}
            >
              {weights.length > 0 &&
                weights.map((w) => (
                  <HealthRow
                    key={w.id}
                    title={`${Number(w.weight_kg).toFixed(1)} kg`}
                    sub={formatDate(w.recorded_at, { short: true })}
                  />
                ))}
            </HealthSection>

            <HealthSection
              icon={AlertTriangle}
              title={t("animalDetail.sectionAllergies")}
              empty={t("animalDetail.emptyAllergies")}
            >
              {allergies.length > 0 &&
                allergies.map((a) => (
                  <HealthRow
                    key={a.id}
                    title={a.allergen}
                    sub={`${t(`animalDetail.allergyType.${a.type}`)} · ${t(
                      `animalDetail.allergySeverity.${a.severity}`,
                    )}`}
                    danger={a.severity === "severe"}
                  />
                ))}
            </HealthSection>

            <HealthSection
              icon={FileText}
              title={t("animalDetail.sectionStudies")}
              empty={t("animalDetail.emptyStudies")}
            >
              {studies.length > 0 &&
                studies.map((s) => (
                  <HealthRow
                    key={s.id}
                    title={s.title}
                    sub={`${t(`animalDetail.studyType.${s.type}`)} · ${formatDate(
                      s.study_date,
                      { short: true },
                    )}`}
                  />
                ))}
            </HealthSection>
          </View>
        )}

        {/* ─── NOTAS (solo mías) ───────────────────────────────── */}
        {activeTab === "notes" && (
          <View className="mt-4 px-3 gap-2">
            {myNotes.length === 0 ? (
              <Card>
                <View className="items-center py-8">
                  <Lock size={30} color="#d6d3d1" />
                  <Text className="mt-3 text-[13px] text-muted text-center px-6">
                    {t("vet.patientDetail.noNotes")}
                  </Text>
                </View>
              </Card>
            ) : (
              myNotes.map((n) => (
                <View
                  key={n.id}
                  className="rounded-2xl border border-border bg-surface p-3.5"
                >
                  <Text className="font-mono text-[11px] font-semibold text-subtle">
                    {formatDate(n.visit_date, { short: true })} · {n.reason}
                  </Text>
                  {n.private_notes ? (
                    <View className="mt-2">
                      <View className="flex-row items-center gap-1">
                        <Lock size={11} color="#78716c" />
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                          {t("vet.patientDetail.privateNotesLabel")}
                        </Text>
                      </View>
                      <Text className="mt-0.5 text-[13px] leading-relaxed text-foreground">
                        {n.private_notes}
                      </Text>
                    </View>
                  ) : null}
                  {n.public_notes ? (
                    <View className="mt-2">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-accent">
                        {t("vet.patientDetail.publicNotesLabel")}
                      </Text>
                      <Text className="mt-0.5 text-[13px] leading-relaxed text-foreground">
                        {n.public_notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

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
        severeAllergies={severeAllergies}
        activeMeds={activeMeds}
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
  severeAllergies: { allergen: string }[];
  activeMeds: { name: string; dosage: string }[];
  onCreated: () => void;
}

function NewConsultModal({
  visible,
  onClose,
  animalId,
  animalName,
  severeAllergies,
  activeMeds,
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
  const [templates, setTemplates] = useState<ConsultTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Cargar plantillas (sistema + propias) — RLS filtra el acceso.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("consult_templates")
        .select("id, name, content, is_system")
        .order("is_system", { ascending: false })
        .order("name", { ascending: true });
      if (!cancelled && data) {
        setTemplates(data as ConsultTemplate[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  function applyTemplate(tpl: ConsultTemplate) {
    setActiveTemplateId(tpl.id);
    const c = tpl.content ?? {};
    if (typeof c.examination === "string") setExamination(c.examination);
    if (typeof c.diagnosis === "string") setDiagnosis(c.diagnosis);
    if (typeof c.treatment === "string") setTreatment(c.treatment);
    if (typeof c.next_steps === "string") setNextSteps(c.next_steps);
  }

  function appendDiagnosis(dx: string) {
    setDiagnosis((prev) => {
      if (prev.toLowerCase().includes(dx.toLowerCase())) return prev;
      return prev.trim() ? `${prev.trim()}\n· ${dx}` : `· ${dx}`;
    });
  }

  function reset() {
    setReason("");
    setExamination("");
    setDiagnosis("");
    setTreatment("");
    setNextSteps("");
    setPublicNotes("");
    setPrivateNotes("");
    setActiveTemplateId(null);
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
          {/* Banner de seguridad — alergias graves */}
          {severeAllergies.length > 0 && (
            <View className="mb-3 flex-row items-center gap-2.5 rounded-xl bg-rose px-3.5 py-3">
              <AlertTriangle size={17} color="#fff" strokeWidth={2.4} />
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">
                  {t("vet.patientDetail.doNotAdminister")}
                </Text>
                <Text className="text-[13px] font-bold leading-tight text-white">
                  {severeAllergies.map((a) => a.allergen).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Banner de seguridad — medicación activa */}
          {activeMeds.length > 0 && (
            <View className="mb-3 flex-row items-center gap-2.5 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-3">
              <View
                className="items-center justify-center rounded-lg bg-accent"
                style={{ width: 30, height: 30 }}
              >
                <Pill size={15} color="#fff" strokeWidth={2.4} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  {t("vet.patientDetail.activeMedsTitle")}
                </Text>
                <Text className="text-[13px] font-semibold text-foreground" numberOfLines={2}>
                  {activeMeds
                    .map((m) => (m.dosage ? `${m.name} (${m.dosage})` : m.name))
                    .join(", ")}
                </Text>
              </View>
            </View>
          )}

          <Text className="mb-2 text-[12px] uppercase tracking-wider text-subtle">
            {t("vet.patientDetail.patient")}
          </Text>
          <View className="mb-4 rounded-lg border border-border bg-surface-2/40 px-3 py-2">
            <Text className="text-[14px] font-medium text-foreground">
              {animalName}
            </Text>
          </View>

          {/* Plantillas rápidas */}
          {templates.length > 0 && (
            <View className="mb-5">
              <View className="mb-2 flex-row items-center gap-1.5">
                <Sparkles size={13} color="#06b6d4" />
                <Text className="text-[11px] uppercase tracking-wider text-subtle">
                  {t("vet.patientDetail.templatesLabel")}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {templates.map((tpl) => {
                  const active = activeTemplateId === tpl.id;
                  return (
                    <Pressable
                      key={tpl.id}
                      onPress={() => applyTemplate(tpl)}
                      className={`rounded-full border px-3 py-1.5 ${
                        active
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-medium ${
                          active ? "text-accent" : "text-muted"
                        }`}
                      >
                        {tpl.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <FieldLabel required>
            {t("vet.patientDetail.reasonLabel")}
          </FieldLabel>
          <ConsultInput
            value={reason}
            onChangeText={setReason}
            placeholder={t("vet.patientDetail.reasonPlaceholder")}
            multiline={false}
            maxLength={200}
          />

          <FieldLabel>{t("vet.patientDetail.examinationLabel")}</FieldLabel>
          <ConsultInput
            value={examination}
            onChangeText={setExamination}
            placeholder={t("vet.patientDetail.examinationPlaceholder")}
            multiline
            maxLength={2000}
          />

          <FieldLabel>{t("vet.patientDetail.diagnosisLabel")}</FieldLabel>
          <ConsultInput
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder={t("vet.patientDetail.diagnosisPlaceholder")}
            multiline
            maxLength={2000}
          />
          <View className="-mt-2 mb-4">
            <Text className="mb-1.5 text-[11px] font-medium text-subtle">
              {t("vet.patientDetail.commonDiagnoses")}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {COMMON_DIAGNOSES.map((dx) => (
                <Pressable
                  key={dx}
                  onPress={() => appendDiagnosis(dx)}
                  className="flex-row items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1"
                >
                  <Plus size={11} color="#78716c" />
                  <Text className="text-[11.5px] font-medium text-muted">{dx}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <FieldLabel>{t("vet.patientDetail.treatmentLabel")}</FieldLabel>
          <ConsultInput
            value={treatment}
            onChangeText={setTreatment}
            placeholder={t("vet.patientDetail.treatmentPlaceholder")}
            multiline
            maxLength={2000}
          />

          <FieldLabel>{t("vet.patientDetail.nextStepsLabel")}</FieldLabel>
          <ConsultInput
            value={nextSteps}
            onChangeText={setNextSteps}
            placeholder={t("vet.patientDetail.nextStepsPlaceholder")}
            multiline
            maxLength={1000}
          />

          <FieldLabel>{t("vet.patientDetail.publicNotesLabel")}</FieldLabel>
          <ConsultInput
            value={publicNotes}
            onChangeText={setPublicNotes}
            placeholder={t("vet.patientDetail.publicNotesPlaceholder")}
            multiline
            maxLength={2000}
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
            maxLength={2000}
          />
          <Text className="-mt-2 text-[11px] text-subtle">
            {t("vet.patientDetail.privateNotesHint")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center rounded-xl border py-2.5 ${
        active ? "border-accent bg-accent" : "border-border bg-surface"
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          active ? "text-white" : "text-muted"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HealthSection({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof Syringe;
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface p-3.5">
      <View className="mb-1.5 flex-row items-center gap-2">
        <Icon size={15} color="#06b6d4" />
        <Text className="text-[11px] font-bold uppercase tracking-wider text-subtle">
          {title}
        </Text>
      </View>
      {children ? (
        <View>{children}</View>
      ) : (
        <Text className="text-[12.5px] text-muted">{empty}</Text>
      )}
    </View>
  );
}

function HealthRow({
  title,
  sub,
  danger,
}: {
  title: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <View className="border-b border-border/40 py-2 last:border-0 last:pb-0">
      <Text
        className={`text-[13.5px] font-medium ${
          danger ? "text-rose" : "text-foreground"
        }`}
      >
        {title}
      </Text>
      {sub ? (
        <Text className="mt-0.5 text-[11.5px] text-muted">{sub}</Text>
      ) : null}
    </View>
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
  maxLength,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  multiline: boolean;
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#a8a29e"
      multiline={multiline}
      maxLength={maxLength}
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
