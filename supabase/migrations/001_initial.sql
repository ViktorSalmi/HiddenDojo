create extension if not exists pgcrypto;

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int not null check (age between 5 and 99),
  gender text check (gender in ('M', 'F', '-')),
  belt text not null check (belt in ('vitt', 'gult', 'orange', 'grönt', 'blått', 'brunt', 'svart')),
  joined_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'läger' check (type in ('läger', 'tävling')),
  date date not null,
  place text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table camp_attendance (
  camp_id uuid references camps(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (camp_id, member_id)
);

create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text,
  focus text,
  group_label text,
  equipment text,
  notes text,
  created_at timestamptz default now()
);

create table session_attendance (
  session_id uuid references training_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (session_id, member_id)
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  action text not null,
  table_name text not null,
  record_id uuid,
  detail jsonb,
  created_at timestamptz default now()
);

alter table members enable row level security;
alter table camps enable row level security;
alter table camp_attendance enable row level security;
alter table training_sessions enable row level security;
alter table session_attendance enable row level security;
alter table audit_log enable row level security;

create policy "authenticated read members" on members for select using (auth.role() = 'authenticated');
create policy "authenticated write members" on members for all using (auth.role() = 'authenticated');
create policy "authenticated read camps" on camps for select using (auth.role() = 'authenticated');
create policy "authenticated write camps" on camps for all using (auth.role() = 'authenticated');
create policy "authenticated read camp_attendance" on camp_attendance for select using (auth.role() = 'authenticated');
create policy "authenticated write camp_attendance" on camp_attendance for all using (auth.role() = 'authenticated');
create policy "authenticated read training_sessions" on training_sessions for select using (auth.role() = 'authenticated');
create policy "authenticated write training_sessions" on training_sessions for all using (auth.role() = 'authenticated');
create policy "authenticated read session_attendance" on session_attendance for select using (auth.role() = 'authenticated');
create policy "authenticated write session_attendance" on session_attendance for all using (auth.role() = 'authenticated');
create policy "authenticated read audit_log" on audit_log for select using (auth.role() = 'authenticated');
create policy "no direct audit insert" on audit_log for insert with check (false);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_members_updated_at
before update on members
for each row execute function update_updated_at();

create trigger trg_camps_updated_at
before update on camps
for each row execute function update_updated_at();


