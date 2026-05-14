import { NextResponse } from "next/server";
import { adminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(adminCookie.name);
  return res;
}
