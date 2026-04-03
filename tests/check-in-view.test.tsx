// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheckInView } from "@/components/dashboard/check-in-view";
import type { Member, TrainingSession } from "@/types";

afterEach(() => {
  cleanup();
});

const members: Member[] = [
  {
    active: true,
    age: 17,
    belt: "svart",
    created_at: null,
    gender: "M",
    id: "member-1",
    joined_date: "2019-09-01",
    name: "Erik Lindström",
    updated_at: null,
  },
  {
    active: true,
    age: 14,
    belt: "grönt",
    created_at: null,
    gender: "F",
    id: "member-2",
    joined_date: "2020-03-15",
    name: "Sara Nilsson",
    updated_at: null,
  },
];

describe("CheckInView", () => {
  it("starts in coach mode and opens student check-in for the selected date", async () => {
    const onOpenCheckIn = vi.fn().mockResolvedValue(undefined);

    render(
      <CheckInView
        dateValue="2026-04-02"
        members={members}
        onCheckIn={vi.fn()}
        onOpenCheckIn={onOpenCheckIn}
        sessions={[]}
      />,
    );

    expect(screen.getByText("Öppna incheckning för idag")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Sök namn...")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Öppna incheckning för idag" }));

    await waitFor(() => {
      expect(onOpenCheckIn).toHaveBeenCalledWith("2026-04-02");
    });

    expect(await screen.findByPlaceholderText("Sök namn...")).toBeTruthy();
    expect(screen.getByText("Erik Lindström")).toBeTruthy();
  });

  it("filters the visible students by search query once check-in is open", async () => {
    render(
      <CheckInView
        dateValue="2026-04-02"
        initialMode="student"
        members={members}
        onCheckIn={vi.fn()}
        onOpenCheckIn={vi.fn()}
        sessions={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Sök namn..."), {
      target: { value: "Sara" },
    });

    expect(screen.getByText("Sara Nilsson")).toBeTruthy();
    expect(screen.queryByText("Erik Lindström")).toBeNull();
  });

  it("marks already checked-in students and avoids treating them as available cards", () => {
    const sessions: TrainingSession[] = [
      {
        attendee_ids: ["member-2"],
        created_at: null,
        date: "2026-04-02",
        id: "session-1",
        notes: null,
      },
    ];

    render(
      <CheckInView
        dateValue="2026-04-02"
        initialMode="student"
        members={members}
        onCheckIn={vi.fn()}
        onOpenCheckIn={vi.fn()}
        sessions={sessions}
      />,
    );

    expect(screen.getByText("Redan incheckad")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Sara Nilsson/i }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("checks in a student and shows a confirmation message", async () => {
    const onCheckIn = vi.fn().mockResolvedValue("checked-in");

    render(
      <CheckInView
        dateValue="2026-04-02"
        initialMode="student"
        members={members}
        onCheckIn={onCheckIn}
        onOpenCheckIn={vi.fn()}
        sessions={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Erik Lindström/i }));

    await waitFor(() => {
      expect(onCheckIn).toHaveBeenCalledWith("2026-04-02", "member-1");
    });

    expect(await screen.findByText("Erik Lindström är incheckad")).toBeTruthy();
  });
});

