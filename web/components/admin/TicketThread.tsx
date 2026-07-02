"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TICKET_STATUSES,
  STATUS_LABELS,
  formatDateTime,
  type AdminTicket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/ticket-format";

export function TicketThread({
  ticket,
  messages,
}: {
  ticket: AdminTicket;
  messages: TicketMessage[];
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [status, setStatusValue] = useState<TicketStatus>(ticket.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function changeStatus(next: TicketStatus) {
    const prev = status;
    setStatusValue(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatusValue(prev);
        setError(body.message || body.error || "Could not update status.");
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setStatusValue(prev);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.message || b.error || "Could not send reply.");
        return;
      }
      setReply("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className={`pill pill-${status}`}>{STATUS_LABELS[status]}</span>
        <label className="mute" htmlFor="status-select">
          Set status:
        </label>
        <select
          id="status-select"
          value={status}
          disabled={busy}
          onChange={(e) => changeStatus(e.target.value as TicketStatus)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="thread">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg ${m.author_type === "admin" ? "msg-admin" : ""}`}
          >
            <div className="msg-head">
              <span className="who">
                {m.author_type === "admin" ? "You (Elenos)" : "Client"}
              </span>
              <span>{formatDateTime(m.created_at)}</span>
            </div>
            <div className="msg-body">{m.body}</div>
          </div>
        ))}
      </div>

      <form className="form" onSubmit={sendReply}>
        <div className="field">
          <label htmlFor="reply">Reply</label>
          <textarea
            id="reply"
            rows={4}
            maxLength={5000}
            value={reply}
            disabled={busy}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply to the client…"
          />
        </div>
        {error && <span className="form-error">{error}</span>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || reply.trim().length === 0}
        >
          Send reply
        </button>
      </form>
    </>
  );
}
