import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { CampForm } from "@/components/forms/camp-form";
import {
  DashboardPage,
  type DashboardOutletContext,
} from "@/components/layout/dashboard-page";
import { Modal } from "@/components/ui/modal";
import { StatCards } from "@/components/ui/stat-cards";
import { calculateDashboardAttendance } from "@/lib/dojo/attendance";
import { formatDateLabel } from "@/lib/dojo/format";
import type { CampMutationInput } from "@/lib/supabase/queries";
import type { Camp, Member, TrainingSession } from "@/types";

type CampsViewProps = {
  camps: Camp[];
  error?: string | null;
  isMutating?: boolean;
  members: Member[];
  onCreateCamp: (input: CampMutationInput) => Promise<void> | void;
  onDeleteCamp: (id: string) => Promise<void> | void;
  onToggleAttendance: (campId: string, memberId: string) => Promise<void> | void;
  onUpdateCamp: (id: string, input: CampMutationInput) => Promise<void> | void;
  sessions: TrainingSession[];
};

export function CampsView({
  camps,
  error = null,
  isMutating = false,
  members,
  onCreateCamp,
  onDeleteCamp,
  onToggleAttendance,
  onUpdateCamp,
  sessions,
}: CampsViewProps) {
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteCampId, setDeleteCampId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const stats = calculateDashboardAttendance(members, camps, sessions);
  const pending = isMutating || isSubmitting || isDeleting;

  async function handleSubmit(input: CampMutationInput) {
    setIsSubmitting(true);

    try {
      try {
        if (editingCamp?.id) {
          await onUpdateCamp(editingCamp.id, input);
        } else {
          await onCreateCamp(input);
        }
      } catch {
        return;
      }

      setEditingCamp(null);
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteCampId) {
      return;
    }

    setIsDeleting(true);

    try {
      try {
        await onDeleteCamp(deleteCampId);
      } catch {
        return;
      }

      setDeleteCampId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DashboardPage
      title="Läger & tävlingar"
      actions={
        <button
          className="ui-button-primary rounded-[12px] px-[18px] py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
          disabled={pending}
          onClick={() => {
            setEditingCamp(null);
            setIsCreating(true);
          }}
          type="button"
        >
          + Nytt läger
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
        <div className="mb-4 rounded-[14px] border border-[color:var(--red)] bg-[var(--red-pale)] px-4 py-3 text-[13px] text-[color:var(--red)]">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {camps.length === 0 ? (
          <div className="panel rounded-[18px] px-6 py-12 text-center text-[13px] text-[color:var(--ink3)]">
            Inga läger registrerade ännu
          </div>
        ) : (
          camps.map((camp) => (
            <div
              key={camp.id}
              className="panel rounded-[18px] p-5"
            >
              <div className="mb-3.5 flex items-start justify-between gap-3">
                <div>
                  <div className="display-font text-[15px] font-bold text-[color:var(--ink)]">
                    {camp.name}
                  </div>
                  <div className="mt-1 text-[12px] text-[color:var(--ink3)]">
                    {formatDateLabel(camp.date)}
                    {camp.place ? ` • ${camp.place}` : ""}
                  </div>
                </div>
                <div className="rounded-full bg-[var(--red-pale)] px-3 py-1 text-[12px] font-medium text-[color:var(--red)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                  {camp.attendee_ids.length} / {members.length}
                </div>
              </div>
              <div className="mb-2 section-label">
                Klicka en elev för att toggla närvaro
              </div>
              <div className="flex flex-wrap gap-1.5">
                {members.map((member) => {
                  const active = camp.attendee_ids.includes(member.id);

                  return (
                    <button
                      key={member.id}
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-all ${
                        active
                          ? "border border-[rgba(45,122,79,0.12)] bg-[var(--green-pale)] text-[color:var(--green)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                          : "ui-button-pill text-[#8d877e]"
                      }`}
                      disabled={pending}
                      onClick={() => {
                        void (async () => {
                          try {
                            await onToggleAttendance(camp.id, member.id);
                          } catch {
                            return;
                          }
                        })();
                      }}
                      type="button"
                    >
                      {member.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="ui-button-secondary ui-success-ghost rounded-[10px] px-2.5 py-1.5 text-[12px] text-[color:var(--ink3)]"
                  disabled={pending}
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCamp(camp);
                  }}
                  type="button"
                >
                  Redigera
                </button>
                <button
                  className="ui-button-secondary ui-danger-ghost rounded-[10px] px-2.5 py-1.5 text-[12px] text-[color:var(--ink3)]"
                  disabled={pending}
                  onClick={() => setDeleteCampId(camp.id)}
                  type="button"
                >
                  Ta bort
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal
        isOpen={isCreating || editingCamp !== null}
        onClose={() => {
          setEditingCamp(null);
          setIsCreating(false);
        }}
      >
        <CampForm
          camp={editingCamp}
          members={members}
          onCancel={() => {
            setEditingCamp(null);
            setIsCreating(false);
          }}
          onDelete={() => {
            if (editingCamp?.id) {
              setDeleteCampId(editingCamp.id);
              setEditingCamp(null);
            }
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </Modal>
      <Modal
        isOpen={deleteCampId !== null}
        onClose={() => setDeleteCampId(null)}
        widthClassName="max-w-[360px]"
      >
        <div className="display-font mb-2 text-[16px] font-extrabold text-[color:var(--ink)]">
          Ta bort läger
        </div>
        <p className="mb-6 text-[13px] leading-6 text-[color:var(--ink2)]">
          Tar bort lägret och närvaron som hör till det.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="ui-button-secondary rounded-[12px] px-[18px] py-[10px] text-[13px] text-[color:var(--ink2)]"
            disabled={pending}
            onClick={() => setDeleteCampId(null)}
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

export function CampsDashboardRoute() {
  const dashboard = useOutletContext<DashboardOutletContext>();

  return (
    <CampsView
      camps={dashboard.camps}
      error={dashboard.error}
      isMutating={dashboard.isMutating}
      members={dashboard.members}
      onCreateCamp={dashboard.createCamp}
      onDeleteCamp={dashboard.deleteCamp}
      onToggleAttendance={dashboard.toggleCampAttendance}
      onUpdateCamp={dashboard.updateCamp}
      sessions={dashboard.sessions}
    />
  );
}

