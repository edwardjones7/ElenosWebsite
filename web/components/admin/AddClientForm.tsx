"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddClientForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          company: company.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message || body.error || "Could not invite client.");
        return;
      }
      setOk(`Invite sent to ${email.trim()}.`);
      setEmail("");
      setName("");
      setCompany("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="c-name">Name</label>
        <input
          id="c-name"
          type="text"
          required
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input
          id="c-email"
          type="email"
          required
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
        />
      </div>
      <div className="field">
        <label htmlFor="c-company">Company (optional)</label>
        <input
          id="c-company"
          type="text"
          value={company}
          disabled={busy}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company Inc."
        />
      </div>
      {error && <span className="form-error">{error}</span>}
      {ok && <span className="form-ok">{ok}</span>}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy || !email.trim() || !name.trim()}
      >
        {busy ? "Sending invite…" : "Invite client"}
      </button>
    </form>
  );
}
