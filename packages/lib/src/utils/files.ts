/**
 * Validación de archivos subidos al server.
 * Defensa en profundidad: validar tanto en cliente como en server.
 */

export const MAX_PHOTO_SIZE_MB = 8;
export const MAX_DOCUMENT_SIZE_MB = 15;

export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type FileValidationError =
  | "FILE_TOO_LARGE"
  | "FILE_TYPE_NOT_ALLOWED"
  | "FILE_EMPTY";

export interface FileValidationResult {
  ok: boolean;
  error?: FileValidationError;
  message?: string;
}

export function validatePhoto(file: File): FileValidationResult {
  if (file.size === 0) {
    return { ok: false, error: "FILE_EMPTY", message: "Archivo vacío" };
  }
  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return {
      ok: false,
      error: "FILE_TOO_LARGE",
      message: `Máximo ${MAX_PHOTO_SIZE_MB} MB`,
    };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as never)) {
    return {
      ok: false,
      error: "FILE_TYPE_NOT_ALLOWED",
      message: "Solo JPG, PNG, WebP o HEIC",
    };
  }
  return { ok: true };
}

export function validateDocument(file: File): FileValidationResult {
  if (file.size === 0) {
    return { ok: false, error: "FILE_EMPTY", message: "Archivo vacío" };
  }
  if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
    return {
      ok: false,
      error: "FILE_TOO_LARGE",
      message: `Máximo ${MAX_DOCUMENT_SIZE_MB} MB`,
    };
  }
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as never)) {
    return {
      ok: false,
      error: "FILE_TYPE_NOT_ALLOWED",
      message: "Solo PDF o imágenes",
    };
  }
  return { ok: true };
}

/**
 * Sanitiza nombre de archivo — previene path traversal y caracteres raros
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}
