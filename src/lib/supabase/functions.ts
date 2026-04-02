import { supabase } from "@/lib/supabase/client";

type AuditLogDetail = Record<string, unknown> | null | undefined;

type AuditLogPayload = {
  action: string;
  detail?: AuditLogDetail;
  recordId?: string | null;
  tableName: string;
};

export async function writeAuditLog(payload: AuditLogPayload) {
  const { error } = await supabase.functions.invoke("audit-log-write", {
    body: payload,
  });

  if (error) {
    console.warn("Audit log write skipped:", error.message);
  }
}

export async function permanentlyDeleteMember(memberId: string) {
  const { error } = await supabase.functions.invoke("member-delete-permanent", {
    body: { memberId },
  });

  if (!error) {
    return;
  }

  const { error: fallbackError } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId);

  if (fallbackError) {
    throw fallbackError;
  }
}
