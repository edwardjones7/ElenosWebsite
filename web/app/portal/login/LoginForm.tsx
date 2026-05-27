"use client";

import { useState } from "react";
import { getPortalBrowserClient } from "@/lib/supabase-browser";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = getPortalBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Invite-only — never auto-create users from the public login page.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/portal/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p style={{ color: "#a3a3a3", fontSize: 14, lineHeight: 1.55 }}>
        If <strong style={{ color: "#f5f5f5" }}>{email}</strong> has a portal
        account, a sign-in link is on its way. Check your inbox.
      </p>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <input
        type="email"
        placeholder="you@company.com"
        autoFocus
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#0a0a0a",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          color: "#f5f5f5",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
      <button
        type="submit"
        disabled={busy || email.length === 0}
        style={{
          padding: "10px 12px",
          background: busy ? "#5a009b" : "#a200ff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
          opacity: email.length === 0 ? 0.5 : 1,
        }}
      >
        {busy ? "Sending…" : "Send sign-in link"}
      </button>
      {error && (
        <span style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</span>
      )}
    </form>
  );
}
