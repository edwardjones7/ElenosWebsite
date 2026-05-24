"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Subscriber } from "@/lib/subscribers";

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

export function SubscribersTable({ items }: { items: Subscriber[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function remove(id: number, email: string) {
    if (!confirm(`Delete subscriber ${email}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/subscribers/${id}/`, { method: "DELETE" });
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
            <td className="empty-cell" colSpan={4}>
              No subscribers yet.
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
          <th>Email</th>
          <th>Source</th>
          <th>Signed up</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>{s.email}</td>
            <td>{s.source_path || "—"}</td>
            <td>{fmtDate(s.created_at)}</td>
            <td style={{ textAlign: "right" }}>
              <button
                className="btn btn-sm btn-danger"
                disabled={busyId === s.id}
                onClick={() => remove(s.id, s.email)}
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
