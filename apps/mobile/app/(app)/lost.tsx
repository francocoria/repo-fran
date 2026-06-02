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
  MapPin,
  MessageCircle,
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
  const { speciesLabel } = useLocaleFormat();
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
            {t("owner.lost.headline")}
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
          <>
            {/* Destacada */}
            <View className="mt-3 px-5">
              <LostCard alert={alerts[0]!} />
            </View>

            {/* Resto, en filas compactas */}
            {alerts.length > 1 && (
              <View className="mt-6">
                <Text className="mb-2 px-5 text-[11px] font-bold uppercase tracking-wider text-subtle">
                  {t("owner.lost.othersTitle")}
                </Text>
                <View className="px-5" style={{ gap: 10 }}>
                  {alerts.slice(1).map((a) => (
                    <LostRow key={a.id} alert={a} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function LostCard({ alert }: { alert: LostAlert }) {
    const animal = alert.animal!;
    const gradient =
      SPECIES_GRADIENT[animal.species] ?? SPECIES_GRADIENT.other;
    const url = `${env.APP_URL}/lost/${alert.public_slug}`;
    const initial = animal.name.trim().charAt(0).toUpperCase() || "?";
    const sub = [speciesLabel(animal.species), animal.breed, animal.color]
      .filter(Boolean)
      .join(" · ");

    async function handleShare() {
      await Share.share({
        message: t("owner.lost.shareMessage", { name: animal.name, url }),
      });
    }

    function handleWhatsApp() {
      const msg = t("owner.lost.whatsappMessage", { name: animal.name, url });
      void Linking.openURL(waLink(alert.contact_phone, msg));
    }

    return (
      <View
        className="rounded-[20px] border-2 border-rose/25 bg-surface p-3.5"
        style={{
          shadowColor: "#e11d48",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }}
      >
        {/* Badge PERDIDA HACE X */}
        <View
          className="mb-3 flex-row items-center self-start"
          style={{
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
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {t("owner.lost.badge")} {relativeTime(alert.activated_at, t)}
          </Text>
        </View>

        {/* Avatar + datos */}
        <View className="flex-row gap-3">
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
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
                  style={{ color: "white", fontSize: 26, fontWeight: "800" }}
                >
                  {initial}
                </Text>
              </LinearGradient>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-[20px] font-extrabold tracking-tight text-foreground"
              numberOfLines={1}
            >
              {animal.name}
            </Text>
            {sub ? (
              <Text
                className="mt-0.5 text-[12.5px] text-muted"
                numberOfLines={2}
              >
                {sub}
              </Text>
            ) : null}
            {alert.last_seen_location ? (
              <View className="mt-1 flex-row items-center gap-1">
                <MapPin size={12} color="#e11d48" strokeWidth={2.2} />
                <Text
                  className="flex-1 text-[12px] font-medium text-foreground"
                  numberOfLines={1}
                >
                  {alert.last_seen_location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Recompensa */}
        {alert.reward_description ? (
          <View
            className="mt-3 flex-row items-center self-start"
            style={{
              gap: 6,
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: "#92400e", fontWeight: "700" }}>
              🏷 {t("owner.lost.rewardLabel")}: {alert.reward_description}
            </Text>
          </View>
        ) : null}

        {/* Acciones */}
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={handleWhatsApp}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-[12px] py-3"
            style={{
              backgroundColor: "#25D366",
              shadowColor: "#25D366",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <MessageCircle size={16} color="white" strokeWidth={2.4} />
            <Text className="text-[13.5px] font-bold text-white">
              {t("owner.lost.whatsappAvisar")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(url)}
            className="items-center justify-center rounded-[12px] border border-border bg-surface px-4"
          >
            <Text className="text-[13px] font-semibold text-foreground">
              {t("owner.lost.seeMore")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="items-center justify-center rounded-[12px] border border-border bg-surface"
            style={{ width: 46 }}
          >
            <Share2 size={17} color="#0c0a09" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    );
  }

  function LostRow({ alert }: { alert: LostAlert }) {
    const animal = alert.animal!;
    const gradient =
      SPECIES_GRADIENT[animal.species] ?? SPECIES_GRADIENT.other;
    const url = `${env.APP_URL}/lost/${alert.public_slug}`;

    function handleWhatsApp() {
      const msg = t("owner.lost.whatsappMessage", { name: animal.name, url });
      void Linking.openURL(waLink(alert.contact_phone, msg));
    }

    return (
      <View className="flex-row items-center gap-3 rounded-[16px] border border-rose/15 bg-surface p-2.5">
        {/* Miniatura */}
        <View
          style={{ width: 58, height: 58, borderRadius: 14, overflow: "hidden" }}
        >
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
        </View>

        {/* Datos */}
        <View className="min-w-0 flex-1">
          <Text
            className="text-[15px] font-bold text-foreground"
            numberOfLines={1}
          >
            {animal.name}
          </Text>
          <Text className="text-[12px] text-muted" numberOfLines={1}>
            {speciesLabel(animal.species)}
            {animal.breed ? ` · ${animal.breed}` : ""}
          </Text>
          {alert.last_seen_location ? (
            <View className="mt-0.5 flex-row items-center gap-1">
              <MapPin size={11} color="#78716c" strokeWidth={2.2} />
              <Text
                className="flex-1 text-[11.5px] text-subtle"
                numberOfLines={1}
              >
                {alert.last_seen_location}
              </Text>
            </View>
          ) : (
            <Text className="mt-0.5 text-[11.5px] text-subtle">
              {relativeTime(alert.activated_at, t)}
            </Text>
          )}
        </View>

        {/* WhatsApp */}
        <Pressable
          onPress={handleWhatsApp}
          hitSlop={8}
          className="items-center justify-center rounded-full"
          style={{ width: 42, height: 42, backgroundColor: "#25D366" }}
        >
          <MessageCircle size={19} color="white" strokeWidth={2.4} />
        </Pressable>
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

/** Link wa.me con mensaje pre-cargado. wa.me requiere sólo dígitos (sin +). */
function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
