/**
 * Lógica de suscripciones — premium gating del lado vet.
 * Reglas centralizadas para que toda la app responda igual.
 */

export const FREE_PATIENT_CAP = 5;
export const TRIAL_DURATION_DAYS = 30;

export type EffectivePlan = "free" | "trial" | "premium" | "expired";

export interface SubscriptionState {
  plan: "free" | "trial" | "premium";
  status: "active" | "expired" | "suspended";
  expiresAt: Date | null;
}

/**
 * Calcula el plan EFECTIVO considerando expiración.
 * Es lo que se debe usar para checks de features, NO el .plan crudo.
 */
export function effectivePlan(sub: SubscriptionState | null): EffectivePlan {
  if (!sub) return "free";
  if (sub.status === "suspended") return "expired";
  if (sub.plan === "free") return "free";

  if (sub.expiresAt && sub.expiresAt < new Date()) {
    return "expired";
  }

  return sub.plan;
}

export function isPremium(sub: SubscriptionState | null): boolean {
  const eff = effectivePlan(sub);
  return eff === "premium" || eff === "trial";
}

/**
 * Días restantes hasta el vencimiento (negativo si ya venció)
 */
export function daysUntilExpiry(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const ms = expiresAt.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function shouldNotifyExpiry(expiresAt: Date | null): boolean {
  const days = daysUntilExpiry(expiresAt);
  return days !== null && days > 0 && days <= 7;
}

/**
 * ¿El vet puede agregar otro paciente?
 * Reglas: premium → ilimitado. Free → cap. Solo cuentan APROBADOS y NO archivados.
 */
export interface PatientCapCheck {
  canAdd: boolean;
  current: number;
  limit: number | null; // null = ilimitado
  reason?: "FREE_CAP_REACHED" | "SUSPENDED";
}

export function checkPatientCap(
  sub: SubscriptionState | null,
  activeApprovedNonArchivedCount: number,
): PatientCapCheck {
  const eff = effectivePlan(sub);

  if (sub?.status === "suspended") {
    return {
      canAdd: false,
      current: activeApprovedNonArchivedCount,
      limit: 0,
      reason: "SUSPENDED",
    };
  }

  if (eff === "premium" || eff === "trial") {
    return {
      canAdd: true,
      current: activeApprovedNonArchivedCount,
      limit: null,
    };
  }

  return {
    canAdd: activeApprovedNonArchivedCount < FREE_PATIENT_CAP,
    current: activeApprovedNonArchivedCount,
    limit: FREE_PATIENT_CAP,
    reason:
      activeApprovedNonArchivedCount >= FREE_PATIENT_CAP
        ? "FREE_CAP_REACHED"
        : undefined,
  };
}

/**
 * Features disponibles según plan efectivo
 */
export interface FeatureGates {
  unlimitedPatients: boolean;
  certificates: boolean;
  customTemplates: boolean;
  practiceStats: boolean;
  brandedPrescriptions: boolean;
  unlimitedAttachments: boolean;
  verificationBadge: boolean;
}

export function getFeatureGates(sub: SubscriptionState | null): FeatureGates {
  const eff = effectivePlan(sub);
  const premium = eff === "premium" || eff === "trial";
  return {
    unlimitedPatients: premium,
    certificates: premium,
    customTemplates: premium,
    practiceStats: premium,
    brandedPrescriptions: premium,
    unlimitedAttachments: premium,
    verificationBadge: premium,
  };
}
