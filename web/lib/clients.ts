import "server-only";
import { getSupabase } from "@/lib/supabase";

export type ClientStatus = "active" | "archived";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string;
  status: ClientStatus;
  created_at: string;
};

export async function listClients(): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as Client[];
}

// Where Supabase should send the invited user after they click the email link.
function portalCallbackUrl(): string {
  const origin = process.env.PORTAL_ORIGIN || "https://portal.elenos.ai";
  return `${origin.replace(/\/$/, "")}/portal/auth/callback`;
}

export type InviteResult =
  | { ok: true; client: Client }
  | { ok: false; error: string };

// Provision a new client: send a Supabase Auth invite email and create the
// linked clients row. Invite-only — there is no public self-signup.
export async function inviteClient(input: {
  email: string;
  name: string;
  company?: string | null;
}): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const company = input.company?.trim() || null;

  if (!email || !name) {
    return { ok: false, error: "Name and email are required." };
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: portalCallbackUrl(),
  });

  if (error || !data?.user) {
    const msg = error?.message || "Could not send invite.";
    // Friendlier message for the common "already invited / registered" case.
    if (/already|registered|exist/i.test(msg)) {
      return {
        ok: false,
        error: "That email already has an auth account. Add their clients row in Supabase, or use a different email.",
      };
    }
    return { ok: false, error: msg };
  }

  const { data: client, error: insertErr } = await supabase
    .from("clients")
    .insert({ user_id: data.user.id, name, company, email, status: "active" })
    .select("*")
    .single();

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  return { ok: true, client: client as Client };
}

export async function archiveClient(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("clients")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw error;
}
