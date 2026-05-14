import "server-only";
import { getSupabase } from "@/lib/supabase";

export type SubscriberStatus = "active" | "unsubscribed";

export type Subscriber = {
  id: number;
  created_at: string;
  email: string;
  source_path: string | null;
  ip_hash: string | null;
  status: SubscriberStatus;
};

export async function listSubscribers(status?: SubscriberStatus | "all"): Promise<Subscriber[]> {
  let q = getSupabase().from("subscribers").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(10000);
  if (error) throw error;
  return (data || []) as Subscriber[];
}
