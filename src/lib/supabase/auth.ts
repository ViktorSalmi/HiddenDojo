import type { Session } from "@supabase/supabase-js";

export function isAuthenticatedSession(session: Session | null) {
  return Boolean(session?.user?.id);
}
