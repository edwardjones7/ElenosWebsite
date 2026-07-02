import "server-only";
import { getSupabase } from "@/lib/supabase";

export type LeadStatus = "new" | "emailed" | "email_failed" | "unsubscribed";

export type Lead = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  source_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_hash: string | null;
  status: LeadStatus;
  emailed_at: string | null;
};

export async function listLeads(status?: LeadStatus | "all"): Promise<Lead[]> {
  let q = getSupabase().from("leads").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(10000);
  if (error) throw error;
  return (data || []) as Lead[];
}

export async function deleteLead(id: number): Promise<void> {
  const { error } = await getSupabase().from("leads").delete().eq("id", id);
  if (error) throw error;
}
