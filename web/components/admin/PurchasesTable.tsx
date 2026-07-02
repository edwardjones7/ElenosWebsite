"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Purchase } from "@/lib/purchases";

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

function fmtAmount(cents: number | null, currency: string | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)} ${(currency || "usd").toUpperCase()}`;
}

export function PurchasesTable({ items }: { items: Purchase[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function remove(id: number, email: string) {
    if (!confirm(`Delete purchase record for ${email}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/customers/${id}/`, { method: "DELETE" });
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
            <td className="empty-cell" colSpan={7}>
              No customers yet.
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
          <th>Product</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Purchased</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.id}>
            <td>{p.name || "—"}</td>
            <td>{p.email}</td>
            <td>{p.product}</td>
            <td>{fmtAmount(p.amount_cents, p.currency)}</td>
            <td>
              <span className={`pill pill-${p.status}`}>{p.status.replace("_", " ")}</span>
            </td>
            <td>{fmtDate(p.created_at)}</td>
            <td style={{ textAlign: "right" }}>
              <button
                className="btn btn-sm btn-danger"
                disabled={busyId === p.id}
                onClick={() => remove(p.id, p.email)}
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
