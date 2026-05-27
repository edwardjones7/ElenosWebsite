import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { verifyAdminToken, adminCookie } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/|favicon|images/|.*\\..*).*)"],
};

const LOGIN_PATH = "/admin/login";

function isPortalHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return h.startsWith("app.") || h.startsWith("portal.");
}

// Refresh the Supabase auth cookies on every portal-host request.
// @supabase/ssr requires this to keep server-rendered pages in sync.
async function refreshPortalSession(
  req: NextRequest,
  res: NextResponse,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return;

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  await supabase.auth.getUser();
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host");
  const { pathname } = req.nextUrl;

  // Portal subdomain: rewrite everything under /portal/* and keep the
  // Supabase session fresh.
  if (isPortalHost(host)) {
    let res: NextResponse;
    if (!pathname.startsWith("/portal")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? "/portal" : `/portal${pathname}`;
      res = NextResponse.rewrite(url);
    } else {
      res = NextResponse.next();
    }
    await refreshPortalSession(req, res);
    return res;
  }

  // Apex domain: portal routes must come in via the subdomain only.
  if (pathname.startsWith("/portal")) {
    return new NextResponse(null, { status: 404 });
  }

  // Admin auth (unchanged behaviour).
  if (pathname.startsWith("/admin")) {
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
  }

  return NextResponse.next();
}
