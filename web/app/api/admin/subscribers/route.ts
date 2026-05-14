import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listSubscribers, type SubscriberStatus } from "@/lib/subscribers";

export const runtime = "nodejs";

const STATUSES: (SubscriberStatus | "all")[] = ["all", "active", "unsubscribed"];

function toCsv(rows: Awaited<ReturnType<typeof listSubscribers>>): string {
  const header = "email,created_at,source_path,status\n";
  const escape = (v: string | null) => {
    if (v == null) return "";
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const body = rows
    .map((r) => [escape(r.email), escape(r.created_at), escape(r.source_path), escape(r.status)].join(","))
    .join("\n");
  return header + body + (body ? "\n" : "");
}

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const params = req.nextUrl.searchParams;
  const raw = (params.get("status") || "all") as SubscriberStatus | "all";
  const status = STATUSES.includes(raw) ? raw : "all";
  const format = params.get("format");

  try {
    const items = await listSubscribers(status);
    if (format === "csv") {
      return new NextResponse(toCsv(items), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="elenos-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
