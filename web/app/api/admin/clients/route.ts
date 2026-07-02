import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listClients, inviteClient } from "@/lib/clients";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  try {
    const items = await listClients();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: "db", message: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const email = String(body.email || "");
  const name = String(body.name || "");
  const company = body.company == null ? null : String(body.company);

  const result = await inviteClient({ email, name, company });
  if (!result.ok) {
    return NextResponse.json({ error: "invite", message: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, client: result.client });
}
