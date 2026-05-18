import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bird,
  Cat,
  Check,
  ChevronLeft,
  Dog,
  Fish,
  PawPrint,
  Plus,
  Rabbit,
  type LucideIcon,
} from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { supabase } from "../../../src/lib/supabase";
import { useTranslation } from "../../../src/lib/i18n";

const SPECIES: { value: string; icon: LucideIcon }[] = [
  { value: "dog", icon: Dog },
  { value: "cat", icon: Cat },
  { value: "bird", icon: Bird },
  { value: "rabbit", icon: Rabbit },
  { value: "rodent", icon: PawPrint },
  { value: "reptile", icon: PawPrint },
  { value: "fish", icon: Fish },
  { value: "other", icon: Plus },
];

type Sex = "male" | "female" | "unknown";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function EditAnimalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [species, setSpecies] = useState("dog");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [marks, setMarks] = useState("");
  const [microchip, setMicrochip] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [neutered, setNeutered] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const { data } = await supabase
        .from("animals")
        .select(
          "name, species, breed, sex, color, weight_kg, distinctive_marks, microchip, birth_date, notes, neutered",
        )
        .eq("id", id)
        .single();
      if (data) {
        setName(data.name ?? "");
        setSpecies(data.species ?? "dog");
        setBreed(data.breed ?? "");
        setSex((data.sex as Sex) ?? "unknown");
        setColor(data.color ?? "");
        setWeight(data.weight_kg != null ? String(data.weight_kg) : "");
        setMarks(data.distinctive_marks ?? "");
        setMicrochip(data.microchip ?? "");
        setBirthDate(
          data.birth_date ? String(data.birth_date).slice(0, 10) : "",
        );
        setNotes(data.notes ?? "");
        setNeutered(Boolean(data.neutered));
      }
      setLoading(false);
    })();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    if (!name.trim()) {
      Alert.alert(
        t("owner.newPet.missingNameTitle"),
        t("owner.newPet.missingNameBody"),
      );
      return;
    }
    const birth = birthDate.trim();
    if (birth && (!DATE_RE.test(birth) || Number.isNaN(Date.parse(birth)))) {
      Alert.alert(t("common.error"), t("editPet.birthDateInvalid"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("animals")
      .update({
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        sex,
        color: color.trim() || null,
        weight_kg: weight.trim() ? Number(weight) : null,
        distinctive_marks: marks.trim() || null,
        microchip: microchip.trim() || null,
        birth_date: birth || null,
        notes: notes.trim() || null,
        neutered,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      Alert.alert(t("common.error"), error.message || t("editPet.saveError"));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["animal", id] });
    await queryClient.invalidateQueries({ queryKey: ["animals"] });
    Alert.alert(t("common.done"), t("editPet.savedBody"));
    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 px-4 py-3"
        >
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">{t("common.back")}</Text>
        </Pressable>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {t("editPet.title")}
          </Text>
          <Text className="mt-1 text-[14px] text-muted">
            {t("editPet.subtitle", { name: name || "—" })}
          </Text>

          <Text className="mt-6 mb-2 text-[13px] font-medium text-foreground">
            {t("owner.newPet.speciesLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SPECIES.map((sp) => {
              const Icon = sp.icon;
              const selected = species === sp.value;
              return (
                <Pressable
                  key={sp.value}
                  onPress={() => setSpecies(sp.value)}
                  className={`items-center gap-1 rounded-xl border-2 p-3 ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface"
                  }`}
                  style={{ width: "23%" }}
                >
                  <Icon size={20} color={selected ? "#7c3aed" : "#57534e"} />
                  <Text
                    className={`text-[12px] font-medium ${
                      selected ? "text-primary" : "text-muted"
                    }`}
                  >
                    {t(`format.species.${sp.value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-6 gap-4">
            <Input
              label={t("owner.newPet.nameLabel")}
              required
              value={name}
              onChangeText={setName}
              placeholder={t("owner.newPet.namePlaceholder")}
            />
            <Input
              label={t("owner.newPet.breedLabel")}
              value={breed}
              onChangeText={setBreed}
              placeholder={t("owner.newPet.breedPlaceholder")}
              hint={t("owner.newPet.breedHint")}
            />

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-foreground">
                {t("owner.newPet.sexLabel")}
              </Text>
              <View className="flex-row gap-2">
                {(
                  [
                    ["male", t("owner.newPet.sexMale")],
                    ["female", t("owner.newPet.sexFemale")],
                    ["unknown", t("owner.newPet.sexUnknown")],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setSex(value)}
                    className={`flex-1 items-center rounded-lg border py-2.5 ${
                      sex === value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-medium ${
                        sex === value ? "text-primary" : "text-muted"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input
              label={t("owner.newPet.colorLabel")}
              value={color}
              onChangeText={setColor}
              placeholder={t("owner.newPet.colorPlaceholder")}
            />
            <Input
              label={t("owner.newPet.weightLabel")}
              value={weight}
              onChangeText={setWeight}
              placeholder={t("owner.newPet.weightPlaceholder")}
              keyboardType="decimal-pad"
            />
            <Input
              label={t("editPet.birthDateLabel")}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder={t("editPet.birthDatePlaceholder")}
              hint={t("editPet.birthDateHint")}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />
            <Input
              label={t("editPet.marksLabel")}
              value={marks}
              onChangeText={setMarks}
              placeholder={t("editPet.marksPlaceholder")}
            />
            <Input
              label={t("editPet.microchipLabel")}
              value={microchip}
              onChangeText={setMicrochip}
              placeholder={t("editPet.microchipPlaceholder")}
              autoCapitalize="none"
            />
            <Input
              label={t("editPet.notesLabel")}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("editPet.notesPlaceholder")}
            />

            <Pressable
              onPress={() => setNeutered((v) => !v)}
              className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-3 py-3"
            >
              <Text className="text-[14px] font-medium text-foreground">
                {t("editPet.neuteredLabel")}
              </Text>
              <View
                className={`size-6 items-center justify-center rounded-md border ${
                  neutered
                    ? "border-primary bg-primary"
                    : "border-border bg-surface-2"
                }`}
                style={{ width: 24, height: 24 }}
              >
                {neutered && <Check size={15} color="#ffffff" />}
              </View>
            </Pressable>
          </View>

          <View className="mt-8 mb-12">
            <Button
              label={t("common.saveChanges")}
              onPress={handleSave}
              loading={saving}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
