"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const RANGES: { value: "7d" | "30d" | "all"; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
];

export function RangeTabs({ active }: { active: "7d" | "30d" | "all" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(range: "7d" | "30d" | "all") {
    const next = new URLSearchParams(params?.toString() || "");
    next.set("range", range);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="range">
      {RANGES.map((r) => (
        <button
          key={r.value}
          className={r.value === active ? "active" : ""}
          onClick={() => set(r.value)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
