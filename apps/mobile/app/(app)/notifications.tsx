import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  Bell,
  Bug,
  CalendarDays,
  Crown,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";
import { useTranslation } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";
import { PetAvatar } from "../../src/components/pet-avatar";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface ReminderPet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

interface Reminder {
  id: string;
  kind: "vaccine" | "deworming";
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  pet: ReminderPet;
}

const NOTIF_ICONS: Record<string, LucideIcon> = {
  vet_access_request: Stethoscope,
  vet_access_approved: ShieldCheck,
  premium_activated: Crown,
  premium_expired: AlertTriangle,
  new_medical_record: Stethoscope,
};

/** Convierte una fecha ISO `YYYY-MM-DD` (o full ISO) a Date local sin tz. */
function toLocalDate(iso: string): Date {
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Días entre dos fechas (b - a) ignorando hora. */
function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((b0 - a0) / ms);
}

export default function RemindersScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { formatDate } = useLocaleFormat();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const stripRef = useRef<ScrollView>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Notificaciones del sistema
    const notifQ = supabase
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Perfil → animales
    const { data: profile } = await supabase
      .from("owner_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let nextReminders: Reminder[] = [];
    if (profile) {
      const { data: animals } = await supabase
        .from("animals")
        .select("id, name, species, photo_url")
        .eq("owner_id", profile.id)
        .neq("status", "archived");

      const animalIds = (animals ?? []).map((a) => a.id);
      if (animalIds.length > 0) {
        const petsById: Record<string, ReminderPet> = Object.fromEntries(
          (animals ?? []).map((a) => [a.id, a as ReminderPet]),
        );

        const [vaccinesRes, dewormingsRes] = await Promise.all([
          supabase
            .from("vaccines")
            .select("id, animal_id, name, next_dose_date")
            .in("animal_id", animalIds)
            .not("next_dose_date", "is", null),
          supabase
            .from("deworming")
            .select("id, animal_id, product, next_date")
            .in("animal_id", animalIds)
            .not("next_date", "is", null),
        ]);

        nextReminders = [
          ...((vaccinesRes.data ?? []) as Array<{
            id: string;
            animal_id: string;
            name: string;
            next_dose_date: string;
          }>).map<Reminder>((v) => ({
            id: `v_${v.id}`,
            kind: "vaccine",
            title: v.name,
            date: v.next_dose_date,
            pet: petsById[v.animal_id]!,
          })),
          ...((dewormingsRes.data ?? []) as Array<{
            id: string;
            animal_id: string;
            product: string;
            next_date: string;
          }>).map<Reminder>((d) => ({
            id: `d_${d.id}`,
            kind: "deworming",
            title: d.product,
            date: d.next_date,
            pet: petsById[d.animal_id]!,
          })),
        ]
          .filter((r) => r.pet)
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    const { data: notifData } = await notifQ;
    setNotifs(notifData ?? []);
    setReminders(nextReminders);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs((arr) =>
      arr.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  // 14 días desde hoy
  const days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);

  // mapa "YYYY-MM-DD" → cantidad de reminders ese día (sólo dentro del strip)
  const remindersByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reminders) {
      const d = toLocalDate(r.date);
      const diff = daysBetween(today, d);
      if (diff >= 0 && diff < 14) {
        const key = isoKey(d);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [reminders, today]);

  // separar atrasados / próximos (60 días) / lejanos
  const { overdue, upcoming } = useMemo(() => {
    const overdue: Reminder[] = [];
    const upcoming: Reminder[] = [];
    for (const r of reminders) {
      const d = toLocalDate(r.date);
      const diff = daysBetween(today, d);
      if (diff < 0) overdue.push(r);
      else if (diff <= 60) upcoming.push(r);
    }
    return { overdue, upcoming };
  }, [reminders, today]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const dayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return days.map((d) => fmt.format(d).replace(".", "").toUpperCase());
  }, [days, locale]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Blob ambiental decorativo */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -50,
            left: -30,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(124, 58, 237, 0.10)",
          }}
        />

        {/* Header */}
        <View className="px-5 pb-1 pt-3">
          <Text className="text-[12px] tracking-wide text-muted">
            {t("owner.notifications.eyebrow")}
          </Text>
          <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
            {t("owner.notifications.title")}
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            {loading
              ? t("common.loading")
              : reminders.length === 0
                ? t("owner.notifications.subtitleEmpty")
                : t("owner.notifications.subtitleCount", {
                    count: reminders.length,
                  })}
          </Text>
        </View>

        {/* Tira de calendario (14 días) */}
        <View className="mt-4">
          <ScrollView
            ref={stripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {days.map((d, i) => {
              const key = isoKey(d);
              const count = remindersByDay.get(key) ?? 0;
              const isToday = i === 0;
              return (
                <DayChip
                  key={key}
                  label={dayNames[i] ?? ""}
                  number={d.getDate()}
                  today={isToday}
                  count={count}
                />
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 32 }} />
        ) : (
          <>
            {/* Atrasados */}
            {overdue.length > 0 && (
              <Section
                title={t("owner.notifications.overdueTitle")}
                count={overdue.length}
                tone="rose"
              >
                {overdue.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    today={today}
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/animals/[id]",
                        params: { id: r.pet.id },
                      } as never)
                    }
                  />
                ))}
              </Section>
            )}

            {/* Próximos (60 días) */}
            <Section
              title={t("owner.notifications.upcomingTitle")}
              count={upcoming.length}
              tone="primary"
            >
              {upcoming.length === 0 ? (
                <EmptyHint
                  icon={CalendarDays}
                  text={t("owner.notifications.upcomingEmpty")}
                />
              ) : (
                upcoming.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    today={today}
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/animals/[id]",
                        params: { id: r.pet.id },
                      } as never)
                    }
                  />
                ))
              )}
            </Section>

            {/* Notificaciones del sistema */}
            <Section
              title={t("owner.notifications.notifsTitle")}
              count={unreadCount > 0 ? unreadCount : undefined}
              tone="soft"
            >
              {notifs.length === 0 ? (
                <EmptyHint
                  icon={Bell}
                  text={t("owner.notifications.emptyHint")}
                />
              ) : (
                notifs.map((item) => {
                  const Icon = NOTIF_ICONS[item.type] ?? Bell;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => !item.read && markRead(item.id)}
                      className={`mx-5 mb-2 flex-row gap-3 rounded-xl border border-border p-3 ${
                        !item.read ? "bg-primary/5" : "bg-surface"
                      }`}
                    >
                      <View
                        className="items-center justify-center rounded-lg bg-surface-2"
                        style={{ width: 36, height: 36 }}
                      >
                        <Icon size={16} color="#7c3aed" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-[14px] ${!item.read ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          {!item.read && (
                            <View
                              className="rounded-full bg-primary"
                              style={{ width: 6, height: 6 }}
                            />
                          )}
                        </View>
                        {item.body && (
                          <Text
                            className="mt-0.5 text-[12.5px] text-muted"
                            numberOfLines={2}
                          >
                            {item.body}
                          </Text>
                        )}
                        <Text className="mt-1 text-[11px] text-subtle">
                          {formatDate(item.created_at)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function isoKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function DayChip({
  label,
  number,
  today,
  count,
}: {
  label: string;
  number: number;
  today: boolean;
  count: number;
}) {
  if (today) {
    return (
      <LinearGradient
        colors={["#7c3aed", "#06b6d4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 52,
          height: 70,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 9.5,
            fontWeight: "700",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          {number}
        </Text>
        {count > 0 && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "white",
              marginTop: 3,
            }}
          />
        )}
      </LinearGradient>
    );
  }
  const hasReminder = count > 0;
  return (
    <View
      style={{
        width: 52,
        height: 70,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: hasReminder ? "rgba(124,58,237,0.35)" : "#e7e5e4",
        backgroundColor: hasReminder ? "rgba(124,58,237,0.06)" : "#fafaf9",
      }}
    >
      <Text
        style={{
          color: "#78716c",
          fontSize: 9.5,
          fontWeight: "700",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: "#0c0a09",
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {number}
      </Text>
      {hasReminder && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#7c3aed",
            marginTop: 3,
          }}
        />
      )}
    </View>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count?: number;
  tone: "rose" | "primary" | "soft";
  children: React.ReactNode;
}) {
  const dotColor =
    tone === "rose" ? "#e11d48" : tone === "primary" ? "#7c3aed" : "#a8a29e";
  const badgeBg =
    tone === "rose"
      ? "rgba(225,29,72,0.1)"
      : tone === "primary"
        ? "rgba(124,58,237,0.1)"
        : "#f5f5f4";
  const badgeColor =
    tone === "rose" ? "#e11d48" : tone === "primary" ? "#7c3aed" : "#78716c";
  return (
    <View className="mt-6">
      <View className="mb-2 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: dotColor,
            }}
          />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-subtle">
            {title}
          </Text>
        </View>
        {typeof count === "number" && (
          <View
            style={{
              backgroundColor: badgeBg,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: badgeColor }}>
              {count}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function ReminderRow({
  reminder,
  today,
  onPress,
}: {
  reminder: Reminder;
  today: Date;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { formatDate } = useLocaleFormat();
  const d = toLocalDate(reminder.date);
  const diff = daysBetween(today, d);
  const overdue = diff < 0;
  const Icon = reminder.kind === "vaccine" ? Syringe : Bug;

  const relative = overdue
    ? t("owner.notifications.daysOverdue", { count: Math.abs(diff) })
    : diff === 0
      ? t("owner.notifications.todayLabel")
      : diff === 1
        ? t("owner.notifications.tomorrowLabel")
        : t("owner.notifications.daysRemaining", { count: diff });

  return (
    <Pressable
      onPress={onPress}
      className={`mx-5 mb-2 flex-row items-center gap-3 rounded-xl border p-3 ${
        overdue ? "border-rose/30 bg-rose/5" : "border-border bg-surface"
      }`}
    >
      <PetAvatar
        name={reminder.pet.name}
        species={reminder.pet.species}
        photoUrl={reminder.pet.photo_url}
        size={42}
        radius={12}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Icon
            size={13}
            color={overdue ? "#e11d48" : "#7c3aed"}
            strokeWidth={2.2}
          />
          <Text
            className="text-[14px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {reminder.title}
          </Text>
        </View>
        <Text className="mt-0.5 text-[12px] text-muted" numberOfLines={1}>
          {reminder.pet.name} · {formatDate(reminder.date, { short: true })}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: overdue ? "rgba(225,29,72,0.1)" : "rgba(124,58,237,0.08)",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: overdue ? "#e11d48" : "#7c3aed",
          }}
        >
          {relative}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyHint({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <View className="mx-5 items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-6">
      <Icon size={22} color="#a8a29e" strokeWidth={1.8} />
      <Text className="text-center text-[12.5px] text-muted">{text}</Text>
    </View>
  );
}
