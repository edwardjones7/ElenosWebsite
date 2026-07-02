import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  try {
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
