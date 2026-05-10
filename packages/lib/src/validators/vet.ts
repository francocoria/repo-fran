import { z } from "zod";

export const vetProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  licenseNumber: z.string().trim().max(50).optional().or(z.literal("")),
  licenseCountry: z.string().trim().length(2).default("AR"),
  specialty: z.string().trim().max(100).optional().or(z.literal("")),
  clinicName: z.string().trim().max(150).optional().or(z.literal("")),
  clinicAddress: z.string().trim().max(200).optional().or(z.literal("")),
  clinicCity: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const accessRequestSchema = z.object({
  animalId: z.string().uuid(),
});

export const accessApprovalSchema = z.object({
  accessId: z.string().uuid(),
  decision: z.enum(["approved", "revoked"]),
});

export const prescriptionSchema = z.object({
  medicalRecordId: z.string().uuid().optional(),
  animalId: z.string().uuid(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        dosage: z.string().trim().min(1).max(100),
        frequency: z.string().trim().min(1).max(100),
        duration: z.string().trim().max(100).optional().or(z.literal("")),
        instructions: z.string().trim().max(500).optional().or(z.literal("")),
      }),
    )
    .min(1, "Al menos un medicamento"),
});

export const certificateSchema = z.object({
  animalId: z.string().uuid(),
  type: z.enum(["health", "rabies", "travel", "other"]),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
});

export const verificationRequestSchema = z.object({
  licensePhotoUrl: z.string().url(),
});

export type VetProfileUpdateInput = z.infer<typeof vetProfileUpdateSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
