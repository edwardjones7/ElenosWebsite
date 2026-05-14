import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAnalytics, type Range } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const raw = req.nextUrl.searchParams.get("range");
  const range: Range = raw === "30d" || raw === "all" ? raw : "7d";

  try {
    const data = await getAnalytics(range);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "analytics_failed", message: (e as Error).message },
      { status: 500 },
    );
  }
}
