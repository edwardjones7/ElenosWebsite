import "server-only";

import { getPortalServerClient } from "./supabase-server";

export type PortalSession = {
  userId: string;
  email: string;
  client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  };
};

// Resolve the current portal user + active client row, or null if not logged in
// or not provisioned. Mirrors the contract of admin-guard's requireAdmin but
// targets pages/route handlers that need to know *who* the client is.
export async function getPortalSession(): Promise<PortalSession | null> {
  const supabase = getPortalServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, company, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client || client.status !== "active") return null;

  return {
    userId: user.id,
    email: user.email ?? client.email,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
    },
  };
}
