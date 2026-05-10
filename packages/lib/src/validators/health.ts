import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)");

export const vaccineCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  appliedDate: dateString,
  lotNumber: z.string().trim().max(50).optional().or(z.literal("")),
  nextDoseDate: dateString.optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  appliedByVetId: z.string().uuid().optional(),
});

export const dewormingCreateSchema = z.object({
  type: z.enum(["internal", "external"]),
  product: z.string().trim().min(1).max(100),
  appliedDate: dateString,
  nextDate: dateString.optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const medicationCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  dosage: z.string().trim().min(1).max(100),
  frequency: z.string().trim().min(1).max(100),
  startDate: dateString,
  endDate: dateString.optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const allergyCreateSchema = z.object({
  type: z.enum(["food", "medication", "environmental", "other"]),
  allergen: z.string().trim().min(1).max(100),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const medicalRecordCreateSchema = z.object({
  visitDate: z.string().datetime(),
  reason: z.string().trim().min(1).max(200),
  examination: z.string().trim().max(2000).optional().or(z.literal("")),
  diagnosis: z.string().trim().max(2000).optional().or(z.literal("")),
  treatment: z.string().trim().max(2000).optional().or(z.literal("")),
  nextSteps: z.string().trim().max(1000).optional().or(z.literal("")),
  publicNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  privateNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type VaccineCreateInput = z.infer<typeof vaccineCreateSchema>;
export type DewormingCreateInput = z.infer<typeof dewormingCreateSchema>;
export type MedicationCreateInput = z.infer<typeof medicationCreateSchema>;
export type AllergyCreateInput = z.infer<typeof allergyCreateSchema>;
export type MedicalRecordCreateInput = z.infer<typeof medicalRecordCreateSchema>;
