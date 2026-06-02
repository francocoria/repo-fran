import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Archive,
  ChevronRight,
  MessageCircle,
  ScanLine,
  Search,
  Users,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { PetAvatar } from "../../../src/components/pet-avatar";
import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { useVetPatients, type VetPatient } from "../../../src/hooks/use-vet-data";
import { useTranslation } from "../../../src/lib/i18n";
import { useLocaleFormat } from "../../../src/lib/i18n/format";

export default function VetPatientsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: patients = [], isLoading, refetch, isRefetching } = useVetPatients();

  const active = patients.filter((p) => !p.archived);
  const archived = patients.filter((p) => p.archived);

  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<"all" | "dog" | "cat" | "other">(
    "all",
  );

  const counts = useMemo(
    () => ({
      all: active.length,
      dog: active.filter((p) => p.animal_species === "dog").length,
      cat: active.filter((p) => p.animal_species === "cat").length,
      other: active.filter(
        (p) => p.animal_species !== "dog" && p.animal_species !== "cat",
      ).length,
    }),
    [active],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchSpecies = (s: string) =>
      species === "all"
        ? true
        : species === "other"
          ? s !== "dog" && s !== "cat"
          : s === species;
    const matchQuery = (p: VetPatient) =>
      !q ||
      p.animal_name.toLowerCase().includes(q) ||
      (p.owner_name?.toLowerCase().includes(q) ?? false);
    return [...active, ...archived].filter(
      (p) => matchSpecies(p.animal_species) && matchQuery(p),
    );
  }, [active, archived, query, species]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      {/* Blob ambiental decorativo */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          left: -40,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(6, 182, 212, 0.10)",
        }}
      />

      <View className="px-5 pt-4 pb-2">
        <Text className="text-[12px] tracking-wide text-muted">
          {t("vet.patients.eyebrow")}
        </Text>
        <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
          {t("vet.patients.title")}
        </Text>
        <Text className="mt-1 text-[13px] text-muted">
          {t("vet.patients.countActive", { count: active.length })}
          {archived.length > 0 &&
            t("vet.patients.countArchived", { count: archived.length })}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#06b6d4" style={{ marginTop: 32 }} />
      ) : patients.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <LinearGradient
            colors={["#06b6d4", "#0891b2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#06b6d4",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Users size={32} color="#fff" strokeWidth={2.2} />
          </LinearGradient>
          <Text className="mt-4 text-center text-[17px] font-bold text-foreground">
            {t("vet.patients.emptyTitle")}
          </Text>
          <Text className="mt-1.5 text-center text-[13px] text-muted">
            {t("vet.patients.emptyDesc")}
          </Text>
          <View className="mt-5">
            <Button
              label={t("vet.patients.scanQr")}
              variant="accent"
              icon={ScanLine}
              onPress={() => router.push("/(app)/vet/scan" as never)}
            />
          </View>
        </View>
      ) : (
        <>
          {/* Buscador */}
          <View className="px-4 pb-2">
            <View
              className="flex-row items-center gap-2 rounded-xl border border-border bg-surface px-3"
              style={{ height: 44 }}
            >
              <Search size={17} color="#a8a29e" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("vet.patients.searchPlaceholder")}
                placeholderTextColor="#a8a29e"
                className="flex-1 text-[14px] text-foreground"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Filtros por especie */}
          <View className="flex-row gap-2 px-4 pb-2">
            <FilterPill
              label={t("vet.patients.filterAll")}
              count={counts.all}
              active={species === "all"}
              onPress={() => setSpecies("all")}
            />
            <FilterPill
              label={t("vet.patients.filterDogs")}
              count={counts.dog}
              active={species === "dog"}
              onPress={() => setSpecies("dog")}
            />
            <FilterPill
              label={t("vet.patients.filterCats")}
              count={counts.cat}
              active={species === "cat"}
              onPress={() => setSpecies("cat")}
            />
            <FilterPill
              label={t("vet.patients.filterOther")}
              count={counts.other}
              active={species === "other"}
              onPress={() => setSpecies("other")}
            />
          </View>

          <FlatList
            data={list}
            keyExtractor={(item) => item.access_id}
            renderItem={({ item }) => (
              <PatientRow
                patient={item}
                onPress={() =>
                  router.push(`/(app)/vet/patients/${item.animal_id}` as never)
                }
              />
            )}
            ItemSeparatorComponent={() => <View className="h-2" />}
            ListEmptyComponent={
              <View className="items-center px-8 py-16">
                <Search size={28} color="#d6d3d1" />
                <Text className="mt-3 text-center text-[13px] text-muted">
                  {t("vet.patients.noResults")}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#06b6d4"
              />
            }
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function FilterPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full border py-2 ${
        active ? "border-accent bg-accent" : "border-border bg-surface"
      }`}
    >
      <Text
        className={`text-[12.5px] font-semibold ${
          active ? "text-white" : "text-muted"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-[11px] font-bold ${
          active ? "text-white/80" : "text-subtle"
        }`}
      >
        {count}
      </Text>
    </Pressable>
  );
}

function PatientRow({
  patient,
  onPress,
}: {
  patient: VetPatient;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { speciesLabel } = useLocaleFormat();
  return (
    <Pressable
      onPress={onPress}
      className="mx-3 flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-3"
      style={{
        shadowColor: "#0c0a09",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
        opacity: patient.archived ? 0.7 : 1,
      }}
    >
      <PetAvatar
        name={patient.animal_name}
        species={patient.animal_species}
        photoUrl={patient.animal_photo_url}
        size={56}
        radius={14}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-[15px] font-semibold tracking-tight text-foreground"
            numberOfLines={1}
          >
            {patient.animal_name}
          </Text>
          {patient.archived && (
            <Badge
              label={t("vet.patients.badgeArchived")}
              tone="neutral"
              icon={Archive}
            />
          )}
        </View>
        <Text className="text-[12.5px] text-muted" numberOfLines={1}>
          {patient.animal_breed ?? speciesLabel(patient.animal_species)}
        </Text>
        <Text className="text-[11.5px] text-subtle" numberOfLines={1}>
          {patient.owner_name}
          {patient.owner_phone && ` · ${patient.owner_phone}`}
        </Text>
      </View>
      <View className="items-end gap-1">
        {patient.owner_phone && <MessageCircle size={16} color="#25d366" />}
        <ChevronRight size={16} color="#78716c" />
      </View>
    </Pressable>
  );
}
