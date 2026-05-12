import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPECIES_LABELS: Record<string, string> = {
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

const SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
  unknown: "—",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#0c0a09" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottom: "1px solid #e7e5e4",
    marginBottom: 20,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  brandPet: { color: "#0c0a09" },
  brandApp: { color: "#7c3aed" },
  generatedAt: { fontSize: 9, color: "#78716c", marginLeft: "auto" },
  petHeader: { flexDirection: "row", marginBottom: 20, gap: 16 },
  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 16,
    objectFit: "cover",
  },
  petPhotoFallback: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  petName: { fontSize: 28, fontWeight: 700, letterSpacing: -0.5 },
  petMeta: { fontSize: 11, color: "#57534e", marginTop: 4 },
  petMicrochip: { fontSize: 9, color: "#78716c", marginTop: 2, fontFamily: "Courier" },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 18 },
  specCell: { width: "33.33%", padding: 4 },
  specBox: {
    backgroundColor: "#fafaf9",
    border: "1px solid #e7e5e4",
    borderRadius: 6,
    padding: 8,
  },
  specLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: "#78716c",
    textTransform: "uppercase",
  },
  specValue: { fontSize: 11, color: "#0c0a09", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0c0a09",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e7e5e4",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1px solid #f5f5f4",
  },
  itemMain: { flex: 1 },
  itemTitle: { fontSize: 11, fontWeight: 600, color: "#0c0a09" },
  itemSub: { fontSize: 9, color: "#78716c", marginTop: 2 },
  itemMeta: { fontSize: 9, color: "#0c0a09", textAlign: "right" },
  alertRow: {
    backgroundColor: "#ffe4e6",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  alertText: { fontSize: 11, fontWeight: 600, color: "#9f1239" },
  empty: { fontSize: 10, color: "#a8a29e", fontStyle: "italic", paddingVertical: 6 },
  consultBox: {
    backgroundColor: "#fafaf9",
    border: "1px solid #e7e5e4",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  consultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  consultReason: { fontSize: 12, fontWeight: 600 },
  consultDate: { fontSize: 9, color: "#78716c" },
  consultLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#78716c",
    textTransform: "uppercase",
    marginTop: 6,
    letterSpacing: 0.6,
  },
  consultText: { fontSize: 10, color: "#0c0a09", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#a8a29e",
    textAlign: "center",
    borderTop: "1px solid #e7e5e4",
    paddingTop: 8,
  },
});

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function age(birth: Date | null): string {
  if (!birth) return "—";
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} mes${months !== 1 ? "es" : ""}`;
  return `${Math.floor(months / 12)} año${Math.floor(months / 12) !== 1 ? "s" : ""}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Sin perfil" }, { status: 403 });
  }

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      co_owners: {
        where: { status: "active", owner_id: profile.id },
        select: { id: true },
      },
      allergies: { orderBy: { severity: "desc" } },
      vaccines: { orderBy: { applied_date: "desc" } },
      dewormings: { orderBy: { applied_date: "desc" } },
      medications: { orderBy: [{ active: "desc" }, { start_date: "desc" }] },
      studies: { orderBy: { study_date: "desc" } },
      weight_entries: { orderBy: { recorded_at: "desc" }, take: 20 },
      medical_records: {
        select: {
          id: true,
          visit_date: true,
          reason: true,
          examination: true,
          diagnosis: true,
          treatment: true,
          next_steps: true,
          public_notes: true,
          vet: { select: { full_name: true, clinic_name: true } },
        },
        orderBy: { visit_date: "desc" },
      },
    },
  });

  if (!animal) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const isOwner = animal.owner_id === profile.id;
  const isCoOwner = animal.co_owners.length > 0;
  if (!isOwner && !isCoOwner) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  let photoBuffer: Buffer | null = null;
  if (animal.photo_url) {
    try {
      const res = await fetch(animal.photo_url);
      if (res.ok) photoBuffer = Buffer.from(await res.arrayBuffer());
    } catch {
      photoBuffer = null;
    }
  }

  const severe = animal.allergies.filter((a) => a.severity === "severe");
  const others = animal.allergies.filter((a) => a.severity !== "severe");

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            <Text style={styles.brandPet}>Pet</Text>
            <Text style={styles.brandApp}>App</Text>
          </Text>
          <Text style={styles.generatedAt}>
            Historial · Generado {fmt(new Date())}
          </Text>
        </View>

        <View style={styles.petHeader}>
          {photoBuffer ? (
            <Image src={photoBuffer} style={styles.petPhoto} />
          ) : (
            <View style={styles.petPhotoFallback}>
              <Text style={{ fontSize: 30, color: "#7c3aed" }}>🐾</Text>
            </View>
          )}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={styles.petName}>{animal.name}</Text>
            <Text style={styles.petMeta}>
              {SPECIES_LABELS[animal.species] ?? animal.species}
              {animal.breed ? ` · ${animal.breed}` : ""}
              {animal.sex !== "unknown" ? ` · ${SEX_LABELS[animal.sex]}` : ""}
              {animal.birth_date ? ` · ${age(animal.birth_date)}` : ""}
            </Text>
            {animal.microchip ? (
              <Text style={styles.petMicrochip}>Chip: {animal.microchip}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.specsGrid}>
          {animal.birth_date ? (
            <SpecCell label="Fecha nac." value={fmt(animal.birth_date)} />
          ) : null}
          {animal.weight_kg ? (
            <SpecCell
              label="Peso actual"
              value={`${Number(animal.weight_kg).toFixed(1)} kg`}
            />
          ) : null}
          {animal.color ? <SpecCell label="Color" value={animal.color} /> : null}
          {animal.neutered ? (
            <SpecCell label="Castrado" value="Sí" />
          ) : null}
        </View>

        {severe.length > 0 ? (
          <View style={styles.alertRow}>
            <Text style={styles.alertText}>
              ⚠️ ALERGIAS SEVERAS: {severe.map((a) => a.allergen).join(", ")}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Vacunas</Text>
        {animal.vaccines.length === 0 ? (
          <Text style={styles.empty}>Sin vacunas registradas.</Text>
        ) : (
          animal.vaccines.map((v) => (
            <View key={v.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>{v.name}</Text>
                <Text style={styles.itemSub}>
                  Aplicada {fmt(v.applied_date)}
                  {v.lot_number ? ` · Lote ${v.lot_number}` : ""}
                </Text>
              </View>
              {v.next_dose_date ? (
                <Text style={styles.itemMeta}>
                  Próxima{"\n"}
                  {fmt(v.next_dose_date)}
                </Text>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Desparasitación</Text>
        {animal.dewormings.length === 0 ? (
          <Text style={styles.empty}>Sin registros.</Text>
        ) : (
          animal.dewormings.map((d) => (
            <View key={d.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>{d.product}</Text>
                <Text style={styles.itemSub}>
                  {d.type === "internal" ? "Interna" : "Externa"} · {fmt(d.applied_date)}
                </Text>
              </View>
              {d.next_date ? (
                <Text style={styles.itemMeta}>Próxima{"\n"}{fmt(d.next_date)}</Text>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Medicaciones</Text>
        {animal.medications.length === 0 ? (
          <Text style={styles.empty}>Sin medicaciones registradas.</Text>
        ) : (
          animal.medications.map((m) => (
            <View key={m.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>
                  {m.name} {!m.active ? "(finalizada)" : ""}
                </Text>
                <Text style={styles.itemSub}>
                  {m.dosage} · {m.frequency}
                </Text>
              </View>
              <Text style={styles.itemMeta}>
                Desde{"\n"}
                {fmt(m.start_date)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Alergias</Text>
        {animal.allergies.length === 0 ? (
          <Text style={styles.empty}>Sin alergias registradas.</Text>
        ) : (
          animal.allergies.map((a) => (
            <View key={a.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>{a.allergen}</Text>
                <Text style={styles.itemSub}>
                  {a.type} · {a.severity.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Historial de consultas</Text>
        {animal.medical_records.length === 0 ? (
          <Text style={styles.empty}>Sin consultas registradas.</Text>
        ) : (
          animal.medical_records.map((r) => (
            <View key={r.id} style={styles.consultBox} wrap={false}>
              <View style={styles.consultHeader}>
                <Text style={styles.consultReason}>{r.reason}</Text>
                <Text style={styles.consultDate}>{fmt(r.visit_date)}</Text>
              </View>
              <Text style={{ fontSize: 9, color: "#57534e" }}>
                Dr/a. {r.vet.full_name}
                {r.vet.clinic_name ? ` · ${r.vet.clinic_name}` : ""}
              </Text>
              {r.diagnosis ? (
                <View>
                  <Text style={styles.consultLabel}>Diagnóstico</Text>
                  <Text style={styles.consultText}>{r.diagnosis}</Text>
                </View>
              ) : null}
              {r.treatment ? (
                <View>
                  <Text style={styles.consultLabel}>Tratamiento</Text>
                  <Text style={styles.consultText}>{r.treatment}</Text>
                </View>
              ) : null}
              {r.next_steps ? (
                <View>
                  <Text style={styles.consultLabel}>Próximos pasos</Text>
                  <Text style={styles.consultText}>{r.next_steps}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${animal.name} · PetApp · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );

  const pdfBuffer = await renderToBuffer(doc);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="historial-${animal.name.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
      "Cache-Control": "private, no-cache",
    },
  });
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specCell}>
      <View style={styles.specBox}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value}</Text>
      </View>
    </View>
  );
}
