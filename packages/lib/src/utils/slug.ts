import { customAlphabet } from "nanoid";

/**
 * Genera un slug público corto, URL-friendly, no adivinable.
 * Usa solo caracteres no ambiguos (sin 0, O, l, 1).
 */
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 10);

export function generatePublicSlug(): string {
  return generate();
}
