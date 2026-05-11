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
 * Razas comunes por especie — para sugerencias en form de mascota.
 * No es lista cerrada: el user puede escribir cualquier raza custom.
 */
export const COMMON_BREEDS: Record<string, string[]> = {
  dog: [
    "Mestizo",
    "Labrador",
    "Golden Retriever",
    "Caniche",
    "Bulldog Francés",
    "Bulldog Inglés",
    "Border Collie",
    "Pastor Alemán",
    "Husky Siberiano",
    "Chihuahua",
    "Pug",
    "Yorkshire Terrier",
    "Schnauzer",
    "Boxer",
    "Dálmata",
    "Doberman",
    "Rottweiler",
    "Beagle",
    "Cocker Spaniel",
    "Dachshund (Salchicha)",
    "Pomerania",
    "Shih Tzu",
    "Maltés",
    "Akita",
    "Pitbull",
    "Dogo Argentino",
    "Galgo",
    "San Bernardo",
    "Gran Danés",
    "Pekinés",
  ],
  cat: [
    "Mestizo",
    "Común Europeo",
    "Siamés",
    "Persa",
    "Maine Coon",
    "British Shorthair",
    "Ragdoll",
    "Bengala",
    "Sphynx",
    "Russian Blue",
    "Birmano",
    "Abisinio",
    "Bombay",
    "Angora Turco",
    "Scottish Fold",
    "Exótico",
  ],
  bird: [
    "Canario",
    "Periquito",
    "Cacatúa",
    "Loro",
    "Cotorra",
    "Agapornis",
    "Ninfa",
    "Diamante de Gould",
    "Jilguero",
    "Guacamayo",
  ],
  rabbit: [
    "Mini Lop",
    "Holland Lop",
    "Cabeza de león",
    "Belier",
    "Angora",
    "Rex",
    "Mini Rex",
    "Enano holandés",
    "Gigante de Flandes",
  ],
  rodent: ["Hámster", "Cobayo / Cuy", "Conejillo de Indias", "Rata", "Ratón", "Chinchilla", "Hurón", "Jerbo"],
  reptile: ["Tortuga", "Iguana", "Gecko leopardo", "Pogona / Dragón barbudo", "Serpiente del maíz", "Pitón bola"],
  fish: ["Betta", "Goldfish", "Guppy", "Neón", "Disco", "Tetra", "Cíclidos"],
  exotic: ["Erizo africano", "Petauro del azúcar", "Cerdo vietnamita", "Lechuza", "Hurón"],
  other: [],
};

/**
 * Diagnósticos comunes para consulta vet — chips clickeables.
 */
export const COMMON_DIAGNOSES = [
  "Otitis",
  "Dermatitis",
  "Gastroenteritis",
  "Conjuntivitis",
  "Pulgas / Garrapatas",
  "Sarna",
  "Gingivitis",
  "Sarro / Periodontitis",
  "Parásitos intestinales",
  "Cistitis / Infección urinaria",
  "Bronquitis",
  "Tos de las perreras",
  "Insuficiencia renal crónica",
  "Diabetes mellitus",
  "Hipotiroidismo",
  "Hipertiroidismo",
  "Obesidad",
  "Displasia de cadera",
  "Artrosis",
  "Otohematoma",
  "Piodermitis",
  "Alergia alimentaria",
  "Cólico / Empacho",
  "Vómitos agudos",
  "Diarrea aguda",
  "Anemia",
  "Mordedura / Herida",
  "Control rutinario",
  "Vacunación de rutina",
  "Desparasitación",
  "Castración / Esterilización",
  "Embarazo / Gestación",
];

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
