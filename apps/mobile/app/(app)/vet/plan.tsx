import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Crown, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "../../../src/components/ui/card";
import { Badge } from "../../../src/components/ui/badge";
import { useVetPlan } from "../../../src/hooks/use-vet-data";
import { formatDate } from "../../../src/lib/format";

const FEATURES = [
  { label: "Pacientes ilimitados", premium: true },
  { label: "Recetas con tu marca", premium: true },
  { label: "Certificados profesionales", premium: true },
  { label: "Verificación de matrícula", premium: true },
  { label: "Estadísticas de práctica", premium: true },
  { label: "Plantillas propias", premium: true },
];

export default function VetPlanScreen() {
  const { data, isLoading } = useVetPlan();

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  const { subscription } = data;
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const now = new Date();
  const expired = expiresAt && expiresAt < now;
  const isPremium = !expired && (subscription?.plan === "premium" || subscription?.plan === "trial");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-[24px] font-bold tracking-tight text-foreground">
            Mi plan
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            Gestioná tu suscripción y beneficios.
          </Text>
        </View>

        <View className="mt-3 px-3">
          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Badge
                  label={
                    expired
                      ? "Vencido"
                      : subscription?.plan === "premium"
                        ? "Premium"
                        : subscription?.plan === "trial"
                          ? "Trial"
                          : "Free"
                  }
                  tone={
                    expired
                      ? "rose"
                      : subscription?.plan === "premium"
                        ? "gold"
                        : subscription?.plan === "trial"
                          ? "amber"
                          : "neutral"
                  }
                  icon={Crown}
                />
                <Text className="mt-2 text-[18px] font-bold text-foreground">
                  {isPremium
                    ? "Premium activo"
                    : expired
                      ? "Tu plan venció"
                      : "Plan gratuito"}
                </Text>
                {expiresAt && (
                  <Text className="mt-0.5 text-[12px] text-muted">
                    {expired ? "Venció " : "Vence "} el {formatDate(expiresAt)}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </View>

        <View className="mt-5 px-5">
          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Beneficios
          </Text>
        </View>

        <View className="px-3">
          <Card className="gap-3">
            {FEATURES.map((f) => (
              <View key={f.label} className="flex-row items-center gap-3">
                <View
                  className={`size-6 items-center justify-center rounded-md ${
                    isPremium ? "bg-emerald/15" : "bg-surface-2"
                  }`}
                  style={{ width: 24, height: 24 }}
                >
                  {isPremium ? (
                    <Check size={14} color="#10b981" />
                  ) : (
                    <X size={14} color="#a8a29e" />
                  )}
                </View>
                <Text
                  className={`flex-1 text-[14px] ${
                    isPremium ? "text-foreground" : "text-muted"
                  }`}
                >
                  {f.label}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {!isPremium && (
          <View className="mt-6 mx-3">
            <LinearGradient
              colors={["#7c3aed", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 20, alignItems: "center" }}
            >
              <Crown size={32} color="#fff" />
              <Text className="mt-2 text-[18px] font-bold text-white">
                Plan Premium
              </Text>
              <Text className="mt-1 text-center text-[13px] text-white/90">
                Pacientes ilimitados, certificados profesionales y branding.
              </Text>
              <Text className="mt-3 text-center text-[12px] text-white/75">
                Las suscripciones se gestionan desde la cuenta web. Próximamente compras dentro de la app.
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
