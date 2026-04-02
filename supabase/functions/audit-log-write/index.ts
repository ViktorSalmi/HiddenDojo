import { createClient } from "jsr:@supabase/supabase-js@2";

type AuditPayload = {
  action?: string;
  detail?: Record<string, unknown> | null;
  recordId?: string | null;
  tableName?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization) {
    return json({ error: "Missing authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authorization },
    },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const payload = (await request.json()) as AuditPayload;

  if (!payload.action || !payload.tableName) {
    return json({ error: "Invalid payload" }, 400);
  }

  const { error } = await admin.from("audit_log").insert({
    action: payload.action,
    detail: payload.detail ?? null,
    record_id: payload.recordId ?? null,
    table_name: payload.tableName,
    user_email: user.email ?? user.id,
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ ok: true });
});
