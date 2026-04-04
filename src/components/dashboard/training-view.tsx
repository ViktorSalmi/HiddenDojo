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

const templatePresets = [
  {
    equipment: "Mittsar, koner",
    focus: "Distans, balans och gard",
    groupLabel: "Blandad grupp",
    label: "Teknikpass",
    notes:
      "Uppvärmning:\n- Lätt fotarbete och rörlighet\n\nTeknikblock:\n- Kihon i framåtrörelse\n- Fokus på gard och avstånd\n\nÖvningsblock:\n- Parövningar med kontrollerad kontakt\n\nAvslut:\n- Nedvarvning och kort reflektion",
    title: "Kihon och fotarbete",
  },
  {
    equipment: "Inget särskilt",
    focus: "Kata, timing och precision",
    groupLabel: "Katafokus",
    label: "Katapass",
    notes:
      "Uppvärmning:\n- Koordination och positioner\n\nTeknikblock:\n- Grundpositioner och övergången mellan dem\n\nKataarbete:\n- Repetition i delar\n- En hel genomgång med fokus på timing\n\nAvslut:\n- Individuell feedback",
    title: "Kata med detaljer",
  },
  {
    equipment: "Handskar, benskydd",
    focus: "Distansläsning och beslutsfattande",
    groupLabel: "Vuxna / fortsättning",
    label: "Sparringpass",
    notes:
      "Uppvärmning:\n- Puls, fotarbete, reaktionsstarter\n\nTeknikblock:\n- Ingångar och utgångar ur avstånd\n\nSparring:\n- Lätt sparring i korta intervaller\n- Fokus på kontroll och tajming\n\nAvslut:\n- Nedvarvning och avstämning",
    title: "Sparring och distans",
  },
] as const;

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

function getSessionTitle(session: Pick<TrainingSession, "title">) {
  return session.title?.trim() || "Planerad träning";
}

function getSessionStatus(session: TrainingSession, today: string) {
  if (session.date === today) {
    return {
      className: "bg-[rgba(29,111,196,0.12)] text-[color:var(--blue)]",
      label: "Idag",
    };
  }

  if (session.attendee_ids.length > 0 || session.date < today) {
    return {
      className: "bg-[rgba(45,122,79,0.12)] text-[color:var(--green)]",
      label: "Genomfört",
    };
  }

  return {
    className: "bg-[rgba(212,160,50,0.12)] text-[color:var(--gold)]",
    label: "Planerat",
  };
}

