import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { randomUUID } from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Bird,
  Camera,
  Cat,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Dog,
  MessageCircle,
  PawPrint,
  QrCode,
  Rabbit,
  Scale,
  Sparkles,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { supabase } from "../../../src/lib/supabase";
import { env } from "../../../src/lib/env";
import { useTranslation } from "../../../src/lib/i18n";
import { PetAvatar } from "../../../src/components/pet-avatar";
import { PawPattern } from "../../../src/components/ui/paw-pattern";
import { Confetti } from "../../../src/components/ui/confetti";
import {
  pickAnimalPhoto,
  takeAnimalPhoto,
  uploadAnimalPhoto,
} from "../../../src/lib/photo-upload";

type SpeciesKey = "dog" | "cat" | "rabbit" | "bird" | "other";
type Sex = "male" | "female";
type Chip = "yes" | "no" | "later";

const PET_TYPES: {
  key: SpeciesKey;
  icon: LucideIcon;
  from: string;
  to: string;
}[] = [
  { key: "dog", icon: Dog, from: "#8b5cf6", to: "#ec4899" },
  { key: "cat", icon: Cat, from: "#06b6d4", to: "#8b5cf6" },
  { key: "rabbit", icon: Rabbit, from: "#a78bfa", to: "#f472b6" },
  { key: "bird", icon: Bird, from: "#f59e0b", to: "#ec4899" },
  { key: "other", icon: PawPrint, from: "#64748b", to: "#a78bfa" },
];

const COMMON_BREEDS: Record<string, string[]> = {
  dog: ["Mestizo", "Labrador", "Caniche", "Bulldog Francés", "Border Collie", "Golden", "Pitbull", "Galgo", "Husky", "Beagle"],
  cat: ["Mestizo", "Siamés", "Persa", "Maine Coon", "Bengalí", "Británico", "Ragdoll", "Esfinge"],
  rabbit: ["Holland Lop", "Belier", "Cabeza de león", "Mini Rex", "Toy"],
  bird: ["Canario", "Periquito", "Cacatúa", "Loro", "Agapornis"],
  other: [],
};

const COLORS_HINT = [
  "Negro",
  "Blanco",
  "Marrón",
  "Atigrado",
  "Tricolor",
  "Negro y blanco",
];

const TOTAL_STEPS = 7; // pasos 2..8

