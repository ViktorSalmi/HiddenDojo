import { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import {
  useDashboardData,
  type UseDashboardDataResult,
} from "@/hooks/use-dashboard-data";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase/client";

export type DashboardOutletContext = UseDashboardDataResult;

type DashboardPageProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  search?: React.ReactNode;
  stats?: React.ReactNode;
  title: string;
};

type DashboardPlaceholderPageProps = {
  description: string;
  title: string;
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, session } = useSession();
  const dashboard = useDashboardData({ enabled: isAuthenticated });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (isLoading) {
    return <main className="shell">Laddar dashboard...</main>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", { replace: true });
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Kunde inte logga ut just nu.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-[var(--paper)] lg:flex-row">
      <Sidebar
        activeMembers={dashboard.sidebar.activeMembers}
        averageAttendance={dashboard.sidebar.averageAttendancePercent}
        footer={
          <div className="space-y-3">
            <button
              className="w-full rounded-[10px] border border-[#2a2a2a] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-[12px] font-medium text-white transition-colors hover:border-[color:var(--red)] hover:bg-[rgba(232,57,42,0.08)] hover:text-[#ffd1cb]"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              type="button"
            >
              {isSigningOut ? "Loggar ut..." : "Logga ut"}
            </button>
            {session?.user.email ? (
              <div className="text-[11px] text-[#666666]">{session.user.email}</div>
            ) : null}
            {signOutError ? (
              <div className="text-[11px] text-[#ff9a90]">{signOutError}</div>
            ) : null}
            <div className="text-[11px] text-[#575757]">Hidden Karate Dojo © 2026</div>
          </div>
        }
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <Outlet context={dashboard} />
      </div>
    </div>
  );
}

export function DashboardPage({
  actions,
  children,
  search,
  stats,
  title,
}: DashboardPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="ui-topbar flex h-[66px] shrink-0 items-center justify-between border-b border-[color:var(--border)] px-8">
        <h1 className="display-font text-[18px] font-extrabold text-[color:var(--ink)]">
          {title}
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {search}
          {actions}
        </div>
      </div>
      <div className="dojo-scrollbar min-h-0 flex-1 overflow-y-auto px-8 py-8">
        {stats}
        {children}
      </div>
    </div>
  );
}

export function DashboardPlaceholderPage({
  description,
  title,
}: DashboardPlaceholderPageProps) {
  return (
    <DashboardPage title={title}>
      <div className="panel rounded-[16px] px-6 py-12">
        <div className="display-font text-[22px] font-bold text-[color:var(--ink)]">
          {title}
        </div>
        <p className="mt-2 max-w-[56ch] text-[14px] leading-6 text-[color:var(--ink2)]">
          {description}
        </p>
      </div>
    </DashboardPage>
  );
}

