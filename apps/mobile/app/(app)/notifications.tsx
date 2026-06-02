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
  ChevronRight,
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

type RecCategory = "vaccine" | "deworming" | "checkup";

interface Recommendation {
  id: string;
  category: RecCategory;
  /** clave i18n del título, ej "owner.notifications.recRabies" */
  titleKey: string;
  /** clave i18n del subtítulo */
  hintKey: string;
  pet: ReminderPet;
}

/** Categoría activa del filtro de tabs. */
type TabCategory = "all" | "vaccine" | "deworming" | "checkup";

/** Edad en meses desde una fecha de nacimiento ISO, o null si no hay dato. */
function ageInMonths(birth: string | null): number | null {
  if (!birth) return null;
  const b = toLocalDate(birth);
  const now = new Date();
  return (
    (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  );
}

/**
 * Motor de recomendaciones de cuidado preventivo. Sólo perros y gatos
 * (vacunación inteligente). Sugiere lo que falta: vacuna núcleo / plan de
 * cachorro, desparasitación y control anual.
 */
function buildRecommendations(
  animals: Array<ReminderPet & { birth_date: string | null }>,
  hasVaccine: Set<string>,
  hasDeworming: Set<string>,
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const a of animals) {
    if (a.species !== "dog" && a.species !== "cat") continue;
    const months = ageInMonths(a.birth_date);
    const isYoung = months != null && months < 12;
    const pet: ReminderPet = {
      id: a.id,
      name: a.name,
      species: a.species,
      photo_url: a.photo_url,
    };

    if (!hasVaccine.has(a.id)) {
      recs.push({
        id: `rec_vax_${a.id}`,
        category: "vaccine",
        titleKey: isYoung
          ? "owner.notifications.recPuppyPlan"
          : "owner.notifications.recRabies",
        hintKey: isYoung
          ? "owner.notifications.recPuppyPlanHint"
          : "owner.notifications.recRabiesHint",
        pet,
      });
    }

    if (!hasDeworming.has(a.id)) {
      recs.push({
        id: `rec_dew_${a.id}`,
        category: "deworming",
        titleKey: "owner.notifications.recDeworming",
        hintKey: "owner.notifications.recDewormingHint",
        pet,
      });
    }

    // Control anual: para adultos (o edad desconocida).
    if (!isYoung) {
      recs.push({
        id: `rec_chk_${a.id}`,
        category: "checkup",
        titleKey: "owner.notifications.recCheckup",
        hintKey: "owner.notifications.recCheckupHint",
        pet,
      });
    }
  }
  return recs;
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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<TabCategory>("all");
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
    let nextRecs: Recommendation[] = [];
    if (profile) {
      const { data: animals } = await supabase
        .from("animals")
        .select("id, name, species, photo_url, birth_date")
        .eq("owner_id", profile.id)
        .neq("status", "archived");

      const animalIds = (animals ?? []).map((a) => a.id);
      if (animalIds.length > 0) {
        const petsById: Record<string, ReminderPet> = Object.fromEntries(
          (animals ?? []).map((a) => [a.id, a as ReminderPet]),
        );

        // Traemos todas las filas (no sólo las que tienen próxima fecha):
        // las que tienen next date generan recordatorios; la presencia/ausencia
        // alimenta el motor de recomendaciones.
        const [vaccinesRes, dewormingsRes] = await Promise.all([
          supabase
            .from("vaccines")
            .select("id, animal_id, name, next_dose_date")
            .in("animal_id", animalIds),
          supabase
            .from("deworming")
            .select("id, animal_id, product, next_date")
            .in("animal_id", animalIds),
        ]);

        const vaccineRows = (vaccinesRes.data ?? []) as Array<{
          id: string;
          animal_id: string;
          name: string;
          next_dose_date: string | null;
        }>;
        const dewormingRows = (dewormingsRes.data ?? []) as Array<{
          id: string;
          animal_id: string;
          product: string;
          next_date: string | null;
        }>;

        nextReminders = [
          ...vaccineRows
            .filter((v) => v.next_dose_date)
            .map<Reminder>((v) => ({
              id: `v_${v.id}`,
              kind: "vaccine",
              title: v.name,
              date: v.next_dose_date as string,
              pet: petsById[v.animal_id]!,
            })),
          ...dewormingRows
            .filter((d) => d.next_date)
            .map<Reminder>((d) => ({
              id: `d_${d.id}`,
              kind: "deworming",
              title: d.product,
              date: d.next_date as string,
              pet: petsById[d.animal_id]!,
            })),
        ]
          .filter((r) => r.pet)
          .sort((a, b) => a.date.localeCompare(b.date));

        // Motor de recomendaciones: sólo perros y gatos (vacunación inteligente).
        const hasVaccine = new Set(vaccineRows.map((v) => v.animal_id));
        const hasDeworming = new Set(dewormingRows.map((d) => d.animal_id));
        nextRecs = buildRecommendations(
          (animals ?? []) as Array<ReminderPet & { birth_date: string | null }>,
          hasVaccine,
          hasDeworming,
        );
      }
    }

    const { data: notifData } = await notifQ;
    setNotifs(notifData ?? []);
    setReminders(nextReminders);
    setRecommendations(nextRecs);
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

  const openPet = (id: string) =>
    router.push({
      pathname: "/(app)/animals/[id]",
      params: { id },
    } as never);

  // Semana actual, de lunes a domingo
  const days = useMemo(() => {
    const monday = new Date(today);
    const dow = (today.getDay() + 6) % 7; // 0 = lunes
    monday.setDate(today.getDate() - dow);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [today]);

  // mapa "YYYY-MM-DD" → cantidad de reminders ese día
  const remindersByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reminders) {
      const key = isoKey(toLocalDate(r.date));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [reminders]);

  // Recordatorios filtrados por la categoría del tab activo
  const tabReminders = useMemo(() => {
    if (activeTab === "vaccine")
      return reminders.filter((r) => r.kind === "vaccine");
    if (activeTab === "deworming")
      return reminders.filter((r) => r.kind === "deworming");
    if (activeTab === "checkup") return [] as Reminder[];
    return reminders;
  }, [reminders, activeTab]);

  // Buckets temporales: atrasados / hoy / esta semana / más adelante (≤60d)
  const { overdue, todayItems, week, later } = useMemo(() => {
    const overdue: Reminder[] = [];
    const todayItems: Reminder[] = [];
    const week: Reminder[] = [];
    const later: Reminder[] = [];
    for (const r of tabReminders) {
      const diff = daysBetween(today, toLocalDate(r.date));
      if (diff < 0) overdue.push(r);
      else if (diff === 0) todayItems.push(r);
      else if (diff <= 7) week.push(r);
      else if (diff <= 60) later.push(r);
    }
    return { overdue, todayItems, week, later };
  }, [tabReminders, today]);

  // Recomendaciones filtradas por la categoría del tab activo
  const tabRecs = useMemo(() => {
    if (activeTab === "all") return recommendations;
    return recommendations.filter((r) => r.category === activeTab);
  }, [recommendations, activeTab]);

  // Título de la sección de recomendaciones: por mascota si son todas de una.
  const recPetName = useMemo(() => {
    if (tabRecs.length === 0) return null;
    const names = new Set(tabRecs.map((r) => r.pet.name));
    return names.size === 1 ? tabRecs[0]!.pet.name : null;
  }, [tabRecs]);

  const reminderCount =
    overdue.length + todayItems.length + week.length + later.length;
  const tabHasContent = reminderCount > 0 || tabRecs.length > 0;
  const unreadCount = notifs.filter((n) => !n.read).length;

  // Contadores por tab (recordatorios + recomendaciones de esa categoría)
  const tabCounts = useMemo<Record<TabCategory, number>>(() => {
    const vac = reminders.filter((r) => r.kind === "vaccine").length;
    const dew = reminders.filter((r) => r.kind === "deworming").length;
    const recVac = recommendations.filter((r) => r.category === "vaccine").length;
    const recDew = recommendations.filter(
      (r) => r.category === "deworming",
    ).length;
    const recChk = recommendations.filter(
      (r) => r.category === "checkup",
    ).length;
    return {
      all: reminders.length + recommendations.length,
      vaccine: vac + recVac,
      deworming: dew + recDew,
      checkup: recChk,
    };
  }, [reminders, recommendations]);

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
          <Text className="text-[28px] font-extrabold tracking-tight text-foreground">
            {t("owner.notifications.title")}
          </Text>
          <Text className="mt-1 text-[13px] text-muted">
            {loading
              ? t("common.loading")
              : t("owner.notifications.subtitleWeek")}
          </Text>
        </View>

        {/* Tira de calendario (semana) */}
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
              const isToday = daysBetween(today, d) === 0;
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

        {/* Tabs de categoría */}
        <CategoryTabs
          active={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
        />

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
                    onPress={() => openPet(r.pet.id)}
                  />
                ))}
              </Section>
            )}

            {/* Hoy */}
            {todayItems.length > 0 && (
              <Section
                title={t("owner.notifications.todaySection", {
                  date: formatDate(today, { short: true }),
                })}
                count={todayItems.length}
                tone="primary"
              >
                {todayItems.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    today={today}
                    onPress={() => openPet(r.pet.id)}
                  />
                ))}
              </Section>
            )}

            {/* Esta semana */}
            {week.length > 0 && (
              <Section
                title={t("owner.notifications.weekSection")}
                count={week.length}
                tone="primary"
              >
                {week.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    today={today}
                    onPress={() => openPet(r.pet.id)}
                  />
                ))}
              </Section>
            )}

            {/* Más adelante (≤60 días) */}
            {later.length > 0 && (
              <Section
                title={t("owner.notifications.laterTitle")}
                count={later.length}
                tone="soft"
              >
                {later.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    today={today}
                    onPress={() => openPet(r.pet.id)}
                  />
                ))}
              </Section>
            )}

            {/* Recomendado para vos */}
            {tabRecs.length > 0 && (
              <Section
                title={
                  recPetName
                    ? t("owner.notifications.recommendedForTitle", {
                        name: recPetName,
                      })
                    : t("owner.notifications.recommendedTitle")
                }
                count={tabRecs.length}
                tone="primary"
              >
                {tabRecs.map((rec) => (
                  <RecommendationRow
                    key={rec.id}
                    rec={rec}
                    onPress={() => openPet(rec.pet.id)}
                  />
                ))}
              </Section>
            )}

            {/* Vacío por categoría */}
            {!tabHasContent && activeTab !== "all" && (
              <View className="mt-6">
                <EmptyHint
                  icon={CalendarDays}
                  text={t("owner.notifications.tabEmpty")}
                />
              </View>
            )}

            {/* Notificaciones del sistema (sólo en "Todos") */}
            {activeTab === "all" && (
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
            )}
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

