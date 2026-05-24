import "server-only";
import { getSupabase } from "@/lib/supabase";

export type ContactStatus = "new" | "replied" | "archived";

export type Contact = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string;
  source_path: string | null;
  status: ContactStatus;
};

export async function listContacts(status?: ContactStatus | "all"): Promise<Contact[]> {
  let q = getSupabase().from("contacts").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(500);
  if (error) throw error;
  return (data || []) as Contact[];
}

export async function updateContactStatus(id: number, status: ContactStatus): Promise<void> {
  const { error } = await getSupabase().from("contacts").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: number): Promise<number> {
  const { error, count } = await getSupabase()
    .from("contacts")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return count ?? 0;
}
