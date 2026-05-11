export function getAge(birthDate: Date | string): string {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (months < 1) return "Recién nacido";
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
  if (years === 1) return "1 año";
  return `${years} años`;
}

export function formatDate(value: Date | string, opts?: { short?: boolean }): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: opts?.short ? "short" : "long",
    year: "numeric",
  });
}

export const speciesLabel: Record<string, string> = {
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
