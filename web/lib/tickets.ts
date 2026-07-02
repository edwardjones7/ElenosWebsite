import "server-only";
import { getSupabase } from "@/lib/supabase";
import { TICKET_STATUSES } from "@/lib/ticket-format";
import type {
  TicketStatus,
  TicketPriority,
  Ticket,
  TicketMessage,
  AdminTicket,
} from "@/lib/ticket-format";

// Re-export so server callers can keep importing these from "@/lib/tickets".
export { TICKET_STATUSES };
export type { TicketStatus, TicketPriority, Ticket, TicketMessage, AdminTicket };

// List every ticket with its client, newest activity first. Admin-only (service role).
export async function listTickets(
  status?: TicketStatus | "all",
): Promise<AdminTicket[]> {
  let q = getSupabase()
    .from("tickets")
    .select(
      "id, client_id, title, priority, status, created_at, updated_at, client:clients(id, name, company, email)",
    )
    .order("updated_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(500);
  if (error) throw error;
  // Supabase returns the joined relation as an array; normalise to a single object.
  return (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    const rel = r.client;
    const client = Array.isArray(rel) ? rel[0] ?? null : rel ?? null;
    return { ...(r as object), client } as AdminTicket;
  });
}

export async function getTicket(id: string): Promise<AdminTicket | null> {
  const { data, error } = await getSupabase()
    .from("tickets")
    .select(
      "id, client_id, title, priority, status, created_at, updated_at, client:clients(id, name, company, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as Record<string, unknown>;
  const rel = r.client;
  const client = Array.isArray(rel) ? rel[0] ?? null : rel ?? null;
  return { ...(r as object), client } as AdminTicket;
}

export async function listMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await getSupabase()
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as TicketMessage[];
}

// Post an admin reply. Admins authenticate via the password/JWT gate, not Supabase
// Auth, so author_user_id is null. The service-role insert bypasses RLS.
export async function postAdminMessage(
  ticketId: string,
  body: string,
): Promise<TicketMessage> {
  const { data, error } = await getSupabase()
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, author_type: "admin", author_user_id: null, body })
    .select("*")
    .single();
  if (error) throw error;
  return data as TicketMessage;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<void> {
  const { error } = await getSupabase()
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
