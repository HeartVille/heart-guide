-- Creator Studio: self-serve guide creation
-- Run once against the live project (Studio SQL editor).

create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text,
  website_url text,
  consultation_url text,
  resource_url text,
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

-- guide_journey_entries.guide_id moves from a fixed text check constraint to a
-- real foreign key against the new guides table. No production journey data
-- exists yet (fresh table), so this drops and recreates the column safely.
truncate table public.guide_journey_entries;

alter table public.guide_journey_entries
  drop constraint if exists guide_journey_entries_guide_id_check;

alter table public.guide_journey_entries
  alter column guide_id type uuid using guide_id::uuid;

alter table public.guide_journey_entries
  add constraint guide_journey_entries_guide_id_fkey
  foreign key (guide_id) references public.guides (id) on delete cascade;
