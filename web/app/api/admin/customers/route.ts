import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listPurchases, type PurchaseStatus } from "@/lib/purchases";

export const runtime = "nodejs";

const STATUSES: (PurchaseStatus | "all")[] = ["all", "paid", "delivered", "delivery_failed", "refunded"];

function toCsv(rows: Awaited<ReturnType<typeof listPurchases>>): string {
  const header = "name,email,product,amount,currency,status,created_at\n";
  const escape = (v: string | null) => {
    if (v == null) return "";
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const body = rows
    .map((r) =>
      [
        escape(r.name),
        escape(r.email),
        escape(r.product),
        r.amount_cents == null ? "" : (r.amount_cents / 100).toFixed(2),
        escape(r.currency),
        escape(r.status),
        escape(r.created_at),
      ].join(","),
    )
    .join("\n");
  return header + body + (body ? "\n" : "");
}

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const params = req.nextUrl.searchParams;
  const raw = (params.get("status") || "all") as PurchaseStatus | "all";
  const status = STATUSES.includes(raw) ? raw : "all";
  const format = params.get("format");

  try {
    const items = await listPurchases(status);
    if (format === "csv") {
      return new NextResponse(toCsv(items), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="elenos-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
