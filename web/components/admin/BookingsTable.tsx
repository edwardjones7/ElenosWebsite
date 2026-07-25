"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@/lib/bookings";

function fmtWhen(iso: string, tz: string | null): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function BookingsTable({ items }: { items: Booking[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const router = useRouter();

  const visible = items.filter((b) => !hiddenIds.has(b.id));

  if (visible.length === 0) {
    return (
      <table className="data-table">
        <tbody>
          <tr>
            <td className="empty-cell" colSpan={6}>
              No bookings here.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  async function cancel(id: string, name: string) {
    if (!confirm(`Cancel the call with ${name}? This frees the slot, removes the calendar event, and emails them.`))
      return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        alert(`Cancel failed (${res.status}): ${body.error || "unknown"}`);
        return;
      }
      setHiddenIds((prev) => new Set(prev).add(id));
      setOpenId((v) => (v === id ? null : v));
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Cancel failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>When</th>
          <th>Name</th>
          <th>Email</th>
          <th>Meet</th>
          <th>Status</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {visible.map((b) => {
          const open = b.id === openId;
          return (
            <Fragment key={b.id}>
              <tr onClick={() => setOpenId(open ? null : b.id)}>
                <td>{fmtWhen(b.starts_at, b.timezone)}</td>
                <td>{b.name}</td>
                <td className="truncate">{b.email}</td>
                <td>
                  {b.meet_url ? (
                    <a href={b.meet_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                      Meet ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className={`pill pill-${b.status === "confirmed" ? "new" : "archived"}`}>{b.status}</span>
                </td>
                <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  {b.status === "confirmed" && (
                    <button className="btn btn-sm btn-danger" disabled={busyId === b.id} onClick={() => cancel(b.id, b.name)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
              {open && (
                <tr className="row-detail">
                  <td colSpan={6}>
                    <div className="meta">
                      <span>From: {b.name} &lt;{b.email}&gt;</span>
                      {b.company && <span>Company: {b.company}</span>}
                      {b.timezone && <span>Their tz: {b.timezone}</span>}
                      {b.source_path && <span>Source: {b.source_path}</span>}
                    </div>
                    {b.message && <div className="message">{b.message}</div>}
                    <div className="actions">
                      <a className="btn btn-sm btn-primary" href={`mailto:${b.email}`}>
                        Email {b.name.split(/\s+/)[0]}
                      </a>
                      {b.meet_url && (
                        <a className="btn btn-sm" href={b.meet_url} target="_blank" rel="noopener">
                          Open Meet
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
