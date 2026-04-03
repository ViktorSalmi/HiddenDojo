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
      <div className="display-font mb-6 text-[22px] font-extrabold text-[color:var(--ink)]">
        {member ? `Redigera ${member.name.split(" ")[0]}` : "Ny medlem"}
      </div>
      <div className="mb-3.5">
        <label className="section-label mb-1.5 block">
          Namn
        </label>
        <input
          className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
          defaultValue={member?.name ?? ""}
          disabled={pending}
          name="name"
          placeholder="Förnamn Efternamn"
          required
        />
      </div>
      <div className="mb-3.5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="section-label mb-1.5 block">
            Ålder
          </label>
          <input
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
            defaultValue={member?.age ?? 12}
            disabled={pending}
            max={99}
            min={5}
            name="age"
            type="number"
          />
        </div>
        <div>
          <label className="section-label mb-1.5 block">
            Kön
          </label>
          <select
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
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
          <label className="section-label mb-1.5 block">
            Bälte
          </label>
          <select
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
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
          <label className="section-label mb-1.5 block">
            Sedan
          </label>
          <input
            className="ui-input w-full rounded-[12px] px-3.5 py-3 text-[13px] outline-none"
            defaultValue={member?.joined_date ?? getTodayValue()}
            disabled={pending}
            name="joined_date"
            type="date"
          />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2.5">
        {member && onDelete ? (
          <button
            className="ui-button-secondary ui-danger-ghost mr-auto rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--red)]"
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

