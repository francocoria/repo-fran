import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronLeft, PawPrint, UserPlus, X } from "lucide-react-native";
import { Button } from "../../src/components/ui/button";
import { Card } from "../../src/components/ui/card";
import {
  usePendingCoOwnerInvites,
  useRespondCoOwnerInvite,
  type CoOwnerInvite,
} from "../../src/hooks/use-co-owner-invites";
import { useTranslation } from "../../src/lib/i18n";
import { useLocaleFormat } from "../../src/lib/i18n/format";

export default function InvitesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = usePendingCoOwnerInvites();
  const invites = data?.invites ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1"
        >
          <ChevronLeft size={22} color="#0c0a09" />
          <Text className="text-[15px] text-foreground">
            {t("owner.invites.back")}
          </Text>
        </Pressable>
        <Text className="text-[15px] font-semibold text-foreground">
          {t("owner.invites.title")}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : invites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <PawPrint size={36} color="#a8a29e" />
          <Text className="mt-3 text-center text-[15px] font-medium text-foreground">
            {t("owner.invites.emptyTitle")}
          </Text>
          <Text className="mt-1 text-center text-[13px] text-muted">
            {t("owner.invites.emptyDesc")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => <InviteCard invite={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function InviteCard({ invite }: { invite: CoOwnerInvite }) {
  const { t } = useTranslation();
  const { speciesLabel } = useLocaleFormat();
  const respond = useRespondCoOwnerInvite();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);

  function handle(kind: "accept" | "decline") {
    setAction(kind);
    respond.mutate(
      { coOwnerId: invite.id, action: kind },
      {
        onSuccess: () => {
          setAction(null);
        },
        onError: (err) => {
          setAction(null);
          const msg = err instanceof Error ? err.message : t("common.error");
          Alert.alert(t("common.error"), msg);
        },
      },
    );
  }

  return (
    <Card className="p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-14 overflow-hidden rounded-xl bg-surface-2">
          {invite.animal.photo_url ? (
            <Image
              source={{ uri: invite.animal.photo_url }}
              style={{ width: 56, height: 56 }}
            />
          ) : (
            <View className="size-full items-center justify-center">
              <PawPrint size={24} color="#a8a29e" />
            </View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <UserPlus size={13} color="#7c3aed" />
            <Text className="text-[12px] font-medium text-primary">
              {t("owner.invites.invitedYou", {
                name: invite.inviter.full_name ?? t("owner.invites.someone"),
              })}
            </Text>
          </View>
          <Text className="mt-0.5 text-[16px] font-semibold text-foreground">
            {invite.animal.name}
          </Text>
          <Text className="text-[12px] text-muted">
            {speciesLabel(invite.animal.species)}
            {invite.animal.breed && ` · ${invite.animal.breed}`}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <View style={{ flex: 1 }}>
          <Button
            label={t("owner.invites.accept")}
            icon={Check}
            onPress={() => handle("accept")}
            loading={respond.isPending && action === "accept"}
            disabled={respond.isPending}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t("owner.invites.decline")}
            variant="outline"
            icon={X}
            onPress={() => handle("decline")}
            loading={respond.isPending && action === "decline"}
            disabled={respond.isPending}
            fullWidth
          />
        </View>
      </View>
    </Card>
  );
}
