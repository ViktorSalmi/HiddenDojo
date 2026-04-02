import { getTodayValue } from "@/lib/dojo/format";
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

  return (
    <form
      key={camp?.id ?? "new-camp"}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(readCampInput(event.currentTarget));
      }}
    >
      <div className="display-font mb-5 text-[18px] font-extrabold text-[color:var(--ink)]">
        {camp ? "Redigera läger" : "Nytt läger / tävling"}
      </div>
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
          Namn
        </label>
        <input
          className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
          defaultValue={camp?.name ?? ""}
          disabled={pending}
          name="name"
          required
        />
      </div>
      <div className="mb-3.5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Datum
          </label>
          <input
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={camp?.date ?? getTodayValue()}
            disabled={pending}
            name="date"
            type="date"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Plats
          </label>
          <input
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={camp?.place ?? ""}
            disabled={pending}
            name="place"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
          Deltagare
        </label>
        <div className="max-h-40 overflow-y-auto rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {members.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[12px] text-[color:var(--ink2)]"
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
      <div className="mt-5 flex items-center justify-end gap-2">
        {camp && onDelete ? (
          <button
            className="mr-auto rounded-[7px] border border-[color:var(--red)] px-3.5 py-2 text-[13px] font-medium text-[color:var(--red)] transition-colors hover:bg-[var(--red-pale)]"
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
          className="rounded-[7px] border border-[color:var(--border)] px-[18px] py-[9px] text-[13px] text-[color:var(--ink2)] transition-colors hover:bg-[var(--paper)]"
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
          className="rounded-[7px] bg-[var(--red)] px-5 py-[9px] text-[13px] font-medium text-white transition-colors hover:bg-[var(--red2)] disabled:cursor-progress disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sparar..." : "Spara"}
        </button>
      </div>
    </form>
  );
}

