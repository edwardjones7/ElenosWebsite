import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken, adminCookie } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`) {
    return NextResponse.next();
  }

  const token = req.cookies.get(adminCookie.name)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  const ok = await verifyAdminToken(token);
  if (!ok) {
    const res = NextResponse.redirect(new URL(LOGIN_PATH, req.url));
    res.cookies.delete(adminCookie.name);
    return res;
  }

  return NextResponse.next();
}
