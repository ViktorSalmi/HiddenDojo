import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { MemberForm } from "@/components/forms/member-form";
import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { ExportLinks } from "@/components/ui/export-links";
import { Modal } from "@/components/ui/modal";
import { StatCards } from "@/components/ui/stat-cards";
import { beltMeta } from "@/lib/dojo/catalog";
import { calculateDashboardAttendance, calculateMemberAttendance } from "@/lib/dojo/attendance";
import {
  buildMembersCsv,
  downloadCsv,
  type MemberRow,
} from "@/lib/dojo/export";
import {
  getBeltLabel,
  formatDateLabel,
  getAttendanceColor,
  getAvatarColors,
  getGenderLabel,
  getInitials,
} from "@/lib/dojo/format";
import { downloadSimplePdfReport } from "@/lib/dojo/pdf";
import type { MemberMutationInput } from "@/lib/supabase/queries";
import type { Camp, Member, TrainingSession } from "@/types";

type MembersViewProps = {
  archivedMembers: Member[];
  camps: Camp[];
  error?: string | null;
  isLoading?: boolean;
  isMutating?: boolean;
  members: Member[];
  onCreateMember: (input: MemberMutationInput) => Promise<void> | void;
  onPermanentlyDeleteMember: (id: string) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  onSoftDeleteMember: (id: string) => Promise<void> | void;
  onUpdateMember: (
    id: string,
    input: MemberMutationInput,
  ) => Promise<void> | void;
  sessions: TrainingSession[];
};

type DeleteTarget = {
  id: string;
  mode: "hard" | "soft";
};

