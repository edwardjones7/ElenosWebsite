import { Shell } from "@/components/admin/Shell";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  let items: Awaited<ReturnType<typeof listLeads>> = [];
  let error: string | null = null;
  try {
    items = await listLeads("all");
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">/learn funnel</span>
          <h1>Leads</h1>
        </div>
        <a className="btn btn-sm" href="/api/admin/leads/?format=csv">
          Export CSV
        </a>
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">Couldn’t load leads: {error}</div>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <p className="mute" style={{ marginBottom: 12 }}>
              {items.length.toLocaleString()} lead{items.length === 1 ? "" : "s"}
            </p>
          )}
          <LeadsTable items={items} />
        </>
      )}
    </Shell>
  );
}
