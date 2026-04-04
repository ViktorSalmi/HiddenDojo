import { useOutletContext } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { ExportLinks } from "@/components/ui/export-links";
import { StatCards } from "@/components/ui/stat-cards";
import {
  calculateDashboardAttendance,
  calculateMemberAttendance,
  sortMembersByAttendance,
} from "@/lib/dojo/attendance";
import {
  buildAttendanceCsv,
  downloadCsv,
  type AttendanceRow,
} from "@/lib/dojo/export";
import {
  getAttendanceColor,
  getAvatarColors,
  getBeltLabel,
  getInitials,
} from "@/lib/dojo/format";
import { downloadBrandedPdfReport } from "@/lib/dojo/pdf-report";
import type { Camp, Member, TrainingSession } from "@/types";

type AttendanceViewProps = {
  camps: Camp[];
  members: Member[];
  sessions: TrainingSession[];
};

function getDatedFilename(prefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}`;
}

function buildAttendanceRows(
  members: Member[],
  camps: Camp[],
  sessions: TrainingSession[],
) {
  return sortMembersByAttendance(members, camps, sessions).map((entry) => ({
    beltLabel: getBeltLabel(entry.member.belt),
    member: entry.member,
    summary: entry.summary,
  }));
}

function buildAttendanceExportRows(
  members: Member[],
  camps: Camp[],
  sessions: TrainingSession[],
): AttendanceRow[] {
  return buildAttendanceRows(members, camps, sessions).map(({ beltLabel, member, summary }) => ({
    beltLabel,
    campsLabel: `${summary.attendedCamps} / ${summary.totalCamps}`,
    name: member.name,
    percent: summary.percent,
    sessionsLabel: `${summary.attendedSessions} / ${summary.totalSessions}`,
  }));
}

export function AttendanceView({
  camps,
  members,
  sessions,
}: AttendanceViewProps) {
  const rows = buildAttendanceRows(members, camps, sessions);
  const stats = calculateDashboardAttendance(members, camps, sessions);

  function exportAttendanceCsv() {
    downloadCsv(
      `${getDatedFilename("narvaro")}.csv`,
      buildAttendanceCsv(buildAttendanceExportRows(members, camps, sessions)),
    );
  }

  async function exportAttendancePdf() {
    await downloadBrandedPdfReport(`${getDatedFilename("narvaro")}.pdf`, {
      columns: [
        { header: "Namn", width: 2.1 },
        { header: "Bälte", width: 1.2 },
        { header: "Läger", width: 1.0, align: "center" },
        { header: "Träningar", width: 1.1, align: "center" },
        { header: "Närvaro", width: 1.0, align: "right" },
      ],
      footerNote: "Närvarorapport för Hidden Karate",
      rows: rows.map(({ beltLabel, member, summary }) => [
        member.name,
        beltLabel,
        `${summary.attendedCamps} / ${summary.totalCamps}`,
        `${summary.attendedSessions} / ${summary.totalSessions}`,
        `${summary.percent}%`,
      ]),
      subtitle: `${members.length} aktiva medlemmar med samlad närvarostatistik`,
      summaryCards: [
        {
          label: "Aktiva medlemmar",
          helper: "Underlag för dagens rapport",
          tone: "blue",
          value: String(members.length),
        },
        {
          label: "Snittnärvaro",
          helper: "Över alla loggade pass",
          tone: "green",
          value: `${stats.averageAttendancePercent}%`,
        },
        {
          label: "Läger loggade",
          helper: "Registrerade lägerdagar",
          tone: "red",
          value: String(camps.length),
        },
        {
          label: "Träningar loggade",
          helper: "Registrerade träningspass",
          tone: "gold",
          value: String(sessions.length),
        },
      ],
      title: "Närvaro",
    });
  }

  return (
    <DashboardPage
      title="Närvaro"
      stats={
        <StatCards
          averageAttendancePercent={stats.averageAttendancePercent}
          campCount={camps.length}
          memberCount={members.length}
          sessionCount={sessions.length}
        />
      }
    >
      <ExportLinks
        csvLabel="Ladda ner närvaro som CSV"
        onExportCsv={exportAttendanceCsv}
        onExportPdf={() => void exportAttendancePdf()}
        pdfLabel="Ladda ner närvaro som PDF"
      />
      <div className="table-shell dojo-scrollbar overflow-x-auto rounded-[18px]">
        <table className="min-w-[900px] w-full table-fixed border-collapse">
          <thead className="table-head">
            <tr className="border-b border-[color:var(--border)]">
              <th className="w-[52px] px-5 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]" />
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">Namn</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">Bälte</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">Läger</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">Träningar</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">Närvaro</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ beltLabel, member, summary }) => {
              const [avatarBackground, avatarForeground] = getAvatarColors(member.id);
              const color = getAttendanceColor(summary.percent);

              return (
                <tr
                  key={member.id}
                  className="table-row border-b border-[color:var(--border)] last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <div
                      className="display-font flex h-[34px] w-[34px] items-center justify-center rounded-full text-[12px] font-bold"
                      style={{ background: avatarBackground, color: avatarForeground }}
                    >
                      {getInitials(member.name)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-[13px]">{beltLabel}</td>
                  <td className="px-4 py-3 text-[13px] text-[color:var(--ink3)]">
                    {summary.attendedCamps} / {summary.totalCamps}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[color:var(--ink3)]">
                    {summary.attendedSessions} / {summary.totalSessions}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-[8px] w-[140px] overflow-hidden rounded-full bg-[#ece7df]">
                      <div
                        className="h-[8px] rounded-full"
                        style={{ background: color, width: `${summary.percent}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: `${color}18`, color }}
                    >
                      {summary.percent}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardPage>
  );
}

export function AttendanceDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <AttendanceView
      camps={dashboard.camps}
      members={dashboard.members}
      sessions={dashboard.sessions}
    />
  );
}


