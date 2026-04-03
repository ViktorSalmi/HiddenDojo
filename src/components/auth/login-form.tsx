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
      message: "Inloggningen lyckades. Du skickas vidare till dashboarden...",
    };
  } catch {
    return {
      error: "Det gick inte att logga in just nu. Försök igen strax.",
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
    return <main className="shell">Laddar session...</main>;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard/members" />;
  }

  return (
    <main className="shell">
      <section className="hero-card auth-shell">
        <div className="auth-panel-brand">
          <p className="eyebrow">Hidden Karate</p>
          <p className="mt-2 max-w-[42ch] text-[15px] leading-7 text-[color:var(--ink2)]">
            Planera pass, checka in elever, följ närvaro och samla allt kring
            medlemmar, träningar och läger i ett lugnt arbetsflöde.
          </p>
          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <div className="section-label">Översikt</div>
              <div className="mt-2 text-[15px] font-medium text-[color:var(--ink)]">
                Se dagens pass, kommande planering och aktuell närvaro direkt.
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="section-label">Ipad-läge</div>
              <div className="mt-2 text-[15px] font-medium text-[color:var(--ink)]">
                Öppna check-in på plats och låt elever registrera sig snabbt.
              </div>
            </div>
          </div>
        </div>
        <div className="auth-panel-form">
          <p className="eyebrow">Logga in</p>
          <h2 className="display-font text-[34px] font-extrabold text-[color:var(--ink)]">
            Välkommen tillbaka
          </h2>
          <p className="lede mt-3">
            Använd din coach-inloggning för att öppna dashboarden.
          </p>
          <form className="auth-form-grid" onSubmit={(event) => void handleSubmit(event)}>
            <label className="auth-label">
              <span>E-post</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ui-input rounded-[14px] px-4 py-3.5 text-[15px] outline-none"
              placeholder="coach@hiddenkarate.se"
            />
          </label>
            <label className="auth-label">
              <span>Lösenord</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="ui-input rounded-[14px] px-4 py-3.5 text-[15px] outline-none"
              placeholder="Skriv ditt lösenord"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ui-button-primary rounded-[14px] px-5 py-3.5 text-[15px] font-semibold text-white disabled:cursor-progress disabled:opacity-60"
          >
            {isSubmitting ? "Loggar in..." : "Öppna dashboard"}
          </button>
        </form>
          <p className="auth-helper">
            Har du inte fått inloggning ännu? Be ansvarig coach att skapa eller
            uppdatera ditt konto i Supabase.
          </p>
        {message ? <p className="auth-helper text-[color:var(--green)]">{message}</p> : null}
        {error ? (
          <p
            className="auth-helper rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[color:var(--red)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        </div>
      </section>
    </main>
  );
}
