import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Pill,
  Plus,
  PlusCircle,
  UserPlus,
} from "lucide-react-native";
import { PetAvatar } from "../../src/components/pet-avatar";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { useAnimals, type AnimalListItem } from "../../src/hooks/use-animals";
import { useSession, useProfile } from "../../src/lib/session";
import { usePendingCoOwnerInvites } from "../../src/hooks/use-co-owner-invites";
import { useTranslation } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";

export default function OwnerHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const { data: animals = [], isLoading, refetch, isRefetching } = useAnimals();
  const { data: profile } = useProfile(session?.user.id);
  const { data: invitesData } = usePendingCoOwnerInvites();
  const pendingInvitesCount = invitesData?.count ?? 0;
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
        <View>
          <View className="px-5 pt-2 pb-3">
            <Text className="text-[13px] text-muted">
              {t("owner.home.greeting")}
            </Text>
            <Text className="text-[28px] font-bold tracking-tight text-foreground">
              {firstName || "👋"}
            </Text>
            <Text className="mt-1.5 text-[14px] text-muted">
              {animals.length === 0
                ? t("owner.home.emptySubtitle")
                : t("owner.home.countSubtitle", { count: animals.length })}
            </Text>
          </View>

          {pendingInvitesCount > 0 && (
            <Pressable
              onPress={() => router.push("/(app)/invites" as never)}
              className="mx-3 mb-3 flex-row items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#7c3aed",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserPlus size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-foreground">
                  {t("owner.home.invitesPending", {
                    count: pendingInvitesCount,
                  })}
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  {t("owner.home.invitesHint")}
                </Text>
              </View>
              <ChevronRight size={18} color="#78716c" />
            </Pressable>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <PetRow animal={item} onPress={() => router.push(`/(app)/animals/${item.id}` as never)} />
      )}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      ListEmptyComponent={
        <View className="mx-5 mt-8 items-center rounded-2xl border-2 border-dashed border-border-strong p-8">
          <Text className="text-[16px] font-semibold text-foreground">
            {t("owner.home.emptyTitle")}
          </Text>
          <Text className="mt-2 text-center text-[13px] text-muted">
            {t("owner.home.emptyDesc")}
          </Text>
          <View className="mt-5">
            <Button
              label={t("owner.home.registerFirst")}
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
                {t("owner.home.addPet")}
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
  const { t } = useTranslation();
  const { ageLabel, speciesLabel } = useLocaleFormat();
  const age = animal.birth_date ? ageLabel(animal.birth_date) : null;
  const isLost = animal.status === "lost";

  const stateBadge = isLost
    ? {
        label: t("owner.home.badgeLost"),
        tone: "rose" as const,
        icon: AlertTriangle,
      }
    : animal.has_severe_allergy
      ? {
          label: t("owner.home.badgeSevereAllergy"),
          tone: "amber" as const,
          icon: AlertTriangle,
        }
      : animal.has_overdue_vaccine
        ? {
            label: t("owner.home.badgeOverdueVaccine"),
            tone: "rose" as const,
            icon: AlertTriangle,
          }
        : {
            label: t("owner.home.badgeOk"),
            tone: "emerald" as const,
            icon: CheckCircle2,
          };

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
          {animal.breed ?? speciesLabel(animal.species)}
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
