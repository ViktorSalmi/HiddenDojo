drop policy if exists "authenticated write members" on members;
create policy "authenticated write members"
on members for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write camps" on camps;
create policy "authenticated write camps"
on camps for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write camp_attendance" on camp_attendance;
create policy "authenticated write camp_attendance"
on camp_attendance for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write training_sessions" on training_sessions;
create policy "authenticated write training_sessions"
on training_sessions for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write session_attendance" on session_attendance;
create policy "authenticated write session_attendance"
on session_attendance for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "no direct audit insert" on audit_log;
create policy "no direct audit insert"
on audit_log for insert
with check (false);
