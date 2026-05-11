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

const SPECIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "dog", label: "Perro", icon: Dog },
  { value: "cat", label: "Gato", icon: Cat },
  { value: "bird", label: "Ave", icon: Bird },
  { value: "rabbit", label: "Conejo", icon: Rabbit },
  { value: "rodent", label: "Roedor", icon: PawPrint },
  { value: "reptile", label: "Reptil", icon: PawPrint },
  { value: "fish", label: "Pez", icon: Fish },
  { value: "other", label: "Otra", icon: Plus },
];

export default function NewAnimalScreen() {
  const router = useRouter();
  const [species, setSpecies] = useState("dog");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim() || name.trim().length < 1) {
      Alert.alert("Falta nombre", "Ingresá el nombre de tu mascota.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: profile } = await supabase
        .from("owner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) throw new Error("No se encontró el perfil");

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
      Alert.alert("Error", e?.message ?? "No se pudo crear la mascota.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 px-4 py-3">
          <ChevronLeft size={20} color="#57534e" />
          <Text className="text-[15px] text-muted">Volver</Text>
        </Pressable>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Text className="text-[28px] font-bold tracking-tight text-foreground">
            Nueva mascota
          </Text>
          <Text className="mt-1 text-[14px] text-muted">
            Datos básicos para crear su perfil.
          </Text>

          <Text className="mt-6 mb-2 text-[13px] font-medium text-foreground">
            Especie
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
                    {sp.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-6 gap-4">
            <Input
              label="Nombre"
              required
              value={name}
              onChangeText={setName}
              placeholder="Firu"
            />
            <Input
              label="Raza"
              value={breed}
              onChangeText={setBreed}
              placeholder="Mestizo, Labrador..."
              hint="Opcional. Escribí libremente."
            />

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-foreground">
                Sexo
              </Text>
              <View className="flex-row gap-2">
                {([
                  ["male", "♂ Macho"],
                  ["female", "♀ Hembra"],
                  ["unknown", "—"],
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
              label="Color"
              value={color}
              onChangeText={setColor}
              placeholder="Negro, atigrado..."
            />
            <Input
              label="Peso (kg)"
              value={weight}
              onChangeText={setWeight}
              placeholder="Ej: 12.5"
              keyboardType="decimal-pad"
            />
          </View>

          <View className="mt-8 mb-12">
            <Button
              label="Crear perfil"
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
