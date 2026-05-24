"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Contact, ContactStatus } from "@/lib/contacts";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(s: string, n = 80): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export function ContactsTable({ items }: { items: Contact[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <table className="data-table">
        <tbody>
          <tr>
            <td className="empty-cell" colSpan={6}>
              No contacts yet.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  async function setStatus(id: number, status: ContactStatus) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/contacts/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Delete contact from ${name}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/contacts/${id}/`, { method: "DELETE" });
      setOpenId((v) => (v === id ? null : v));
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Email</th>
          <th>Project</th>
          <th>Message</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => {
          const open = c.id === openId;
          return (
            <Fragment key={c.id}>
              <tr onClick={() => setOpenId(open ? null : c.id)}>
                <td>{fmtDate(c.created_at)}</td>
                <td>{c.name}</td>
                <td className="truncate">{c.email}</td>
                <td>{c.project_type || "—"}</td>
                <td className="truncate">{truncate(c.message)}</td>
                <td>
                  <span className={`pill pill-${c.status}`}>{c.status}</span>
                </td>
              </tr>
              {open && (
                <tr className="row-detail">
                  <td colSpan={6}>
                    <div className="meta">
                      <span>From: {c.name} &lt;{c.email}&gt;</span>
                      {c.company && <span>Company: {c.company}</span>}
                      {c.source_path && <span>Source: {c.source_path}</span>}
                    </div>
                    <div className="message">{c.message}</div>
                    <div className="actions">
                      <a className="btn btn-sm btn-primary" href={`mailto:${c.email}`}>
                        Reply by email
                      </a>
                      <button
                        className="btn btn-sm"
                        disabled={busyId === c.id || c.status === "replied"}
                        onClick={() => setStatus(c.id, "replied")}
                      >
                        Mark replied
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={busyId === c.id || c.status === "archived"}
                        onClick={() => setStatus(c.id, "archived")}
                      >
                        Archive
                      </button>
                      {c.status !== "new" && (
                        <button
                          className="btn btn-sm"
                          disabled={busyId === c.id}
                          onClick={() => setStatus(c.id, "new")}
                        >
                          Mark new
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={busyId === c.id}
                        onClick={() => remove(c.id, c.name)}
                      >
                        Delete
                      </button>
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
