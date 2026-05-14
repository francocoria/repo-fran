export const EMAIL_TYPES = [
  "premium_activated",
  "premium_expiring_soon",
  "premium_expired",
  "vet_access_requested",
  "vet_access_approved",
  "verification_approved",
  "verification_rejected",
  "vaccine_reminder",
  "co_owner_invited",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export { sendEmail } from "./send";
export type { SendEmailOptions, SendEmailResult } from "./send";

export {
  premiumActivatedTemplate,
  premiumExpiringSoonTemplate,
  premiumExpiredTemplate,
  verificationApprovedTemplate,
  verificationRejectedTemplate,
  vetAccessApprovedTemplate,
  vaccineReminderTemplate,
  coOwnerInvitedTemplate,
} from "./templates";

export type {
  PremiumActivatedData,
  PremiumExpiringSoonData,
  PremiumExpiredData,
  VerificationApprovedData,
  VerificationRejectedData,
  VetAccessApprovedData,
  VaccineReminderData,
  CoOwnerInvitedData,
} from "./templates";
