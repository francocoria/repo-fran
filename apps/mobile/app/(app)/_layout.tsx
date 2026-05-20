import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Home,
  Bell,
  User,
  Users,
  Crown,
  QrCode,
  ScanLine,
  Search,
  type LucideIcon,
} from "lucide-react-native";
import { useSession, useProfile } from "../../src/lib/session";
import { useTranslation } from "../../src/lib/i18n";

type Role = "owner" | "vet";

interface Tab {
  labelKey: string;
  icon: LucideIcon;
  href: string;
}

const OWNER_TABS: Tab[] = [
  { labelKey: "nav.pets", icon: Home, href: "/(app)/" },
  { labelKey: "nav.reminders", icon: Bell, href: "/(app)/notifications" },
  { labelKey: "nav.lost", icon: Search, href: "/(app)/lost" },
  { labelKey: "nav.me", icon: User, href: "/(app)/settings" },
];

const VET_TABS: Tab[] = [
  { labelKey: "nav.home", icon: Home, href: "/(app)/vet" },
  { labelKey: "nav.patients", icon: Users, href: "/(app)/vet/patients" },
  { labelKey: "nav.plan", icon: Crown, href: "/(app)/vet/plan" },
  { labelKey: "nav.me", icon: User, href: "/(app)/vet/settings" },
];

export default function AppLayout() {
  const { session, loading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(
    session?.user.id,
  );
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (session && profile === null) router.replace("/onboarding");
  }, [session, profile, profileLoading, loading, router]);

  if (loading || profileLoading || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  const role: Role = profile.role ?? "owner";
  const tabs = role === "vet" ? VET_TABS : OWNER_TABS;
  const fabHref = role === "vet" ? "/(app)/vet/scan" : "/(app)/animals/qr";
  const FabIcon = role === "vet" ? ScanLine : QrCode;
  const fabColors: [string, string] =
    role === "vet" ? ["#06b6d4", "#0891b2"] : ["#7c3aed", "#06b6d4"];

  const activePath = "/" + segments.slice(1).join("/");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1">
        <Slot />

        <View className="absolute bottom-0 left-0 right-0">
          <View className="relative h-20 border-t border-border bg-background/95">
            <View className="flex-1 flex-row items-end pb-3 pt-2">
              {tabs.slice(0, 2).map((tab) => (
                <TabButton
                  key={tab.href}
                  tab={tab}
                  activePath={activePath}
                  accent={role === "vet" ? "#06b6d4" : "#7c3aed"}
                  onPress={() => router.push(tab.href as never)}
                />
              ))}
              <View className="flex-1" />
              {tabs.slice(2).map((tab) => (
                <TabButton
                  key={tab.href}
                  tab={tab}
                  activePath={activePath}
                  accent={role === "vet" ? "#06b6d4" : "#7c3aed"}
                  onPress={() => router.push(tab.href as never)}
                />
              ))}
            </View>

            <Pressable
              onPress={() => router.push(fabHref as never)}
              className="absolute left-1/2 -top-5"
              style={{ marginLeft: -32 }}
            >
              <LinearGradient
                colors={fabColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: fabColors[0],
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <FabIcon size={28} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  tab,
  activePath,
  accent,
  onPress,
}: {
  tab: Tab;
  activePath: string;
  accent: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const Icon = tab.icon;
  const active = activePath === tab.href.replace("/(app)", "") || activePath === tab.href;
  const color = active ? accent : "#78716c";
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-1">
      <Icon size={22} color={color} strokeWidth={active ? 2.4 : 2} />
      <Text
        className="text-[10.5px]"
        style={{ color, fontWeight: active ? "600" : "500" }}
      >
        {t(tab.labelKey)}
      </Text>
    </Pressable>
  );
}
