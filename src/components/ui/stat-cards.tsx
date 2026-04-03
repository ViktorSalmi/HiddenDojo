type StatCardsProps = {
  averageAttendancePercent: number;
  campCount: number;
  memberCount: number;
  sessionCount: number;
};

function StatCard({
  accent,
  label,
  value,
}: {
  accent: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="panel relative overflow-hidden rounded-[16px] px-5 py-5">
      <div className="absolute inset-x-0 top-0 h-[4px]" style={{ background: accent }} />
      <div className="display-font text-[32px] leading-none font-bold text-[color:var(--ink)]">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[color:var(--ink3)]">
        {label}
      </div>
    </div>
  );
}

export function StatCards({
  averageAttendancePercent,
  campCount,
  memberCount,
  sessionCount,
}: StatCardsProps) {
  return (
    <div className="mb-7 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
      <StatCard accent="#c0281a" label="Totalt medlemmar" value={memberCount} />
      <StatCard accent="#c8973a" label="Läger loggade" value={campCount} />
      <StatCard
        accent="#2d7a4f"
        label="Snitt närvaro"
        value={`${averageAttendancePercent}%`}
      />
      <StatCard accent="#1d6fc4" label="Träningar loggade" value={sessionCount} />
    </div>
  );
}

