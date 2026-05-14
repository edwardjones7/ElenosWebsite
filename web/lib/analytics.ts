import "server-only";
import { getSupabase } from "@/lib/supabase";

export type Range = "7d" | "30d" | "all";

export type AnalyticsSummary = {
  range: Range;
  windowStart: string | null;
  totals: {
    sessions: number;
    pageviews: number;
    ctaClicks: number;
    calendlyClicks: number;
    formSubmits: number;
  };
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  funnel: {
    pageviews: number;
    ctaClicks: number;
    calendlyClicks: number;
    formSubmits: number;
  };
  recent: { id: number; occurred_at: string; type: string; path: string; referrer: string | null }[];
};

function rangeStart(range: Range): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export async function getAnalytics(range: Range): Promise<AnalyticsSummary> {
  const sb = getSupabase();
  const start = rangeStart(range);
  const startIso = start ? start.toISOString() : null;

  let q = sb.from("events").select("type, path, referrer, session_id, occurred_at, id");
  if (startIso) q = q.gte("occurred_at", startIso);
  const { data: rows, error } = await q.order("occurred_at", { ascending: false }).limit(50000);
  if (error) throw error;

  const events = rows || [];

  const sessionSet = new Set<string>();
  let pageviews = 0;
  let ctaClicks = 0;
  let calendlyClicks = 0;
  let formSubmits = 0;

  const pagesByPath = new Map<string, number>();
  const refsByHost = new Map<string, number>();

  for (const e of events) {
    sessionSet.add(e.session_id);
    if (e.type === "pageview") {
      pageviews += 1;
      pagesByPath.set(e.path, (pagesByPath.get(e.path) || 0) + 1);
    } else if (e.type === "cta_click") {
      ctaClicks += 1;
    } else if (e.type === "calendly_click") {
      calendlyClicks += 1;
    } else if (e.type === "form_submit") {
      formSubmits += 1;
    }
    const refKey = referrerHost(e.referrer);
    refsByHost.set(refKey, (refsByHost.get(refKey) || 0) + 1);
  }

  const topPages = [...pagesByPath.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topReferrers = [...refsByHost.entries()]
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recent = events.slice(0, 20).map((e) => ({
    id: e.id,
    occurred_at: e.occurred_at,
    type: e.type,
    path: e.path,
    referrer: e.referrer,
  }));

  return {
    range,
    windowStart: startIso,
    totals: { sessions: sessionSet.size, pageviews, ctaClicks, calendlyClicks, formSubmits },
    topPages,
    topReferrers,
    funnel: { pageviews, ctaClicks, calendlyClicks, formSubmits },
    recent,
  };
}

function referrerHost(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    const u = new URL(referrer);
    return u.hostname || "direct";
  } catch {
    return "direct";
  }
}
