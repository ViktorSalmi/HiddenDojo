alter table camps
add column if not exists type text;

update camps
set type = 'läger'
where type is null;

alter table camps
alter column type set default 'läger';

alter table camps
alter column type set not null;

alter table camps
drop constraint if exists camps_type_check;

alter table camps
add constraint camps_type_check
check (type in ('läger', 'tävling'));
