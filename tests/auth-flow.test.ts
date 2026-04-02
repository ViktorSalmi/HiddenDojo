import { describe, expect, it } from "vitest";

import { getAuthFlow } from "@/lib/supabase/auth-flow";

describe("getAuthFlow", () => {
  it("reads code-based callbacks", () => {
    const flow = getAuthFlow(
      new URL("http://localhost:3000/auth/callback?code=abc123&next=/dashboard/camps"),
    );

    expect(flow).toEqual({
      kind: "code",
      code: "abc123",
      nextPath: "/dashboard/camps",
    });
  });

  it("reads token-hash callbacks for SSR email auth", () => {
    const flow = getAuthFlow(
      new URL(
        "http://localhost:3000/auth/confirm?token_hash=hash123&type=email&next=/dashboard/training",
      ),
    );

    expect(flow).toEqual({
      kind: "token_hash",
      tokenHash: "hash123",
      otpType: "email",
      nextPath: "/dashboard/training",
    });
  });

  it("falls back to the default dashboard route for invalid next paths", () => {
    const flow = getAuthFlow(
      new URL("http://localhost:3000/auth/callback?code=abc123&next=https://example.com"),
    );

    expect(flow).toEqual({
      kind: "code",
      code: "abc123",
      nextPath: "/dashboard/members",
    });
  });
});
