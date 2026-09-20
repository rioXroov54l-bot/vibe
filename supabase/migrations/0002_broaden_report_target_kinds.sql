-- Broaden supported report target kinds for compliance/legal reports.
-- Non-destructive: only replaces the target_kind check constraint.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.vibe_reports'::regclass
      and conname = 'vibe_reports_target_kind_check'
  ) then
    alter table public.vibe_reports
      drop constraint vibe_reports_target_kind_check;
  end if;
end
$$;

alter table public.vibe_reports
  add constraint vibe_reports_target_kind_check
  check (
    target_kind in (
      'user',
      'room',
      'message',
      'support',
      'content',
      'appeal',
      'copyright',
      'privacy'
    )
  );
