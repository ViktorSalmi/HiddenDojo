export type Gender = "M" | "F" | "-";
export type Belt =
  | "vitt"
  | "gult"
  | "orange"
  | "grönt"
  | "blått"
  | "brunt"
  | "svart";

export type Timestamp = string | null;

export type Member = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  belt: Belt;
  joined_date: string;
  active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type Camp = {
  id: string;
  name: string;
  date: string;
  place: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  attendee_ids: string[];
};

export type TrainingSession = {
  id: string;
  date: string;
  notes: string | null;
  created_at: Timestamp;
  attendee_ids: string[];
};

export type AttendanceSummary = {
  percent: number;
  attendedCamps: number;
  totalCamps: number;
  attendedSessions: number;
  totalSessions: number;
};

export type MemberWithAttendance = {
  member: Member;
  summary: AttendanceSummary;
};

export type AuditLogEntry = {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: Timestamp;
};
