import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getTicket, postAdminMessage } from "@/lib/tickets";

export const runtime = "nodejs";

export async function POST(
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

  const text = String(body.body || "").trim();
  if (!text) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  try {
    const ticket = await getTicket(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const message = await postAdminMessage(params.id, text.slice(0, 5000));
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    return NextResponse.json(
      { error: "db", message: (e as Error).message },
      { status: 500 },
    );
  }
}
