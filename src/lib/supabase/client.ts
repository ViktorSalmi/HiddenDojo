import { createClient } from "@supabase/supabase-js";

type SupabaseClientEnv = {
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
};

export function getSupabaseClientConfig(env: SupabaseClientEnv) {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return {
    anonKey,
    url,
  };
}

const { url, anonKey } = getSupabaseClientConfig(import.meta.env);

export const supabase = createClient(url, anonKey);
