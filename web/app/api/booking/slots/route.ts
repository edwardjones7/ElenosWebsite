import { NextResponse, type NextRequest } from "next/server";
import { DateTime } from "luxon";
import { preflight, withCors } from "@/lib/cors";
import { getAvailableSlots } from "@/lib/booking-slots";
import { BOOKING_CONFIG } from "@/lib/booking-config";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const now = DateTime.utc();
  const fromParam = params.get("from");
  const toParam = params.get("to");

  const from =
    fromParam && DateTime.fromISO(fromParam).isValid ? fromParam : now.toISO()!;
  const to =
    toParam && DateTime.fromISO(toParam).isValid
      ? toParam
      : now.plus({ days: BOOKING_CONFIG.horizonDays }).toISO()!;

  try {
    const result = await getAvailableSlots(from, to);
    return withCors(req, NextResponse.json(result));
  } catch (e) {
    // Google/DB unavailable — surface an error rather than show wrong availability.
    return withCors(
      req,
      NextResponse.json({ error: "unavailable", message: (e as Error).message }, { status: 503 }),
    );
  }
}
