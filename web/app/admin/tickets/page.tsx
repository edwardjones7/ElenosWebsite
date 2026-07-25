import { Shell } from "@/components/admin/Shell";
import { TicketsTable } from "@/components/admin/TicketsTable";
import { TicketStatusTabs } from "@/components/admin/TicketStatusTabs";
import { listTickets, TICKET_STATUSES, type TicketStatus } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export default async function AdminTickets({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const raw = searchParams?.status as TicketStatus | "all" | undefined;
  const status =
    raw && (raw === "all" || TICKET_STATUSES.includes(raw)) ? raw : "all";

  let items: Awaited<ReturnType<typeof listTickets>> = [];
  let error: string | null = null;
  try {
    items = await listTickets(status);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Support</span>
          <h1>Tickets</h1>
        </div>
        <TicketStatusTabs active={status} />
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">
            Couldn’t load tickets: {error}. Ensure the portal migrations in{" "}
            <code>web/migrations/</code> have been run in Supabase.
          </div>
        </div>
      ) : (
        <TicketsTable items={items} />
      )}
    </Shell>
  );
}
