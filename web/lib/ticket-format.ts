// Shared, client-safe ticket types + display helpers. Kept free of "server-only"
// so client components can import the types, the TICKET_STATUSES list, and the
// label/colour maps without pulling in the service-role data layer (lib/tickets).

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_client"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  client_id: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_type: "client" | "admin";
  author_user_id: string | null;
  body: string;
  created_at: string;
};

// A ticket enriched with its owning client for the admin list view.
export type AdminTicket = Ticket & {
  client: { id: string; name: string; company: string | null; email: string } | null;
};

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_client",
  "resolved",
  "closed",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_client: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

// Accent colors for status pills (hex, brand-aligned).
export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "#a200ff",
  in_progress: "#3b82f6",
  waiting_client: "#f59e0b",
  resolved: "#22c55e",
  closed: "#6b7280",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