function getSessionSnippet(session: TrainingSession) {
  const value = session.notes?.trim();

  if (!value) {
    return "Inget passupplägg sparat ännu.";
  }

  if (value.length <= 180) {
    return value;
  }

  return `${value.slice(0, 177).trimEnd()}...`;
}

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
  const today = getTodayValue();
  const requestedDate = searchParams.get("date") || today;
  const [date, setDate] = useState(requestedDate);
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [groupLabel, setGroupLabel] = useState("");
  const [equipment, setEquipment] = useState("");
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
  const currentStatus = currentSession
    ? getSessionStatus(currentSession, today)
    : {
        className: "bg-[rgba(212,160,50,0.12)] text-[color:var(--gold)]",
        label: date === today ? "Planeras för idag" : "Inte sparat än",
      };

  useEffect(() => {
    setTitle(currentSession?.title ?? "");
    setFocus(currentSession?.focus ?? "");
    setGroupLabel(currentSession?.group_label ?? "");
    setEquipment(currentSession?.equipment ?? "");
    setNotes(currentSession?.notes ?? "");
  }, [
    currentSession?.equipment,
    currentSession?.focus,
    currentSession?.group_label,
    currentSession?.id,
    currentSession?.notes,
    currentSession?.title,
  ]);

  useEffect(() => {
    setDate(requestedDate);
  }, [requestedDate]);

  function applyTemplate(
    session: Pick<
      TrainingSession,
      "equipment" | "focus" | "group_label" | "notes" | "title"
    >,
  ) {
    setTitle(session.title ?? "");
    setFocus(session.focus ?? "");
    setGroupLabel(session.group_label ?? "");
    setEquipment(session.equipment ?? "");
    setNotes(session.notes ?? "");
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      try {
        await onSaveTrainingSession({
          date,
          equipment,
          focus,
          group_label: groupLabel,
          member_ids: [],
          notes,
          title,
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
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
              Träningsplanerare
            </div>
            <div className="mt-1 max-w-[62ch] text-[13px] leading-6 text-[color:var(--ink2)]">
              Här bygger du själva passet i förväg. Närvaron hanteras sedan i
              <span className="font-medium text-[color:var(--ink)]"> Checka in</span>, så den här sidan kan fokusera helt på upplägg, nivå och innehåll.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${currentStatus.className}`}>
              {currentStatus.label}
            </span>
            <span className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]">
              {currentSession
                ? `${currentSession.attendee_ids.length} incheckade på detta pass`
                : "Ingen närvaro kopplad ännu"}
            </span>
          </div>
        </div>

        <div className="mb-5 rounded-[18px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.45)_100%)] px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-label">Snabbstart</div>
              <div className="mt-1 text-[12px] leading-6 text-[color:var(--ink3)]">
                Välj ett färdigt upplägg som startpunkt och justera därefter.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {templatePresets.map((preset) => (
                <button
                  key={preset.label}
                  className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink2)]"
                  disabled={pending}
                  onClick={() =>
                    applyTemplate({
                      equipment: preset.equipment,
                      focus: preset.focus,
                      group_label: preset.groupLabel,
                      notes: preset.notes,
                      title: preset.title,
                    })
                  }
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[14px] bg-white/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="section-label">Valt datum</div>
              <div className="mt-2 text-[15px] font-semibold text-[color:var(--ink)]">
                {formatDateLabel(date)}
              </div>
            </div>
            <div className="rounded-[14px] bg-white/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="section-label">Målgrupp</div>
              <div className="mt-2 text-[15px] font-semibold text-[color:var(--ink)]">
                {groupLabel.trim() || "Inte vald ännu"}
              </div>
            </div>
            <div className="rounded-[14px] bg-white/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="section-label">Fokus</div>
              <div className="mt-2 text-[15px] font-semibold text-[color:var(--ink)]">
                {focus.trim() || "Ingen riktning satt"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    ? "Du redigerar ett pass som redan finns på detta datum."
                    : "Skapa i förväg och öppna check-in när träningen börjar."}
                </div>
              </div>
              <div className="md:col-span-2">
                <label
                  className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                  htmlFor="training-title"
                >
                  Titel
                </label>
                <input
                  id="training-title"
                  className="ui-input mt-2 w-full rounded-[14px] px-4 py-3 text-[14px] outline-none"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Till exempel: Kihon och fotarbete"
                  value={title}
                />
              </div>
              <div>
                <label
                  className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                  htmlFor="training-focus"
                >
                  Fokus
                </label>
                <input
                  id="training-focus"
                  className="ui-input mt-2 w-full rounded-[14px] px-4 py-3 text-[14px] outline-none"
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder="Distans, timing, kata..."
                  value={focus}
                />
              </div>
              <div>
                <label
                  className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                  htmlFor="training-group"
                >
                  Grupp / nivå
                </label>
                <input
                  id="training-group"
                  className="ui-input mt-2 w-full rounded-[14px] px-4 py-3 text-[14px] outline-none"
                  onChange={(event) => setGroupLabel(event.target.value)}
                  placeholder="Barn nybörjare, vuxna blandat..."
                  value={groupLabel}
                />
              </div>
              <div>
                <label
                  className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                  htmlFor="training-equipment"
                >
                  Utrustning
                </label>
                <input
                  id="training-equipment"
                  className="ui-input mt-2 w-full rounded-[14px] px-4 py-3 text-[14px] outline-none"
                  onChange={(event) => setEquipment(event.target.value)}
                  placeholder="Mittsar, handskar, koner..."
                  value={equipment}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  className="display-font text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
                  htmlFor="training-notes"
                >
                  Passupplägg
                </label>
                <div className="text-[12px] text-[color:var(--ink3)]">
                  Uppvärmning, teknikblock, övningar och avslut
                </div>
              </div>
              <textarea
                id="training-notes"
                className="ui-input min-h-[240px] w-full resize-y rounded-[16px] px-4 py-3 text-[14px] leading-7 outline-none"
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  "Uppvärmning:\n- 10 min fotarbete och rörlighet\n\nTeknikblock:\n- Kihon med fokus på balans\n\nÖvningar / sparring:\n- Parövningar i korta rundor\n\nAvslut:\n- Nedvarvning och repetition"
                }
                value={notes}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.4)_100%)] px-4 py-4">
              <div className="section-label">Översikt</div>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-[12px] text-[color:var(--ink3)]">Titel</div>
                  <div className="mt-1 text-[15px] font-semibold text-[color:var(--ink)]">
                    {title.trim() || "Planerad träning"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px] leading-6 text-[color:var(--ink2)]">
                  <div>
                    <div className="text-[color:var(--ink3)]">Fokus</div>
                    <div className="mt-1 font-medium text-[color:var(--ink)]">
                      {focus.trim() || "Inte satt"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[color:var(--ink3)]">Grupp</div>
                    <div className="mt-1 font-medium text-[color:var(--ink)]">
                      {groupLabel.trim() || "Inte satt"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[color:var(--ink3)]">Utrustning</div>
                  <div className="mt-1 text-[13px] leading-6 text-[color:var(--ink2)]">
                    {equipment.trim() || "Ingen särskild utrustning noterad ännu."}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.4)_100%)] px-4 py-4">
              <div className="section-label">Coachnotis</div>
              <div className="mt-2 text-[12px] leading-6 text-[color:var(--ink2)]">
                Om passet redan har använts i check-in ligger närvaron kvar. Du uppdaterar bara själva planeringen här.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            className="rounded-[12px] bg-[linear-gradient(180deg,#36935e_0%,var(--green)_100%)] px-[18px] py-2.5 text-[13px] font-medium text-white shadow-[0_10px_22px_rgba(45,122,79,0.18)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(45,122,79,0.22)] disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving
              ? "Sparar..."
              : currentSession
                ? "Spara pass"
                : "Spara pass"}
          </button>
        </div>
      </div>

      <div>
        <div className="display-font mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink3)]">
          Tidigare planering och genomförda pass
        </div>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="py-2 text-[12px] text-[color:var(--ink3)]">
              Inga pass registrerade ännu
            </div>
          ) : (
            sessions.map((session) => {
              const attendeeNames = session.attendee_ids
                .map((id) => members.find((member) => member.id === id)?.name)
                .filter(Boolean) as string[];
              const status = getSessionStatus(session, today);

              return (
                <div key={session.id} className="panel-muted rounded-[18px] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="display-font text-[18px] font-bold text-[color:var(--ink)]">
                          {getSessionTitle(session)}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] leading-6 text-[color:var(--ink3)]">
                        {formatDateLabel(session.date)}
                        {session.focus ? ` • ${session.focus}` : ""}
                        {session.group_label ? ` • ${session.group_label}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink2)]"
                        disabled={pending}
                        onClick={() => applyTemplate(session)}
                        type="button"
                      >
                        Använd som mall
                      </button>
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

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="space-y-3">
                      <div className="rounded-[14px] bg-white/78 px-4 py-3 text-[13px] leading-7 text-[color:var(--ink2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        {getSessionSnippet(session)}
                      </div>
                      {session.equipment ? (
                        <div className="text-[12px] leading-6 text-[color:var(--ink2)]">
                          <span className="font-semibold text-[color:var(--ink)]">Utrustning:</span>{" "}
                          {session.equipment}
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-[14px] border border-[color:var(--border)] bg-white/52 px-4 py-3">
                      <div className="section-label">Närvaro</div>
                      <div className="mt-2 text-[12px] text-[color:var(--ink3)]">
                        {attendeeNames.length > 0
                          ? `${attendeeNames.length} incheckade elever`
                          : "Ingen närvaro registrerad ännu"}
                      </div>
                      {attendeeNames.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
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


