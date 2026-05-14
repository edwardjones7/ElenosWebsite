import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken, adminCookie } from "@/lib/auth";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(adminCookie.name)?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}
