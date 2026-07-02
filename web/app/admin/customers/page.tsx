import { Shell } from "@/components/admin/Shell";
import { PurchasesTable } from "@/components/admin/PurchasesTable";
import { listPurchases } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  let items: Awaited<ReturnType<typeof listPurchases>> = [];
  let error: string | null = null;
  try {
    items = await listPurchases("all");
  } catch (e) {
    error = (e as Error).message;
  }

  const revenueCents = items.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Course sales</span>
          <h1>Customers</h1>
        </div>
        <a className="btn btn-sm" href="/api/admin/customers/?format=csv">
          Export CSV
        </a>
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">Couldn’t load customers: {error}</div>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <p className="mute" style={{ marginBottom: 12 }}>
              {items.length.toLocaleString()} customer{items.length === 1 ? "" : "s"} · $
              {(revenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} total
            </p>
          )}
          <PurchasesTable items={items} />
        </>
      )}
    </Shell>
  );
}
