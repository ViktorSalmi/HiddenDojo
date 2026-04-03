import { calculateDashboardAttendance } from "@/lib/dojo/attendance";
import { supabase } from "@/lib/supabase/client";
import {
  permanentlyDeleteMember as permanentlyDeleteMemberFunction,
  writeAuditLog,
} from "@/lib/supabase/functions";
import type { Camp, Member, TrainingSession } from "@/types";

type CampQueryRow = Omit<Camp, "attendee_ids"> & {
  camp_attendance: Array<{ member_id: string }> | null;
};

type SessionQueryRow = Omit<TrainingSession, "attendee_ids"> & {
  session_attendance: Array<{ member_id: string }> | null;
};

export type MemberMutationInput = Pick<
  Member,
  "age" | "belt" | "gender" | "joined_date" | "name"
>;

export type CampMutationInput = {
  attendee_ids: string[];
  date: string;
  name: string;
  place: string | null;
};

export type TrainingSessionMutationInput = {
  date: string;
  member_ids: string[];
  notes: string | null;
};

export type CheckInResult = "checked-in" | "already-checked-in";

export type MembersDashboardData = {
  archivedMembers: Member[];
  camps: Camp[];
  members: Member[];
  sessions: TrainingSession[];
  sidebar: ReturnType<typeof calculateDashboardAttendance>;
};

async function replaceCampAttendance(campId: string, attendeeIds: string[]) {
  const { error: deleteError } = await supabase
    .from("camp_attendance")
    .delete()
    .eq("camp_id", campId);

  if (deleteError) {
    throw deleteError;
  }

  if (attendeeIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("camp_attendance").insert(
    attendeeIds.map((memberId) => ({
      camp_id: campId,
      member_id: memberId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function replaceSessionAttendance(sessionId: string, memberIds: string[]) {
  const { error: deleteError } = await supabase
    .from("session_attendance")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) {
    throw deleteError;
  }

  if (memberIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("session_attendance").insert(
    memberIds.map((memberId) => ({
      member_id: memberId,
      session_id: sessionId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

function mapCampRow(row: CampQueryRow): Camp {
  return {
    ...row,
    attendee_ids: row.camp_attendance?.map((entry) => entry.member_id) ?? [],
  };
}

function mapSessionRow(row: SessionQueryRow): TrainingSession {
  return {
    ...row,
    attendee_ids:
      row.session_attendance?.map((entry) => entry.member_id) ?? [],
  };
}

export async function listMembers(options?: { includeInactive?: boolean }) {
  const builder = supabase.from("members").select("*");

  const { data, error } = options?.includeInactive
    ? await builder.order("name")
    : await builder.eq("active", true).order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as Member[];
}

export async function listCamps() {
  const { data, error } = await supabase
    .from("camps")
    .select("id, name, date, place, created_at, updated_at, camp_attendance(member_id)")
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CampQueryRow[]).map(mapCampRow);
}

export async function listTrainingSessions() {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, date, notes, created_at, session_attendance(member_id)")
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SessionQueryRow[]).map(mapSessionRow);
}

export async function fetchMembersDashboardData(): Promise<MembersDashboardData> {
  const [allMembers, camps, sessions] = await Promise.all([
    listMembers({ includeInactive: true }),
    listCamps(),
    listTrainingSessions(),
  ]);

  const members = allMembers.filter((member) => member.active);
  const archivedMembers = allMembers.filter((member) => !member.active);

  return {
    archivedMembers,
    camps,
    members,
    sessions,
    sidebar: calculateDashboardAttendance(members, camps, sessions),
  };
}

export async function fetchDashboardData() {
  return fetchMembersDashboardData();
}

export async function createMember(input: MemberMutationInput) {
  const { data, error } = await supabase
    .from("members")
    .insert({ ...input, active: true })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "create",
    detail: input,
    recordId: data.id,
    tableName: "members",
  });

  return data as Member;
}

export async function updateMember(id: string, input: MemberMutationInput) {
  const { error } = await supabase.from("members").update(input).eq("id", id);

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "update",
    detail: input,
    recordId: id,
    tableName: "members",
  });
}

export async function softDeleteMember(id: string) {
  const { error } = await supabase
    .from("members")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "delete",
    detail: { active: false },
    recordId: id,
    tableName: "members",
  });
}

export async function permanentlyDeleteMember(id: string) {
  await permanentlyDeleteMemberFunction(id);
  await writeAuditLog({
    action: "delete_permanent",
    detail: {},
    recordId: id,
    tableName: "members",
  });
}

export async function createCamp(input: CampMutationInput) {
  const payload = {
    date: input.date,
    name: input.name.trim(),
    place: input.place?.trim() || null,
  };
  const attendeeIds = Array.from(new Set(input.attendee_ids));

  const { data, error } = await supabase
    .from("camps")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await replaceCampAttendance(data.id, attendeeIds);
  await writeAuditLog({
    action: "create",
    detail: { ...payload, attendee_ids: attendeeIds },
    recordId: data.id,
    tableName: "camps",
  });

  return {
    ...(data as Omit<Camp, "attendee_ids">),
    attendee_ids: attendeeIds,
  } as Camp;
}

export async function updateCamp(id: string, input: CampMutationInput) {
  const payload = {
    date: input.date,
    name: input.name.trim(),
    place: input.place?.trim() || null,
  };
  const attendeeIds = Array.from(new Set(input.attendee_ids));

  const { error } = await supabase.from("camps").update(payload).eq("id", id);

  if (error) {
    throw error;
  }

  await replaceCampAttendance(id, attendeeIds);
  await writeAuditLog({
    action: "update",
    detail: { ...payload, attendee_ids: attendeeIds },
    recordId: id,
    tableName: "camps",
  });
}

export async function deleteCamp(id: string) {
  const { error } = await supabase.from("camps").delete().eq("id", id);

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "delete",
    detail: {},
    recordId: id,
    tableName: "camps",
  });
}

export async function toggleCampAttendance(campId: string, memberId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("camp_attendance")
    .select("camp_id")
    .eq("camp_id", campId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error } = await supabase
      .from("camp_attendance")
      .delete()
      .eq("camp_id", campId)
      .eq("member_id", memberId);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("camp_attendance").insert({
      camp_id: campId,
      member_id: memberId,
    });

    if (error) {
      throw error;
    }
  }

  await writeAuditLog({
    action: "update",
    detail: { memberId },
    recordId: campId,
    tableName: "camp_attendance",
  });
}

