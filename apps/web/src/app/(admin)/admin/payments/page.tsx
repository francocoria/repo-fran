import Link from "next/link";
import { Receipt, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { formatDateLong } from "@pet-app/lib/utils/format";

export async function generateMetadata() {
  const t = await getTranslations("adminPayments");
  return { title: t("metaTitle") };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));
  const t = await getTranslations("adminPayments");

  const methodLabels: Record<string, string> = {
    transfer: t("methodTransfer"),
    cash: t("methodCash"),
    mp_external: t("methodMpExternal"),
    stripe_external: t("methodStripeExternal"),
    other: t("methodOther"),
  };

  const [payments, totals, count] = await Promise.all([
    prisma.manualPayment.findMany({
      include: {
        vet: { select: { id: true, full_name: true, clinic_name: true } },
      },
      orderBy: { paid_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.manualPayment.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    prisma.manualPayment.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // Sumar por moneda (simple): asumimos USD predominante
  const usdTotal = totals._sum.amount
    ? Number(totals._sum.amount).toFixed(2)
    : "0.00";

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("summary", { count: totals._count, total: usdTotal })}
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("emptyDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t("thDate")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("thVet")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("thAmount")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("thMethod")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("thMonths")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("thNotes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateLong(p.paid_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/vets/${p.vet.id}`}
                          className="flex items-center gap-1.5 hover:underline underline-offset-2"
                        >
                          <Stethoscope className="h-3.5 w-3.5 text-accent" />
                          <span className="font-medium">
                            {p.vet.full_name}
                          </span>
                        </Link>
                        {p.vet.clinic_name && (
                          <p className="text-xs text-muted-foreground">
                            {p.vet.clinic_name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge variant="secondary">
                          {methodLabels[p.method] ?? p.method.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {p.months_granted}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {p.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {t("pagination", { page, total: totalPages })}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/payments?page=${page - 1}`}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
              >
                {t("prev")}
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/payments?page=${page + 1}`}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
              >
                {t("next")}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
