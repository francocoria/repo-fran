import { z } from "zod";

export const ANIMAL_SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "rodent",
  "reptile",
  "fish",
  "exotic",
  "other",
] as const;

export const ANIMAL_SEX = ["male", "female", "unknown"] as const;

export const animalCreateSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(60),
  species: z.enum(ANIMAL_SPECIES),
  breed: z.string().trim().max(80).optional().or(z.literal("")),
  sex: z.enum(ANIMAL_SEX).default("unknown"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
  birthDateApprox: z.boolean().default(false),
  color: z.string().trim().max(60).optional().or(z.literal("")),
  distinctiveMarks: z.string().trim().max(300).optional().or(z.literal("")),
  microchip: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]*$/, "Solo letras y números")
    .max(20)
    .optional()
    .or(z.literal("")),
  weightKg: z.coerce
    .number()
    .positive("Debe ser positivo")
    .max(999.99)
    .optional(),
  neutered: z.boolean().default(false),
  neuteredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const animalUpdateSchema = animalCreateSchema.partial();

export const weightEntrySchema = z.object({
  weightKg: z.coerce.number().positive().max(999.99),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const lostPetActivateSchema = z.object({
  contactName: z.string().trim().min(2).max(100),
  contactPhone: z.string().trim().min(8).max(20),
  contactEmail: z.string().email().optional().or(z.literal("")),
  lastSeenLocation: z.string().trim().max(200).optional().or(z.literal("")),
  lastSeenAt: z.string().datetime().optional(),
  rewardDescription: z.string().trim().max(200).optional().or(z.literal("")),
  additionalInfo: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type AnimalCreateInput = z.infer<typeof animalCreateSchema>;
export type AnimalUpdateInput = z.infer<typeof animalUpdateSchema>;
export type WeightEntryInput = z.infer<typeof weightEntrySchema>;
export type LostPetActivateInput = z.infer<typeof lostPetActivateSchema>;
