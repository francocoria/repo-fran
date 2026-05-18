import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  Image as ImageIcon,
  Pencil,
  QrCode,
  Syringe,
  Pill,
  Scale,
  Bug,
  FileText,
  Stethoscope,
  X,
  Share2,
  CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "react-native-qrcode-svg";
import { PetAvatar } from "../../../src/components/pet-avatar";
import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { Card } from "../../../src/components/ui/card";
import { useAnimal } from "../../../src/hooks/use-animals";
import { supabase } from "../../../src/lib/supabase";
import { useTranslation } from "../../../src/lib/i18n";
import { useLocaleFormat } from "../../../src/lib/i18n/format";
import { env } from "../../../src/lib/env";
import {
  pickAnimalPhoto,
  takeAnimalPhoto,
  uploadAnimalPhoto,
} from "../../../src/lib/photo-upload";
import { InviteCoOwnerModal } from "../../../src/components/invite-co-owner-modal";
import { LostModeModal } from "../../../src/components/lost-mode-modal";

interface Vaccine {
  id: string;
  name: string;
  applied_date: string;
  next_dose_date: string | null;
}
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}
interface AllergyRow {
  id: string;
  allergen: string;
  type: string;
  severity: string;
}
interface DewormingRow {
  id: string;
  product: string;
  type: string;
  applied_date: string;
  next_date: string | null;
}
interface StudyRow {
  id: string;
  title: string;
  type: string;
  study_date: string;
}
interface WeightRow {
  id: string;
  weight_kg: number;
  recorded_at: string;
}
interface ConsultRow {
  id: string;
  visit_date: string;
  reason: string;
  diagnosis: string | null;
  vet: { full_name: string } | null;
}

interface HealthData {
  vaccines: Vaccine[];
  medications: Medication[];
  allergies: AllergyRow[];
  dewormings: DewormingRow[];
  studies: StudyRow[];
  weights: WeightRow[];
  consults: ConsultRow[];
}

const EMPTY_HEALTH: HealthData = {
  vaccines: [],
  medications: [],
  allergies: [],
  dewormings: [],
  studies: [],
  weights: [],
  consults: [],
};

