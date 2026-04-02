export type MemberRow = {
  name: string;
  genderLabel: string;
  age: number;
  beltLabel: string;
  joinedDateLabel: string;
  attendancePercent: number;
  statusLabel: string;
};

export type AttendanceRow = {
  name: string;
  beltLabel: string;
  campsLabel: string;
  sessionsLabel: string;
  percent: number;
};

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, csvText: string) {
  downloadBlob(filename, new Blob([csvText], { type: "text/csv;charset=utf-8" }));
}

export function sanitizeCsvCell(value: string | number) {
  const stringValue = String(value);

  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

function buildCsvLine(values: Array<string | number>) {
  return values.map((value) => sanitizeCsvCell(value)).join(",");
}

export function buildMembersCsv(rows: MemberRow[]) {
  return [
    buildCsvLine([
      "Namn",
      "Kon",
      "Age",
      "Balte",
      "Startdatum",
      "Narvaro %",
      "Status",
    ]),
    ...rows.map((row) =>
      buildCsvLine([
        row.name,
        row.genderLabel,
        row.age,
        row.beltLabel,
        row.joinedDateLabel,
        row.attendancePercent,
        row.statusLabel,
      ]),
    ),
  ].join("\n");
}

export function buildAttendanceCsv(rows: AttendanceRow[]) {
  return [
    buildCsvLine(["Namn", "Balte", "Lager", "Traningar", "Narvaro %"]),
    ...rows.map((row) =>
      buildCsvLine([
        row.name,
        row.beltLabel,
        row.campsLabel,
        row.sessionsLabel,
        row.percent,
      ]),
    ),
  ].join("\n");
}
