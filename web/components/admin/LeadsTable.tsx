"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/leads";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LeadsTable({ items }: { items: Lead[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function remove(id: number, email: string) {
    if (!confirm(`Delete lead ${email}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/leads/${id}/`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <table className="data-table">
        <tbody>
          <tr>
            <td className="empty-cell" colSpan={6}>
              No leads yet.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Source</th>
          <th>Status</th>
          <th>Unlocked</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {items.map((l) => (
          <tr key={l.id}>
            <td>{l.name}</td>
            <td>{l.email}</td>
            <td>{l.utm_source || "direct"}</td>
            <td>
              <span className={`pill pill-${l.status}`}>{l.status.replace("_", " ")}</span>
            </td>
            <td>{fmtDate(l.created_at)}</td>
            <td style={{ textAlign: "right" }}>
              <button
                className="btn btn-sm btn-danger"
                disabled={busyId === l.id}
                onClick={() => remove(l.id, l.email)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
