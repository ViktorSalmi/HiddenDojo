import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase/client";

type PasswordCredentials = {
  email: string;
  password: string;
};

type PasswordSignInResult = {
  error: string | null;
  message: string | null;
};

type SignInWithPassword = (
  credentials: PasswordCredentials,
) => Promise<{ error: { message: string } | null }>;

export async function attemptPasswordSignIn(
  signInWithPassword: SignInWithPassword,
  credentials: PasswordCredentials,
): Promise<PasswordSignInResult> {
  try {
    const { error } = await signInWithPassword(credentials);

    if (error) {
      return {
        error: error.message,
        message: null,
      };
    }

    return {
      error: null,
      message: "Signed in successfully. Redirecting to the dashboard...",
    };
  } catch {
    return {
      error: "Unable to sign in right now. Please try again.",
      message: null,
    };
  }
}

export function LoginPage() {
  const { isAuthenticated, isLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await attemptPasswordSignIn(
        (credentials) => supabase.auth.signInWithPassword(credentials),
        { email, password },
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <main className="shell">Checking session...</main>;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard/members" />;
  }

  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">Karate App</p>
        <h1>Log in</h1>
        <p className="lede">
          Enter your email and password to access the dashboard.
        </p>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          style={{ display: "grid", gap: "16px", marginTop: "28px" }}
        >
          <label style={{ display: "grid", gap: "8px" }}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "inherit",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "8px" }}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "inherit",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              border: 0,
              background: "#8fb0ff",
              color: "#09111f",
              fontWeight: 700,
              cursor: isSubmitting ? "progress" : "pointer",
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {message ? <p className="lede">{message}</p> : null}
        {error ? (
          <p className="lede" role="alert" style={{ color: "#ffb4b4" }}>
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
