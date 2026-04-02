import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

import { attemptPasswordSignIn } from "@/components/auth/login-form";

describe("attemptPasswordSignIn", () => {
  it("returns a fallback error when password sign-in rejects", async () => {
    const signInWithPassword = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(
      attemptPasswordSignIn(signInWithPassword, {
        email: "coach@example.com",
        password: "secret123",
      }),
    ).resolves.toEqual({
      error: "Unable to sign in right now. Please try again.",
      message: null,
    });
  });
});
