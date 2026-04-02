import type { EmailOtpType } from "@supabase/supabase-js";

type AuthFlow =
  | { kind: "code"; code: string; nextPath: string }
  | {
      kind: "token_hash";
      nextPath: string;
      otpType: EmailOtpType;
      tokenHash: string;
    }
  | { kind: "missing"; nextPath: string };

const DEFAULT_NEXT_PATH = "/dashboard/members";

export function getAuthFlow(requestUrl: URL): AuthFlow {
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");

  if (code) {
    return {
      kind: "code",
      code,
      nextPath,
    };
  }

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (tokenHash && isEmailOtpType(type)) {
    return {
      kind: "token_hash",
      nextPath,
      otpType: type,
      tokenHash,
    };
  }

  return {
    kind: "missing",
    nextPath,
  };
}

function normalizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }

  return nextPath;
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  );
}
