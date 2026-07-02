import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { TicketThread } from "@/components/admin/TicketThread";
import { getTicket, listMessages } from "@/lib/tickets";
import { PRIORITY_LABELS, formatDateTime } from "@/lib/ticket-format";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetail({
  params,
}: {
  params: { id: string };
}) {
  const ticket = await getTicket(params.id);
  if (!ticket) notFound();

  const messages = await listMessages(ticket.id);

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">
            <Link href="/admin/tickets">← Tickets</Link>
          </span>
          <h1>{ticket.title}</h1>
        </div>
      </header>

      <p className="mute" style={{ marginBottom: 16 }}>
        {ticket.client?.name || "Unknown client"}
        {ticket.client?.company ? ` · ${ticket.client.company}` : ""}
        {ticket.client?.email ? ` · ${ticket.client.email}` : ""} ·{" "}
        {PRIORITY_LABELS[ticket.priority]} priority · opened{" "}
        {formatDateTime(ticket.created_at)}
      </p>

      <TicketThread ticket={ticket} messages={messages} />
    </Shell>
  );
}
