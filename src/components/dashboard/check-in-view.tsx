import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { formatDateLabel, getAvatarColors, getInitials, getTodayValue } from "@/lib/dojo/format";
import type { CheckInResult } from "@/lib/supabase/queries";
import type { Member, TrainingSession } from "@/types";

type CheckInMode = "coach" | "student";

type CheckInViewProps = {
  dateValue?: string;
  error?: string | null;
  initialMode?: CheckInMode;
  isMutating?: boolean;
  members: Member[];
  onCheckIn: (date: string, memberId: string) => Promise<CheckInResult | void> | void;
  onOpenCheckIn: (date: string) => Promise<void> | void;
  sessions: TrainingSession[];
};

function getTodaySession(sessions: TrainingSession[], dateValue: string) {
  return sessions.find((session) => session.date === dateValue) ?? null;
}

export function CheckInView({
  dateValue = getTodayValue(),
  error = null,
  initialMode = "coach",
  isMutating = false,
  members,
  onCheckIn,
  onOpenCheckIn,
  sessions,
}: CheckInViewProps) {
  const [mode, setMode] = useState<CheckInMode>(initialMode);
  const [query, setQuery] = useState("");
  const [confirmationName, setConfirmationName] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const todaySession = getTodaySession(sessions, dateValue);
  const checkedInIds = useMemo(
    () => new Set(todaySession?.attendee_ids ?? []),
    [todaySession],
  );
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const pending = isMutating || isOpening || submittingId !== null;

  useEffect(() => {
    if (!confirmationName) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setConfirmationName(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [confirmationName]);

  async function handleOpen() {
    setIsOpening(true);

    try {
      await onOpenCheckIn(dateValue);
      setMode("student");
    } finally {
      setIsOpening(false);
    }
  }

  async function handleCheckIn(member: Member) {
    if (checkedInIds.has(member.id)) {
      return;
    }

    setSubmittingId(member.id);

    try {
      const result = await onCheckIn(dateValue, member.id);

      if (result === "already-checked-in") {
        return;
      }

      setConfirmationName(member.name);
      setQuery("");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <DashboardPage title="Checka in">
      {mode === "coach" ? (
        <div className="panel mx-auto max-w-[880px] rounded-[24px] px-8 py-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,var(--red-pale)_0%,#fff6f4_100%)] text-[color:var(--red)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.8]">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div className="display-font text-[34px] font-extrabold text-[color:var(--ink)]">
            Incheckning för {formatDateLabel(dateValue)}
          </div>
          {todaySession?.notes ? (
            <div className="mx-auto mt-4 max-w-[58ch] rounded-[18px] bg-white/70 px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="section-label">Dagens passupplägg</div>
              <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink2)]">
                {todaySession.notes}
              </p>
            </div>
          ) : (
            <p className="mx-auto mt-3 max-w-[54ch] text-[15px] leading-7 text-[color:var(--ink2)]">
              Öppna incheckningen för dagens träning. Om inget pass är planerat ännu
              skapas det automatiskt när du startar.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="ui-button-pill rounded-full px-4 py-2 text-[13px] font-medium text-[color:var(--ink2)]">
              {todaySession ? `${todaySession.attendee_ids.length} redan incheckade` : "Inget pass öppnat än"}
            </div>
          </div>
          {error ? (
            <div className="mx-auto mt-6 max-w-[520px] rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[13px] text-[color:var(--red)]">
              {error}
            </div>
          ) : null}
          <div className="mt-8">
            <button
              className="ui-button-primary rounded-[16px] px-7 py-4 text-[16px] font-semibold text-white disabled:opacity-60"
              disabled={pending}
              onClick={() => void handleOpen()}
              type="button"
            >
              {isOpening ? "Öppnar..." : "Öppna incheckning för idag"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
          <div className="panel rounded-[22px] px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-label">Dagens träning</div>
                <div className="display-font mt-2 text-[32px] font-extrabold text-[color:var(--ink)]">
                  Checka in dig här
                </div>
                <div className="mt-2 text-[14px] text-[color:var(--ink2)]">
                  {formatDateLabel(dateValue)} • {checkedInIds.size} incheckade
                </div>
              </div>
              <div className="relative w-full max-w-[420px]">
                <input
                  className="ui-input w-full rounded-[16px] px-4 py-4 pl-11 text-[17px] outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Sök namn..."
                  value={query}
                />
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 fill-none stroke-[var(--ink3)] stroke-2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[14px] text-[color:var(--red)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.length === 0 ? (
              <div className="panel col-span-full rounded-[20px] px-6 py-12 text-center">
                <div className="display-font text-[24px] font-bold text-[color:var(--ink)]">
                  Ingen träff
                </div>
                <div className="mt-2 text-[14px] text-[color:var(--ink3)]">
                  Prova att söka på ett annat namn.
                </div>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isCheckedIn = checkedInIds.has(member.id);
                const isSaving = submittingId === member.id;
                const [avatarBackground, avatarForeground] = getAvatarColors(member.id);

                return (
                  <button
                    key={member.id}
                    aria-label={member.name}
                    className={`group relative rounded-[22px] border px-5 py-5 text-left transition-all ${
                      isCheckedIn
                        ? "border-[rgba(45,122,79,0.15)] bg-[linear-gradient(180deg,#f7fcf8_0%,var(--green-pale)_100%)] shadow-[0_14px_28px_rgba(45,122,79,0.08)]"
                        : "panel hover:-translate-y-[1px] hover:border-[color:var(--border-strong)]"
                    }`}
                    disabled={isCheckedIn || pending}
                    onClick={() => void handleCheckIn(member)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="display-font flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[16px] font-bold"
                          style={{ background: avatarBackground, color: avatarForeground }}
                        >
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="text-[19px] font-semibold text-[color:var(--ink)]">
                            {member.name}
                          </div>
                          <div className="mt-1 text-[13px] text-[color:var(--ink3)]">
                            Tryck för att checka in
                          </div>
                        </div>
                      </div>
                      {isCheckedIn ? (
                        <span className="inline-flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-[rgba(45,122,79,0.12)] px-3 py-1 text-[12px] font-semibold text-[color:var(--green)]">
                          Redan incheckad
                        </span>
                      ) : null}
                    </div>
                    {!isCheckedIn ? (
                      <div className="mt-5 rounded-[14px] bg-[linear-gradient(180deg,var(--red2)_0%,var(--red)_100%)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-[0_14px_26px_rgba(192,40,26,0.18)] transition-transform group-hover:-translate-y-[1px]">
                        {isSaving ? "Sparar..." : "Checka in"}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-[14px] bg-white/70 px-4 py-3 text-center text-[15px] font-semibold text-[color:var(--green)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                        Incheckad
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {confirmationName ? (
            <div className="pointer-events-none fixed inset-0 z-[400] flex items-start justify-center px-4 pt-8 sm:pt-10">
              <div className="w-full max-w-[480px] rounded-[28px] bg-[linear-gradient(180deg,#3a9a66_0%,var(--green)_100%)] px-7 py-6 text-white shadow-[0_28px_60px_rgba(45,122,79,0.28)] ring-1 ring-white/15">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-white stroke-[2.4]">
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/72">
                      Bekräftat
                    </div>
                    <div className="mt-1 text-[24px] leading-tight font-semibold">
                      {confirmationName} är incheckad
                    </div>
                    <div className="mt-1 text-[14px] text-white/78">
                      Du är nu registrerad för dagens träning.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </DashboardPage>
  );
}

export function CheckInDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <CheckInView
      error={dashboard.error}
      isMutating={dashboard.isMutating}
      members={dashboard.members}
      onCheckIn={dashboard.checkInMemberForDate}
      onOpenCheckIn={dashboard.ensureTrainingSession}
      sessions={dashboard.sessions}
    />
  );
}