export default function AnimalProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { ageLabel, speciesLabel, formatDate } = useLocaleFormat();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animal, isLoading } = useAnimal(id ?? "");
  const [health, setHealth] = useState<HealthData>(EMPTY_HEALTH);
  const [qrOpen, setQrOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostSlug, setLostSlug] = useState<string | null>(null);
  const [markingFound, setMarkingFound] = useState(false);

  function refreshAnimal() {
    void queryClient.invalidateQueries({ queryKey: ["animal", id] });
    void queryClient.invalidateQueries({ queryKey: ["animals"] });
  }

  const loadHealth = useCallback(async () => {
    if (!id) return;
    const [
      vaccines,
      medications,
      allergies,
      dewormings,
      studies,
      weights,
      consults,
      lostAlert,
    ] = await Promise.all([
      supabase
        .from("vaccines")
        .select("id, name, applied_date, next_dose_date")
        .eq("animal_id", id)
        .order("applied_date", { ascending: false }),
      supabase
        .from("medications")
        .select("id, name, dosage, frequency")
        .eq("animal_id", id)
        .eq("active", true)
        .order("start_date", { ascending: false }),
      supabase
        .from("allergies")
        .select("id, allergen, type, severity")
        .eq("animal_id", id)
        .order("severity", { ascending: false }),
      supabase
        .from("deworming")
        .select("id, product, type, applied_date, next_date")
        .eq("animal_id", id)
        .order("applied_date", { ascending: false }),
      supabase
        .from("studies")
        .select("id, title, type, study_date")
        .eq("animal_id", id)
        .order("study_date", { ascending: false }),
      supabase
        .from("weight_entries")
        .select("id, weight_kg, recorded_at")
        .eq("animal_id", id)
        .order("recorded_at", { ascending: false })
        .limit(8),
      supabase
        .from("medical_records")
        .select("id, visit_date, reason, diagnosis, vet:vet_profiles(full_name)")
        .eq("animal_id", id)
        .order("visit_date", { ascending: false }),
      supabase
        .from("lost_pet_alerts")
        .select("public_slug")
        .eq("animal_id", id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    setHealth({
      vaccines: (vaccines.data as Vaccine[]) ?? [],
      medications: (medications.data as Medication[]) ?? [],
      allergies: (allergies.data as AllergyRow[]) ?? [],
      dewormings: (dewormings.data as DewormingRow[]) ?? [],
      studies: (studies.data as StudyRow[]) ?? [],
      weights: (weights.data as WeightRow[]) ?? [],
      consults:
        (consults.data as unknown as ConsultRow[])?.map((c) => ({
          ...c,
          vet: Array.isArray(c.vet) ? (c.vet[0] ?? null) : c.vet,
        })) ?? [],
    });
    setLostSlug(lostAlert.data?.public_slug ?? null);
  }, [id]);

  // Recargamos la salud cada vez que la pantalla recibe foco —
  // así al volver de "editar" o de "agregar registro" se ve al instante.
  useFocusEffect(
    useCallback(() => {
      void loadHealth();
    }, [loadHealth]),
  );

  async function handleMarkFound() {
    if (!id || markingFound) return;
    Alert.alert(
      t("animalDetail.markFoundTitle"),
      t("animalDetail.markFoundBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("animalDetail.markFoundConfirm"),
          onPress: async () => {
            setMarkingFound(true);
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
                  animalId: id,
                  action: "deactivate",
                  asFound: true,
                }),
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                Alert.alert(
                  t("common.error"),
                  body.error ?? t("animalDetail.markFoundFailBody"),
                );
                return;
              }
              setLostSlug(null);
              refreshAnimal();
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : t("common.networkError");
              Alert.alert(t("common.error"), msg);
            } finally {
              setMarkingFound(false);
            }
          },
        },
      ],
    );
  }

  async function handlePhotoChange() {
    if (!id || uploadingPhoto) return;
    Alert.alert(t("animalDetail.photoTitle"), t("animalDetail.photoBody"), [
      {
        text: t("animalDetail.photoGallery"),
        onPress: async () => {
          const picked = await pickAnimalPhoto();
          if (!picked) return;
          await doUpload(picked.uri);
        },
      },
      {
        text: t("animalDetail.photoCamera"),
        onPress: async () => {
          const picked = await takeAnimalPhoto();
          if (!picked) return;
          await doUpload(picked.uri);
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  async function doUpload(photoUri: string) {
    setUploadingPhoto(true);
    const result = await uploadAnimalPhoto(id ?? "", photoUri);
    setUploadingPhoto(false);
    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["animal", id] });
      await queryClient.invalidateQueries({ queryKey: ["animals"] });
    } else {
      Alert.alert(
        t("common.error"),
        result.error ?? t("animalDetail.photoUploadFail"),
      );
    }
  }

  if (isLoading || !animal) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  const isLost = animal.status === "lost";
  const ageText = animal.birth_date ? ageLabel(animal.birth_date) : null;
  const qrUrl = `${env.APP_URL}/vet/scan?token=${animal.url_token}`;
  const severeAllergies = health.allergies.filter(
    (a) => a.severity === "severe",
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
          <ChevronLeft size={22} color="#0c0a09" />
          <Text className="text-[15px] text-foreground">
            {t("animalDetail.back")}
          </Text>
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/animals/edit",
                params: { id: animal.id },
              } as never)
            }
            className="size-9 items-center justify-center rounded-lg border border-border bg-surface"
            style={{ width: 36, height: 36 }}
          >
            <Pencil size={16} color="#0c0a09" />
          </Pressable>
          <Pressable
            onPress={() => setQrOpen(true)}
            className="size-9 items-center justify-center rounded-lg border border-border bg-surface"
            style={{ width: 36, height: 36 }}
          >
            <QrCode size={16} color="#0c0a09" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center gap-4 px-5 pt-2">
          <Pressable
            onPress={handlePhotoChange}
            disabled={uploadingPhoto}
            style={{ position: "relative" }}
          >
            <PetAvatar
              name={animal.name}
              species={animal.species}
              photoUrl={animal.photo_url}
              size={88}
              radius={22}
              lost={isLost}
            />
            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#7c3aed",
                borderWidth: 2,
                borderColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : animal.photo_url ? (
                <Camera size={14} color="#ffffff" />
              ) : (
                <ImageIcon size={14} color="#ffffff" />
              )}
            </View>
          </Pressable>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-[24px] font-bold tracking-tight text-foreground">
                {animal.name}
              </Text>
              {isLost && (
                <Badge
                  label={t("animalDetail.badgeLost")}
                  tone="rose"
                  icon={AlertTriangle}
                />
              )}
            </View>
            <Text className="mt-1 text-[13px] text-muted">
              {speciesLabel(animal.species)}
              {animal.breed && ` · ${animal.breed}`}
              {ageText && ` · ${ageText}`}
            </Text>
            {animal.microchip && (
              <Text className="mt-0.5 font-mono text-[11px] text-subtle">
                {t("animalDetail.chipLabel", { value: animal.microchip })}
              </Text>
            )}
          </View>
        </View>

        {severeAllergies.length > 0 && (
          <View className="mt-4 mx-5 flex-row items-center gap-3 rounded-xl border border-rose/30 bg-rose/5 p-3">
            <AlertTriangle size={18} color="#e11d48" />
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-rose">
                {t("animalDetail.severeAllergiesTitle")}
              </Text>
              <Text className="text-[12px] text-muted">
                {severeAllergies.map((a) => a.allergen).join(" · ")}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-5 px-3">
          <View className="flex-row gap-2">
            <MiniStat
              icon={Scale}
              label={t("animalDetail.miniWeight")}
              value={
                animal.weight_kg
                  ? `${Number(animal.weight_kg).toFixed(1)} kg`
                  : "—"
              }
            />
            <MiniStat
              icon={Syringe}
              label={t("animalDetail.miniVaccines")}
              value={`${health.vaccines.length}`}
            />
            <MiniStat
              icon={Pill}
              label={t("animalDetail.miniMeds")}
              value={`${health.medications.length}`}
            />
          </View>
        </View>

        {/* ─── VACUNAS ─────────────────────────────────────────── */}
        <Section icon={Syringe} title={t("animalDetail.sectionVaccines")}>
          {health.vaccines.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyVaccines")} />
          ) : (
            health.vaccines.map((v) => (
              <ListRow
                key={v.id}
                title={v.name}
                subtitle={
                  formatDate(v.applied_date, { short: true }) +
                  (v.next_dose_date
                    ? ` · ${t("animalDetail.vaccineNext", {
                        date: formatDate(v.next_dose_date, { short: true }),
                      })}`
                    : "")
                }
              />
            ))
          )}
        </Section>

        {/* ─── MEDICACIÓN ──────────────────────────────────────── */}
        <Section icon={Pill} title={t("animalDetail.sectionMedications")}>
          {health.medications.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyMedications")} />
          ) : (
            health.medications.map((m) => (
              <ListRow
                key={m.id}
                title={m.name}
                subtitle={`${m.dosage} · ${m.frequency}`}
              />
            ))
          )}
        </Section>

        {/* ─── ALERGIAS ────────────────────────────────────────── */}
        <Section icon={AlertTriangle} title={t("animalDetail.sectionAllergies")}>
          {health.allergies.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyAllergies")} />
          ) : (
            health.allergies.map((a) => (
              <ListRow
                key={a.id}
                title={a.allergen}
                subtitle={`${t(`animalDetail.allergyType.${a.type}`)} · ${t(
                  `animalDetail.allergySeverity.${a.severity}`,
                )}`}
                danger={a.severity === "severe"}
              />
            ))
          )}
        </Section>

        {/* ─── ANTIPARASITARIOS ────────────────────────────────── */}
        <Section icon={Bug} title={t("animalDetail.sectionDewormings")}>
          {health.dewormings.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyDewormings")} />
          ) : (
            health.dewormings.map((d) => (
              <ListRow
                key={d.id}
                title={d.product}
                subtitle={
                  `${t(`animalDetail.dewormingType.${d.type}`)} · ` +
                  formatDate(d.applied_date, { short: true }) +
                  (d.next_date
                    ? ` · ${t("animalDetail.dewormingNext", {
                        date: formatDate(d.next_date, { short: true }),
                      })}`
                    : "")
                }
              />
            ))
          )}
        </Section>

        {/* ─── ESTUDIOS ────────────────────────────────────────── */}
        <Section icon={FileText} title={t("animalDetail.sectionStudies")}>
          {health.studies.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyStudies")} />
          ) : (
            health.studies.map((s) => (
              <ListRow
                key={s.id}
                title={s.title}
                subtitle={`${t(`animalDetail.studyType.${s.type}`)} · ${formatDate(
                  s.study_date,
                  { short: true },
                )}`}
              />
            ))
          )}
        </Section>

        {/* ─── PESO ────────────────────────────────────────────── */}
        <Section icon={Scale} title={t("animalDetail.sectionWeight")}>
          {health.weights.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyWeight")} />
          ) : (
            health.weights.map((w) => (
              <ListRow
                key={w.id}
                title={`${Number(w.weight_kg).toFixed(1)} kg`}
                subtitle={formatDate(w.recorded_at, { short: true })}
              />
            ))
          )}
        </Section>

        {/* ─── HISTORIAL DE CONSULTAS ──────────────────────────── */}
        <Section icon={Stethoscope} title={t("animalDetail.sectionConsults")}>
          {health.consults.length === 0 ? (
            <EmptyLine text={t("animalDetail.emptyConsults")} />
          ) : (
            health.consults.map((c) => (
              <ListRow
                key={c.id}
                title={c.reason}
                subtitle={
                  formatDate(c.visit_date, { short: true }) +
                  (c.vet
                    ? ` · ${t("animalDetail.consultBy", {
                        name: c.vet.full_name,
                      })}`
                    : "")
                }
                detail={c.diagnosis ?? undefined}
              />
            ))
          )}
        </Section>

        {/* ─── DATOS ───────────────────────────────────────────── */}
        <View className="mt-5 px-5">
          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            {t("animalDetail.dataTitle")}
          </Text>
          <Card className="gap-3">
            {animal.color && (
              <DataLine label={t("animalDetail.dataColor")} value={animal.color} />
            )}
            {animal.distinctive_marks && (
              <DataLine
                label={t("animalDetail.dataMarks")}
                value={animal.distinctive_marks}
              />
            )}
            {animal.notes && (
              <DataLine label={t("animalDetail.dataNotes")} value={animal.notes} />
            )}
            {!animal.color && !animal.distinctive_marks && !animal.notes && (
              <Text className="text-[13px] text-muted">
                {t("animalDetail.noExtraData")}
              </Text>
            )}
          </Card>
        </View>

        {/* Modo perdido */}
        <View className="mt-6 px-3">
          <Text className="mb-2 px-2 text-[11px] uppercase tracking-wider text-subtle">
            {t("animalDetail.lostModeTitle")}
          </Text>
          {isLost ? (
            <Card className="gap-3">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={18} color="#e11d48" />
                <Text className="flex-1 text-[13px] font-semibold text-rose">
                  {t("animalDetail.lostReported", { name: animal.name })}
                </Text>
              </View>
              <Text className="text-[12px] text-muted">
                {t("animalDetail.lostActiveDesc")}
              </Text>
              {lostSlug && (
                <Button
                  label={t("animalDetail.shareLost")}
                  variant="rose"
                  icon={Share2}
                  fullWidth
                  onPress={() => {
                    void Share.share({
                      message: t("components.lostMode.shareMessage", {
                        name: animal.name,
                        url: `${env.APP_URL}/lost/${lostSlug}`,
                      }),
                    });
                  }}
                />
              )}
              <Button
                label={t("animalDetail.markFound")}
                variant="outline"
                icon={CheckCircle2}
                fullWidth
                loading={markingFound}
                onPress={handleMarkFound}
              />
            </Card>
          ) : (
            <Card className="gap-2">
              <Text className="text-[13px] text-muted">
                {t("animalDetail.lostInactiveDesc", { name: animal.name })}
              </Text>
              <Button
                label={t("animalDetail.reportLost")}
                variant="rose"
                icon={AlertTriangle}
                fullWidth
                onPress={() => setLostModalOpen(true)}
              />
            </Card>
          )}
        </View>

        {/* Co-dueños */}
        <View className="mt-6 px-3">
          <Text className="mb-2 px-2 text-[11px] uppercase tracking-wider text-subtle">
            {t("animalDetail.coOwnersTitle")}
          </Text>
          <Card className="gap-2">
            <Text className="text-[13px] text-muted">
              {t("animalDetail.coOwnersDesc")}
            </Text>
            <Button
              label={t("animalDetail.inviteByEmail")}
              variant="outline"
              icon={Share2}
              fullWidth
              onPress={() => setInviteModalOpen(true)}
            />
          </Card>
        </View>
      </ScrollView>

      <QRSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        animalName={animal.name}
        species={animal.species}
        photoUrl={animal.photo_url}
        qrUrl={qrUrl}
      />

      <InviteCoOwnerModal
        visible={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        animalId={animal.id}
        animalName={animal.name}
      />

      <LostModeModal
        visible={lostModalOpen}
        onClose={() => setLostModalOpen(false)}
        onActivated={refreshAnimal}
        animalId={animal.id}
        animalName={animal.name}
      />
    </SafeAreaView>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
          {label}
        </Text>
        <Icon size={14} color="#78716c" />
      </View>
      <Text className="mt-1 font-mono text-[17px] font-semibold text-foreground">
        {value}
      </Text>
    </View>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Scale;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-5 px-5">
      <View className="mb-2 flex-row items-center gap-1.5">
        <Icon size={13} color="#78716c" />
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          {title}
        </Text>
      </View>
      <Card className="gap-2.5">{children}</Card>
    </View>
  );
}

