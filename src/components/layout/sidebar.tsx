import { NavLink } from "react-router-dom";

import { navigationItems } from "@/lib/dojo/catalog";

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M22 12h-4l-3 9-6-18-3 9H2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

const iconMap = {
  attendance: PulseIcon,
  calendar: CalendarIcon,
  camps: HouseIcon,
  checkin: CalendarIcon,
  members: UsersIcon,
  training: CalendarIcon,
} as const;

type SidebarProps = {
  activeMembers: number;
  averageAttendance: number;
  footer: React.ReactNode;
};

export function Sidebar({
  activeMembers,
  averageAttendance,
  footer,
}: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-y-auto bg-[linear-gradient(180deg,var(--sidebar)_0%,var(--sidebar-elevated)_100%)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)] lg:h-screen lg:w-[248px]">
      <div className="border-b border-[#222222] px-6 py-8">
        <div className="display-font text-[24px] font-extrabold tracking-[-0.04em] text-white">
          Hidden Karate
        </div>
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-[#757575]">
          Tränarportalen
        </div>
      </div>
      <div className="px-4 pt-6 text-[10px] uppercase tracking-[0.12em] text-[#6c6c6c]">
        Hantering
      </div>
      <nav className="px-3 pb-5 pt-2">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.key];

          return (
            <NavLink
              key={item.href}
              className={({ isActive }) =>
                `my-1 flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "border-[rgba(232,57,42,0.16)] bg-[linear-gradient(180deg,rgba(232,57,42,0.16)_0%,rgba(192,40,26,0.1)_100%)] text-[#ffd6d1] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "border-transparent text-[#a7a7a7] hover:border-[rgba(255,255,255,0.05)] hover:bg-[#1d1d1d] hover:text-[#fff7ee]"
                }`
              }
              to={item.href}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.03)]">
                <Icon />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#1e1e1e] px-4 py-5">
        <div className="mb-4 rounded-[14px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#666666]">
            Översikt
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="display-font text-[22px] font-bold text-white">
                {activeMembers}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[#707070]">
                Aktiva
              </div>
            </div>
            <div className="text-right">
              <div className="display-font text-[22px] font-bold text-white">
                {averageAttendance}%
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[#707070]">
                Närvaro
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[#666666]">
            Konto
          </div>
          {footer}
        </div>
      </div>
    </aside>
  );
}

