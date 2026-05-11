import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Stethoscope, Crown, ShieldCheck, AlertTriangle } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";
import { formatDate } from "../../src/lib/format";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const ICONS: Record<string, LucideIcon> = {
  vet_access_request: Stethoscope,
  vet_access_approved: ShieldCheck,
  premium_activated: Crown,
  premium_expired: AlertTriangle,
  new_medical_record: Stethoscope,
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-[24px] font-bold tracking-tight text-foreground">
          Notificaciones
        </Text>
        <Text className="mt-1 text-[13px] text-muted">
          {loading
            ? "Cargando..."
            : items.length === 0
              ? "Sin notificaciones"
              : unreadCount > 0
                ? `${unreadCount} sin leer`
                : "Todas leídas"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Bell size={40} color="#d6d3d1" />
          <Text className="mt-3 text-center text-[14px] text-muted">
            Cuando haya algo nuevo, va a aparecer acá.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const Icon = ICONS[item.type] ?? Bell;
            return (
              <Pressable
                onPress={() => !item.read && markRead(item.id)}
                className={`mx-3 my-1 flex-row gap-3 rounded-xl p-3 ${
                  !item.read ? "bg-primary/5" : "bg-surface"
                }`}
              >
                <View className="size-8 items-center justify-center rounded-lg bg-surface-2" style={{ width: 32, height: 32 }}>
                  <Icon size={16} color="#7c3aed" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-[14px] ${!item.read ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
                    >
                      {item.title}
                    </Text>
                    {!item.read && (
                      <View className="size-1.5 rounded-full bg-primary" style={{ width: 6, height: 6 }} />
                    )}
                  </View>
                  {item.body && (
                    <Text className="mt-0.5 text-[12.5px] text-muted">
                      {item.body}
                    </Text>
                  )}
                  <Text className="mt-1 text-[11px] text-subtle">
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
