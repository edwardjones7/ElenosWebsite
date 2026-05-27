import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function PortalLoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0a0a0a",
        color: "#f5f5f5",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#141414",
          border: "1px solid #262626",
          borderRadius: 12,
          padding: "2rem",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: 11,
            color: "#a200ff",
            marginBottom: 12,
          }}
        >
          Elenos / Portal
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Sign in
        </h1>
        <p style={{ color: "#a3a3a3", fontSize: 14, marginBottom: 20 }}>
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
