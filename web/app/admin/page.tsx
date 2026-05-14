import { Shell } from "@/components/admin/Shell";
import { StatCard } from "@/components/admin/StatCard";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { getAnalytics, type Range } from "@/lib/analytics";

export const dynamic = "force-dynamic";

function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const raw = searchParams?.range;
  const range: Range = raw === "30d" || raw === "all" ? raw : "7d";

  let data: Awaited<ReturnType<typeof getAnalytics>> | null = null;
  let error: string | null = null;
  try {
    data = await getAnalytics(range);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
        </div>
        <RangeTabs active={range} />
      </header>

      {error && (
        <div className="widget" style={{ marginBottom: 20 }}>
          <div className="widget-empty">
            Couldn’t load analytics: {error}. Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code> and run the schema in{" "}
            <code>web/lib/schema.sql</code>.
          </div>
        </div>
      )}

      {data && (
        <>
          <section className="stats">
            <StatCard label="Sessions" value={data.totals.sessions} />
            <StatCard label="Pageviews" value={data.totals.pageviews} />
            <StatCard label="Calendly clicks" value={data.totals.calendlyClicks} />
            <StatCard label="Form submits" value={data.totals.formSubmits} />
          </section>

          <section className="widgets">
            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">Top pages</span>
              </div>
              {data.topPages.length === 0 ? (
                <div className="widget-empty">No data yet.</div>
              ) : (
                data.topPages.map((p) => (
                  <div className="widget-row" key={p.path}>
                    <span className="label">{p.path}</span>
                    <span className="value">{p.count.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">Top referrers</span>
              </div>
              {data.topReferrers.length === 0 ? (
                <div className="widget-empty">No data yet.</div>
              ) : (
                data.topReferrers.map((r) => (
                  <div className="widget-row" key={r.referrer}>
                    <span className="label">{r.referrer}</span>
                    <span className="value">{r.count.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">Funnel</span>
              </div>
              <div className="widget-row">
                <span className="label">pageview → cta_click</span>
                <span className="value">{pct(data.funnel.ctaClicks, data.funnel.pageviews)}</span>
              </div>
              <div className="widget-row">
                <span className="label">cta_click → calendly_click</span>
                <span className="value">
                  {pct(data.funnel.calendlyClicks, data.funnel.ctaClicks)}
                </span>
              </div>
              <div className="widget-row">
                <span className="label">pageview → form_submit</span>
                <span className="value">{pct(data.funnel.formSubmits, data.funnel.pageviews)}</span>
              </div>
            </div>

            <div className="widget">
              <div className="widget-head">
                <span className="widget-title">Recent events</span>
              </div>
              {data.recent.length === 0 ? (
                <div className="widget-empty">No data yet.</div>
              ) : (
                data.recent.map((e) => (
                  <div className="widget-row" key={e.id}>
                    <span className="label">
                      {e.type} · {e.path}
                    </span>
                    <span className="value">
                      {new Date(e.occurred_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
