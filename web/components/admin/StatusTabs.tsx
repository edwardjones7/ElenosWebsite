"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const TABS: { value: "all" | "new" | "replied" | "archived"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

export function StatusTabs({ active }: { active: "all" | "new" | "replied" | "archived" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(value: typeof TABS[number]["value"]) {
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