export async function saveTrainingSession(input: TrainingSessionMutationInput) {
  if (!input.date) {
    throw new Error("Datum krävs.");
  }

  const memberIds = Array.from(new Set(input.member_ids));
  const notes = input.notes?.trim() || null;
  const { data: existing, error: existingError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("date", input.date)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let sessionId = existing?.id;

  if (sessionId) {
    const { error } = await supabase
      .from("training_sessions")
      .update({ notes })
      .eq("id", sessionId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await supabase
      .from("training_sessions")
      .insert({ date: input.date, notes })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    sessionId = data.id;
  }

  if (memberIds.length > 0) {
    await replaceSessionAttendance(sessionId, memberIds);
  }
  await writeAuditLog({
    action: existing ? "update" : "create",
    detail: { date: input.date, member_ids: memberIds, notes },
    recordId: sessionId,
    tableName: "training_sessions",
  });
}

export async function ensureTrainingSession(date: string) {
  if (!date) {
    throw new Error("Datum krävs.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("date", date)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .insert({ date, notes: null })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "create",
    detail: { date, source: "check-in-open" },
    recordId: data.id,
    tableName: "training_sessions",
  });

  return data.id;
}

export async function checkInMemberForDate(
  date: string,
  memberId: string,
): Promise<CheckInResult> {
  const sessionId = await ensureTrainingSession(date);

  const { data: existing, error: existingError } = await supabase
    .from("session_attendance")
    .select("session_id")
    .eq("session_id", sessionId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return "already-checked-in";
  }

  const { error } = await supabase.from("session_attendance").insert({
    member_id: memberId,
    session_id: sessionId,
  });

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "check_in",
    detail: { date, memberId },
    recordId: sessionId,
    tableName: "session_attendance",
  });

  return "checked-in";
}

export async function deleteTrainingSession(id: string) {
  const { error } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  await writeAuditLog({
    action: "delete",
    detail: {},
    recordId: id,
    tableName: "training_sessions",
  });
}

