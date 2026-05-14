import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateContactStatus, type ContactStatus } from "@/lib/contacts";

export const runtime = "nodejs";

const STATUSES: ContactStatus[] = ["new", "replied", "archived"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const status = String(body.status || "") as ContactStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "bad_status" }, { status: 400 });
  }

  try {
    await updateContactStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
