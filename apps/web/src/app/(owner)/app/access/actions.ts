"use server";

// Wrapper async para que la UI del owner pueda llamar las acciones de aprobación.
// Las actions viven en (vet)/vet/access-actions.ts pero hacen el ownership check
// internamente — son seguras de invocar desde el lado owner.
import {
  approveAccess as _approveAccess,
  rejectAccess as _rejectAccess,
  revokeAccess as _revokeAccess,
} from "@/app/(vet)/vet/access-actions";

export async function approveAccess(accessId: string) {
  return _approveAccess(accessId);
}

export async function rejectAccess(accessId: string) {
  return _rejectAccess(accessId);
}

export async function revokeAccess(accessId: string) {
  return _revokeAccess(accessId);
}
