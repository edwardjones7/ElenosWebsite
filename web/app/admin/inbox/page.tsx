import { Shell } from "@/components/admin/Shell";
import { ContactsTable } from "@/components/admin/ContactsTable";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { listContacts, type ContactStatus } from "@/lib/contacts";

export const dynamic = "force-dynamic";

const STATUSES: (ContactStatus | "all")[] = ["all", "new", "replied", "archived"];

export default async function AdminInbox({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const raw = searchParams?.status as ContactStatus | "all" | undefined;
  const status = raw && STATUSES.includes(raw) ? raw : "all";

  let items: Awaited<ReturnType<typeof listContacts>> = [];
  let error: string | null = null;
  try {
    items = await listContacts(status);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Inbox</span>
          <h1>Contacts</h1>
        </div>
        <StatusTabs active={status} />
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">
            Couldn’t load contacts: {error}. Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code> and run the schema in{" "}
            <code>web/lib/schema.sql</code>.
          </div>
        </div>
      ) : (
        <ContactsTable items={items} />
      )}
    </Shell>
  );
}
