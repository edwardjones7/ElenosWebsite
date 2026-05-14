import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listContacts, type ContactStatus } from "@/lib/contacts";

export const runtime = "nodejs";

const STATUSES: (ContactStatus | "all")[] = ["all", "new", "replied", "archived"];

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const raw = (req.nextUrl.searchParams.get("status") || "all") as ContactStatus | "all";
  const status = STATUSES.includes(raw) ? raw : "all";

  try {
    const items = await listContacts(status);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
