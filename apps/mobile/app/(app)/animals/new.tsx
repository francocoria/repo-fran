import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bird,
  Cat,
  ChevronLeft,
  Dog,
  Fish,
  PawPrint,
  Plus,
  Rabbit,
  type LucideIcon,
} from "lucide-react-native";
import { randomUUID } from "expo-crypto";
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

export default function NewAnimalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [species, setSpecies] = useState("dog");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim() || name.trim().length < 1) {
      Alert.alert(
        t("owner.newPet.missingNameTitle"),
        t("owner.newPet.missingNameBody"),
      );
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("owner.newPet.notAuth"));

      const { data: profile } = await supabase
        .from("owner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) throw new Error(t("owner.newPet.noProfile"));

      const id = randomUUID();
      const urlToken = randomUUID();

      const { error } = await supabase.from("animals").insert({
        id,
        owner_id: profile.id,
        url_token: urlToken,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        sex,
        color: color.trim() || null,
        weight_kg: weight.trim() ? Number(weight) : null,
        status: "active",
      });
      if (error) throw error;

      router.replace(`/(app)/animals/${id}` as never);
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("owner.newPet.createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 px-4 py-3">
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">{t("common.back")}</Text>
        </Pressable>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            {t("owner.newPet.title")}
          </Text>
          <Text className="mt-1 text-[14px] text-muted">
            {t("owner.newPet.subtitle")}
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
                {([
                  ["male", t("owner.newPet.sexMale")],
                  ["female", t("owner.newPet.sexFemale")],
                  ["unknown", t("owner.newPet.sexUnknown")],
                ] as const).map(([value, label]) => (
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
          </View>

          <View className="mt-8 mb-12">
            <Button
              label={t("owner.newPet.createProfile")}
              onPress={handleCreate}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
