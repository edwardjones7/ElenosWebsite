import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getTicket,
  listMessages,
  updateTicketStatus,
  TICKET_STATUSES,
  type TicketStatus,
} from "@/lib/tickets";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  try {
    const ticket = await getTicket(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const messages = await listMessages(params.id);
    return NextResponse.json({ ticket, messages });
  } catch (e) {
    return NextResponse.json(
      { error: "db", message: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const status = String(body.status || "") as TicketStatus;
  if (!TICKET_STATUSES.includes(status)) {
    return NextResponse.json({ error: "bad_status" }, { status: 400 });
  }

  try {
    await updateTicketStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "db", message: (e as Error).message },
      { status: 500 },
    );
  }
}
