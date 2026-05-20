import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Crown,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "../../../src/components/ui/badge";
import { Card } from "../../../src/components/ui/card";
import { useVetPlan } from "../../../src/hooks/use-vet-data";
import { useTranslation } from "../../../src/lib/i18n";

const FREE_CAP = 5;

export default function VetHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading } = useVetPlan();

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#06b6d4" />
      </View>
    );
  }

  const { profile, subscription, activeCount } = data;
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const now = new Date();
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const expired = expiresAt && expiresAt < now;
  const isPremium = !expired && (subscription?.plan === "premium" || subscription?.plan === "trial");
  const atCap = !isPremium && activeCount >= FREE_CAP;
  const trialEndingSoon = subscription?.plan === "trial" && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  const firstName = profile.full_name.split(" ")[0];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Blob ambiental decorativo */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(6, 182, 212, 0.10)",
        }}
      />

      <View className="px-5 pt-4">
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-[12px] tracking-wide text-muted">
              {t("vet.home.greeting")}
            </Text>
            <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
              {firstName}
            </Text>
            {profile.clinic_name && (
              <Text className="mt-0.5 text-[13px] text-muted">
                {profile.clinic_name}
              </Text>
            )}
          </View>
          <PlanBadge plan={subscription?.plan} expired={!!expired} daysLeft={daysLeft} />
        </View>
      </View>

      {(expired || trialEndingSoon || atCap) && (
        <View className="mt-4 px-3">
          <Card
            className={
              expired
                ? "border-rose/30 bg-rose/5"
                : "border-amber/30 bg-amber/10"
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

      <Pressable
        onPress={() => router.push("/(app)/vet/scan" as never)}
        className="mt-4 mx-3"
      >
        <LinearGradient
          colors={["#06b6d4", "#0891b2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            shadowColor: "#06b6d4",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[16px] font-bold text-white">
              {t("vet.home.scanQr")}
            </Text>
            <Text className="text-[12.5px] text-white/90">
              {t("vet.home.scanQrSub")}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      <View className="mt-4 px-3">
        <View className="flex-row gap-2">
          <MiniStat
            label={t("vet.home.statActive")}
            value={isPremium ? `${activeCount}` : `${activeCount} / ${FREE_CAP}`}
            icon={Users}
          />
          <MiniStat
            label={t("vet.home.statPlan")}
            value={subscription?.plan ?? "free"}
            icon={Crown}
          />
        </View>
      </View>

      <View className="mt-5 px-5">
        <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          {t("vet.home.actions")}
        </Text>
      </View>

      <View className="px-3 gap-2">
        <Pressable
          onPress={() => router.push("/(app)/vet/patients" as never)}
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <View
            className="size-10 items-center justify-center rounded-lg bg-accent/10"
            style={{ width: 40, height: 40 }}
          >
            <Users size={18} color="#06b6d4" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-foreground">
              {t("vet.home.myPatients")}
            </Text>
            <Text className="text-[12px] text-muted">
              {t("vet.home.myPatientsSub")}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(app)/vet/plan" as never)}
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <LinearGradient
            colors={["#f59e0b", "#fbbf24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown size={18} color="#fff" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-foreground">
              {t("vet.home.myPlan")}
            </Text>
            <Text className="text-[12px] text-muted">
              {isPremium
                ? t("vet.home.myPlanPremium")
                : t("vet.home.myPlanFree")}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
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
  if (expired)
    return (
      <Badge label={t("vet.home.badgeExpired")} tone="rose" icon={AlertCircle} />
    );
  if (plan === "premium")
    return (
      <Badge label={t("vet.home.badgePremium")} tone="gold" icon={Crown} />
    );
  if (plan === "trial")
    return (
      <Badge
        label={
          daysLeft
            ? t("vet.home.badgeTrialDays", { days: daysLeft })
            : t("vet.home.badgeTrial")
        }
        tone="amber"
        icon={Sparkles}
      />
    );
  return <Badge label={t("vet.home.badgeFree")} tone="neutral" />;
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-surface p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
          {label}
        </Text>
        <Icon size={14} color="#78716c" />
      </View>
      <Text className="mt-1 font-mono text-[18px] font-semibold capitalize text-foreground">
        {value}
      </Text>
    </View>
  );
}
