import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listBookings, type BookingFilter } from "@/lib/bookings";

export const runtime = "nodejs";

const FILTERS: BookingFilter[] = ["upcoming", "past", "canceled", "all"];

export async function GET(req: NextRequest) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const raw = (req.nextUrl.searchParams.get("filter") || "upcoming") as BookingFilter;
  const filter = FILTERS.includes(raw) ? raw : "upcoming";

  try {
    const items = await listBookings(filter);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
}
