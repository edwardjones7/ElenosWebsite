import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-guard";
import { getPortalServerClient } from "@/lib/supabase-server";
import { postReply } from "@/app/portal/actions";
import { StatusBadge } from "@/app/portal/StatusBadge";
import type { TicketStatus, TicketPriority } from "@/lib/ticket-format";
import { PRIORITY_LABELS, formatDateTime } from "@/lib/ticket-format";

export const dynamic = "force-dynamic";

type TicketRow = {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
};

type MessageRow = {
  id: string;
  author_type: "client" | "admin";
  body: string;
  created_at: string;
};

export default async function PortalTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const supabase = getPortalServerClient();

  // RLS restricts both queries to tickets owned by this client. A ticket id
  // that isn't theirs simply returns nothing → 404.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, title, status, priority, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!ticket) notFound();
  const t = ticket as TicketRow;

  const { data: messageData } = await supabase
    .from("ticket_messages")
    .select("id, author_type, body, created_at")
    .eq("ticket_id", t.id)
    .order("created_at", { ascending: true });
  const messages = (messageData || []) as MessageRow[];

  const isClosed = t.status === "closed";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#f5f5f5",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "3rem 2rem",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/portal"
          style={{ color: "#a3a3a3", fontSize: 13, textDecoration: "none" }}
        >
          ← Back to tickets
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            margin: "16px 0 4px",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>{t.title}</h1>
          <StatusBadge status={t.status} />
        </div>
        <p style={{ color: "#737373", fontSize: 12, marginBottom: 28 }}>
          {PRIORITY_LABELS[t.priority]} priority · opened{" "}
          {formatDateTime(t.created_at)}
        </p>

        <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
          {messages.map((m) => {
            const mine = m.author_type === "client";
            return (
              <div
                key={m.id}
                style={{
                  background: mine ? "#16121c" : "#141414",
                  border: `1px solid ${mine ? "#3a2350" : "#262626"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#737373",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: mine ? "#c084fc" : "#a3a3a3",
                    }}
                  >
                    {mine ? "You" : "Elenos"}
                  </span>
                  <span>{formatDateTime(m.created_at)}</span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.body}
                </p>
              </div>
            );
          })}
        </div>

        {isClosed ? (
          <p style={{ color: "#737373", fontSize: 13 }}>
            This ticket is closed. Open a new ticket if you need anything else.
          </p>
        ) : (
          <form action={postReply} style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="ticketId" value={t.id} />
            <textarea
              name="body"
              required
              maxLength={5000}
              rows={4}
              placeholder="Write a reply…"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#f5f5f5",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <button
              type="submit"
              style={{
                justifySelf: "start",
                padding: "10px 18px",
                background: "#a200ff",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send reply
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
