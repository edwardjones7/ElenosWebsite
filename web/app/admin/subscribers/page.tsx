import { Shell } from "@/components/admin/Shell";
import { listSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
      ) : items.length === 0 ? (
        <table className="data-table">
          <tbody>
            <tr>
              <td className="empty-cell" colSpan={3}>
                No subscribers yet.
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <>
          <p className="mute" style={{ marginBottom: 12 }}>
            {items.length.toLocaleString()} active subscriber{items.length === 1 ? "" : "s"}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.source_path || "—"}</td>
                  <td>{fmtDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Shell>
  );
}
