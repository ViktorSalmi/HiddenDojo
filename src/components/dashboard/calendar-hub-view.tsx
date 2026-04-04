import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { formatDateLabel, getTodayValue } from "@/lib/dojo/format";
import type {
  CampMutationInput,
  TrainingSessionMutationInput,
} from "@/lib/supabase/queries";
import type { Camp, TrainingSession } from "@/types";

type PanelKind = "träning" | "läger" | "tävling";

type CalendarHubViewProps = {
  camps: Camp[];
  error?: string | null;
  isMutating?: boolean;
  onCreateCamp: (input: CampMutationInput) => Promise<void> | void;
  onSaveTrainingSession: (
    input: TrainingSessionMutationInput,
  ) => Promise<void> | void;
  onUpdateCamp: (id: string, input: CampMutationInput) => Promise<void> | void;
  sessions: TrainingSession[];
};

const weekdayLabels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const panelKinds: PanelKind[] = ["träning", "läger", "tävling"];

function getCampTypeLabel(type: Camp["type"]) {
  return type === "tävling" ? "Tävling" : "Läger";
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthGrid(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function summarizeDate(
  dateValue: string,
  camps: Camp[],
  sessions: TrainingSession[],
) {
  return {
    camps: camps.filter((camp) => camp.date === dateValue),
    competitions: camps.filter(
      (camp) => camp.date === dateValue && camp.type === "tävling",
    ),
    session: sessions.find((session) => session.date === dateValue) ?? null,
    traditionalCamps: camps.filter(
      (camp) => camp.date === dateValue && camp.type === "läger",
    ),
  };
}

export function CalendarHubView({
  camps,
  error = null,
  isMutating = false,
  onCreateCamp,
  onSaveTrainingSession,
  onUpdateCamp,
  sessions,
}: CalendarHubViewProps) {
  const navigate = useNavigate();
  const today = getTodayValue();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const [panelKind, setPanelKind] = useState<PanelKind>("träning");
  const [editingCampId, setEditingCampId] = useState<string | null>(null);
  const [isEditingTraining, setIsEditingTraining] = useState(false);
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingFocus, setTrainingFocus] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [trainingGroupLabel, setTrainingGroupLabel] = useState("");
  const [trainingEquipment, setTrainingEquipment] = useState("");
  const [campName, setCampName] = useState("");
  const [campPlace, setCampPlace] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const monthGrid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const selectedSummary = useMemo(
    () => summarizeDate(selectedDate, camps, sessions),
    [selectedDate, camps, sessions],
  );
  const pending = isMutating || isSubmitting;
  const editingCamp =
    selectedSummary.camps.find((camp) => camp.id === editingCampId) ?? null;

  function resetQuickForm(kind: PanelKind) {
    setPanelKind(kind);
    setEditingCampId(null);
    setIsEditingTraining(false);
    setTrainingTitle("");
    setTrainingFocus("");
    setTrainingNotes("");
    setTrainingGroupLabel("");
    setTrainingEquipment("");
    setCampName("");
    setCampPlace("");
  }

  useEffect(() => {
    resetQuickForm("träning");
  }, [selectedDate]);

  function handleEditTraining() {
    setPanelKind("träning");
    setIsEditingTraining(true);
    setEditingCampId(null);
    setTrainingTitle(selectedSummary.session?.title ?? "");
    setTrainingFocus(selectedSummary.session?.focus ?? "");
    setTrainingNotes(selectedSummary.session?.notes ?? "");
    setTrainingGroupLabel(selectedSummary.session?.group_label ?? "");
    setTrainingEquipment(selectedSummary.session?.equipment ?? "");
  }

  function handleEditCamp(camp: Camp) {
    setPanelKind(camp.type);
    setEditingCampId(camp.id);
    setIsEditingTraining(false);
    setCampName(camp.name);
    setCampPlace(camp.place ?? "");
  }

  async function handleQuickSave() {
    setIsSubmitting(true);

    try {
      if (panelKind === "träning") {
        await onSaveTrainingSession({
          date: selectedDate,
          equipment: trainingEquipment.trim() || null,
          focus: trainingFocus.trim() || null,
          group_label: trainingGroupLabel.trim() || null,
          member_ids: [],
          notes: trainingNotes.trim() || null,
          title: trainingTitle.trim() || null,
        });
      } else {
        const payload: CampMutationInput = {
          attendee_ids: editingCamp?.attendee_ids ?? [],
          date: selectedDate,
          name: campName.trim(),
          place: campPlace.trim() || null,
          type: panelKind,
        };

        if (editingCamp?.id) {
          await onUpdateCamp(editingCamp.id, payload);
        } else {
          await onCreateCamp({ ...payload, attendee_ids: [] });
        }
      }

      resetQuickForm(panelKind);
    } finally {
      setIsSubmitting(false);
    }
  }

  const summaryCountLabel = [
    selectedSummary.session ? "1 träning" : null,
    selectedSummary.traditionalCamps.length > 0
      ? `${selectedSummary.traditionalCamps.length} läger`
      : null,
    selectedSummary.competitions.length > 0
      ? `${selectedSummary.competitions.length} tävlingar`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <DashboardPage title="Kalender">
      {error ? (
        <div className="mb-4 rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[13px] text-[color:var(--red)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="panel rounded-[20px] px-5 py-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
                Planering
              </div>
              <div className="mt-1 text-[13px] text-[color:var(--ink2)]">
                Välj datum och lägg snabbt in träning, läger eller tävling utan
                att lämna kalendern.
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                onClick={() => setMonthDate((current) => addMonths(current, -1))}
                type="button"
              >
                Föregående
              </button>
              <button
                className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                onClick={() => {
                  setMonthDate(startOfMonth(new Date()));
                  setSelectedDate(today);
                }}
                type="button"
              >
                Idag
              </button>
              <button
                className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                onClick={() => setMonthDate((current) => addMonths(current, 1))}
                type="button"
              >
                Nästa
              </button>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="display-font text-[24px] font-bold text-[color:var(--ink)]">
              {monthDate.toLocaleDateString("sv-SE", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="text-[12px] text-[color:var(--ink3)]">
              Klicka på en dag för att planera eller justera innehållet
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink3)]"
              >
                {label}
              </div>
            ))}
            {monthGrid.map((date) => {
              const dateValue = toDateValue(date);
              const inCurrentMonth = date.getMonth() === monthDate.getMonth();
              const { camps: dayCamps, session } = summarizeDate(
                dateValue,
                camps,
                sessions,
              );
              const isSelected = dateValue === selectedDate;
              const isToday = dateValue === today;

              return (
                <button
                  key={dateValue}
                  className={`relative min-h-[118px] rounded-[16px] border px-3 py-3 text-left transition-all ${
                    isSelected
                      ? "border-[rgba(232,57,42,0.18)] bg-[linear-gradient(180deg,#fff9f7_0%,#fff3ef_100%)] shadow-[0_14px_30px_rgba(192,40,26,0.08)]"
                      : "panel-muted hover:border-[color:var(--border-strong)]"
                  } ${!inCurrentMonth ? "opacity-45" : ""}`}
                  onClick={() => setSelectedDate(dateValue)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-semibold text-[color:var(--ink)]">
                      {date.getDate()}
                    </div>
                    {isToday ? (
                      <span className="rounded-full bg-[var(--red-pale)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--red)]">
                        Idag
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {session ? (
                      <div className="rounded-[10px] bg-[var(--green-pale)] px-2 py-1 text-[11px] font-medium text-[color:var(--green)]">
                        {session.title?.trim() || "Träning"}
                      </div>
                    ) : null}
                    {dayCamps.slice(0, 2).map((camp) => (
                      <div
                        key={camp.id}
                        className={`rounded-[10px] px-2 py-1 text-[11px] font-medium ${
                          camp.type === "tävling"
                            ? "bg-[rgba(29,111,196,0.12)] text-[color:var(--blue)]"
                            : "bg-[var(--red-pale)] text-[color:var(--red)]"
                        }`}
                      >
                        {camp.name}
                      </div>
                    ))}
                    {dayCamps.length > 2 ? (
                      <div className="text-[11px] text-[color:var(--ink3)]">
                        +{dayCamps.length - 2} till
                      </div>
                    ) : null}
                    {!session && dayCamps.length === 0 ? (
                      <div className="pt-5 text-[11px] text-[color:var(--ink3)]">
                        Tom dag
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel sticky top-0 self-start rounded-[20px] px-5 py-5">
          <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
            {formatDateLabel(selectedDate)}
          </div>
          <div className="mt-1 text-[13px] text-[color:var(--ink2)]">
            {summaryCountLabel || "Inget planerat ännu på detta datum."}
          </div>

          <div className="mt-5">
            <div className="mb-2 section-label">Redan inlagt</div>
            <div className="space-y-2.5">
              {selectedSummary.session ? (
                <div className="rounded-[14px] border border-[rgba(45,122,79,0.14)] bg-[var(--green-pale)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-semibold text-[color:var(--green)]">
                        Träning
                      </div>
                      <div className="mt-1 text-[14px] font-semibold text-[color:var(--ink)]">
                        {selectedSummary.session.title?.trim() || "Planerad träning"}
                      </div>
                      <div className="mt-1 text-[12px] leading-6 text-[color:var(--ink2)]">
                        {selectedSummary.session.focus
                          ? `${selectedSummary.session.focus} • `
                          : ""}
                        {selectedSummary.session.attendee_ids.length} incheckade
                      </div>
                    </div>
                    <button
                      className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                      onClick={handleEditTraining}
                      type="button"
                    >
                      Redigera
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedSummary.camps.map((camp) => (
                <div
                  key={camp.id}
                  className={`rounded-[14px] border px-4 py-3 ${
                    camp.type === "tävling"
                      ? "border-[rgba(29,111,196,0.14)] bg-[rgba(29,111,196,0.08)]"
                      : "border-[rgba(232,57,42,0.14)] bg-[var(--red-pale)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={`text-[12px] font-semibold ${
                          camp.type === "tävling"
                            ? "text-[color:var(--blue)]"
                            : "text-[color:var(--red)]"
                        }`}
                      >
                        {getCampTypeLabel(camp.type)}
                      </div>
                      <div className="mt-1 text-[14px] font-semibold text-[color:var(--ink)]">
                        {camp.name}
                      </div>
                      <div className="mt-1 text-[12px] leading-6 text-[color:var(--ink2)]">
                        {camp.place || "Plats inte satt ännu"}
                      </div>
                    </div>
                    <button
                      className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                      onClick={() => handleEditCamp(camp)}
                      type="button"
                    >
                      Redigera
                    </button>
                  </div>
                </div>
              ))}

              {!selectedSummary.session && selectedSummary.camps.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-[color:var(--border)] px-4 py-4 text-[12px] leading-6 text-[color:var(--ink3)]">
                  Ingen aktivitet sparad ännu. Välj typ nedan och lägg till direkt härifrån.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="section-label">
                {isEditingTraining || editingCampId ? "Redigera" : "Lägg till ny"}
              </div>
              {isEditingTraining || editingCampId ? (
                <button
                  className="ui-button-pill rounded-full px-3 py-1.5 text-[12px] text-[color:var(--ink2)]"
                  onClick={() => resetQuickForm(panelKind)}
                  type="button"
                >
                  Ny post
                </button>
              ) : null}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {panelKinds.map((kind) => {
                const active = panelKind === kind;

                return (
                  <button
                    key={kind}
                    className={`rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors ${
                      active
                        ? kind === "träning"
                          ? "bg-[var(--green)] text-white shadow-[0_10px_24px_rgba(45,122,79,0.18)]"
                          : kind === "tävling"
                            ? "bg-[color:var(--blue)] text-white shadow-[0_10px_24px_rgba(29,111,196,0.18)]"
                            : "bg-[color:var(--red)] text-white shadow-[0_10px_24px_rgba(232,57,42,0.18)]"
                        : "ui-button-pill text-[color:var(--ink2)]"
                    }`}
                    onClick={() => resetQuickForm(kind)}
                    type="button"
                  >
                    {kind === "träning"
                      ? "Träning"
                      : kind === "läger"
                        ? "Läger"
                        : "Tävling"}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {panelKind === "träning" ? (
                <>
                  <div>
                    <label className="section-label mb-1.5 block">Titel</label>
                    <input
                      className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
                      onChange={(event) => setTrainingTitle(event.target.value)}
                      placeholder="Till exempel: Kihon och fotarbete"
                      value={trainingTitle}
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1.5 block">Fokus</label>
                    <input
                      className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
                      onChange={(event) => setTrainingFocus(event.target.value)}
                      placeholder="Distans, kata, timing..."
                      value={trainingFocus}
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1.5 block">
                      Kort anteckning
                    </label>
                    <textarea
                      className="ui-input min-h-[120px] w-full rounded-[12px] px-3.5 py-3 text-[13px] leading-6 outline-none"
                      onChange={(event) => setTrainingNotes(event.target.value)}
                      placeholder="Kort plan för passet. Fullt upplägg kan du alltid göra i Planera träning."
                      value={trainingNotes}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="section-label mb-1.5 block">Namn</label>
                    <input
                      className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
                      onChange={(event) => setCampName(event.target.value)}
                      placeholder={
                        panelKind === "läger"
                          ? "Till exempel: Sommarläger"
                          : "Till exempel: Distriktsmästerskap"
                      }
                      value={campName}
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1.5 block">Plats</label>
                    <input
                      className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
                      onChange={(event) => setCampPlace(event.target.value)}
                      placeholder="Borås, Stockholm..."
                      value={campPlace}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className={`rounded-[12px] px-4 py-3 text-[13px] font-medium text-white ${
                  panelKind === "träning"
                    ? "ui-button-positive"
                    : panelKind === "tävling"
                      ? "bg-[linear-gradient(180deg,#2b80d7_0%,var(--blue)_100%)] shadow-[0_12px_26px_rgba(29,111,196,0.18)]"
                      : "ui-button-primary"
                } disabled:opacity-60`}
                disabled={
                  pending ||
                  (panelKind === "träning"
                    ? trainingTitle.trim().length === 0
                    : campName.trim().length === 0)
                }
                onClick={() => void handleQuickSave()}
                type="button"
              >
                {isSubmitting
                  ? "Sparar..."
                  : isEditingTraining || editingCampId
                    ? "Spara ändringar"
                    : `Lägg till ${
                        panelKind === "träning"
                          ? "träning"
                          : panelKind === "läger"
                            ? "läger"
                            : "tävling"
                      }`}
              </button>
              <button
                className="ui-button-secondary rounded-[12px] px-4 py-3 text-[13px] font-medium text-[color:var(--ink2)]"
                onClick={() =>
                  navigate(
                    panelKind === "träning"
                      ? `/dashboard/training?date=${selectedDate}`
                      : `/dashboard/camps?date=${selectedDate}`,
                  )
                }
                type="button"
              >
                Öppna full sida
              </button>
            </div>

            {selectedDate === today ? (
              <button
                className="ui-button-secondary ui-success-ghost mt-3 w-full rounded-[12px] px-4 py-3 text-[13px] font-medium text-[color:var(--ink2)]"
                onClick={() => navigate("/dashboard/check-in")}
                type="button"
              >
                Öppna check-in för idag
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}

export function CalendarDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <CalendarHubView
      camps={dashboard.camps}
      error={dashboard.error}
      isMutating={dashboard.isMutating}
      onCreateCamp={dashboard.createCamp}
      onSaveTrainingSession={dashboard.saveTrainingSession}
      onUpdateCamp={dashboard.updateCamp}
      sessions={dashboard.sessions}
    />
  );
}
