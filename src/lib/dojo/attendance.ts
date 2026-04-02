import type {
  AttendanceSummary,
  Camp,
  Member,
  MemberWithAttendance,
  TrainingSession,
} from "@/types";

function countCampAttendance(memberId: string, camps: Camp[]) {
  return camps.filter((camp) => camp.attendee_ids.includes(memberId)).length;
}

function countSessionAttendance(memberId: string, sessions: TrainingSession[]) {
  return sessions.filter((session) => session.attendee_ids.includes(memberId))
    .length;
}

export function calculateMemberAttendance(
  member: Member,
  camps: Camp[],
  sessions: TrainingSession[],
): AttendanceSummary {
  const attendedCamps = countCampAttendance(member.id, camps);
  const attendedSessions = countSessionAttendance(member.id, sessions);
  const totalEvents = camps.length + sessions.length;
  const attendedEvents = attendedCamps + attendedSessions;

  return {
    percent:
      totalEvents === 0 ? 0 : Math.round((attendedEvents / totalEvents) * 100),
    attendedCamps,
    totalCamps: camps.length,
    attendedSessions,
    totalSessions: sessions.length,
  };
}

export function calculateDashboardAttendance(
  members: Member[],
  camps: Camp[],
  sessions: TrainingSession[],
) {
  const activeMembers = members.filter((member) => member.active);

  if (activeMembers.length === 0) {
    return {
      activeMembers: 0,
      averageAttendancePercent: 0,
    };
  }

  const totalPercent = activeMembers.reduce((sum, member) => {
    return sum + calculateMemberAttendance(member, camps, sessions).percent;
  }, 0);

  return {
    activeMembers: activeMembers.length,
    averageAttendancePercent: Math.round(totalPercent / activeMembers.length),
  };
}

export function sortMembersByAttendance(
  members: Member[],
  camps: Camp[],
  sessions: TrainingSession[],
): MemberWithAttendance[] {
  return members
    .map((member) => ({
      member,
      summary: calculateMemberAttendance(member, camps, sessions),
    }))
    .sort((left, right) => right.summary.percent - left.summary.percent);
}
