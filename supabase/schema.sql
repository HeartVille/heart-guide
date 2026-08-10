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

-- Creator-authored guides. Anyone signed in can become a creator by
-- publishing a guide; no separate role/invite system.
create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  website_url text,
  consultation_url text,
  resource_title text,
  resource_description text,
  resource_url text,
  resource_links jsonb not null default '[]'::jsonb,
  cta_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

create policy "Signed-in users can read creator profiles"
  on public.creator_profiles for select
  to authenticated
  using (true);

create policy "Users can create their own creator profile"
  on public.creator_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own creator profile"
  on public.creator_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null check (category in ('Relationships', 'Business', 'Wellbeing')),
  description text not null,
  colour text not null default 'jade' check (colour in ('jade', 'violet', 'aqua', 'gold', 'rose', 'sage')),
  symbol text not null default '✦',
  questions jsonb not null,
  result_heading text not null default 'A clearer direction is taking shape.',
  result_insight text not null default 'Your answers point to what matters most and the next step you are ready to take.',
  result_prompt text not null default 'What support, timing or boundary would make this feel possible?',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guides_status_idx on public.guides (status, created_at desc);
create index if not exists guides_creator_id_idx on public.guides (creator_id);

alter table public.guides enable row level security;

create policy "Anyone can read published guides, creators read their own"
  on public.guides for select
  to public
  using (status = 'published' or creator_id = auth.uid());

create policy "Creators can insert their own guides"
  on public.guides for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "Creators can update their own guides"
  on public.guides for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "Creators can delete their own guides"
  on public.guides for delete
  to authenticated
  using (creator_id = auth.uid());

create or replace function public.enforce_one_live_guide_per_free_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
    and exists (select 1 from public.creator_profiles where user_id = new.creator_id)
    and exists (
      select 1
      from public.guides
      where creator_id = new.creator_id
        and status = 'published'
        and id is distinct from new.id
    ) then
    raise exception using
      errcode = '23505',
      message = 'Free creators can publish one live guide at a time.',
      hint = 'Unpublish your current live guide before publishing another one.';
  end if;
  return new;
end;
$$;

create trigger enforce_one_live_guide_per_free_creator
before insert or update of status, creator_id on public.guides
for each row
execute function public.enforce_one_live_guide_per_free_creator();

-- Saved reflective journey progress, one row per in-progress or completed guide.
create table if not exists public.guide_journey_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
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
