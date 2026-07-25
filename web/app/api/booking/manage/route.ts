import { NextResponse, type NextRequest } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { getByToken } from "@/lib/bookings";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

/** Returns the booking behind a manage token, for the /book/manage page. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) {
    return withCors(req, NextResponse.json({ ok: false, error: "no_token" }, { status: 400 }));
  }

  let booking;
  try {
    booking = await getByToken(token);
  } catch (e) {
    return withCors(req, NextResponse.json({ ok: false, error: "db" }, { status: 500 }));
  }
  if (!booking) {
    return withCors(req, NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }));
  }

  return withCors(
    req,
    NextResponse.json({
      ok: true,
      booking: {
        name: booking.name,
        starts_at: booking.starts_at,
        ends_at: booking.ends_at,
        timezone: booking.timezone,
        status: booking.status,
        meet_url: booking.meet_url,
      },
    }),
  );
}
