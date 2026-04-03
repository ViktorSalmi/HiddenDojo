import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { Modal } from "@/components/ui/modal";
import { StatCards } from "@/components/ui/stat-cards";
import { beltMeta } from "@/lib/dojo/catalog";
import { calculateDashboardAttendance } from "@/lib/dojo/attendance";
import {
  formatDateLabel,
  getAvatarColors,
  getInitials,
  getTodayValue,
} from "@/lib/dojo/format";
import type { TrainingSessionMutationInput } from "@/lib/supabase/queries";
import type { Camp, Member, TrainingSession } from "@/types";

type TrainingViewProps = {
  camps: Camp[];
  error?: string | null;
  isMutating?: boolean;
  members: Member[];
  onDeleteTrainingSession: (id: string) => Promise<void> | void;
  onSaveTrainingSession: (
    input: TrainingSessionMutationInput,
  ) => Promise<void> | void;
  sessions: TrainingSession[];
};

export function TrainingView({
  camps,
  error = null,
  isMutating = false,
  members,
  onDeleteTrainingSession,
  onSaveTrainingSession,
  sessions,
}: TrainingViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [date, setDate] = useState(getTodayValue());
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const stats = calculateDashboardAttendance(members, camps, sessions);
  const pending = isMutating || isSaving || isDeleting;

  async function handleSave() {
    setIsSaving(true);

    try {
      try {
        await onSaveTrainingSession({
          date,
          member_ids: selectedIds,
          notes: null,
        });
      } catch {
        return;
      }

      setSelectedIds([]);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteSessionId) {
      return;
    }

    setIsDeleting(true);

    try {
      try {
        await onDeleteTrainingSession(deleteSessionId);
      } catch {
        return;
      }

      setDeleteSessionId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DashboardPage
      title="Registrera träning"
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
        <div className="mb-4 rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[13px] text-[color:var(--red)]">
          {error}
        </div>
      ) : null}
      <div className="panel mb-[18px] flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] text-[color:var(--ink2)]">Datum:</span>
          <input
            className="ui-input rounded-[12px] px-3 py-[9px] text-[13px] outline-none"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
          <button
            className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
            onClick={() => setSelectedIds(members.map((member) => member.id))}
            type="button"
          >
            Markera alla
          </button>
          <button
            className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
            onClick={() => setSelectedIds([])}
            type="button"
          >
            Rensa
          </button>
        </div>
        <button
          className="rounded-[12px] bg-[linear-gradient(180deg,#36935e_0%,var(--green)_100%)] px-[18px] py-2.5 text-[13px] font-medium text-white shadow-[0_10px_22px_rgba(45,122,79,0.18)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(45,122,79,0.22)] disabled:opacity-60"
          disabled={pending}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Sparar..." : "Spara träningspass"}
        </button>
      </div>
      <div className="mb-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const active = selectedSet.has(member.id);
          const [avatarBackground, avatarForeground] = getAvatarColors(member.id);

          return (
            <button
              key={member.id}
              className={`flex items-center gap-2.5 rounded-[10px] border p-[10px_14px] text-left transition-colors ${
                active
                  ? "border-[color:var(--green)] bg-[linear-gradient(180deg,#f7fcf8_0%,var(--green-pale)_100%)] shadow-[0_10px_20px_rgba(45,122,79,0.08)]"
                  : "panel-muted hover:border-[color:var(--border-strong)]"
              }`}
              onClick={() => {
                setSelectedIds((current) =>
                  current.includes(member.id)
                    ? current.filter((id) => id !== member.id)
                    : [...current, member.id],
                );
              }}
              type="button"
            >
              <div
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border ${
                  active ? "border-[color:var(--green)] bg-[var(--green)]" : "border-[#cccccc]"
                }`}
              >
                {active ? (
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-none stroke-white stroke-[2.5]">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                ) : null}
              </div>
              <div
                className="display-font flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: avatarBackground, color: avatarForeground }}
              >
                {getInitials(member.name)}
              </div>
              <div>
                <div
                  className={`text-[13px] font-medium ${
                    active ? "text-[color:var(--green)]" : "text-[color:var(--ink)]"
                  }`}
                >
                  {member.name}
                </div>
                <div className="text-[11px] text-[color:var(--ink3)]">
                  {beltMeta[member.belt].label.replace(" bälte", "")}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div>
        <div className="display-font mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink3)]">
          Loggade pass
        </div>
        <div className="space-y-1.5">
          {sessions.length === 0 ? (
            <div className="py-2 text-[12px] text-[color:var(--ink3)]">
              Inga pass loggade ännu
            </div>
          ) : (
            sessions.map((session) => {
              const names = session.attendee_ids
                .map((id) => members.find((member) => member.id === id)?.name.split(" ")[0])
                .filter(Boolean) as string[];

              return (
                <div
                  key={session.id}
                  className="panel-muted flex items-center gap-3 rounded-[14px] px-[14px] py-3"
                >
                  <div className="min-w-[88px] text-[12px] font-medium text-[color:var(--ink)]">
                    {formatDateLabel(session.date)}
                  </div>
                  <div className="flex flex-1 flex-wrap gap-1">
                    {names.map((name) => (
                      <span
                        key={`${session.id}-${name}`}
                        className="rounded-full bg-[var(--green-pale)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--green)]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-[color:var(--ink3)]">{names.length} elever</div>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] leading-none text-[#cccccc] transition-colors hover:bg-[var(--red-pale)] hover:text-[color:var(--red)]"
                    disabled={pending}
                    onClick={() => setDeleteSessionId(session.id)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Modal
        isOpen={deleteSessionId !== null}
        onClose={() => setDeleteSessionId(null)}
        widthClassName="max-w-[360px]"
      >
        <div className="display-font mb-2 text-[16px] font-extrabold text-[color:var(--ink)]">
          Ta bort pass
        </div>
        <p className="mb-6 text-[13px] leading-6 text-[color:var(--ink2)]">
          Tar bort det loggade träningspasset och närvaron som hör till det.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="ui-button-secondary rounded-[12px] px-[18px] py-[10px] text-[13px] text-[color:var(--ink2)]"
            disabled={pending}
            onClick={() => setDeleteSessionId(null)}
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

export function TrainingDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <TrainingView
      camps={dashboard.camps}
      error={dashboard.error}
      isMutating={dashboard.isMutating}
      members={dashboard.members}
      onDeleteTrainingSession={dashboard.deleteTrainingSession}
      onSaveTrainingSession={dashboard.saveTrainingSession}
      sessions={dashboard.sessions}
    />
  );
}

