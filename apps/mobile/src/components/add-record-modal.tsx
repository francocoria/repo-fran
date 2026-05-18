import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useTranslation } from "../lib/i18n";

export type RecordType =
  | "vaccine"
  | "weight"
  | "allergy"
  | "medication"
  | "deworming";

interface AddRecordModalProps {
  visible: boolean;
  type: RecordType | null;
  animalId: string;
  onClose: () => void;
  onCreated: () => void;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

function validDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

const TABLE: Record<RecordType, string> = {
  vaccine: "vaccines",
  weight: "weight_entries",
  allergy: "allergies",
  medication: "medications",
  deworming: "deworming",
};

const TITLE_KEY: Record<RecordType, string> = {
  vaccine: "addRecord.titleVaccine",
  weight: "addRecord.titleWeight",
  allergy: "addRecord.titleAllergy",
  medication: "addRecord.titleMedication",
  deworming: "addRecord.titleDeworming",
};

const ALLERGY_TYPES = ["food", "medication", "environmental", "other"];
const ALLERGY_SEVERITIES = ["mild", "moderate", "severe"];
const DEWORMING_TYPES = ["internal", "external"];

export function AddRecordModal({
  visible,
  type,
  animalId,
  onClose,
  onCreated,
}: AddRecordModalProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  // Campos genéricos reutilizados según el tipo de registro.
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [lot, setLot] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [date1, setDate1] = useState(today());
  const [date2, setDate2] = useState("");
  const [allergyType, setAllergyType] = useState("food");
  const [allergySeverity, setAllergySeverity] = useState("moderate");
  const [dewormingType, setDewormingType] = useState("internal");

  useEffect(() => {
    if (visible) {
      setName("");
      setDosage("");
      setFrequency("");
      setLot("");
      setWeight("");
      setNotes("");
      setDate1(today());
      setDate2("");
      setAllergyType("food");
      setAllergySeverity("moderate");
      setDewormingType("internal");
      setSaving(false);
    }
  }, [visible]);

  async function handleSave() {
    if (!type) return;

    // Validación por tipo.
    let payload: Record<string, unknown> | null = null;
    if (type === "vaccine") {
      if (!name.trim() || !date1.trim()) {
        Alert.alert(t("common.error"), t("addRecord.missingFields"));
        return;
      }
      if (!validDate(date1) || (date2.trim() && !validDate(date2))) {
        Alert.alert(t("common.error"), t("addRecord.invalidDate"));
        return;
      }
      payload = {
        animal_id: animalId,
        name: name.trim(),
        applied_date: date1,
        next_dose_date: date2.trim() || null,
        lot_number: lot.trim() || null,
        notes: notes.trim() || null,
      };
    } else if (type === "weight") {
      if (!weight.trim() || Number.isNaN(Number(weight))) {
        Alert.alert(t("common.error"), t("addRecord.missingFields"));
        return;
      }
      if (!validDate(date1)) {
        Alert.alert(t("common.error"), t("addRecord.invalidDate"));
        return;
      }
      payload = {
        animal_id: animalId,
        weight_kg: Number(weight),
        recorded_at: date1,
        notes: notes.trim() || null,
      };
    } else if (type === "allergy") {
      if (!name.trim()) {
        Alert.alert(t("common.error"), t("addRecord.missingFields"));
        return;
      }
      payload = {
        animal_id: animalId,
        allergen: name.trim(),
        type: allergyType,
        severity: allergySeverity,
        notes: notes.trim() || null,
      };
    } else if (type === "medication") {
      if (!name.trim() || !dosage.trim() || !frequency.trim() || !date1.trim()) {
        Alert.alert(t("common.error"), t("addRecord.missingFields"));
        return;
      }
      if (!validDate(date1) || (date2.trim() && !validDate(date2))) {
        Alert.alert(t("common.error"), t("addRecord.invalidDate"));
        return;
      }
      payload = {
        animal_id: animalId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        start_date: date1,
        end_date: date2.trim() || null,
        active: true,
        notes: notes.trim() || null,
      };
    } else if (type === "deworming") {
      if (!name.trim() || !date1.trim()) {
        Alert.alert(t("common.error"), t("addRecord.missingFields"));
        return;
      }
      if (!validDate(date1) || (date2.trim() && !validDate(date2))) {
        Alert.alert(t("common.error"), t("addRecord.invalidDate"));
        return;
      }
      payload = {
        animal_id: animalId,
        product: name.trim(),
        type: dewormingType,
        applied_date: date1,
        next_date: date2.trim() || null,
        notes: notes.trim() || null,
      };
    }

    if (!payload) return;

    setSaving(true);
    const { error } = await supabase.from(TABLE[type]).insert(payload);
    setSaving(false);
    if (error) {
      Alert.alert(t("common.error"), error.message || t("addRecord.saveError"));
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable
            onPress={onClose}
            disabled={saving}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#0c0a09" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-foreground">
            {type ? t(TITLE_KEY[type]) : ""}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 10,
              backgroundColor: saving ? "#cbd5e1" : "#7c3aed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                {t("common.save")}
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          >
            {type === "vaccine" && (
              <>
                <Field
                  label={t("addRecord.vaccineName")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("addRecord.vaccineNamePlaceholder")}
                />
                <Field
                  label={t("addRecord.appliedDate")}
                  value={date1}
                  onChangeText={setDate1}
                  placeholder={t("addRecord.datePlaceholder")}
                />
                <Field
                  label={t("addRecord.nextDoseDate")}
                  value={date2}
                  onChangeText={setDate2}
                  placeholder={t("addRecord.datePlaceholder")}
                />
                <Field
                  label={t("addRecord.lotNumber")}
                  value={lot}
                  onChangeText={setLot}
                />
              </>
            )}

            {type === "weight" && (
              <>
                <Field
                  label={t("addRecord.weightKg")}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={t("addRecord.weightPlaceholder")}
                  keyboardType="decimal-pad"
                />
                <Field
                  label={t("addRecord.recordedAt")}
                  value={date1}
                  onChangeText={setDate1}
                  placeholder={t("addRecord.datePlaceholder")}
                />
              </>
            )}

            {type === "allergy" && (
              <>
                <Field
                  label={t("addRecord.allergen")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("addRecord.allergenPlaceholder")}
                />
                <Selector
                  label={t("addRecord.allergyTypeLabel")}
                  options={ALLERGY_TYPES}
                  value={allergyType}
                  onChange={setAllergyType}
                  labelFor={(o) => t(`animalDetail.allergyType.${o}`)}
                />
                <Selector
                  label={t("addRecord.allergySeverityLabel")}
                  options={ALLERGY_SEVERITIES}
                  value={allergySeverity}
                  onChange={setAllergySeverity}
                  labelFor={(o) => t(`animalDetail.allergySeverity.${o}`)}
                />
              </>
            )}

            {type === "medication" && (
              <>
                <Field
                  label={t("addRecord.medName")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("addRecord.medNamePlaceholder")}
                />
                <Field
                  label={t("addRecord.dosage")}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder={t("addRecord.dosagePlaceholder")}
                />
                <Field
                  label={t("addRecord.frequency")}
                  value={frequency}
                  onChangeText={setFrequency}
                  placeholder={t("addRecord.frequencyPlaceholder")}
                />
                <Field
                  label={t("addRecord.startDate")}
                  value={date1}
                  onChangeText={setDate1}
                  placeholder={t("addRecord.datePlaceholder")}
                />
                <Field
                  label={t("addRecord.endDate")}
                  value={date2}
                  onChangeText={setDate2}
                  placeholder={t("addRecord.datePlaceholder")}
                />
              </>
            )}

            {type === "deworming" && (
              <>
                <Field
                  label={t("addRecord.dewormingProduct")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("addRecord.dewormingProductPlaceholder")}
                />
                <Selector
                  label={t("addRecord.dewormingTypeLabel")}
                  options={DEWORMING_TYPES}
                  value={dewormingType}
                  onChange={setDewormingType}
                  labelFor={(o) => t(`animalDetail.dewormingType.${o}`)}
                />
                <Field
                  label={t("addRecord.appliedDate")}
                  value={date1}
                  onChangeText={setDate1}
                  placeholder={t("addRecord.datePlaceholder")}
                />
                <Field
                  label={t("addRecord.nextDoseDate")}
                  value={date2}
                  onChangeText={setDate2}
                  placeholder={t("addRecord.datePlaceholder")}
                />
              </>
            )}

            <Field
              label={t("addRecord.notes")}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("addRecord.notesPlaceholder")}
              multiline
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="mb-1.5 text-[12px] uppercase tracking-wider text-subtle">
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#a8a29e"
        autoCorrect={false}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: "#e7e5e4",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 15,
          color: "#0c0a09",
          backgroundColor: "#ffffff",
          minHeight: multiline ? 80 : 44,
          textAlignVertical: multiline ? "top" : "center",
        }}
        {...props}
      />
    </View>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
  labelFor,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labelFor: (o: string) => string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="mb-1.5 text-[12px] uppercase tracking-wider text-subtle">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const selected = o === value;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              className={`rounded-lg border px-3 py-2 ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  selected ? "text-primary" : "text-muted"
                }`}
              >
                {labelFor(o)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
