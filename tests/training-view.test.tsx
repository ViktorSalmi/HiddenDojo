// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrainingView } from "@/components/dashboard/training-view";
import type { Camp, Member, TrainingSession } from "@/types";

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

const camps: Camp[] = [];

const sessions: TrainingSession[] = [
  {
    attendee_ids: ["member-1", "member-2"],
    created_at: null,
    date: "2026-04-02",
    id: "session-1",
    notes: "Kihon med fotarbete och lätt sparring.",
  },
];

describe("TrainingView", () => {
  it("loads the existing session for the selected day into the editor", () => {
    render(
      <TrainingView
        camps={camps}
        members={members}
        onDeleteTrainingSession={vi.fn()}
        onSaveTrainingSession={vi.fn()}
        sessions={sessions}
      />,
    );

    expect(screen.getByDisplayValue("Kihon med fotarbete och lätt sparring.")).toBeTruthy();
    expect(screen.getByText("2 incheckade på detta pass")).toBeTruthy();
  });

  it("saves the training description without requiring attendance selection", async () => {
    const onSaveTrainingSession = vi.fn().mockResolvedValue(undefined);

    render(
      <TrainingView
        camps={camps}
        members={members}
        onDeleteTrainingSession={vi.fn()}
        onSaveTrainingSession={onSaveTrainingSession}
        sessions={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Passbeskrivning"), {
      target: { value: "Kata, fokus på rytm och avslut." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Skapa träningspass" }));

    await waitFor(() => {
      expect(onSaveTrainingSession).toHaveBeenCalledWith({
        date: expect.any(String),
        member_ids: [],
        notes: "Kata, fokus på rytm och avslut.",
      });
    });
  });

  it("shows saved notes in the logged sessions list", () => {
    render(
      <TrainingView
        camps={camps}
        members={members}
        onDeleteTrainingSession={vi.fn()}
        onSaveTrainingSession={vi.fn()}
        sessions={sessions}
      />,
    );

    expect(screen.getByText("Kihon med fotarbete och lätt sparring.")).toBeTruthy();
    expect(screen.getByText("2 incheckade elever")).toBeTruthy();
  });
});
