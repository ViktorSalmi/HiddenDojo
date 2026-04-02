import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { isAuthenticatedSession } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

type UseSessionResult = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
};

type GetSessionResult = {
  data: {
    session: Session | null;
  };
};

export async function loadInitialSession(
  getSession: () => Promise<GetSessionResult>,
): Promise<Session | null> {
  try {
    const { data } = await getSession();
    return data.session;
  } catch {
    return null;
  }
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await loadInitialSession(() =>
          supabase.auth.getSession(),
        );

        if (!isMounted) {
          return;
        }

        setSession(nextSession);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated: isAuthenticatedSession(session),
    isLoading,
    session,
  };
}
