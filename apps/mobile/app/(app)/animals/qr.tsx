import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAnimals } from "../../../src/hooks/use-animals";

export default function QrEntry() {
  const router = useRouter();
  const { data: animals = [], isLoading } = useAnimals();

  useEffect(() => {
    if (isLoading) return;
    if (animals.length === 0) {
      router.replace("/(app)/animals/new" as never);
    } else if (animals.length === 1) {
      router.replace(`/(app)/animals/${animals[0]!.id}` as never);
    } else {
      router.replace("/(app)/" as never);
    }
  }, [isLoading, animals, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#7c3aed" />
    </View>
  );
}
