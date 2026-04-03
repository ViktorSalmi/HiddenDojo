import { createBrowserRouter, Navigate } from "react-router-dom";

import { LoginPage } from "@/components/auth/login-form";
import { AttendanceDashboardRoute } from "@/components/dashboard/attendance-view";
import { CalendarDashboardRoute } from "@/components/dashboard/calendar-view";
import { CampsDashboardRoute } from "@/components/dashboard/camps-view";
import { CheckInDashboardRoute } from "@/components/dashboard/check-in-view";
import { MembersDashboardRoute } from "@/components/dashboard/members-view";
import { TrainingDashboardRoute } from "@/components/dashboard/training-view";
import { DashboardLayout, DashboardPlaceholderPage } from "@/components/layout/dashboard-page";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate replace to="/dashboard/members" /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard/members" /> },
      { path: "calendar", element: <CalendarDashboardRoute /> },
      { path: "members", element: <MembersDashboardRoute /> },
      { path: "camps", element: <CampsDashboardRoute /> },
      { path: "attendance", element: <AttendanceDashboardRoute /> },
      { path: "training", element: <TrainingDashboardRoute /> },
      { path: "check-in", element: <CheckInDashboardRoute /> },
      {
        path: "*",
        element: (
          <DashboardPlaceholderPage
            description="Den här vyn finns inte ännu."
            title="Sidan saknas"
          />
        ),
      },
    ],
  },
]);
