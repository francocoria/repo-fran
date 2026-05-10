import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email inválido")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
  .regex(/[a-z]/, "Debe tener al menos una minúscula")
  .regex(/[0-9]/, "Debe tener al menos un número");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

export const ownerSignupSchema = z.object({
  email: emailSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Nombre muy corto")
    .max(100, "Nombre muy largo"),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal("")),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar los términos" }),
  }),
});

export const vetSignupSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().min(2).max(100),
  licenseNumber: z.string().trim().max(50).optional().or(z.literal("")),
  clinicName: z.string().trim().max(150).optional().or(z.literal("")),
  phone: z.string().trim().min(8).max(20).optional().or(z.literal("")),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar los términos" }),
  }),
});

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
export type VetSignupInput = z.infer<typeof vetSignupSchema>;
