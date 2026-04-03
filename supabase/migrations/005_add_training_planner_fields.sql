alter table training_sessions
  add column if not exists title text,
  add column if not exists focus text,
  add column if not exists group_label text,
  add column if not exists equipment text;
