import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Pill,
  Plus,
  PlusCircle,
} from "lucide-react-native";
import { PetAvatar } from "../../src/components/pet-avatar";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { useAnimals, type AnimalListItem } from "../../src/hooks/use-animals";
import { useSession, useProfile } from "../../src/lib/session";
import { getAge, speciesLabel } from "../../src/lib/format";

export default function OwnerHome() {
  const router = useRouter();
  const { session } = useSession();
  const { data: animals = [], isLoading, refetch, isRefetching } = useAnimals();
  const { data: profile } = useProfile(session?.user.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <FlatList
      data={animals}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 120 }}
      ListHeaderComponent={
        <View className="px-5 pt-2 pb-3">
          <Text className="text-[13px] text-muted">Hola de nuevo,</Text>
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {firstName || "👋"}
          </Text>
          <Text className="mt-1.5 text-[14px] text-muted">
            {animals.length === 0
              ? "Empezá registrando tu primera mascota."
              : `Tenés ${animals.length} ${animals.length === 1 ? "mascota" : "mascotas"} registrada${animals.length === 1 ? "" : "s"}.`}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <PetRow animal={item} onPress={() => router.push(`/(app)/animals/${item.id}` as never)} />
      )}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      ListEmptyComponent={
        <View className="mx-5 mt-8 items-center rounded-2xl border-2 border-dashed border-border-strong p-8">
          <Text className="text-[16px] font-semibold text-foreground">
            Todavía no registraste mascotas
          </Text>
          <Text className="mt-2 text-center text-[13px] text-muted">
            Empezá registrando a tu primera mascota para llevar el control de
            sus vacunas, turnos e historial.
          </Text>
          <View className="mt-5">
            <Button
              label="Registrar mi primera mascota"
              icon={PlusCircle}
              onPress={() => router.push("/(app)/animals/new" as never)}
            />
          </View>
        </View>
      }
      ListFooterComponent={
        animals.length > 0 ? (
          <View className="px-5 pt-3">
            <Pressable
              onPress={() => router.push("/(app)/animals/new" as never)}
              className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong py-5"
            >
              <Plus size={18} color="#78716c" />
              <Text className="text-[14px] font-medium text-muted">
                Agregar mascota
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#7c3aed"
        />
      }
      style={{ paddingHorizontal: 12 }}
    />
  );
}

function PetRow({
  animal,
  onPress,
}: {
  animal: AnimalListItem;
  onPress: () => void;
}) {
  const age = animal.birth_date ? getAge(animal.birth_date) : null;
  const isLost = animal.status === "lost";

  const stateBadge = isLost
    ? { label: "PERDIDA", tone: "rose" as const, icon: AlertTriangle }
    : animal.has_severe_allergy
      ? { label: "Alergia severa", tone: "amber" as const, icon: AlertTriangle }
      : animal.has_overdue_vaccine
        ? { label: "Vacuna vencida", tone: "rose" as const, icon: AlertTriangle }
        : { label: "Al día", tone: "emerald" as const, icon: CheckCircle2 };

  return (
    <Pressable
      onPress={onPress}
      className="mx-3 flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-3"
    >
      <PetAvatar
        name={animal.name}
        species={animal.species}
        photoUrl={animal.photo_url}
        size={64}
        radius={16}
        lost={isLost}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[16px] font-semibold text-foreground">
            {animal.name}
          </Text>
          {age && <Text className="text-[12px] text-subtle">· {age}</Text>}
        </View>
        <Text className="text-[12.5px] text-muted">
          {animal.breed ?? speciesLabel[animal.species] ?? animal.species}
          {animal.sex !== "unknown" && (animal.sex === "male" ? " · ♂" : " · ♀")}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Badge label={stateBadge.label} tone={stateBadge.tone} icon={stateBadge.icon} />
          {animal.active_meds_count > 0 && <Pill size={14} color="#78716c" />}
        </View>
      </View>
      <ChevronRight size={18} color="#78716c" />
    </Pressable>
  );
}
