import { Shell } from "@/components/admin/Shell";
import { AddClientForm } from "@/components/admin/AddClientForm";
import { listClients } from "@/lib/clients";
import { formatDateTime } from "@/lib/ticket-format";

export const dynamic = "force-dynamic";

export default async function AdminClients() {
  let items: Awaited<ReturnType<typeof listClients>> = [];
  let error: string | null = null;
  try {
    items = await listClients();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Portal</span>
          <h1>Clients</h1>
        </div>
      </header>

      <div className="widget" style={{ marginBottom: 24 }}>
        <div className="widget-head">
          <span className="widget-title">Invite a client</span>
        </div>
        <p className="mute" style={{ margin: "0 0 14px" }}>
          Sends a Supabase sign-in invite and creates their portal account.
        </p>
        <AddClientForm />
      </div>

      {error ? (
        <div className="widget">
          <div className="widget-empty">
            Couldn’t load clients: {error}. Ensure the portal schema in{" "}
            <code>web/lib/schema.sql</code> has been run in Supabase.
          </div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Joined</th>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={5}>
                  No clients yet. Invite your first one above.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateTime(c.created_at)}</td>
                  <td>{c.name}</td>
                  <td>{c.company || "—"}</td>
                  <td className="truncate">{c.email}</td>
                  <td>
                    <span
                      className={`pill pill-${
                        c.status === "active" ? "resolved" : "closed"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </Shell>
  );
}
