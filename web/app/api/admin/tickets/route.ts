import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listTickets, TICKET_STATUSES, type TicketStatus } from "@/lib/tickets";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const raw = (req.nextUrl.searchParams.get("status") || "all") as
    | TicketStatus
    | "all";
  const status = raw === "all" || TICKET_STATUSES.includes(raw) ? raw : "all";

  try {
    const items = await listTickets(status);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: "db", message: (e as Error).message },
      { status: 500 },
    );
  }
}
