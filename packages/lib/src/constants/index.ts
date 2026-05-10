/**
 * Constantes del producto
 */

export const APP_NAME = "PetApp";

export const SPECIES_LABELS: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  rodent: "Roedor",
  reptile: "Reptil",
  fish: "Pez",
  exotic: "Exótico",
  other: "Otro",
};

export const SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
  unknown: "Desconocido",
};

export const ALLERGY_TYPE_LABELS: Record<string, string> = {
  food: "Alimentaria",
  medication: "Medicamento",
  environmental: "Ambiental",
  other: "Otra",
};

export const ALLERGY_SEVERITY_LABELS: Record<string, string> = {
  mild: "Leve",
  moderate: "Moderada",
  severe: "Severa",
};

/**
 * Calendario base de vacunación — perros y gatos.
 * Se usa para sugerir próximas vacunas en el cliente.
 * Fuente: AVMA / WSAVA guidelines (genérico, ajustar por país).
 */
export const VACCINATION_SCHEDULES = {
  dog: [
    { age: "6-8 sem", name: "Polivalente (1ra dosis)" },
    { age: "10-12 sem", name: "Polivalente (2da dosis)" },
    { age: "14-16 sem", name: "Polivalente (3ra dosis) + Antirrábica" },
    { age: "Anual", name: "Refuerzo polivalente + antirrábica" },
  ],
  cat: [
    { age: "6-8 sem", name: "Triple felina (1ra dosis)" },
    { age: "10-12 sem", name: "Triple felina (2da dosis) + Leucemia" },
    { age: "14-16 sem", name: "Antirrábica" },
    { age: "Anual", name: "Refuerzo triple + antirrábica" },
  ],
} as const;
