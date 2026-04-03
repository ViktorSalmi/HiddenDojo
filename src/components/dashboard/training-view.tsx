import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { Modal } from "@/components/ui/modal";
import { StatCards } from "@/components/ui/stat-cards";
import { calculateDashboardAttendance } from "@/lib/dojo/attendance";
import { formatDateLabel, getTodayValue } from "@/lib/dojo/format";
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
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get("date") || getTodayValue();
  const [date, setDate] = useState(requestedDate);
  const [notes, setNotes] = useState("");
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentSession = useMemo(
    () => sessions.find((session) => session.date === date) ?? null,
    [date, sessions],
  );
  const stats = calculateDashboardAttendance(members, camps, sessions);
  const pending = isMutating || isSaving || isDeleting;

  useEffect(() => {
    setNotes(currentSession?.notes ?? "");
  }, [currentSession?.id, currentSession?.notes]);

  useEffect(() => {
    setDate(requestedDate);
  }, [requestedDate]);

  async function handleSave() {
    setIsSaving(true);

    try {
      try {
        await onSaveTrainingSession({
          date,
          member_ids: [],
          notes,
        });
      } catch {
        return;
      }
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
      title="Planera träning"
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

      <div className="panel mb-5 rounded-[18px] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
              Passupplägg
            </div>
            <div className="mt-1 max-w-[62ch] text-[13px] leading-6 text-[color:var(--ink2)]">
              Här planerar du själva passet i förväg. Närvaron hanteras sedan i
              <span className="font-medium text-[color:var(--ink)]"> Checka in</span> när träningen faktiskt börjar.
            </div>
          </div>
          <div className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]">
            {currentSession
              ? `${currentSession.attendee_ids.length} incheckade på detta pass`
              : "Inget pass skapat ännu"}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <label className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]">
              Datum
            </label>
            <input
              className="ui-input mt-2 w-full rounded-[14px] px-3 py-3 text-[14px] outline-none"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
            <div className="mt-3 text-[12px] leading-6 text-[color:var(--ink3)]">
              {currentSession
                ? "Det finns redan ett pass på detta datum. Du redigerar nu samma pass som check-in använder."
                : "Skapa passet i förväg, så kan du öppna check-in för samma datum senare."}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                htmlFor="training-notes"
              >
                Passbeskrivning
              </label>
              <div className="text-[12px] text-[color:var(--ink3)]">
                Teknik, fokus, upplägg och kommentarer
              </div>
            </div>
            <textarea
              id="training-notes"
              className="ui-input min-h-[160px] w-full resize-y rounded-[16px] px-4 py-3 text-[14px] leading-6 outline-none"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Till exempel: kihon med fotarbete, kata-repetition, lätt sparring och fokus på distans."
              value={notes}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            className="rounded-[12px] bg-[linear-gradient(180deg,#36935e_0%,var(--green)_100%)] px-[18px] py-2.5 text-[13px] font-medium text-white shadow-[0_10px_22px_rgba(45,122,79,0.18)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(45,122,79,0.22)] disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "Sparar..." : currentSession ? "Uppdatera passupplägg" : "Skapa träningspass"}
          </button>
        </div>
      </div>

      <div>
        <div className="display-font mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink3)]">
          Planerade och loggade pass
        </div>
        <div className="space-y-1.5">
          {sessions.length === 0 ? (
            <div className="py-2 text-[12px] text-[color:var(--ink3)]">
              Inga pass registrerade ännu
            </div>
          ) : (
            sessions.map((session) => {
              const attendeeNames = session.attendee_ids
                .map((id) => members.find((member) => member.id === id)?.name)
                .filter(Boolean) as string[];

              return (
                <div key={session.id} className="panel-muted rounded-[14px] px-[14px] py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-[88px] pt-1 text-[12px] font-medium text-[color:var(--ink)]">
                      {formatDateLabel(session.date)}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="text-[12px] text-[color:var(--ink3)]">
                        {attendeeNames.length > 0
                          ? `${attendeeNames.length} incheckade elever`
                          : "Ingen närvaro registrerad ännu"}
                      </div>
                      {attendeeNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {attendeeNames.map((name) => (
                            <span
                              key={`${session.id}-${name}`}
                              className="rounded-full bg-[var(--green-pale)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--green)]"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {session.notes ? (
                        <div className="rounded-[12px] bg-white/75 px-3 py-2 text-[12px] leading-6 text-[color:var(--ink2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                          {session.notes}
                        </div>
                      ) : (
                        <div className="text-[12px] italic text-[color:var(--ink3)]">
                          Ingen passbeskrivning ännu
                        </div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-3 pl-2">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] leading-none text-[#cccccc] transition-colors hover:bg-[var(--red-pale)] hover:text-[color:var(--red)]"
                        disabled={pending}
                        onClick={() => setDeleteSessionId(session.id)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
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
          Tar bort det planerade träningspasset och eventuell närvaro som hör till det.
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


