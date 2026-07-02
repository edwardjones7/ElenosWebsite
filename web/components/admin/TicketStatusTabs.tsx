"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  TICKET_STATUSES,
  STATUS_LABELS,
  type TicketStatus,
} from "@/lib/ticket-format";

const TABS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...TICKET_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function TicketStatusTabs({ active }: { active: TicketStatus | "all" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(value: TicketStatus | "all") {
    const next = new URLSearchParams(params?.toString() || "");
    if (value === "all") next.delete("status");
    else next.set("status", value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="range">
      {TABS.map((t) => (
        <button
          key={t.value}
          className={t.value === active ? "active" : ""}
          onClick={() => set(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
