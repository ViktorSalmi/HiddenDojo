import { describe, expect, it } from "vitest";

import {
  buildAttendanceCsv,
  buildMembersCsv,
  sanitizeCsvCell,
} from "@/lib/dojo/export";
import type { AttendanceRow, MemberRow } from "@/lib/dojo/export";

describe("sanitizeCsvCell", () => {
  it("quotes cells with commas, quotes, or new lines", () => {
    expect(sanitizeCsvCell('Karlstad, "SE"\nHall')).toBe(
      '"Karlstad, ""SE""\nHall"',
    );
  });
});

describe("buildMembersCsv", () => {
  it("builds a csv with the expected header and row order", () => {
    const csv = buildMembersCsv([
      {
        name: "Erik Lindstrom",
        genderLabel: "Pojke",
        age: 17,
        beltLabel: "Svart balte",
        joinedDateLabel: "2019-09-01",
        attendancePercent: 100,
        statusLabel: "Aktiv",
      },
    ] satisfies MemberRow[]);

    expect(csv).toContain(
      "Namn,Kon,Age,Balte,Startdatum,Narvaro %,Status",
    );
    expect(csv).toContain(
      "Erik Lindstrom,Pojke,17,Svart balte,2019-09-01,100,Aktiv",
    );
  });
});

describe("buildAttendanceCsv", () => {
  it("builds an attendance csv with summary columns", () => {
    const csv = buildAttendanceCsv([
      {
        name: "Sara Nilsson",
        beltLabel: "Brunt balte",
        campsLabel: "0 / 1",
        sessionsLabel: "1 / 2",
        percent: 33,
      },
    ] satisfies AttendanceRow[]);

    expect(csv).toContain("Namn,Balte,Lager,Traningar,Narvaro %");
    expect(csv).toContain("Sara Nilsson,Brunt balte,0 / 1,1 / 2,33");
  });
});
