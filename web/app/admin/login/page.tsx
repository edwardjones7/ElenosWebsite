import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <span className="brand">ELENOS / ADMIN</span>
        <h1 className="title">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
