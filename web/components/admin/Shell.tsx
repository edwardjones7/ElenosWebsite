"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { label: "Overview", href: "/admin" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Inbox", href: "/admin/inbox" },
  { label: "Subscribers", href: "/admin/subscribers" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Customers", href: "/admin/customers" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/logout/", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          <span className="wordmark">ELENOS</span>
          <span className="sub">/ admin</span>
        </div>

        <nav className="admin-nav">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin" || pathname === "/admin/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-side-foot">
          <ThemeToggle />
          <button className="admin-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
