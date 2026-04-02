import { describe, expect, it } from "vitest";

import { isAuthenticatedSession } from "@/lib/supabase/auth";

describe("isAuthenticatedSession", () => {
  it("returns false for missing session", () => {
    expect(isAuthenticatedSession(null)).toBe(false);
  });

  it("returns true for a session with a user id", () => {
    expect(
      isAuthenticatedSession({
        user: { id: "user-1" },
      } as never),
    ).toBe(true);
  });
});
