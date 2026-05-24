import { Shell } from "@/components/admin/Shell";
import { SubscribersTable } from "@/components/admin/SubscribersTable";
import { listSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function AdminSubscribers() {
  let items: Awaited<ReturnType<typeof listSubscribers>> = [];
  let error: string | null = null;
  try {
    items = await listSubscribers("active");
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Email list</span>
          <h1>Subscribers</h1>
        </div>
        <a className="btn btn-sm" href="/api/admin/subscribers/?format=csv">
          Export CSV
        </a>
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">Couldn’t load subscribers: {error}</div>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <p className="mute" style={{ marginBottom: 12 }}>
              {items.length.toLocaleString()} active subscriber{items.length === 1 ? "" : "s"}
            </p>
          )}
          <SubscribersTable items={items} />
        </>
      )}
    </Shell>
  );
}
