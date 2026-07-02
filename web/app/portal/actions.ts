"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-guard";
import { getPortalServerClient } from "@/lib/supabase-server";
import { notifyDiscord } from "@/lib/discord";
import type { TicketPriority } from "@/lib/tickets";

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

// Client opens a new ticket and posts its first message. RLS ("clients insert
// own tickets" / "clients insert own messages") scopes both inserts to them.
export async function createTicket(formData: FormData): Promise<void> {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const title = str(formData, "title").slice(0, 200);
  const body = str(formData, "body").slice(0, 5000);
  const rawPriority = str(formData, "priority") as TicketPriority;
  const priority: TicketPriority = PRIORITIES.includes(rawPriority)
    ? rawPriority
    : "normal";

  if (!title || !body) {
    redirect("/portal/tickets/new?error=missing");
  }

  const supabase = getPortalServerClient();

  const { data: ticket, error: ticketErr } = await supabase
    .from("tickets")
    .insert({ client_id: session.client.id, title, priority })
    .select("id")
    .single();

  if (ticketErr || !ticket) {
    redirect("/portal/tickets/new?error=save");
  }

  const { error: msgErr } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    author_type: "client",
    author_user_id: session.userId,
    body,
  });

  if (msgErr) {
    redirect("/portal/tickets/new?error=save");
  }

  await notifyDiscord("tickets", {
    title: "New portal ticket",
    fields: [
      { name: "Client", value: session.client.name, inline: true },
      { name: "Company", value: session.client.company ?? "—", inline: true },
      { name: "Priority", value: priority, inline: true },
      { name: "Title", value: title },
      { name: "Message", value: body },
    ],
  });

  revalidatePath("/portal");
  redirect(`/portal/tickets/${ticket.id}`);
}

// Client posts a reply on one of their own tickets.
export async function postReply(formData: FormData): Promise<void> {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const ticketId = str(formData, "ticketId");
  const body = str(formData, "body").slice(0, 5000);
  if (!ticketId || !body) {
    redirect(`/portal/tickets/${ticketId || ""}`);
  }

  const supabase = getPortalServerClient();
  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_type: "client",
    author_user_id: session.userId,
    body,
  });

  if (error) {
    redirect(`/portal/tickets/${ticketId}?error=reply`);
  }

  revalidatePath(`/portal/tickets/${ticketId}`);
  redirect(`/portal/tickets/${ticketId}`);
}
