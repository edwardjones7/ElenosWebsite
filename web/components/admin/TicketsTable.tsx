"use client";

import { useRouter } from "next/navigation";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  formatDateTime,
  type AdminTicket,
} from "@/lib/ticket-format";

export function TicketsTable({ items }: { items: AdminTicket[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <table className="data-table">
        <tbody>
          <tr>
            <td className="empty-cell" colSpan={5}>
              No tickets yet.
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
          <th>Updated</th>
          <th>Client</th>
          <th>Title</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t) => (
          <tr
            key={t.id}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/admin/tickets/${t.id}`)}
          >
            <td>{formatDateTime(t.updated_at)}</td>
            <td>
              {t.client?.name || "—"}
              {t.client?.company ? (
                <span className="mute"> · {t.client.company}</span>
              ) : null}
            </td>
            <td className="truncate">{t.title}</td>
            <td>{PRIORITY_LABELS[t.priority]}</td>
            <td>
              <span className={`pill pill-${t.status}`}>
                {STATUS_LABELS[t.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
