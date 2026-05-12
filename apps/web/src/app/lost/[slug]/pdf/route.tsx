import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { prisma } from "@pet-app/db";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://petapp-one.vercel.app";

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

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  banner: {
    backgroundColor: "#e11d48",
    color: "#ffffff",
    padding: 16,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
  },
  bannerSubtitle: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.95,
  },
  petName: {
    fontSize: 56,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
    color: "#0c0a09",
    letterSpacing: -1,
  },
  petMeta: {
    fontSize: 14,
    textAlign: "center",
    color: "#57534e",
    marginBottom: 18,
  },
  photoBox: {
    width: 220,
    height: 220,
    marginHorizontal: "auto",
    marginBottom: 18,
    borderRadius: 12,
    overflow: "hidden",
    border: "2px solid #fda4af",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f4",
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackText: {
    fontSize: 72,
    color: "#a8a29e",
  },
  contactCard: {
    backgroundColor: "#fafaf9",
    border: "2px solid #e11d48",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#e11d48",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0c0a09",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0c0a09",
    marginTop: 4,
  },
  rewardBox: {
    backgroundColor: "#fef9c3",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#854d0e",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 13,
    color: "#0c0a09",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 12,
  },
  detailCell: {
    width: "50%",
    padding: 4,
  },
  detailBox: {
    backgroundColor: "#fafaf9",
    border: "1px solid #e7e5e4",
    borderRadius: 8,
    padding: 10,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#78716c",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: "#0c0a09",
  },
  alertBox: {
    backgroundColor: "#ffe4e6",
    border: "1px solid #fda4af",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 11,
    color: "#9f1239",
    fontWeight: 700,
  },
  footer: {
    fontSize: 9,
    textAlign: "center",
    color: "#a8a29e",
    marginTop: 18,
  },
  urlBox: {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    padding: 8,
    borderRadius: 6,
    textAlign: "center",
    marginTop: 12,
  },
  urlText: {
    fontSize: 11,
    color: "#ffffff",
  },
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const alert = await prisma.lostPetAlert.findUnique({
    where: { public_slug: slug },
    include: {
      animal: {
        select: {
          name: true,
          species: true,
          breed: true,
          sex: true,
          birth_date: true,
          color: true,
          distinctive_marks: true,
          microchip: true,
          photo_url: true,
          allergies: {
            where: { severity: "severe" },
            select: { allergen: true },
          },
        },
      },
    },
  });

  if (!alert || alert.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const a = alert.animal;
  let photoBuffer: Buffer | null = null;
  if (a.photo_url) {
    try {
      const res = await fetch(a.photo_url);
      if (res.ok) {
        photoBuffer = Buffer.from(await res.arrayBuffer());
      }
    } catch {
      photoBuffer = null;
    }
  }

  const sexLabel =
    a.sex === "male" ? "Macho" : a.sex === "female" ? "Hembra" : "—";
  const speciesLabel = SPECIES_LABELS[a.species] ?? a.species;
  const publicUrl = `${APP_URL}/lost/${slug}`;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>SE PERDIÓ {a.name.toUpperCase()}</Text>
          <Text style={styles.bannerSubtitle}>
            Si la viste, llamanos. Compartí este aviso.
          </Text>
        </View>

        <View style={styles.photoBox}>
          {photoBuffer ? (
            <Image src={photoBuffer} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.photoFallbackText}>🐾</Text>
            </View>
          )}
        </View>

        <Text style={styles.petName}>{a.name}</Text>
        <Text style={styles.petMeta}>
          {speciesLabel}
          {a.breed ? ` · ${a.breed}` : ""}
          {a.sex !== "unknown" ? ` · ${sexLabel}` : ""}
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactLabel}>Si la viste, contactanos</Text>
          <Text style={styles.contactName}>{alert.contact_name}</Text>
          <Text style={styles.contactPhone}>{alert.contact_phone}</Text>
          {alert.contact_email ? (
            <Text style={{ fontSize: 11, color: "#57534e", marginTop: 6 }}>
              {alert.contact_email}
            </Text>
          ) : null}
        </View>

        {alert.reward_description ? (
          <View style={styles.rewardBox}>
            <Text style={styles.rewardLabel}>💰 Recompensa</Text>
            <Text style={styles.rewardText}>{alert.reward_description}</Text>
          </View>
        ) : null}

        {a.allergies.length > 0 ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⚠️ ALERGIAS GRAVES — NO DARLE:{" "}
              {a.allergies.map((al) => al.allergen).join(", ")}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailsGrid}>
          {alert.last_seen_location ? (
            <View style={styles.detailCell}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Última ubicación</Text>
                <Text style={styles.detailValue}>{alert.last_seen_location}</Text>
              </View>
            </View>
          ) : null}
          {alert.last_seen_at ? (
            <View style={styles.detailCell}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Cuándo</Text>
                <Text style={styles.detailValue}>
                  {new Date(alert.last_seen_at).toLocaleDateString("es-AR")}
                </Text>
              </View>
            </View>
          ) : null}
          {a.color ? (
            <View style={styles.detailCell}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{a.color}</Text>
              </View>
            </View>
          ) : null}
          {a.distinctive_marks ? (
            <View style={styles.detailCell}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Marcas distintivas</Text>
                <Text style={styles.detailValue}>{a.distinctive_marks}</Text>
              </View>
            </View>
          ) : null}
          {a.microchip ? (
            <View style={styles.detailCell}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Microchip</Text>
                <Text
                  style={{
                    ...styles.detailValue,
                    fontFamily: "Courier",
                  }}
                >
                  {a.microchip}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {alert.additional_info ? (
          <View
            style={{
              backgroundColor: "#fafaf9",
              border: "1px solid #e7e5e4",
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          >
            <Text style={styles.detailLabel}>Más información</Text>
            <Text style={{ ...styles.detailValue, marginTop: 4 }}>
              {alert.additional_info}
            </Text>
          </View>
        ) : null}

        <View style={styles.urlBox}>
          <Text style={styles.urlText}>Más info: {publicUrl}</Text>
        </View>

        <Text style={styles.footer}>
          Generado con PetApp — petapp-one.vercel.app
        </Text>
      </Page>
    </Document>
  );

  const pdfBuffer = await renderToBuffer(doc);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="se-perdio-${a.name.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