export default function NewAnimalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<SpeciesKey | null>(null);
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [birth, setBirth] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [color, setColor] = useState("");
  const [hasChip, setHasChip] = useState<Chip | null>(null);
  const [chipId, setChipId] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; token: string } | null>(
    null,
  );

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(1, s - 1));

  function resetForAnother() {
    setSpecies(null);
    setName("");
    setPhotoUri(null);
    setSex(null);
    setBirth("");
    setBreed("");
    setWeight("");
    setColor("");
    setHasChip(null);
    setChipId("");
    setCreated(null);
    setStep(2);
  }

  function pickPhoto() {
    Alert.alert(t("petWizard.photoOrTake"), undefined, [
      {
        text: t("petWizard.photoGallery"),
        onPress: async () => {
          const p = await pickAnimalPhoto();
          if (p) setPhotoUri(p.uri);
        },
      },
      {
        text: t("petWizard.photoCamera"),
        onPress: async () => {
          const p = await takeAnimalPhoto();
          if (p) setPhotoUri(p.uri);
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("petWizard.notAuth"));
      const { data: profile } = await supabase
        .from("owner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) throw new Error(t("petWizard.noProfile"));

      const id = randomUUID();
      const token = randomUUID();
      const { error } = await supabase.from("animals").insert({
        id,
        owner_id: profile.id,
        url_token: token,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        sex: sex ?? "unknown",
        birth_date: birth.trim() || null,
        color: color.trim() || null,
        weight_kg: weight.trim() ? Number(weight) : null,
        microchip: hasChip === "yes" && chipId.trim() ? chipId.trim() : null,
        status: "active",
      });
      if (error) throw error;

      if (photoUri) {
        await uploadAnimalPhoto(id, photoUri);
      }
      await queryClient.invalidateQueries({ queryKey: ["animals"] });
      setCreated({ id, token });
      setStep(9);
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("petWizard.createError"));
    } finally {
      setCreating(false);
    }
  }

  const showHeader = step >= 2 && step <= 8;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      {step === 9 && <Confetti active />}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {showHeader ? (
          <WizardHeader
            step={step - 1}
            onBack={back}
            onSkip={[4, 6, 7].includes(step) ? next : undefined}
            skipLabel={step === 4 ? t("petWizard.later") : t("petWizard.skip")}
            stepLabel={t("petWizard.stepOf", {
              step: step - 1,
              total: TOTAL_STEPS,
            })}
          />
        ) : null}

        <Animated.View key={step} entering={FadeIn.duration(260)} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ─── STEP 1 — Bienvenida ─────────────────────────── */}
            {step === 1 && (
              <View className="flex-1">
                <View className="flex-1 items-center justify-center">
                  <View
                    style={{ width: 240, height: 180 }}
                    className="mb-3 items-center justify-center"
                  >
                    <PawPattern width={240} height={180} color="#7c3aed" opacity={0.06} />
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <View style={{ transform: [{ rotate: "-12deg" }] }}>
                        <PetAvatar name="L" species="dog" size={78} radius={20} />
                      </View>
                      <View style={{ transform: [{ translateY: -10 }] }}>
                        <PetAvatar name="P" species="cat" size={98} radius={26} />
                      </View>
                      <View style={{ transform: [{ rotate: "12deg" }] }}>
                        <PetAvatar name="M" species="rabbit" size={70} radius={18} />
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                    <Sparkles size={12} color="#7c3aed" strokeWidth={2.4} />
                    <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-primary">
                      {t("petWizard.welcomeEyebrow")}
                    </Text>
                  </View>

                  <Text className="mt-4 text-center text-[30px] font-extrabold leading-9 tracking-tight text-foreground">
                    {t("petWizard.welcomeTitle1")}
                    {"\n"}
                    <Text className="text-primary">
                      {t("petWizard.welcomeTitle2")}
                    </Text>
                  </Text>
                  <Text className="mt-3 max-w-[300px] text-center text-[15px] leading-6 text-muted">
                    {t("petWizard.welcomeSubtitle")}
                  </Text>

                  <View className="mt-6 w-full gap-2">
                    <FeatureRow
                      icon={QrCode}
                      tint="#7c3aed"
                      bg="bg-primary/10"
                      text={t("petWizard.feat1")}
                    />
                    <FeatureRow
                      icon={Bell}
                      tint="#0891b2"
                      bg="bg-accent/10"
                      text={t("petWizard.feat2")}
                    />
                    <FeatureRow
                      icon={AlertTriangle}
                      tint="#e11d48"
                      bg="bg-rose/10"
                      text={t("petWizard.feat3")}
                    />
                  </View>
                </View>
                <GradientButton label={t("petWizard.start")} onPress={next} />
              </View>
            )}

            {/* ─── STEP 2 — Tipo ───────────────────────────────── */}
            {step === 2 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.typeTitle")}
                  subtitle={t("petWizard.typeSubtitle")}
                />
                <View className="mt-5 flex-row flex-wrap" style={{ gap: 10 }}>
                  {PET_TYPES.map((p) => {
                    const PIcon = p.icon;
                    const on = species === p.key;
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => setSpecies(p.key)}
                        className="items-center gap-2 rounded-[18px] border-2 px-3 pb-4 pt-5"
                        style={{
                          width: (width - 48 - 10) / 2,
                          borderColor: on ? p.from : "#e7e5e4",
                          backgroundColor: on ? `${p.from}14` : "#ffffff",
                        }}
                      >
                        <LinearGradient
                          colors={[p.from, p.to]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PIcon size={26} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                        <Text className="text-[14px] font-semibold text-foreground">
                          {t(`format.species.${p.key}`)}
                        </Text>
                        {on ? (
                          <View
                            className="absolute right-2 top-2 size-[22px] items-center justify-center rounded-full"
                            style={{ backgroundColor: p.from }}
                          >
                            <Check size={12} color="#fff" strokeWidth={3} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-1" />
                <GradientButton
                  label={t("petWizard.next")}
                  onPress={next}
                  disabled={!species}
                />
              </View>
            )}

            {/* ─── STEP 3 — Nombre ─────────────────────────────── */}
            {step === 3 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.nameTitle")}
                  subtitle={t("petWizard.nameSubtitle")}
                />
                <View className="mt-6 items-center">
                  <PetAvatar
                    name={name || "?"}
                    species={species ?? "other"}
                    size={130}
                    radius={32}
                  />
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("petWizard.namePlaceholder")}
                  placeholderTextColor="#a8a29e"
                  autoFocus
                  className="mt-6 rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-center text-[22px] font-semibold text-foreground"
                />
                <Text className="mt-2 text-center text-[12px] text-subtle">
                  {t("petWizard.nameChangeLater")}
                </Text>
                <View className="flex-1" />
                <GradientButton
                  label={t("petWizard.next")}
                  onPress={next}
                  disabled={name.trim().length < 2}
                />
              </View>
            )}

            {/* ─── STEP 4 — Foto ───────────────────────────────── */}
            {step === 4 && (
              <View className="flex-1">
                <StepTitle
                  title={`${t("petWizard.photoTitlePre")} ${
                    name || t("petWizard.photoFallbackName")
                  }`}
                  subtitle={t("petWizard.photoSubtitle")}
                />
                <View className="mt-6 flex-1 items-center">
                  <Pressable
                    onPress={pickPhoto}
                    className="items-center justify-center overflow-hidden"
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 50,
                      borderWidth: photoUri ? 0 : 2,
                      borderColor: "#c4b5fd",
                      borderStyle: "dashed",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {photoUri ? (
                      <PetAvatar
                        name={name || "?"}
                        species={species ?? "other"}
                        photoUrl={photoUri}
                        size={200}
                        radius={50}
                      />
                    ) : (
                      <View className="items-center gap-2">
                        <LinearGradient
                          colors={["#7c3aed", "#06b6d4"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 18,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Camera size={26} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                        <Text className="text-[13px] font-semibold text-foreground">
                          {t("petWizard.photoTapUpload")}
                        </Text>
                        <Text className="text-[11px] text-muted">
                          {t("petWizard.photoOrTake")}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  {photoUri ? (
                    <Pressable
                      onPress={pickPhoto}
                      className="mt-4 rounded-full border border-border px-3.5 py-2"
                    >
                      <Text className="text-[12px] font-medium text-muted">
                        {t("petWizard.photoChange")}
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="mt-4 w-full flex-row items-start gap-2.5 rounded-xl border border-amber/25 bg-amber/10 p-3">
                      <AlertTriangle size={14} color="#b45309" strokeWidth={2.2} />
                      <Text className="flex-1 text-[12px] leading-5 text-muted">
                        {t("petWizard.photoHint")}
                      </Text>
                    </View>
                  )}
                </View>
                <GradientButton
                  label={
                    photoUri ? t("petWizard.next") : t("petWizard.photoSkip")
                  }
                  onPress={next}
                />
              </View>
            )}

            {/* ─── STEP 5 — Sexo + Nacimiento ──────────────────── */}
            {step === 5 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.dataTitle")}
                  subtitle={t("petWizard.dataSubtitle")}
                />
                <View className="mt-5 gap-5">
                  <View>
                    <FieldLabel text={t("petWizard.sexLabel")} />
                    <View className="flex-row gap-2.5">
                      {(
                        [
                          ["male", t("petWizard.sexMale"), "♂", "#3b82f6"],
                          ["female", t("petWizard.sexFemale"), "♀", "#ec4899"],
                        ] as const
                      ).map(([val, label, glyph, c]) => {
                        const on = sex === val;
                        return (
                          <Pressable
                            key={val}
                            onPress={() => setSex(val)}
                            className="flex-1 items-center gap-1.5 rounded-2xl border-2 py-4"
                            style={{
                              borderColor: on ? c : "#e7e5e4",
                              backgroundColor: on ? `${c}14` : "#ffffff",
                            }}
                          >
                            <Text
                              style={{ color: on ? c : "#78716c" }}
                              className="text-[28px] font-bold leading-none"
                            >
                              {glyph}
                            </Text>
                            <Text className="text-[13.5px] font-semibold text-foreground">
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <View>
                    <FieldLabel
                      text={`${t("petWizard.birthLabel")} ${t("petWizard.birthApprox")}`}
                    />
                    <TextInput
                      value={birth}
                      onChangeText={setBirth}
                      placeholder={t("petWizard.birthPlaceholder")}
                      placeholderTextColor="#a8a29e"
                      keyboardType="numbers-and-punctuation"
                      autoCapitalize="none"
                      className="rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-[15px] font-medium text-foreground"
                    />
                    <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                      {(
                        [
                          [t("petWizard.agePuppy"), 2],
                          [t("petWizard.age1y"), 12],
                          [t("petWizard.age3y"), 36],
                          [t("petWizard.ageAdult"), 84],
                        ] as const
                      ).map(([label, months]) => (
                        <Pressable
                          key={label}
                          onPress={() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - months);
                            setBirth(d.toISOString().slice(0, 10));
                          }}
                          className="rounded-full border border-border bg-surface px-2.5 py-1.5"
                        >
                          <Text className="text-[11.5px] font-medium text-muted">
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="flex-1" />
                <GradientButton
                  label={t("petWizard.next")}
                  onPress={next}
                  disabled={!sex}
                />
              </View>
            )}

            {/* ─── STEP 6 — Raza ───────────────────────────────── */}
            {step === 6 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.breedTitle")}
                  subtitle={t("petWizard.breedSubtitle")}
                />
                <TextInput
                  value={breed}
                  onChangeText={setBreed}
                  placeholder={t("petWizard.breedPlaceholder")}
                  placeholderTextColor="#a8a29e"
                  className="mt-5 rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-[15px] font-medium text-foreground"
                />
                {(COMMON_BREEDS[species ?? "other"] ?? []).length > 0 ? (
                  <>
                    <Text className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-subtle">
                      {t("petWizard.breedCommon")}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(COMMON_BREEDS[species ?? "other"] ?? []).map((b) => {
                        const on = breed === b;
                        return (
                          <Pressable
                            key={b}
                            onPress={() => setBreed(b)}
                            className="rounded-full border px-3.5 py-2"
                            style={{
                              borderColor: on ? "#7c3aed" : "#e7e5e4",
                              backgroundColor: on ? "#7c3aed" : "#ffffff",
                            }}
                          >
                            <Text
                              className="text-[13px] font-medium"
                              style={{ color: on ? "#fff" : "#0c0a09" }}
                            >
                              {b}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}
                <View className="flex-1" />
                <GradientButton label={t("petWizard.next")} onPress={next} />
              </View>
            )}

            {/* ─── STEP 7 — Físico ─────────────────────────────── */}
            {step === 7 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.physicalTitle")}
                  subtitle={t("petWizard.physicalSubtitle")}
                />
                <View className="mt-5 gap-4">
                  <View>
                    <FieldLabel text={t("petWizard.weightLabel")} />
                    <View className="flex-row items-center rounded-2xl border-2 border-border bg-surface px-3.5">
                      <Scale size={18} color="#78716c" />
                      <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="4.0"
                        placeholderTextColor="#a8a29e"
                        keyboardType="decimal-pad"
                        className="flex-1 px-2.5 py-3.5 text-[15px] font-semibold text-foreground"
                      />
                      <Text className="font-mono text-[13px] text-muted">kg</Text>
                    </View>
                  </View>
                  <View>
                    <FieldLabel text={t("petWizard.colorLabel")} />
                    <TextInput
                      value={color}
                      onChangeText={setColor}
                      placeholder={t("petWizard.colorPlaceholder")}
                      placeholderTextColor="#a8a29e"
                      className="rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-[15px] font-medium text-foreground"
                    />
                    <View className="mt-2 flex-row flex-wrap gap-1.5">
                      {COLORS_HINT.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setColor(c)}
                          className="rounded-full border border-border bg-surface px-2.5 py-1.5"
                        >
                          <Text className="text-[11.5px] text-muted">{c}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="flex-1" />
                <GradientButton label={t("petWizard.next")} onPress={next} />
              </View>
            )}

            {/* ─── STEP 8 — Microchip ──────────────────────────── */}
            {step === 8 && (
              <View className="flex-1">
                <StepTitle
                  title={t("petWizard.chipTitle")}
                  subtitle={t("petWizard.chipSubtitle")}
                />
                <View className="mt-5 gap-2.5">
                  {(
                    [
                      ["yes", t("petWizard.chipYes"), CheckCircle2],
                      ["no", t("petWizard.chipNo"), X],
                      ["later", t("petWizard.chipLater"), Clock],
                    ] as const
                  ).map(([val, label, OptIcon]) => {
                    const on = hasChip === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setHasChip(val)}
                        className="flex-row items-center gap-3 rounded-2xl border-2 p-3.5"
                        style={{
                          borderColor: on ? "#7c3aed" : "#e7e5e4",
                          backgroundColor: on ? "#7c3aed14" : "#ffffff",
                        }}
                      >
                        <View
                          className="size-9 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: on ? "#7c3aed" : "#f5f5f4",
                          }}
                        >
                          <OptIcon
                            size={17}
                            color={on ? "#fff" : "#57534e"}
                            strokeWidth={2.2}
                          />
                        </View>
                        <Text className="flex-1 text-[14.5px] font-semibold text-foreground">
                          {label}
                        </Text>
                        {on ? (
                          <Check size={18} color="#7c3aed" strokeWidth={2.4} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {hasChip === "yes" ? (
                    <View className="mt-1">
                      <FieldLabel text={t("petWizard.chipNumberLabel")} />
                      <TextInput
                        value={chipId}
                        onChangeText={setChipId}
                        placeholder={t("petWizard.chipPlaceholder")}
                        placeholderTextColor="#a8a29e"
                        autoCapitalize="characters"
                        className="rounded-2xl border-2 border-border bg-surface px-4 py-3.5 font-mono text-[14px] text-foreground"
                      />
                    </View>
                  ) : null}
                </View>
                <View className="flex-1" />
                <GradientButton
                  label={t("petWizard.next")}
                  onPress={handleCreate}
                  disabled={!hasChip}
                  loading={creating}
                />
              </View>
            )}

            {/* ─── STEP 9 — ¡Listo! + QR ───────────────────────── */}
            {step === 9 && created ? (
              <View className="flex-1">
                <View className="items-center">
                  <PetAvatar
                    name={name}
                    species={species ?? "other"}
                    photoUrl={photoUri}
                    size={72}
                    radius={20}
                  />
                  <Text className="mt-2.5 text-[11px] font-bold uppercase tracking-[2px] text-primary">
                    {t("petWizard.doneEyebrow")}
                  </Text>
                  <Text className="text-[24px] font-extrabold tracking-tight text-foreground">
                    {t("petWizard.doneTitle", { name })}
                  </Text>
                  <Text className="mt-1 text-[13px] text-muted">
                    {t("petWizard.doneShowQr")}
                  </Text>
                </View>

                <View className="mt-5 items-center">
                  <View
                    className="rounded-3xl border border-border bg-white p-4"
                    style={{
                      shadowColor: "#0c0a09",
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.14,
                      shadowRadius: 28,
                      elevation: 6,
                    }}
                  >
                    <QRCode
                      value={`${env.APP_URL}/vet/scan?token=${created.token}`}
                      size={200}
                      backgroundColor="#ffffff"
                      color="#0c0a09"
                    />
                  </View>
                </View>

                <View className="flex-1" />

                <View className="gap-2.5">
                  <Pressable
                    onPress={() => {
                      void Share.share({
                        message: t("petWizard.doneShareMessage", {
                          name,
                          url: `${env.APP_URL}/lost`,
                        }),
                      });
                    }}
                    className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-whatsapp"
                  >
                    <MessageCircle size={18} color="#fff" />
                    <Text className="text-[15px] font-semibold text-white">
                      {t("petWizard.doneSendVet")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.replace(`/(app)/animals/${created.id}` as never)
                    }
                    className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-surface"
                  >
                    <PawPrint size={16} color="#0c0a09" />
                    <Text className="text-[14px] font-semibold text-foreground">
                      {t("petWizard.doneSeeProfile", { name })}
                    </Text>
                  </Pressable>
                  <Pressable onPress={resetForAnother} className="h-11 items-center justify-center">
                    <Text className="text-[13px] font-medium text-muted">
                      + {t("petWizard.doneAddAnother")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Sub-componentes ──────────────────────────────────────── */

function WizardHeader({
  step,
  onBack,
  onSkip,
  skipLabel,
  stepLabel,
}: {
  step: number;
  onBack: () => void;
  onSkip?: () => void;
  skipLabel: string;
  stepLabel: string;
}) {
  return (
    <View className="px-4 pt-2.5">
      <View className="h-9 flex-row items-center justify-between gap-3">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-xl"
        >
          <ChevronLeft size={20} color="#0c0a09" />
        </Pressable>
        <View className="h-1 max-w-[200px] flex-1 overflow-hidden rounded-full bg-surface-2">
          <LinearGradient
            colors={["#7c3aed", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              width: `${(step / TOTAL_STEPS) * 100}%`,
              borderRadius: 999,
            }}
          />
        </View>
        {onSkip ? (
          <Pressable onPress={onSkip} hitSlop={8} className="h-9 justify-center px-2">
            <Text className="text-[13px] font-medium text-muted">
              {skipLabel}
            </Text>
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>
      <Text className="mt-1.5 text-center text-[11px] font-bold uppercase tracking-[1.5px] text-subtle">
        {stepLabel}
      </Text>
    </View>
  );
}

function StepTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
        {title}
      </Text>
      <Text className="mt-1.5 text-[14px] text-muted">{subtitle}</Text>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text className="mb-2 text-[12px] font-semibold text-muted">{text}</Text>
  );
}

function FeatureRow({
  icon: Icon,
  tint,
  bg,
  text,
}: {
  icon: LucideIcon;
  tint: string;
  bg: string;
  text: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className={`size-8 items-center justify-center rounded-[10px] ${bg}`}>
        <Icon size={15} color={tint} strokeWidth={2.2} />
      </View>
      <Text className="flex-1 text-[13.5px] text-muted">{text}</Text>
    </View>
  );
}

function GradientButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      className="mt-4"
      style={
        off
          ? undefined
          : {
              shadowColor: "#7c3aed",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 14,
              elevation: 4,
            }
      }
    >
      {disabled && !loading ? (
        <View className="h-[54px] flex-row items-center justify-center rounded-[14px] bg-surface-2">
          <Text className="text-[16px] font-semibold text-subtle">{label}</Text>
        </View>
      ) : (
        <LinearGradient
          colors={["#7c3aed", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 54,
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-[16px] font-semibold text-white">
                {label}
              </Text>
              <ArrowRight size={18} color="#fff" strokeWidth={2.4} />
            </>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}
