// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseSession = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock("@/hooks/use-session", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

import { LoginPage } from "@/components/auth/login-form";
import { DashboardLayout } from "@/components/layout/dashboard-page";

beforeEach(() => {
  mockUseSession.mockReset();
  mockSignInWithPassword.mockReset();
});

describe("Task 2 auth routing", () => {
  it("redirects unauthenticated dashboard visits to /login", async () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      session: null,
    });

    const router = createMemoryRouter(
      [
        { path: "/login", element: <div>Login Screen</div> },
        { path: "/dashboard/*", element: <DashboardLayout /> },
      ],
      { initialEntries: ["/dashboard/members"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Login Screen")).toBeTruthy();
  });

  it("redirects authenticated login visits to /dashboard/members", async () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      session: { user: { id: "user-1" } },
    });

    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/dashboard/members", element: <div>Dashboard Members</div> },
      ],
      { initialEntries: ["/login"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Dashboard Members")).toBeTruthy();
  });

  it("recovers the login form after rejected sign-in", async () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      session: null,
    });
    mockSignInWithPassword.mockRejectedValue(new Error("network down"));

    const router = createMemoryRouter(
      [{ path: "/login", element: <LoginPage /> }],
      { initialEntries: ["/login"] },
    );

    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "coach@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "coach@example.com",
      password: "secret123",
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    });
    expect(
      screen.getByText("Unable to sign in right now. Please try again."),
    ).toBeTruthy();
  });
});
