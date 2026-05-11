import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Crown,
  QrCode,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "../../../src/components/ui/badge";
import { Card } from "../../../src/components/ui/card";
import { useVetPlan } from "../../../src/hooks/use-vet-data";
import { formatDate } from "../../../src/lib/format";

const FREE_CAP = 5;

export default function VetHomeScreen() {
  const router = useRouter();
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
      <View className="px-5 pt-4">
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-[13px] text-muted">Hola,</Text>
            <Text className="text-[26px] font-bold tracking-tight text-foreground">
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
                    ? "Tu plan venció"
                    : trialEndingSoon
                      ? `Tu trial termina en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`
                      : "Llegaste al límite del plan gratis"}
                </Text>
                <Text className="mt-0.5 text-[12.5px] text-muted">
                  {expired
                    ? "Renová para no perder pacientes activos."
                    : trialEndingSoon
                      ? "Activá Premium para mantener todos tus pacientes."
                      : `${activeCount} de ${FREE_CAP} activos. Pasate a Premium para ilimitados.`}
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
            <Text className="text-[16px] font-bold text-white">Escanear QR</Text>
            <Text className="text-[12.5px] text-white/90">
              Apuntá al código del animal
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      <View className="mt-4 px-3">
        <View className="flex-row gap-2">
          <MiniStat
            label="Activos"
            value={isPremium ? `${activeCount}` : `${activeCount} / ${FREE_CAP}`}
            icon={Users}
          />
          <MiniStat label="Plan" value={subscription?.plan ?? "free"} icon={Crown} />
        </View>
      </View>

      <View className="mt-5 px-5">
        <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Acciones
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
              Mis pacientes
            </Text>
            <Text className="text-[12px] text-muted">
              Ver listado completo
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
              Mi plan
            </Text>
            <Text className="text-[12px] text-muted">
              {isPremium ? "Premium activo" : "Conocé los beneficios"}
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
  if (expired) return <Badge label="Vencido" tone="rose" icon={AlertCircle} />;
  if (plan === "premium") return <Badge label="Premium" tone="gold" icon={Crown} />;
  if (plan === "trial")
    return (
      <Badge
        label={daysLeft ? `Trial · ${daysLeft}d` : "Trial"}
        tone="amber"
        icon={Sparkles}
      />
    );
  return <Badge label="Free" tone="neutral" />;
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
