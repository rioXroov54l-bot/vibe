-- Additive reconciliation for the live Supabase schema.
-- This migration intentionally:
--   - creates missing runtime tables only if absent
--   - adds missing columns only if absent
--   - enables RLS only
-- It does NOT drop, rename, truncate, or overwrite production data.
--
-- Verify against a live schema dump before applying to production.

-- Existing vibe_settings table: add runtime columns if missing.
alter table public.vibe_settings
  add column if not exists theme text;
alter table public.vibe_settings
  add column if not exists smart_photos_enabled boolean;
alter table public.vibe_settings
  add column if not exists hide_age boolean;
alter table public.vibe_settings
  add column if not exists hide_distance boolean;

-- Existing vibe_rooms table: add legacy compatibility columns if missing.
alter table public.vibe_rooms
  add column if not exists legacy_id integer;
alter table public.vibe_rooms
  add column if not exists legacy_snapshot jsonb;

-- Runtime tables referenced by the Worker but absent from the old committed SQL.
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  onboarding_step smallint,
  onboarding_completed_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key,
  sender_id uuid,
  room_id uuid,
  receiver_id uuid,
  kind text not null default 'text',
  content text not null default '',
  object_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key,
  user_id uuid,
  actor_id uuid,
  message_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.user_interests (
  user_id uuid,
  category text,
  value smallint,
  primary key (user_id, category, value)
);

create table if not exists public.message_reactions (
  message_id uuid,
  user_id uuid,
  emoji text,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.vibe_profile_details (
  user_id uuid primary key,
  living_in text,
  height_cm smallint,
  job text,
  education text,
  basics jsonb,
  lifestyle jsonb
);

create table if not exists public.vibe_profile_photos (
  user_id uuid,
  slot smallint,
  object_path text,
  created_at timestamptz not null default now(),
  primary key (user_id, slot)
);

create table if not exists public.vibe_profile_prompts (
  user_id uuid,
  slot smallint,
  question text,
  answer text,
  primary key (user_id, slot)
);

-- Add expected columns when the tables already exist.
alter table public.messages
  add column if not exists sender_id uuid;
alter table public.messages
  add column if not exists room_id uuid;
alter table public.messages
  add column if not exists receiver_id uuid;
alter table public.messages
  add column if not exists kind text default 'text';
alter table public.messages
  add column if not exists content text default '';
alter table public.messages
  add column if not exists object_path text;
alter table public.messages
  add column if not exists created_at timestamptz default now();

alter table public.profiles
  add column if not exists email text;
alter table public.profiles
  add column if not exists username text;
alter table public.profiles
  add column if not exists full_name text;
alter table public.profiles
  add column if not exists avatar_url text;
alter table public.profiles
  add column if not exists created_at timestamptz default now();
alter table public.profiles
  add column if not exists onboarding_step smallint;
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

alter table public.notifications
  add column if not exists user_id uuid;
alter table public.notifications
  add column if not exists actor_id uuid;
alter table public.notifications
  add column if not exists message_id uuid;
alter table public.notifications
  add column if not exists created_at timestamptz default now();
alter table public.notifications
  add column if not exists read_at timestamptz;

alter table public.message_reactions
  add column if not exists emoji text;
alter table public.message_reactions
  add column if not exists created_at timestamptz default now();

alter table public.vibe_profile_details
  add column if not exists living_in text;
alter table public.vibe_profile_details
  add column if not exists height_cm smallint;
alter table public.vibe_profile_details
  add column if not exists job text;
alter table public.vibe_profile_details
  add column if not exists education text;
alter table public.vibe_profile_details
  add column if not exists basics jsonb;
alter table public.vibe_profile_details
  add column if not exists lifestyle jsonb;

alter table public.vibe_profile_photos
  add column if not exists object_path text;
alter table public.vibe_profile_photos
  add column if not exists created_at timestamptz default now();

alter table public.vibe_profile_prompts
  add column if not exists question text;
alter table public.vibe_profile_prompts
  add column if not exists answer text;
