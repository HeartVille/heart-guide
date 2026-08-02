-- Heart Guide — core schema
-- Run once against the Supabase project (Studio SQL editor or `supabase db push`).

create extension if not exists pgcrypto;

-- Founder Access membership status, kept by email because GoHighLevel's
-- webhook only knows the customer's email, not their Supabase user id.
create table if not exists public.founder_memberships (
  email text primary key,
  status text not null,
  plan text,
  source text not null default 'ghl',
  updated_at timestamptz not null default now()
);

alter table public.founder_memberships enable row level security;

create policy "Users can read their own membership"
  on public.founder_memberships for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

-- Writes only ever come from the GHL webhook route using the service-role
-- key, which bypasses RLS — no insert/update/delete policy is granted here.

-- Saved reflective journey progress, one row per in-progress or completed guide.
create table if not exists public.guide_journey_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  guide_id text not null check (
    guide_id in ('connection', 'pause', 'boundaries', 'visibility', 'weekly')
  ),
  answers jsonb not null default '[]'::jsonb,
  current_step integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guide_journey_entries_user_id_idx
  on public.guide_journey_entries (user_id, updated_at desc);

alter table public.guide_journey_entries enable row level security;

create policy "Users can read their own journeys"
  on public.guide_journey_entries for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own journeys"
  on public.guide_journey_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own journeys"
  on public.guide_journey_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
