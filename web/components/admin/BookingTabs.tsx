"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { BookingFilter } from "@/lib/bookings";

const TABS: { value: BookingFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "canceled", label: "Canceled" },
  { value: "all", label: "All" },
];

export function BookingTabs({ active }: { active: BookingFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(value: BookingFilter) {
    const next = new URLSearchParams(params?.toString() || "");
    if (value === "upcoming") next.delete("filter");
    else next.set("filter", value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="range">
      {TABS.map((t) => (
        <button key={t.value} className={t.value === active ? "active" : ""} onClick={() => set(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
