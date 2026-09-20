-- Improve directory search performance without changing data.
create extension if not exists pg_trgm;

create index if not exists vibe_profiles_display_name_trgm_idx
  on public.vibe_profiles using gin (display_name gin_trgm_ops);
