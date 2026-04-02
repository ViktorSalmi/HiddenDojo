import { describe, expect, it } from "vitest";

import {
  calculateDashboardAttendance,
  calculateMemberAttendance,
  sortMembersByAttendance,
} from "@/lib/dojo/attendance";
import type { Camp, Member, TrainingSession } from "@/types";

const members: Member[] = [
  {
    id: "member-1",
    name: "Erik Lindstrom",
    age: 17,
    gender: "M",
    belt: "svart",
    joined_date: "2019-09-01",
    active: true,
    created_at: null,
    updated_at: null,
  },
  {
    id: "member-2",
    name: "Sara Nilsson",
    age: 14,
    gender: "F",
    belt: "brunt",
    joined_date: "2020-03-15",
    active: true,
    created_at: null,
    updated_at: null,
  },
];

const camps: Camp[] = [
  {
    id: "camp-1",
    name: "Sommarlager",
    date: "2025-07-14",
    place: "Karlstad",
    created_at: null,
    updated_at: null,
    attendee_ids: ["member-1"],
  },
];

const sessions: TrainingSession[] = [
  {
    id: "session-1",
    date: "2025-03-10",
    notes: null,
    created_at: null,
    attendee_ids: ["member-1", "member-2"],
  },
  {
    id: "session-2",
    date: "2025-03-17",
    notes: null,
    created_at: null,
    attendee_ids: ["member-1"],
  },
];

describe("calculateMemberAttendance", () => {
  it("calculates all-history attendance across camps and sessions", () => {
    const summary = calculateMemberAttendance(members[0], camps, sessions);

    expect(summary).toEqual({
      percent: 100,
      attendedCamps: 1,
      totalCamps: 1,
      attendedSessions: 2,
      totalSessions: 2,
    });
  });

  it("returns partial attendance for members who miss events", () => {
    const summary = calculateMemberAttendance(members[1], camps, sessions);

    expect(summary).toEqual({
      percent: 33,
      attendedCamps: 0,
      totalCamps: 1,
      attendedSessions: 1,
      totalSessions: 2,
    });
  });

  it("treats an empty schedule as zero percent attendance", () => {
    const summary = calculateMemberAttendance(members[0], [], []);

    expect(summary.percent).toBe(0);
    expect(summary.totalCamps).toBe(0);
    expect(summary.totalSessions).toBe(0);
  });
});

describe("calculateDashboardAttendance", () => {
  it("averages active members only", () => {
    const summary = calculateDashboardAttendance(
      [
        ...members,
        {
          ...members[1],
          id: "member-3",
          name: "Inactive Member",
          active: false,
        },
      ],
      camps,
      sessions,
    );

    expect(summary.activeMembers).toBe(2);
    expect(summary.averageAttendancePercent).toBe(67);
  });
});

describe("sortMembersByAttendance", () => {
  it("sorts members by attendance descending", () => {
    const sorted = sortMembersByAttendance(members, camps, sessions);

    expect(sorted.map((entry) => entry.member.id)).toEqual([
      "member-1",
      "member-2",
    ]);
    expect(sorted[0].summary.percent).toBeGreaterThan(sorted[1].summary.percent);
  });
});