function EmptyState({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[10px] border border-[color:var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <div className="display-font text-[22px] font-bold text-[color:var(--ink)]">
        {title}
      </div>
      <div className="mt-2 text-[13px] text-[color:var(--ink3)]">{children}</div>
    </div>
  );
}

export function MembersView({
  archivedMembers,
  camps,
  error = null,
  isLoading = false,
  isMutating = false,
  members,
  onCreateMember,
  onPermanentlyDeleteMember,
  onRefresh,
  onSoftDeleteMember,
  onUpdateMember,
  sessions,
}: MembersViewProps) {
  const [query, setQuery] = useState("");
  const [beltFilter, setBeltFilter] = useState<"alla" | Member["belt"]>("alla");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMembers = members.filter((member) => {
    const matchesQuery = member.name.toLowerCase().includes(query.toLowerCase());
    const matchesBelt = beltFilter === "alla" || member.belt === beltFilter;
    return matchesQuery && matchesBelt;
  });
  const pending = isMutating || isSubmitting || isDeleting;
  const isFormOpen = isCreating || editingMember !== null;
  const stats = calculateDashboardAttendance(members, camps, sessions);

  function buildExportRows(): MemberRow[] {
    return members.map((member) => {
      const summary = calculateMemberAttendance(member, camps, sessions);

      return {
        age: member.age,
        attendancePercent: summary.percent,
        beltLabel: getBeltLabel(member.belt),
        genderLabel: getGenderLabel(member.gender),
        joinedDateLabel: member.joined_date,
        name: member.name,
        statusLabel: member.active ? "Aktiv" : "Inaktiv",
      };
    });
  }

  function handleExportCsv() {
    downloadCsv("medlemmar.csv", buildMembersCsv(buildExportRows()));
  }

  async function handleExportPdf() {
    const rows = buildExportRows();

    await downloadSimplePdfReport("medlemmar.pdf", {
      columns: ["Namn", "Kön", "Ålder", "Bälte", "Närvaro"],
      rows: rows.map((row) => [
        row.name,
        row.genderLabel,
        String(row.age),
        row.beltLabel,
        `${row.attendancePercent}%`,
      ]),
      subtitle: `${rows.length} aktiva medlemmar`,
      title: "Medlemmar",
    });
  }

  async function handleSubmit(input: MemberMutationInput) {
    setIsSubmitting(true);

    try {
      try {
        if (editingMember?.id) {
          await onUpdateMember(editingMember.id, input);
        } else {
          await onCreateMember(input);
        }
      } catch {
        return;
      }

      setEditingMember(null);
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      try {
        if (deleteTarget.mode === "hard") {
          await onPermanentlyDeleteMember(deleteTarget.id);
        } else {
          await onSoftDeleteMember(deleteTarget.id);
        }
      } catch {
        return;
      }

      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DashboardPage
      title="Medlemmar"
      search={
        <div className="relative">
          <input
            className="ui-input w-[240px] rounded-[12px] px-3 py-2.5 pl-8 text-[13px] outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök namn..."
            value={query}
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 fill-none stroke-[var(--ink3)] stroke-2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      }
      actions={
        <button
          className="ui-button-primary rounded-[12px] px-[18px] py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
          disabled={pending}
          onClick={() => {
            setEditingMember(null);
            setIsCreating(true);
          }}
          type="button"
        >
          + Ny medlem
        </button>
      }
      stats={
        <StatCards
          averageAttendancePercent={stats.averageAttendancePercent}
          campCount={camps.length}
          memberCount={members.length}
          sessionCount={sessions.length}
        />
      }
    >
      {error ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[13px] text-[color:var(--red)]">
          <span>{error}</span>
          {onRefresh ? (
            <button
              className="ui-button-secondary rounded-[10px] border-[color:var(--red)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--red)]"
              disabled={pending}
              onClick={() => void onRefresh()}
              type="button"
            >
              Försök igen
            </button>
          ) : null}
        </div>
      ) : null}
      <ExportLinks
        onExportCsv={handleExportCsv}
        onExportPdf={() => void handleExportPdf()}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["alla", ...Object.keys(beltMeta)] as Array<"alla" | Member["belt"]>).map(
          (belt) => (
            <button
              key={belt}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                beltFilter === belt
                  ? "border border-[color:var(--ink)] bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(14,14,14,0.12)]"
                  : "ui-button-pill text-[color:var(--ink2)] hover:text-[color:var(--ink)]"
              }`}
              onClick={() => setBeltFilter(belt)}
              type="button"
            >
              {belt === "alla" ? "Alla" : beltMeta[belt].label.replace(" bälte", "")}
            </button>
          ),
        )}
      </div>
      {isLoading && members.length === 0 ? (
        <EmptyState title="Laddar medlemmar...">
          Väntar på data från Supabase.
        </EmptyState>
      ) : (
        <div className="table-shell dojo-scrollbar overflow-x-auto rounded-[18px]">
          <table className="min-w-[920px] w-full table-fixed border-collapse">
            <thead className="table-head">
              <tr className="border-b border-[color:var(--border)]">
                <th className="w-[52px] px-5 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]" />
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Namn
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Ålder
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Bälte
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Sedan
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Närvaro
                </th>
                <th className="w-[180px] px-5 py-3 text-right text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-[13px] text-[color:var(--ink3)]"
                    colSpan={7}
                  >
                    Inga medlemmar hittades
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const attendance = calculateMemberAttendance(member, camps, sessions);
                  const [avatarBackground, avatarForeground] = getAvatarColors(member.id);
                  const attendanceColor = getAttendanceColor(attendance.percent);

                  return (
                    <tr
                      key={member.id}
                      className="table-row border-b border-[color:var(--border)] last:border-b-0"
                    >
                      <td className="px-5 py-3">
                        <div
                          className="display-font flex h-[34px] w-[34px] items-center justify-center rounded-full text-[12px] font-bold"
                          style={{
                            background: avatarBackground,
                            color: avatarForeground,
                          }}
                        >
                          {getInitials(member.name)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-medium text-[color:var(--ink)]">
                          {member.name}
                        </div>
                        <div className="mt-px text-[11px] text-[color:var(--ink3)]">
                          {getGenderLabel(member.gender)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">{member.age} år</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: `${beltMeta[member.belt].color}22`,
                            color:
                              member.belt === "vitt"
                                ? "#666666"
                                : beltMeta[member.belt].color,
                          }}
                        >
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{
                              background: beltMeta[member.belt].color,
                              border: member.belt === "vitt" ? "1px solid #cccccc" : "none",
                            }}
                          />
                          {beltMeta[member.belt].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[color:var(--ink3)]">
                        {formatDateLabel(member.joined_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            background: `${attendanceColor}18`,
                            color: attendanceColor,
                          }}
                        >
                          {attendance.percent}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          <button
                            className="ui-button-secondary ui-success-ghost inline-flex items-center whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[12px] text-[color:var(--ink3)]"
                            disabled={pending}
                            onClick={() => {
                              setIsCreating(false);
                              setEditingMember(member);
                            }}
                            type="button"
                          >
                            Redigera
                          </button>
                          <button
                            className="ui-button-secondary ui-danger-ghost inline-flex items-center whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[12px] text-[color:var(--ink3)]"
                            disabled={pending}
                            onClick={() =>
                              setDeleteTarget({ id: member.id, mode: "soft" })
                            }
                            type="button"
                          >
                            Ta bort
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {archivedMembers.length > 0 ? (
        <div className="mt-8">
          <h2 className="display-font mb-3 text-[18px] font-bold">Arkiverade medlemmar</h2>
          <div className="space-y-2">
            {archivedMembers.map((member) => (
              <div
                key={member.id}
                className="panel-muted flex items-center justify-between rounded-[16px] px-4 py-3"
              >
                <div>
                  <div className="text-[13px] font-medium">{member.name}</div>
                  <div className="text-[11px] text-[color:var(--ink3)]">
                    Arkiverad medlem
                  </div>
                </div>
                <button
                  className="ui-button-secondary ui-danger-ghost rounded-[12px] px-3.5 py-2 text-[12px] font-medium text-[color:var(--red)]"
                  disabled={pending}
                  onClick={() => setDeleteTarget({ id: member.id, mode: "hard" })}
                  type="button"
                >
                  Radera permanent
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setEditingMember(null);
          setIsCreating(false);
        }}
      >
        <MemberForm
          member={editingMember}
          onCancel={() => {
            setEditingMember(null);
            setIsCreating(false);
          }}
          onDelete={() => {
            if (editingMember?.id) {
              setDeleteTarget({ id: editingMember.id, mode: "soft" });
              setEditingMember(null);
            }
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </Modal>
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        widthClassName="max-w-[360px]"
      >
        <div className="display-font mb-2 text-[16px] font-extrabold text-[color:var(--ink)]">
          {deleteTarget?.mode === "hard" ? "Radera permanent" : "Arkivera medlem"}
        </div>
        <p className="mb-6 text-[13px] leading-6 text-[color:var(--ink2)]">
          {deleteTarget?.mode === "hard"
            ? "Detta tar bort medlemmen permanent inklusive kopplad närvarodata."
            : "Detta gör en soft delete och sätter active = false."}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="ui-button-secondary rounded-[12px] px-[18px] py-[10px] text-[13px] text-[color:var(--ink2)]"
            disabled={pending}
            onClick={() => setDeleteTarget(null)}
            type="button"
          >
            Avbryt
          </button>
          <button
            className="ui-button-primary rounded-[12px] px-5 py-[10px] text-[13px] font-medium text-white disabled:cursor-progress disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleDelete()}
            type="button"
          >
            {isDeleting ? "Sparar..." : "Bekräfta"}
          </button>
        </div>
      </Modal>
    </DashboardPage>
  );
}

export function MembersDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <MembersView
      archivedMembers={dashboard.archivedMembers}
      camps={dashboard.camps}
      error={dashboard.error}
      isLoading={dashboard.isLoading}
      isMutating={dashboard.isMutating}
      members={dashboard.members}
      onCreateMember={dashboard.createMember}
      onPermanentlyDeleteMember={dashboard.permanentlyDeleteMember}
      onRefresh={dashboard.refresh}
      onSoftDeleteMember={dashboard.softDeleteMember}
      onUpdateMember={dashboard.updateMember}
      sessions={dashboard.sessions}
    />
  );
}


