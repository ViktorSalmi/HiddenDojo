import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { formatDateLabel, getTodayValue } from "@/lib/dojo/format";
import type { Camp, TrainingSession } from "@/types";

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
    session: sessions.find((session) => session.date === dateValue) ?? null,
  };
}

const weekdayLabels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

type CalendarViewProps = {
  camps: Camp[];
  sessions: TrainingSession[];
};

export function CalendarView({ camps, sessions }: CalendarViewProps) {
  const navigate = useNavigate();
  const today = getTodayValue();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const monthGrid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const selectedSummary = useMemo(
    () => summarizeDate(selectedDate, camps, sessions),
    [selectedDate, camps, sessions],
  );

  return (
    <DashboardPage title="Kalender">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel rounded-[20px] px-5 py-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
                Planering
              </div>
              <div className="mt-1 text-[13px] text-[color:var(--ink2)]">
                Klicka på ett datum för att planera pass, läger eller tävling.
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
                onClick={() => setMonthDate(startOfMonth(new Date()))}
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
              {monthDate.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
            </div>
            <div className="text-[12px] text-[color:var(--ink3)]">
              Träningar, läger och tävlingar i samma översikt
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
              const { camps: dayCamps, session } = summarizeDate(dateValue, camps, sessions);
              const isSelected = dateValue === selectedDate;
              const isToday = dateValue === today;

              return (
                <button
                  key={dateValue}
                  className={`min-h-[104px] rounded-[16px] border px-3 py-3 text-left transition-all ${
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
                        Träning
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
                        {getCampTypeLabel(camp.type)}
                      </div>
                    ))}
                    {dayCamps.length > 2 ? (
                      <div className="text-[11px] text-[color:var(--ink3)]">
                        +{dayCamps.length - 2} till
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel rounded-[20px] px-5 py-5">
          <div className="display-font text-[20px] font-bold text-[color:var(--ink)]">
            {formatDateLabel(selectedDate)}
          </div>
          <div className="mt-1 text-[13px] text-[color:var(--ink2)]">
            Välj vad som ska hända på den här dagen.
          </div>

          <div className="mt-5 space-y-3">
            <button
              className="ui-button-positive w-full rounded-[14px] px-4 py-3 text-[13px] font-medium text-white"
              onClick={() => navigate(`/dashboard/training?date=${selectedDate}`)}
              type="button"
            >
              Öppna träningsplanering
            </button>
            <button
              className="ui-button-secondary w-full rounded-[14px] px-4 py-3 text-[13px] font-medium text-[color:var(--ink2)]"
              onClick={() => navigate(`/dashboard/camps?date=${selectedDate}`)}
              type="button"
            >
              Öppna läger & tävlingar
            </button>
            {selectedDate === today ? (
              <button
                className="ui-button-secondary ui-success-ghost w-full rounded-[14px] px-4 py-3 text-[13px] font-medium text-[color:var(--ink2)]"
                onClick={() => navigate("/dashboard/check-in")}
                type="button"
              >
                Öppna check-in för idag
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="section-label">Träning</div>
              {selectedSummary.session ? (
                <div className="mt-2 rounded-[14px] bg-[var(--green-pale)] px-4 py-3">
                  <div className="text-[12px] font-semibold text-[color:var(--green)]">
                    {selectedSummary.session.title?.trim() || "Pass registrerat"}
                  </div>
                  <div className="mt-1 text-[12px] text-[color:var(--ink2)]">
                    {selectedSummary.session.focus
                      ? `${selectedSummary.session.focus} • `
                      : ""}
                    {selectedSummary.session.attendee_ids.length} incheckade
                  </div>
                  {selectedSummary.session.group_label ? (
                    <div className="mt-1 text-[12px] text-[color:var(--ink2)]">
                      Grupp: {selectedSummary.session.group_label}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[12px] leading-6 text-[color:var(--ink2)]">
                    {selectedSummary.session.notes || "Ingen beskrivning ännu."}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[12px] text-[color:var(--ink3)]">
                  Ingen träning planerad ännu.
                </div>
              )}
            </div>

            <div>
              <div className="section-label">Läger & tävlingar</div>
              {selectedSummary.camps.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedSummary.camps.map((camp) => (
                    <div key={camp.id} className="rounded-[14px] bg-[var(--red-pale)] px-4 py-3">
                      <div className="text-[12px] font-semibold text-[color:var(--red)]">
                        {getCampTypeLabel(camp.type)}: {camp.name}
                      </div>
                      <div className="mt-1 text-[12px] text-[color:var(--ink2)]">
                        {camp.place || "Plats inte satt ännu"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-[12px] text-[color:var(--ink3)]">
                  Inget läger eller tävling på detta datum.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}

export function CalendarDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return <CalendarView camps={dashboard.camps} sessions={dashboard.sessions} />;
}

