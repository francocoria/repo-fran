import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession, loadProfile } from "../src/lib/session";

export default function Entry() {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    loadProfile(session.user.id).then((profile) => {
      if (!profile) {
        router.replace("/onboarding");
      } else if (profile.role === "vet") {
        router.replace("/(app)/vet" as never);
      } else {
        router.replace("/(app)/" as never);
      }
    });
  }, [session, loading, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  );
}
