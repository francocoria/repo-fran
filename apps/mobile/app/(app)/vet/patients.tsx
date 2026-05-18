import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Archive, ChevronRight, MessageCircle, ScanLine } from "lucide-react-native";
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-[24px] font-bold tracking-tight text-foreground">
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
          <ScanLine size={40} color="#d6d3d1" />
          <Text className="mt-3 text-center text-[15px] font-semibold text-foreground">
            {t("vet.patients.emptyTitle")}
          </Text>
          <Text className="mt-1.5 text-center text-[13px] text-muted">
            {t("vet.patients.emptyDesc")}
          </Text>
          <View className="mt-5">
            <Button
              label={t("vet.patients.scanQr")}
              icon={ScanLine}
              onPress={() => router.push("/(app)/vet/scan" as never)}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={[...active, ...archived]}
          keyExtractor={(item) => item.access_id}
          renderItem={({ item }) => (
            <PatientRow
              patient={item}
              onPress={() => router.push(`/(app)/vet/patients/${item.animal_id}` as never)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06b6d4"
            />
          }
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
        />
      )}
    </SafeAreaView>
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
    >
      <PetAvatar
        name={patient.animal_name}
        species={patient.animal_species}
        photoUrl={patient.animal_photo_url}
        size={56}
        radius={14}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-semibold text-foreground">
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
        <Text className="text-[12.5px] text-muted">
          {patient.animal_breed ?? speciesLabel(patient.animal_species)}
        </Text>
        <Text className="text-[11.5px] text-subtle">
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
