import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ChevronLeft,
  QrCode,
  Syringe,
  Pill,
  Scale,
  X,
  Share2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { PetAvatar } from "../../../src/components/pet-avatar";
import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { Card } from "../../../src/components/ui/card";
import { useAnimal } from "../../../src/hooks/use-animals";
import { supabase } from "../../../src/lib/supabase";
import { getAge, speciesLabel } from "../../../src/lib/format";
import { env } from "../../../src/lib/env";

interface HealthCounts {
  vaccines: number;
  meds: number;
  allergies: number;
  studies: number;
  consults: number;
  severeAllergies: { id: string; allergen: string }[];
}

export default function AnimalProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animal, isLoading } = useAnimal(id ?? "");
  const [counts, setCounts] = useState<HealthCounts | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [vaccines, meds, allergies, studies, consults] = await Promise.all([
        supabase.from("vaccines").select("id", { count: "exact", head: true }).eq("animal_id", id),
        supabase.from("medications").select("id", { count: "exact", head: true }).eq("animal_id", id).eq("active", true),
        supabase.from("allergies").select("id, allergen, severity").eq("animal_id", id),
        supabase.from("studies").select("id", { count: "exact", head: true }).eq("animal_id", id),
        supabase.from("medical_records").select("id", { count: "exact", head: true }).eq("animal_id", id),
      ]);

      setCounts({
        vaccines: vaccines.count ?? 0,
        meds: meds.count ?? 0,
        allergies: (allergies.data ?? []).length,
        studies: studies.count ?? 0,
        consults: consults.count ?? 0,
        severeAllergies: (allergies.data ?? []).filter((a) => a.severity === "severe"),
      });
    })();
  }, [id]);

  if (isLoading || !animal) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  const isLost = animal.status === "lost";
  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;
  const qrUrl = `${env.APP_URL}/vet/scan?token=${animal.url_token}`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
          <ChevronLeft size={22} color="#0c0a09" />
          <Text className="text-[15px] text-foreground">Atrás</Text>
        </Pressable>
        <View className="flex-row gap-2">
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
          <PetAvatar
            name={animal.name}
            species={animal.species}
            photoUrl={animal.photo_url}
            size={88}
            radius={22}
            lost={isLost}
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-[24px] font-bold tracking-tight text-foreground">
                {animal.name}
              </Text>
              {isLost && <Badge label="PERDIDA" tone="rose" icon={AlertTriangle} />}
            </View>
            <Text className="mt-1 text-[13px] text-muted">
              {speciesLabel[animal.species] ?? animal.species}
              {animal.breed && ` · ${animal.breed}`}
              {ageText && ` · ${ageText}`}
            </Text>
            {animal.microchip && (
              <Text className="mt-0.5 font-mono text-[11px] text-subtle">
                Chip: {animal.microchip}
              </Text>
            )}
          </View>
        </View>

        {counts && counts.severeAllergies.length > 0 && (
          <View className="mt-4 mx-5 flex-row items-center gap-3 rounded-xl border border-rose/30 bg-rose/5 p-3">
            <AlertTriangle size={18} color="#e11d48" />
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-rose">
                Alergias severas
              </Text>
              <Text className="text-[12px] text-muted">
                {counts.severeAllergies.map((a) => a.allergen).join(" · ")}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-5 px-3">
          <View className="flex-row gap-2">
            <MiniStat
              icon={Scale}
              label="Peso"
              value={animal.weight_kg ? `${Number(animal.weight_kg).toFixed(1)} kg` : "—"}
            />
            <MiniStat icon={Syringe} label="Vacunas" value={`${counts?.vaccines ?? 0}`} />
            <MiniStat icon={Pill} label="Medic." value={`${counts?.meds ?? 0}`} />
          </View>
        </View>

        <View className="mt-5 px-5">
          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Resumen de salud
          </Text>
          <Card className="gap-3">
            <RowItem icon={Syringe} label="Vacunas" count={counts?.vaccines} />
            <RowItem icon={Pill} label="Medicación activa" count={counts?.meds} />
            <RowItem
              icon={AlertTriangle}
              label="Alergias"
              count={counts?.allergies}
              tone={counts && counts.severeAllergies.length > 0 ? "rose" : "neutral"}
            />
          </Card>
        </View>

        <View className="mt-5 px-5">
          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Datos
          </Text>
          <Card className="gap-3">
            {animal.color && <DataLine label="Color" value={animal.color} />}
            {animal.distinctive_marks && (
              <DataLine label="Marcas" value={animal.distinctive_marks} />
            )}
            {animal.notes && <DataLine label="Notas" value={animal.notes} />}
            {!animal.color && !animal.distinctive_marks && !animal.notes && (
              <Text className="text-[13px] text-muted">
                Sin datos adicionales. Editá desde la web para agregar más.
              </Text>
            )}
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

function RowItem({
  icon: Icon,
  label,
  count,
  tone = "primary",
}: {
  icon: typeof Scale;
  label: string;
  count?: number;
  tone?: "primary" | "rose" | "neutral";
}) {
  const colors = {
    primary: { bg: "#ede9fe", fg: "#7c3aed" },
    rose: { bg: "#ffe4e6", fg: "#e11d48" },
    neutral: { bg: "#f5f5f4", fg: "#57534e" },
  }[tone];
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="size-9 items-center justify-center rounded-lg"
        style={{ width: 36, height: 36, backgroundColor: colors.bg }}
      >
        <Icon size={18} color={colors.fg} />
      </View>
      <Text className="flex-1 text-[14px] font-medium text-foreground">{label}</Text>
      <Text className="font-mono text-[13px] font-semibold text-muted">
        {count ?? 0}
      </Text>
    </View>
  );
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
  async function handleShare() {
    await Share.share({
      message: `Acá está el QR de ${animalName}. Escanealo desde PetApp:\n${qrUrl}`,
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
              QR de {animalName}
            </Text>
            <Text className="mt-1 text-center text-[13px] text-white/90">
              Mostrale este código a tu veterinario.
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
              Que el veterinario escanee este código con la cámara de su celular.
            </Text>
          </View>

          <View className="mt-8 w-full">
            <Button
              label="Compartir link"
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
