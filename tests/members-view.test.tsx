// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: () => ({
    archivedMembers: [],
    camps: [],
    createMember: vi.fn(),
    error: null,
    isLoading: false,
    isMutating: false,
    members: [],
    permanentlyDeleteMember: vi.fn(),
    refresh: vi.fn(),
    sessions: [],
    sidebar: { activeMembers: 0, averageAttendancePercent: 0 },
    softDeleteMember: vi.fn(),
    updateMember: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    isAuthenticated: true,
    isLoading: false,
    session: { user: { id: "user-1" } },
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

import { MembersView } from "@/components/dashboard/members-view";
import type { Camp, Member, TrainingSession } from "@/types";

afterEach(() => {
  cleanup();
});

const members: Member[] = [
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
    name: "Sara Nilsson",
    age: 14,
    gender: "F",
    belt: "grönt",
    joined_date: "2020-03-15",
    active: true,
    created_at: null,
    updated_at: null,
  },
];

const archivedMembers: Member[] = [
  {
    id: "member-3",
    name: "Arkiverad Medlem",
    age: 15,
    gender: "F",
    belt: "blått",
    joined_date: "2018-05-11",
    active: false,
    created_at: null,
    updated_at: null,
  },
];

const camps: Camp[] = [
  {
    id: "camp-1",
    name: "Sommarläger",
    date: "2025-07-14",
    place: "Karlstad",
    created_at: null,
    updated_at: null,
    attendee_ids: ["member-1"],
  },
];

const sessions: TrainingSession[] = [
  {
    id: "session-1",
    date: "2025-03-10",
    notes: null,
    created_at: null,
    attendee_ids: ["member-1", "member-2"],
  },
];

describe("MembersView", () => {
  it("preserves the members actions column width and one-line action buttons", () => {
    render(
      <MembersView
        archivedMembers={archivedMembers}
        camps={camps}
        members={members}
        onCreateMember={vi.fn()}
        onPermanentlyDeleteMember={vi.fn()}
        onSoftDeleteMember={vi.fn()}
        onUpdateMember={vi.fn()}
        sessions={sessions}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Åtgärder" }).className,
    ).toContain("w-[180px]");

    const editButton = screen.getAllByRole("button", { name: "Redigera" })[0];

    expect(editButton.parentElement?.className).toContain("justify-end");
    expect(editButton.parentElement?.className).toContain("gap-1");
    expect(editButton.parentElement?.className).toContain("whitespace-nowrap");
  });

  it("filters members by search query", () => {
    render(
      <MembersView
        archivedMembers={archivedMembers}
        camps={camps}
        members={members}
        onCreateMember={vi.fn()}
        onPermanentlyDeleteMember={vi.fn()}
        onSoftDeleteMember={vi.fn()}
        onUpdateMember={vi.fn()}
        sessions={sessions}
      />,
    );

    fireEvent.change(screen.getAllByPlaceholderText("Sök namn...")[0], {
      target: { value: "Sara" },
    });

    expect(screen.getAllByText("Sara Nilsson").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Erik Lindström")).toHaveLength(0);
  });
});
