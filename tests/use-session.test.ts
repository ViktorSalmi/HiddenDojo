import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

import { loadInitialSession } from "@/hooks/use-session";

describe("loadInitialSession", () => {
  it("falls back to an unauthenticated session when getSession rejects", async () => {
    const getSession = vi.fn().mockRejectedValue(new Error("supabase down"));

    await expect(loadInitialSession(getSession)).resolves.toBeNull();
  });
});
