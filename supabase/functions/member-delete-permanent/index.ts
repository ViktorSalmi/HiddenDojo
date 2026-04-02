import { createClient } from "jsr:@supabase/supabase-js@2";

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

  const { memberId } = (await request.json()) as { memberId?: string };

  if (!memberId) {
    return json({ error: "memberId is required" }, 400);
  }

  const { error: campAttendanceError } = await admin
    .from("camp_attendance")
    .delete()
    .eq("member_id", memberId);

  if (campAttendanceError) {
    return json({ error: campAttendanceError.message }, 500);
  }

  const { error: sessionAttendanceError } = await admin
    .from("session_attendance")
    .delete()
    .eq("member_id", memberId);

  if (sessionAttendanceError) {
    return json({ error: sessionAttendanceError.message }, 500);
  }

  const { error: memberDeleteError } = await admin
    .from("members")
    .delete()
    .eq("id", memberId);

  if (memberDeleteError) {
    return json({ error: memberDeleteError.message }, 500);
  }

  return json({ ok: true, user: user.email ?? user.id });
});
