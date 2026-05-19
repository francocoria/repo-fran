import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  Pill,
  Plus,
  QrCode,
  Scale,
  Syringe,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import { useAnimals, type AnimalListItem } from "../../src/hooks/use-animals";
import { useSession, useProfile } from "../../src/lib/session";
import { usePendingCoOwnerInvites } from "../../src/hooks/use-co-owner-invites";
import { useTranslation } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";

const SPECIES_GRADIENT: Record<string, [string, string]> = {
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

export default function OwnerHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useSession();
  const {
    data: animals = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAnimals();
  const { data: profile } = useProfile(session?.user.id);
  const { data: invitesData } = usePendingCoOwnerInvites();
  const pendingInvitesCount = invitesData?.count ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const anyAlerts = animals.some(
    (a) =>
      a.status === "lost" || a.has_severe_allergy || a.has_overdue_vaccine,
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Blob ambiental decorativo */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: "rgba(124, 58, 237, 0.10)",
        }}
      />

      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 130 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-end justify-between px-5 pb-2 pt-3">
              <View className="flex-1">
                <Text className="text-[12.5px] text-muted">
                  {t("owner.home.greeting")}
                </Text>
                <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
                  {firstName || ""} {t("owner.home.greetingWave")}
                </Text>
                {animals.length > 0 ? (
                  <Text className="mt-1 text-[13px] text-muted">
                    {anyAlerts
                      ? t("owner.home.summaryAlerts", { count: animals.length })
                      : t("owner.home.summaryAllOk", { count: animals.length })}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => router.push("/(app)/notifications" as never)}
                className="relative size-[42px] items-center justify-center rounded-[13px] border border-border bg-surface"
              >
                <Bell size={20} color="#0c0a09" />
                {pendingInvitesCount > 0 ? (
                  <View
                    className="absolute size-2 rounded-full bg-rose"
                    style={{
                      top: 8,
                      right: 9,
                      borderWidth: 1.5,
                      borderColor: "#ffffff",
                    }}
                  />
                ) : null}
              </Pressable>
            </View>

            {pendingInvitesCount > 0 ? (
              <Pressable
                onPress={() => router.push("/(app)/invites" as never)}
                className="mx-3 mb-3 mt-2 flex-row items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
              >
                <View
                  className="size-[38px] items-center justify-center rounded-[10px] bg-primary"
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
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="px-5">
            <HeroPetCard
              animal={item}
              onPress={() => router.push(`/(app)/animals/${item.id}` as never)}
            />
            {/* Sugerencias solo después del primer pet card si hay 1 sola mascota */}
            {animals.length === 1 && index === 0 ? (
              <SuggestionsRow
                animal={item}
                onPress={() => router.push(`/(app)/animals/${item.id}` as never)}
              />
            ) : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={
          <View className="mx-5 mt-8 items-center rounded-2xl border-2 border-dashed border-border-strong p-8">
            <Text className="text-[16px] font-semibold text-foreground">
              {t("owner.home.emptyTitle")}
            </Text>
            <Text className="mt-2 text-center text-[13px] text-muted">
              {t("owner.home.emptyDesc")}
            </Text>
            <View className="mt-5">
              <Pressable
                onPress={() => router.push("/(app)/animals/new" as never)}
                style={{
                  shadowColor: "#7c3aed",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 14,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={["#7c3aed", "#06b6d4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    paddingHorizontal: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Plus size={18} color="#fff" strokeWidth={2.4} />
                  <Text className="text-[15px] font-semibold text-white">
                    {t("owner.home.registerFirst")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          animals.length > 0 ? (
            <View className="px-5 pt-5">
              <Pressable
                onPress={() => router.push("/(app)/animals/new" as never)}
                className="flex-row items-center gap-3.5 rounded-[18px] border-[1.5px] border-dashed border-primary/40 bg-surface p-4"
              >
                <LinearGradient
                  colors={["#7c3aed26", "#06b6d426"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={22} color="#7c3aed" strokeWidth={2.4} />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">
                    {t("owner.home.addAnotherTitle")}
                  </Text>
                  <Text className="mt-0.5 text-[12.5px] text-muted">
                    {t("owner.home.addAnotherDesc")}
                  </Text>
                </View>
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
      />
    </View>
  );
}

/* ─── HeroPetCard — foto grande + overlay + stats ──────── */
function HeroPetCard({
  animal,
  onPress,
}: {
  animal: AnimalListItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { ageLabel, speciesLabel } = useLocaleFormat();
  const isLost = animal.status === "lost";
  const age = animal.birth_date ? ageLabel(animal.birth_date) : null;
  const subtitle =
    (animal.breed ?? speciesLabel(animal.species)) +
    (animal.sex === "male" ? " · ♂" : animal.sex === "female" ? " · ♀" : "") +
    (age ? ` · ${age}` : "");

  const status = isLost
    ? {
        label: t("owner.home.badgeLost"),
        bg: "rgba(225,29,72,0.95)",
        icon: AlertTriangle,
      }
    : animal.has_severe_allergy
      ? {
          label: t("owner.home.badgeSevereAllergy"),
          bg: "rgba(245,158,11,0.95)",
          icon: AlertTriangle,
        }
      : animal.has_overdue_vaccine
        ? {
            label: t("owner.home.badgeOverdueVaccine"),
            bg: "rgba(225,29,72,0.95)",
            icon: AlertTriangle,
          }
        : {
            label: t("owner.home.statusOk"),
            bg: "rgba(16,185,129,0.95)",
            icon: CheckCircle2,
          };
  const StatusIcon = status.icon;
  const gradient = SPECIES_GRADIENT[animal.species] ?? SPECIES_GRADIENT.other;

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-[24px] border border-border bg-surface"
      style={{
        shadowColor: "#0c0a09",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 22,
        elevation: 3,
      }}
    >
      {/* Foto hero */}
      <View style={{ height: 220, position: "relative" }}>
        {animal.photo_url ? (
          <Image
            source={{ uri: animal.photo_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 96,
                fontWeight: "800",
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              {animal.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {/* Overlay para legibilidad */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          locations={[0.3, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Top row: badge + QR */}
        <View className="absolute left-3.5 right-3.5 top-3.5 flex-row items-start justify-between">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: status.bg }}
          >
            <StatusIcon size={12} color="#fff" strokeWidth={2.4} />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-white">
              {status.label}
            </Text>
          </View>
          <View
            className="size-9 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: "rgba(255,255,255,0.22)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <QrCode size={18} color="#fff" />
          </View>
        </View>
        {/* Name overlay */}
        <View className="absolute bottom-3.5 left-4 right-4">
          <Text
            className="text-[32px] font-extrabold leading-none tracking-tight text-white"
            style={{
              textShadowColor: "rgba(0,0,0,0.35)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 12,
            }}
          >
            {animal.name}
          </Text>
          <Text className="mt-1 text-[13px] font-medium text-white/95">
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row border-t border-border">
        <StatPill
          icon={Scale}
          label={t("owner.home.statWeight")}
          value={
            animal.weight_kg
              ? Number(animal.weight_kg).toFixed(1)
              : "—"
          }
          unit={animal.weight_kg ? "kg" : undefined}
        />
        <StatPill
          icon={Syringe}
          label={t("owner.home.statAge")}
          value={age ? age.split(" ")[0] ?? "—" : "—"}
          unit={age ? age.split(" ").slice(1).join(" ") : undefined}
          divider
        />
        <StatPill
          icon={Pill}
          label={t("owner.home.statMeds")}
          value={String(animal.active_meds_count)}
        />
      </View>
    </Pressable>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  unit,
  divider,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  divider?: boolean;
}) {
  return (
    <View
      className="flex-1 items-center px-3 py-3"
      style={
        divider
          ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#e7e5e4" }
          : undefined
      }
    >
      <View className="mb-1 flex-row items-center gap-1">
        <Icon size={12} color="#78716c" strokeWidth={2} />
        <Text className="text-[10px] font-bold uppercase tracking-wider text-subtle">
          {label}
        </Text>
      </View>
      <Text className="font-mono text-[17px] font-bold text-foreground">
        {value}
        {unit ? (
          <Text className="text-[11px] font-medium text-muted"> {unit}</Text>
        ) : null}
      </Text>
    </View>
  );
}

/* ─── SuggestionsRow — "Completar perfil de Pepe" ─────── */
function SuggestionsRow({
  animal,
  onPress,
}: {
  animal: AnimalListItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const suggestions: {
    icon: LucideIcon;
    title: string;
    tint: string;
    bg: string;
    border: string;
  }[] = [
    {
      icon: Syringe,
      title: t("owner.home.suggVaccines"),
      tint: "#6d28d9",
      bg: "rgba(124,58,237,0.10)",
      border: "rgba(124,58,237,0.25)",
    },
    {
      icon: ImageIcon,
      title: t("owner.home.suggPhoto"),
      tint: "#0891b2",
      bg: "rgba(6,182,212,0.10)",
      border: "rgba(6,182,212,0.25)",
    },
    {
      icon: Pill,
      title: t("owner.home.suggDewormings"),
      tint: "#b45309",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
    },
  ];

  return (
    <View className="mt-4">
      <Text className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-subtle">
        {t("owner.home.completeProfile", { name: animal.name })}
      </Text>
      <View className="flex-row gap-2.5">
        {suggestions.map((s) => {
          const SIcon = s.icon;
          return (
            <Pressable
              key={s.title}
              onPress={onPress}
              className="flex-1 gap-2 rounded-2xl p-3"
              style={{
                backgroundColor: s.bg,
                borderWidth: 1,
                borderColor: s.border,
              }}
            >
              <View
                className="size-8 items-center justify-center rounded-[10px] bg-white"
                style={{
                  shadowColor: "#0c0a09",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <SIcon size={16} color={s.tint} strokeWidth={2.2} />
              </View>
              <Text className="text-[13px] font-semibold text-foreground">
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
