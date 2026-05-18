import { Pressable, Text, View } from "react-native";
import { Check, Languages } from "lucide-react-native";
import { Card } from "./ui/card";
import { useTranslation, LOCALES } from "../lib/i18n";

/**
 * Selector de idioma (ES/EN/PT) para la pantalla de ajustes.
 * El cambio es inmediato y se persiste con expo-secure-store.
 */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <View className="px-3">
      <Card className="gap-0.5">
        <View className="flex-row items-center gap-2 pb-1">
          <Languages size={15} color="#78716c" />
          <Text className="text-[13px] font-medium text-foreground">
            {t("language.title")}
          </Text>
        </View>
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <Pressable
              key={l.code}
              onPress={() => setLocale(l.code)}
              className="flex-row items-center justify-between rounded-lg px-2 py-2.5"
            >
              <Text
                className={`text-[14px] ${
                  active ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {l.label}
              </Text>
              {active && <Check size={16} color="#7c3aed" />}
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}
