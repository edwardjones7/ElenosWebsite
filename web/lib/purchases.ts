import "server-only";
import { getSupabase } from "@/lib/supabase";

export type PurchaseStatus = "paid" | "delivered" | "delivery_failed" | "refunded";

export type Purchase = {
  id: number;
  created_at: string;
  name: string | null;
  email: string;
  product: string;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: PurchaseStatus;
  delivered_at: string | null;
};

export async function listPurchases(status?: PurchaseStatus | "all"): Promise<Purchase[]> {
  let q = getSupabase().from("purchases").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(10000);
  if (error) throw error;
  return (data || []) as Purchase[];
}

export async function deletePurchase(id: number): Promise<void> {
  const { error } = await getSupabase().from("purchases").delete().eq("id", id);
  if (error) throw error;
}
