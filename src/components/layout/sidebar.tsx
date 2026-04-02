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
  camps: HouseIcon,
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
    <aside className="flex w-full shrink-0 flex-col overflow-y-auto bg-[var(--sidebar)] lg:h-screen lg:w-[240px]">
      <div className="border-b border-[#222222] px-[22px] py-7">
        <div className="display-font text-[22px] font-extrabold tracking-[-0.03em] text-white">
          Hidden Karate
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#666666]">
          Tränarportalen
        </div>
      </div>
      <div className="px-3 pt-5 text-[10px] uppercase tracking-[0.1em] text-[#555555]">
        Hantering
      </div>
      <nav className="px-2 pb-4 pt-1">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.key];

          return (
            <NavLink
              key={item.href}
              className={({ isActive }) =>
                `my-px flex cursor-pointer items-center gap-2.5 rounded-[7px] px-[14px] py-[9px] text-[13px] transition-colors ${
                  isActive
                    ? "bg-[color:rgba(192,40,26,0.09)] text-[#f26a5d]"
                    : "text-[#8f8f8f] hover:bg-[#1e1e1e] hover:text-[#f3efe6]"
                }`
              }
              to={item.href}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#1e1e1e] px-[14px] py-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="display-font text-[20px] font-bold text-white">
              {activeMembers}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.07em] text-[#555555]">
              Aktiva
            </div>
          </div>
          <div className="text-right">
            <div className="display-font text-[20px] font-bold text-white">
              {averageAttendance}%
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.07em] text-[#555555]">
              Närvaro
            </div>
          </div>
        </div>
        {footer}
      </div>
    </aside>
  );
}

