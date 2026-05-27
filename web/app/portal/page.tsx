import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-guard";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: 11,
            color: "#a200ff",
            marginBottom: 8,
          }}
        >
          Elenos / Portal
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          Welcome, {session.client.name}
        </h1>
        <p style={{ color: "#a3a3a3", marginBottom: 32 }}>
          Signed in as {session.email}
          {session.client.company ? ` · ${session.client.company}` : ""}
        </p>

        <div
          style={{
            background: "#141414",
            border: "1px solid #262626",
            borderRadius: 12,
            padding: "2rem",
            color: "#a3a3a3",
          }}
        >
          Tickets coming next. You&apos;ll be able to submit, view, and reply
          to tickets here.
        </div>
      </div>
    </main>
  );
}
