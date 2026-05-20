import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Search,
  Share2,
} from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";
import { env } from "../../src/lib/env";
import { useTranslation } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";

interface LostAlert {
  id: string;
  public_slug: string;
  activated_at: string;
  last_seen_at: string | null;
  last_seen_location: string | null;
  contact_name: string;
  contact_phone: string;
  reward_description: string | null;
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
    color: string | null;
  } | null;
}

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

export default function LostFeedScreen() {
  const { t } = useTranslation();
  const { speciesLabel, formatDate } = useLocaleFormat();
  const [alerts, setAlerts] = useState<LostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("lost_pet_alerts")
      .select(
        `id, public_slug, activated_at, last_seen_at, last_seen_location,
         contact_name, contact_phone, reward_description,
         animal:animals(id, name, species, breed, photo_url, color)`,
      )
      .eq("status", "active")
      .order("activated_at", { ascending: false })
      .limit(100);

    const rows: LostAlert[] = (data ?? []).map((row: any) => ({
      ...row,
      animal: Array.isArray(row.animal) ? (row.animal[0] ?? null) : row.animal,
    }));
    setAlerts(rows.filter((a) => a.animal !== null));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  const total = alerts.length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
      >
        {/* Blob ambiental */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -50,
            right: -30,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(225, 29, 72, 0.10)",
          }}
        />

        {/* Header */}
        <View className="px-5 pb-2 pt-3">
          <View className="flex-row items-center gap-2">
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: "rgba(225,29,72,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={16} color="#e11d48" strokeWidth={2.4} />
            </View>
            <Text className="text-[12px] tracking-wide text-muted">
              {t("owner.lost.eyebrow")}
            </Text>
          </View>
          <Text className="mt-1 text-[28px] font-extrabold tracking-tight text-foreground">
            {t("owner.lost.title")}
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            {loading
              ? t("common.loading")
              : total === 0
                ? t("owner.lost.emptyHint")
                : t("owner.lost.feedCount", { count: total })}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 32 }} />
        ) : alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <View className="mt-3 px-5" style={{ gap: 14 }}>
            {alerts.map((a) => (
              <LostCard key={a.id} alert={a} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function LostCard({ alert }: { alert: LostAlert }) {
    const animal = alert.animal!;
    const gradient =
      SPECIES_GRADIENT[animal.species] ?? SPECIES_GRADIENT.other;
    const url = `${env.APP_URL}/lost/${alert.public_slug}`;

    async function handleShare() {
      await Share.share({
        message: t("owner.lost.shareMessage", {
          name: animal.name,
          url,
        }),
      });
    }

    return (
      <View
        className="overflow-hidden rounded-[22px] border border-rose/20 bg-surface"
        style={{
          shadowColor: "#e11d48",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }}
      >
        {/* Foto */}
        <View style={{ position: "relative", height: 220 }}>
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
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {/* Velo arriba */}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 90,
            }}
          />
          {/* Velo abajo para legibilidad */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 110,
            }}
          />

          {/* Badge PERDIDA (top-left) */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#e11d48",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <AlertTriangle size={12} color="white" strokeWidth={2.6} />
            <Text
              style={{
                color: "white",
                fontSize: 10.5,
                fontWeight: "800",
                letterSpacing: 0.6,
              }}
            >
              {t("owner.lost.badge")}
            </Text>
          </View>

          {/* Tiempo desde activación (top-right) */}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(255,255,255,0.92)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Clock size={10} color="#0c0a09" strokeWidth={2.2} />
            <Text style={{ fontSize: 10.5, fontWeight: "700", color: "#0c0a09" }}>
              {relativeTime(alert.activated_at, t)}
            </Text>
          </View>

          {/* Nombre y especie sobre la foto (bottom-left) */}
          <View
            style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.8,
              }}
            >
              {animal.name}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 12.5,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {speciesLabel(animal.species)}
              {animal.breed ? ` · ${animal.breed}` : ""}
              {animal.color ? ` · ${animal.color}` : ""}
            </Text>
          </View>
        </View>

        {/* Datos + acciones */}
        <View className="gap-3 p-4">
          {alert.last_seen_location && (
            <Row
              icon={MapPin}
              label={t("owner.lost.lastSeenAt", {
                place: alert.last_seen_location,
              })}
              sub={
                alert.last_seen_at
                  ? formatDate(alert.last_seen_at, { short: true })
                  : null
              }
            />
          )}
          {alert.reward_description && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 12, color: "#92400e", fontWeight: "700" }}>
                🏷 {t("owner.lost.rewardLabel")}: {alert.reward_description}
              </Text>
            </View>
          )}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => callPhone(alert.contact_phone)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-[12px] bg-rose py-3"
              style={{
                shadowColor: "#e11d48",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Phone size={15} color="white" strokeWidth={2.4} />
              <Text className="text-[13.5px] font-bold text-white">
                {t("owner.lost.contact", { name: alert.contact_name })}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="items-center justify-center rounded-[12px] border border-border bg-surface"
              style={{ width: 48 }}
            >
              <Share2 size={17} color="#0c0a09" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  function EmptyState() {
    return (
      <View className="mx-5 mt-6 items-center gap-3 rounded-[20px] border border-dashed border-border bg-surface px-5 py-10">
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "rgba(124,58,237,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={26} color="#7c3aed" strokeWidth={1.8} />
        </View>
        <Text className="text-center text-[16px] font-bold text-foreground">
          {t("owner.lost.emptyTitle")}
        </Text>
        <Text className="px-2 text-center text-[13px] text-muted">
          {t("owner.lost.emptyDesc")}
        </Text>
      </View>
    );
  }
}

function Row({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof MapPin;
  label: string;
  sub?: string | null;
}) {
  return (
    <View className="flex-row items-start gap-2">
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "rgba(124,58,237,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        <Icon size={14} color="#7c3aed" strokeWidth={2.2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-medium text-foreground">{label}</Text>
        {sub && <Text className="mt-0.5 text-[11.5px] text-muted">{sub}</Text>}
      </View>
    </View>
  );
}

function relativeTime(iso: string, t: (k: string, p?: Record<string, string | number>) => string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t("owner.lost.justNow");
  if (min < 60) return t("owner.lost.minutesAgo", { count: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t("owner.lost.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("owner.lost.daysAgo", { count: days });
}

function callPhone(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
}
