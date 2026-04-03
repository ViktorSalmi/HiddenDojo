import { getTodayValue } from "@/lib/dojo/format";
import * as React from "react";
import type { CampMutationInput } from "@/lib/supabase/queries";
import type { Camp, Member } from "@/types";

type CampFormProps = {
  camp?: Camp | null;
  members: Member[];
  onCancel: () => void;
  onDelete?: () => void;
  onSubmit: (input: CampMutationInput) => Promise<void> | void;
  pending: boolean;
};

function readCampInput(form: HTMLFormElement): CampMutationInput {
  const formData = new FormData(form);

  return {
    attendee_ids: formData
      .getAll("attendee_ids")
      .map((value) => String(value))
      .filter(Boolean),
    date: String(formData.get("date") ?? getTodayValue()),
    name: String(formData.get("name") ?? "").trim(),
    place: String(formData.get("place") ?? "").trim() || null,
    type: (String(formData.get("type") ?? "läger") as CampMutationInput["type"]),
  };
}

export function CampForm({
  camp,
  members,
  onCancel,
  onDelete,
  onSubmit,
  pending,
}: CampFormProps) {
  const selectedIds = new Set(camp?.attendee_ids ?? []);
  const [selectedType, setSelectedType] = React.useState<CampMutationInput["type"]>(
    camp?.type ?? "läger",
  );

  return (
    <form
      key={camp?.id ?? "new-camp"}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(readCampInput(event.currentTarget));
      }}
    >
      <div className="display-font mb-6 text-[22px] font-extrabold text-[color:var(--ink)]">
        {camp ? "Redigera läger / tävling" : "Nytt läger / tävling"}
      </div>
      <div className="mb-3.5">
        <label className="section-label mb-2 block">
          Typ
        </label>
        <div className="flex flex-wrap gap-2">
          {(["läger", "tävling"] as const).map((type) => {
            const selected = selectedType === type;

            return (
              <label
                key={type}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors ${
                  selected
                    ? "border border-[color:var(--ink)] bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(14,14,14,0.12)]"
                    : "ui-button-pill text-[color:var(--ink2)]"
                }`}
              >
                <input
                  className="sr-only"
                  checked={selected}
                  disabled={pending}
                  name="type"
                  onChange={() => setSelectedType(type)}
                  type="radio"
                  value={type}
                />
                {type === "läger" ? "Läger" : "Tävling"}
              </label>
            );
          })}
        </div>
      </div>
      <div className="mb-3.5">
        <label className="section-label mb-1.5 block">
          Namn
        </label>
        <input
          className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
          defaultValue={camp?.name ?? ""}
          disabled={pending}
          name="name"
          required
        />
      </div>
      <div className="mb-3.5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="section-label mb-1.5 block">
            Datum
          </label>
          <input
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
            defaultValue={camp?.date ?? getTodayValue()}
            disabled={pending}
            name="date"
            type="date"
          />
        </div>
        <div>
          <label className="section-label mb-1.5 block">
            Plats
          </label>
          <input
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
            defaultValue={camp?.place ?? ""}
            disabled={pending}
            name="place"
          />
        </div>
      </div>
      <div>
        <label className="section-label mb-1.5 block">
          Deltagare
        </label>
        <div className="ui-input dojo-scrollbar max-h-44 overflow-y-auto rounded-[16px] p-3">
          <div className="flex flex-wrap gap-1.5">
            {members.map((member) => (
              <label
                key={member.id}
                className="ui-button-pill flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-[color:var(--ink2)]"
              >
                <input
                  defaultChecked={selectedIds.has(member.id)}
                  disabled={pending}
                  name="attendee_ids"
                  type="checkbox"
                  value={member.id}
                />
                {member.name.split(" ")[0]}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2.5">
        {camp && onDelete ? (
          <button
            className="ui-button-secondary ui-danger-ghost mr-auto rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--red)]"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onDelete();
            }}
            type="button"
          >
            Ta bort
          </button>
        ) : null}
        <button
          className="ui-button-secondary rounded-[12px] px-[18px] py-[10px] text-[13px] text-[color:var(--ink2)]"
          disabled={pending}
          onClick={(event) => {
            event.preventDefault();
            onCancel();
          }}
          type="button"
        >
          Avbryt
        </button>
        <button
          className="ui-button-primary rounded-[12px] px-5 py-[10px] text-[13px] font-medium text-white disabled:cursor-progress disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sparar..." : "Spara"}
        </button>
      </div>
    </form>
  );
}

