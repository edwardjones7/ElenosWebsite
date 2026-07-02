import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-guard";
import { createTicket } from "@/app/portal/actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  missing: "Please fill in both a title and a message.",
  save: "Something went wrong saving your ticket. Please try again.",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#a3a3a3",
  marginBottom: 6,
} as const;

const fieldStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "#0a0a0a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  color: "#f5f5f5",
  fontSize: 14,
  fontFamily: "inherit",
} as const;

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const error = searchParams.error ? ERRORS[searchParams.error] : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#f5f5f5",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "3rem 2rem",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link
          href="/portal"
          style={{ color: "#a3a3a3", fontSize: 13, textDecoration: "none" }}
        >
          ← Back to tickets
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "16px 0 24px" }}>
          New ticket
        </h1>

        {error && (
          <p
            style={{
              color: "#ff6b6b",
              fontSize: 13,
              marginBottom: 16,
              background: "#2a0f0f",
              border: "1px solid #5a1f1f",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            {error}
          </p>
        )}

        <form action={createTicket} style={{ display: "grid", gap: 18 }}>
          <div>
            <label htmlFor="title" style={labelStyle}>
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="Short summary"
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="priority" style={labelStyle}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="normal"
              style={fieldStyle}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="body" style={labelStyle}>
              Message
            </label>
            <textarea
              id="body"
              name="body"
              required
              maxLength={5000}
              rows={7}
              placeholder="Describe what you need…"
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            style={{
              justifySelf: "start",
              padding: "10px 18px",
              background: "#a200ff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Submit ticket
          </button>
        </form>
      </div>
    </main>
  );
}
