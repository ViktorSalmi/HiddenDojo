import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getSupabaseClientConfig", () => {
  it("requires the Vite Supabase env names with a clear error", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://dojo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const clientModule = await import("@/lib/supabase/client");

    expect(() =>
      clientModule.getSupabaseClientConfig({
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_ANON_KEY: "",
      }),
    ).toThrowError(
      "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  });
});
