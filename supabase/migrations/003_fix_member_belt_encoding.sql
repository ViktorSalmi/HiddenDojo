update members
set belt = case
  when belt = 'grÃ¶nt' then 'grönt'
  when belt = 'blÃ¥tt' then 'blått'
  else belt
end
where belt in ('grÃ¶nt', 'blÃ¥tt');

alter table members
drop constraint if exists members_belt_check;

alter table members
add constraint members_belt_check
check (belt in ('vitt', 'gult', 'orange', 'grönt', 'blått', 'brunt', 'svart'));