function ListRow({
  title,
  subtitle,
  detail,
  danger,
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  danger?: boolean;
}) {
  return (
    <View className="border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
      <Text
        className={`text-[14px] font-medium ${
          danger ? "text-rose" : "text-foreground"
        }`}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text>
      ) : null}
      {detail ? (
        <Text className="mt-0.5 text-[12.5px] text-foreground/80">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <Text className="text-[13px] text-muted">{text}</Text>;
}

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        {label}
      </Text>
      <Text className="mt-0.5 text-[13.5px] text-foreground">{value}</Text>
    </View>
  );
}

function QRSheet({
  open,
  onClose,
  animalName,
  species,
  photoUrl,
  qrUrl,
}: {
  open: boolean;
  onClose: () => void;
  animalName: string;
  species: string;
  photoUrl: string | null;
  qrUrl: string;
}) {
  const { t } = useTranslation();

  async function handleShare() {
    await Share.share({
      message: t("animalDetail.qrShareMessage", {
        name: animalName,
        url: qrUrl,
      }),
    });
  }

  return (
    <Modal
      visible={open}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background">
        <Pressable onPress={onClose} className="self-end p-4">
          <X size={24} color="#0c0a09" />
        </Pressable>

        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={["#5eead4", "#06b6d4", "#0891b2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 28,
              paddingTop: 32,
              paddingBottom: 48,
              borderRadius: 24,
              width: "100%",
              alignItems: "center",
            }}
          >
            <PetAvatar
              name={animalName}
              species={species}
              photoUrl={photoUrl}
              size={64}
              radius={16}
            />
            <Text className="mt-3 text-[20px] font-bold text-white">
              {t("animalDetail.qrTitle", { name: animalName })}
            </Text>
            <Text className="mt-1 text-center text-[13px] text-white/90">
              {t("animalDetail.qrSubtitle")}
            </Text>
          </LinearGradient>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 16,
              marginTop: -32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 240,
                height: 240,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <QRCode value={qrUrl} size={216} backgroundColor="#ffffff" color="#0c0a09" />
            </View>
            <Text className="mt-3 text-center text-[12px] text-muted">
              {t("animalDetail.qrHint")}
            </Text>
          </View>

          <View className="mt-8 w-full">
            <Button
              label={t("animalDetail.qrShare")}
              onPress={handleShare}
              icon={Share2}
              fullWidth
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
