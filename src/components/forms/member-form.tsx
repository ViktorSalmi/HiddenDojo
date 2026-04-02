import { beltMeta } from "@/lib/dojo/catalog";
import { getTodayValue } from "@/lib/dojo/format";
import type { MemberMutationInput } from "@/lib/supabase/queries";
import type { Member } from "@/types";

type MemberFormProps = {
  member?: Member | null;
  onCancel: () => void;
  onDelete?: () => void;
  onSubmit: (input: MemberMutationInput) => Promise<void> | void;
  pending: boolean;
};

function readMemberInput(form: HTMLFormElement): MemberMutationInput {
  const formData = new FormData(form);
  const age = Number(formData.get("age") ?? 12);

  return {
    age: Number.isFinite(age) ? Math.min(99, Math.max(5, age)) : 12,
    belt: String(formData.get("belt") ?? "vitt") as Member["belt"],
    gender: String(formData.get("gender") ?? "M") as Member["gender"],
    joined_date: String(formData.get("joined_date") ?? getTodayValue()),
    name: String(formData.get("name") ?? "").trim(),
  };
}

export function MemberForm({
  member,
  onCancel,
  onDelete,
  onSubmit,
  pending,
}: MemberFormProps) {
  return (
    <form
      key={member?.id ?? "new-member"}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(readMemberInput(event.currentTarget));
      }}
    >
      <div className="display-font mb-5 text-[18px] font-extrabold text-[color:var(--ink)]">
        {member ? `Redigera ${member.name.split(" ")[0]}` : "Ny medlem"}
      </div>
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
          Namn
        </label>
        <input
          className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
          defaultValue={member?.name ?? ""}
          disabled={pending}
          name="name"
          placeholder="Förnamn Efternamn"
          required
        />
      </div>
      <div className="mb-3.5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Ålder
          </label>
          <input
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={member?.age ?? 12}
            disabled={pending}
            max={99}
            min={5}
            name="age"
            type="number"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Kön
          </label>
          <select
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={member?.gender ?? "M"}
            disabled={pending}
            name="gender"
          >
            <option value="M">Pojke</option>
            <option value="F">Flicka</option>
            <option value="-">Annat</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Bälte
          </label>
          <select
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={member?.belt ?? "vitt"}
            disabled={pending}
            name="belt"
          >
            {Object.entries(beltMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
            Sedan
          </label>
          <input
            className="w-full rounded-[7px] border border-[color:var(--border)] bg-[var(--paper)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--red)]"
            defaultValue={member?.joined_date ?? getTodayValue()}
            disabled={pending}
            name="joined_date"
            type="date"
          />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        {member && onDelete ? (
          <button
            className="mr-auto rounded-[7px] border border-[color:var(--red)] px-3.5 py-2 text-[13px] font-medium text-[color:var(--red)] transition-colors hover:bg-[var(--red-pale)]"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onDelete();
            }}
            type="button"
          >
            Arkivera
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

