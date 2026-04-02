import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockPermanentlyDeleteMember = vi.fn();
const mockWriteAuditLog = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock("@/lib/supabase/functions", () => ({
  permanentlyDeleteMember: (...args: unknown[]) =>
    mockPermanentlyDeleteMember(...args),
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

import {
  createMember,
  fetchMembersDashboardData,
  permanentlyDeleteMember,
  softDeleteMember,
  updateMember,
  type MemberMutationInput,
} from "@/lib/supabase/queries";

function createSelectChain(result: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq, order }));

  return { eq, order, select };
}

describe("members supabase queries", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockPermanentlyDeleteMember.mockReset();
    mockWriteAuditLog.mockReset();
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("fetches dashboard data, keeping active and archived members separate", async () => {
    const membersChain = createSelectChain({
      data: [
        {
          id: "member-1",
          name: "Erik Lindström",
          age: 17,
          gender: "M",
          belt: "svart",
          joined_date: "2019-09-01",
          active: true,
          created_at: null,
          updated_at: null,
        },
        {
          id: "member-2",
          name: "Arkiverad Medlem",
          age: 15,
          gender: "F",
          belt: "grönt",
          joined_date: "2020-03-15",
          active: false,
          created_at: null,
          updated_at: null,
        },
      ],
      error: null,
    });
    const campsChain = createSelectChain({
      data: [
        {
          id: "camp-1",
          name: "Sommarläger",
          date: "2025-07-14",
          place: "Karlstad",
          created_at: null,
          updated_at: null,
          camp_attendance: [{ member_id: "member-1" }],
        },
      ],
      error: null,
    });
    const sessionsChain = createSelectChain({
      data: [
        {
          id: "session-1",
          date: "2025-03-10",
          notes: null,
          created_at: null,
          session_attendance: [{ member_id: "member-1" }, { member_id: "member-2" }],
        },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "members") {
        return { select: membersChain.select };
      }

      if (table === "camps") {
        return { select: campsChain.select };
      }

      if (table === "training_sessions") {
        return { select: sessionsChain.select };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const snapshot = await fetchMembersDashboardData();

    expect(snapshot.members.map((member) => member.id)).toEqual(["member-1"]);
    expect(snapshot.archivedMembers.map((member) => member.id)).toEqual([
      "member-2",
    ]);
    expect(snapshot.camps[0].attendee_ids).toEqual(["member-1"]);
    expect(snapshot.sessions[0].attendee_ids).toEqual([
      "member-1",
      "member-2",
    ]);
  });

  it("creates, updates, archives, and permanently deletes members with client-side Supabase calls", async () => {
    const payload: MemberMutationInput = {
      age: 14,
      belt: "blått",
      gender: "F",
      joined_date: "2025-01-10",
      name: "Sara Nilsson",
    };

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: "member-9" },
      error: null,
    });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));

    mockFrom.mockReturnValue({
      delete: vi.fn(),
      insert,
      select: vi.fn(),
      update,
    });

    await expect(createMember(payload)).resolves.toMatchObject({ id: "member-9" });
    await expect(updateMember("member-9", payload)).resolves.toBeUndefined();
    await expect(softDeleteMember("member-9")).resolves.toBeUndefined();
    await expect(permanentlyDeleteMember("member-9")).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalledWith({ ...payload, active: true });
    expect(update).toHaveBeenCalledWith(payload);
    expect(updateEq).toHaveBeenCalledWith("id", "member-9");
    expect(mockPermanentlyDeleteMember).toHaveBeenCalledWith("member-9");
    expect(mockWriteAuditLog).toHaveBeenCalled();
  });
});