const TAB_DEFS: Array<{ key: TabCategory; labelKey: string }> = [
  { key: "all", labelKey: "owner.notifications.tabAll" },
  { key: "vaccine", labelKey: "owner.notifications.tabVaccines" },
  { key: "deworming", labelKey: "owner.notifications.tabDewormings" },
  { key: "checkup", labelKey: "owner.notifications.tabCheckups" },
];

function CategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: TabCategory;
  onChange: (c: TabCategory) => void;
  counts: Record<TabCategory, number>;
}) {
  const { t } = useTranslation();
  return (
    <View className="mt-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {TAB_DEFS.map((tab) => {
          const isActive = tab.key === active;
          const count = counts[tab.key];
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2 ${
                isActive
                  ? "border-primary bg-primary"
                  : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  isActive ? "text-white" : "text-muted"
                }`}
              >
                {t(tab.labelKey)}
              </Text>
              {count > 0 && (
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 5,
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(124,58,237,0.12)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: "800",
                      color: isActive ? "#ffffff" : "#7c3aed",
                    }}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function RecommendationRow({
  rec,
  onPress,
}: {
  rec: Recommendation;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const Icon =
    rec.category === "vaccine"
      ? Syringe
      : rec.category === "deworming"
        ? Bug
        : Stethoscope;
  return (
    <Pressable
      onPress={onPress}
      className="mx-5 mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-surface p-3"
    >
      <PetAvatar
        name={rec.pet.name}
        species={rec.pet.species}
        photoUrl={rec.pet.photo_url}
        size={42}
        radius={12}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Icon size={13} color="#7c3aed" strokeWidth={2.2} />
          <Text
            className="text-[14px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {t(rec.titleKey)}
          </Text>
        </View>
        <Text className="mt-0.5 text-[12px] text-muted" numberOfLines={1}>
          {rec.pet.name} · {t(rec.hintKey)}
        </Text>
      </View>
      <ChevronRight size={18} color="#a8a29e" />
    </Pressable>
  );
}
