-- Basic guide analytics: started / completed counts per guide.
-- Run once against the live project (Studio SQL editor).

create table if not exists public.guide_events (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  event_type text not null check (event_type in ('started', 'completed')),
  created_at timestamptz not null default now()
);

create index if not exists guide_events_guide_id_idx on public.guide_events (guide_id, event_type);

alter table public.guide_events enable row level security;

-- Inserts happen server-side via the service-role client (no anon/authenticated
-- insert policy needed). Creators can read counts for their own guides.
create policy "Creators can read events for their own guides"
  on public.guide_events for select
  to authenticated
  using (guide_id in (select id from public.guides where creator_id = auth.uid()));
