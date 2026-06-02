import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Crown,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "../../../src/components/ui/card";
import { PetAvatar } from "../../../src/components/pet-avatar";
import { PawPattern } from "../../../src/components/ui/paw-pattern";
import { useVetPlan, useVetRecentConsults } from "../../../src/hooks/use-vet-data";
import { useTranslation } from "../../../src/lib/i18n";

const FREE_CAP = 5;

function timeSince(dateString: string, t: any) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t("owner.lost.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("owner.lost.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("owner.lost.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("owner.lost.daysAgo", { count: days });
}

export default function VetHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { data: planData, isLoading: isLoadingPlan, refetch: refetchPlan, isRefetching: isRefetchingPlan } = useVetPlan();
  const { data: recentConsults = [], isLoading: isLoadingConsults, refetch: refetchConsults, isRefetching: isRefetchingConsults } = useVetRecentConsults();

  const isLoading = isLoadingPlan || isLoadingConsults;
  const isRefetching = isRefetchingPlan || isRefetchingConsults;

  const handleRefresh = async () => {
    await Promise.all([refetchPlan(), refetchConsults()]);
  };

  if (isLoading || !planData) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#06b6d4" />
      </View>
    );
  }

  const { profile, subscription, activeCount } = planData;
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const now = new Date();
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const expired = expiresAt && expiresAt < now;
  const isPremium = !expired && (subscription?.plan === "premium" || subscription?.plan === "trial");
  const atCap = !isPremium && activeCount >= FREE_CAP;
  const trialEndingSoon = subscription?.plan === "trial" && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  // Calculamos las estadísticas reales basadas en las consultas del vet
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayConsultsCount = recentConsults.filter(
    (c) => new Date(c.visit_date) >= todayStart
  ).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekConsultsCount = recentConsults.filter(
    (c) => new Date(c.visit_date) >= weekStart
  ).length;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor="#06b6d4"
        />
      }
    >
      {/* Blob ambiental decorativo */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "rgba(6, 182, 212, 0.08)",
        }}
      />

      {/* Header */}
      <View className="px-5 pt-6 pb-2 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[12.5px] text-muted">
            {t("vet.home.greeting")}
          </Text>
          <Text className="text-[24px] font-extrabold tracking-tight text-foreground leading-tight">
            {profile.full_name}
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <ShieldCheck size={13} color="#0ea5e9" strokeWidth={2.4} />
            <Text className="text-[12px] text-muted">
              {profile.clinic_name || t("vet.settings.clinicPlaceholder")}
            </Text>
          </View>
        </View>
        <PlanBadge plan={subscription?.plan} expired={!!expired} daysLeft={daysLeft} />
      </View>

      {/* Warning/Alert banners */}
      {(expired || trialEndingSoon || atCap) && (
        <View className="mt-2 px-3">
          <Card
            className={
              expired
                ? "border-rose/30 bg-rose/5"
                : "border-amber/30 bg-amber/5"
            }
          >
            <View className="flex-row items-start gap-3">
              <AlertCircle
                size={18}
                color={expired ? "#e11d48" : "#b45309"}
                strokeWidth={2.2}
              />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-foreground">
                  {expired
                    ? t("vet.home.planExpiredTitle")
                    : trialEndingSoon
                      ? t("vet.home.trialEndingTitle", {
                          count: daysLeft ?? 0,
                        })
                      : t("vet.home.atCapTitle")}
                </Text>
                <Text className="mt-0.5 text-[12.5px] text-muted">
                  {expired
                    ? t("vet.home.planExpiredDesc")
                    : trialEndingSoon
                      ? t("vet.home.trialEndingDesc")
                      : t("vet.home.atCapDesc", {
                          active: activeCount,
                          cap: FREE_CAP,
                        })}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Hero scan card */}
      <Pressable
        onPress={() => router.push("/(app)/vet/scan" as never)}
        className="mt-4 mx-3 overflow-hidden rounded-[24px]"
        style={{
          shadowColor: "#06b6d4",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={["#06b6d4", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            height: 100,
            position: "relative",
          }}
        >
          <PawPattern
            width={width - 24}
            height={100}
            color="#ffffff"
            opacity={0.1}
          />
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <QrCode size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold tracking-wider text-white/80 uppercase">
              {t("vet.home.actions")}
            </Text>
            <Text className="text-[19px] font-extrabold text-white leading-tight mt-0.5">
              {t("vet.home.scanQr")}
            </Text>
            <Text className="text-[12.5px] text-white/90 mt-0.5">
              {t("vet.home.scanQrSub")}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Stats Grid */}
      <View className="mt-4 px-3 gap-2.5">
        <View className="flex-row gap-2.5">
          <VetStatTile
            label={t("vet.home.statToday")}
            value={String(todayConsultsCount)}
            icon={Calendar}
            subtitle={t("vet.home.statTodaySub")}
            tone="primary"
          />
          <VetStatTile
            label={t("vet.home.statPatients")}
            value={isPremium ? `${activeCount}` : `${activeCount}/${FREE_CAP}`}
            icon={Users}
            subtitle={t("vet.home.statPatientsSub")}
            tone="accent"
          />
        </View>
        <View className="flex-row gap-2.5">
          <VetStatTile
            label={t("vet.home.statWeek")}
            value={String(weekConsultsCount)}
            icon={TrendingUp}
            subtitle={t("vet.home.statWeekSub")}
            tone="emerald"
          />
          <VetStatTile
            label={t("vet.home.statPlan")}
            value={
              subscription?.plan === "premium"
                ? t("vet.home.planValuePremium")
                : subscription?.plan === "trial"
                  ? t("vet.home.planValueTrial")
                  : t("vet.home.planValueFree")
            }
            icon={Crown}
            subtitle={
              expired ? t("vet.home.planExpired") : t("vet.home.planActive")
            }
            tone="amber"
          />
        </View>
      </View>

      {/* Actions / Navigation list */}
      <View className="mt-5 px-5 flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          {t("vet.home.recentActivity")}
        </Text>
        <Pressable onPress={() => router.push("/(app)/vet/patients" as never)}>
          <Text className="text-[12px] font-semibold text-accent">
            {t("vet.home.seeAll")} →
          </Text>
        </Pressable>
      </View>

      {/* Recent Activity List */}
      <View className="mt-2 px-3 gap-2">
        {recentConsults.length === 0 ? (
          <Card className="items-center py-8">
            <Users size={32} color="#d6d3d1" />
            <Text className="mt-3 text-[13px] text-muted text-center px-6">
              {t("vet.home.emptyActivity")}
            </Text>
          </Card>
        ) : (
          recentConsults.slice(0, 4).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(app)/vet/patients/${c.animal_id}` as never)}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <PetAvatar
                name={c.animal_name}
                species={c.animal_species}
                photoUrl={c.animal_photo_url || undefined}
                size={40}
                radius={10}
              />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13.5px] font-bold text-foreground">
                    {c.animal_name}
                  </Text>
                  <Text className="text-[10.5px] text-subtle">
                    {timeSince(c.visit_date, t)}
                  </Text>
                </View>
                <Text
                  className="text-[11.5px] text-muted mt-0.5"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {c.reason}
                </Text>
              </View>
              <ChevronRight size={14} color="#a8a29e" />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function VetStatTile({
  label,
  value,
  icon: Icon,
  subtitle,
  tone,
}: {
  label: string;
  value: string;
  icon: any;
  subtitle: string;
  tone: "primary" | "accent" | "emerald" | "amber";
}) {
  const styles = {
    primary: { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary" },
    accent: { bg: "bg-accent/5", border: "border-accent/20", text: "text-accent" },
    emerald: { bg: "bg-emerald/5", border: "border-emerald/20", text: "text-emerald" },
    amber: { bg: "bg-amber/5", border: "border-amber/20", text: "text-amber" },
  }[tone];

  return (
    <View className={`rounded-2xl border p-3.5 flex-1 ${styles.bg} ${styles.border}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[10.5px] font-bold uppercase tracking-wider text-subtle">
          {label}
        </Text>
        <Icon size={14} className={styles.text} />
      </View>
      <Text className="mt-1 text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
        {value}
      </Text>
      <Text className="text-[11px] font-medium text-muted mt-0.5">
        {subtitle}
      </Text>
    </View>
  );
}

function PlanBadge({
  plan,
  expired,
  daysLeft,
}: {
  plan?: string;
  expired: boolean;
  daysLeft: number | null;
}) {
  const { t } = useTranslation();
  if (expired) {
    return (
      <View className="rounded-full bg-rose px-2.5 py-1 flex-row items-center gap-1">
        <AlertCircle size={10} color="#fff" strokeWidth={2.4} />
        <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
          {t("vet.home.badgeExpired")}
        </Text>
      </View>
    );
  }
  if (plan === "premium") {
    return (
      <LinearGradient
        colors={["#d97706", "#fbbf24"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          shadowColor: "#d97706",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Crown size={11} color="#fff" strokeWidth={2.4} />
        <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
          {t("vet.home.badgePremium")}
        </Text>
      </LinearGradient>
    );
  }
  if (plan === "trial") {
    return (
      <LinearGradient
        colors={["#d97706", "#fbbf24"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          shadowColor: "#d97706",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Sparkles size={11} color="#fff" strokeWidth={2.4} />
        <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
          {daysLeft
            ? t("vet.home.badgeTrialDays", { days: daysLeft })
            : t("vet.home.badgeTrial")}
        </Text>
      </LinearGradient>
    );
  }
  return (
    <View className="rounded-full bg-neutral-200 px-2.5 py-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        {t("vet.home.badgeFree")}
      </Text>
    </View>
  );
}

