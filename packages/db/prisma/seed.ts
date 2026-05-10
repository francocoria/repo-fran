/**
 * Seed inicial — datos del sistema (no usuarios reales)
 * Ejecutar con: pnpm --filter @pet-app/db db:seed
 */
import { prisma } from "../src";

async function main() {
  console.log("Seeding system data...");

  // Templates de consulta del sistema (disponibles a todos los vets)
  const systemTemplates = [
    {
      name: "Vacunación de rutina",
      content: {
        examination:
          "Animal en buen estado general. Mucosas rosadas, hidratación normal, ganglios sin alteraciones.",
        diagnosis: "Animal sano apto para vacunación.",
        treatment: "Aplicación de vacuna {{nombre_vacuna}}.",
        next_steps:
          "Próxima dosis en {{intervalo}}. Observar 24-48hs por reacciones.",
      },
    },
    {
      name: "Control sano",
      content: {
        examination:
          "Examen físico completo: peso, temperatura, frecuencia cardíaca y respiratoria normales. Mucosas rosadas, abdomen blando indoloro.",
        diagnosis: "Animal clínicamente sano.",
        treatment: "Continuar con plan de alimentación y ejercicio actual.",
        next_steps: "Control en 6 meses o ante cualquier síntoma.",
      },
    },
    {
      name: "Consulta por motivo",
      content: {
        examination: "",
        diagnosis: "",
        treatment: "",
        next_steps: "",
      },
    },
    {
      name: "Desparasitación",
      content: {
        examination:
          "Animal en buen estado. Sin signos de parasitosis evidente.",
        diagnosis: "Desparasitación de rutina.",
        treatment: "Aplicación de {{producto}}, dosis ajustada al peso.",
        next_steps:
          "Repetir en 3 meses (interno) o según producto (externo).",
      },
    },
    {
      name: "Urgencia",
      content: {
        examination: "",
        diagnosis: "",
        treatment: "",
        next_steps:
          "Re-control en 24-48hs. Volver de inmediato si empeora.",
      },
    },
  ];

  // Borramos los del sistema y los recreamos para mantener idempotencia
  await prisma.consultTemplate.deleteMany({
    where: { is_system: true, vet_id: null },
  });

  await prisma.consultTemplate.createMany({
    data: systemTemplates.map((t) => ({
      name: t.name,
      content: t.content,
      is_system: true,
      vet_id: null,
    })),
  });

  console.log(`✓ ${systemTemplates.length} templates de sistema creados`);
  console.log("✓ Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
